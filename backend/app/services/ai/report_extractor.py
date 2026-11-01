import base64
import json
import logging

from flask import current_app
from google import genai
from google.genai.errors import APIError
from google.genai import types

logger = logging.getLogger(__name__)
_GEMINI_TIMEOUT_MS = 180_000

_REPORT_SCHEMA = {
    'type': 'OBJECT',
    'properties': {
        'report_date': {'type': 'STRING', 'nullable': True},
        'shift': {'type': 'STRING', 'nullable': True},
        'section': {'type': 'STRING', 'nullable': True},
        'notes': {'type': 'STRING', 'nullable': True},
        'work_completed': {
            'type': 'ARRAY',
            'items': {'type': 'OBJECT', 'properties': {
                'description': {'type': 'STRING'},
                'remarks': {'type': 'STRING', 'nullable': True},
            }, 'required': ['description']},
        },
        'equipment_breakdowns': {
            'type': 'ARRAY',
            'items': {'type': 'OBJECT', 'properties': {
                'equipment_name': {'type': 'STRING'},
                'fault_description': {'type': 'STRING'},
                'location': {'type': 'STRING', 'nullable': True},
            }, 'required': ['fault_description']},
        },
        'production_delays': {
            'type': 'ARRAY',
            'items': {'type': 'OBJECT', 'properties': {
                'affected_activity': {'type': 'STRING'},
                'duration_minutes': {'type': 'INTEGER', 'nullable': True},
                'reason': {'type': 'STRING'},
                'remarks': {'type': 'STRING', 'nullable': True},
            }, 'required': ['affected_activity', 'reason']},
        },
        'maintenance_items': {
            'type': 'ARRAY',
            'items': {'type': 'OBJECT', 'properties': {
                'equipment_name': {'type': 'STRING'},
                'requirement': {'type': 'STRING'},
                'priority': {'type': 'STRING', 'enum': ['low', 'medium', 'high', 'critical']},
                'remarks': {'type': 'STRING', 'nullable': True},
            }, 'required': ['requirement']},
        },
        'safety_observations': {
            'type': 'ARRAY',
            'items': {'type': 'OBJECT', 'properties': {
                'hazard_type': {'type': 'STRING'},
                'location': {'type': 'STRING', 'nullable': True},
                'description': {'type': 'STRING'},
                'severity': {'type': 'STRING', 'enum': ['low', 'medium', 'high', 'critical']},
            }, 'required': ['description']},
        },
        'issues': {
            'type': 'ARRAY',
            'items': {'type': 'OBJECT', 'properties': {
                'description': {'type': 'STRING'},
                'section': {'type': 'STRING', 'nullable': True},
                'assigned_to': {'type': 'STRING', 'nullable': True},
            }, 'required': ['description']},
        },
        'handover': {
            'type': 'OBJECT',
            'nullable': True,
            'properties': {
                'pending_work': {'type': 'STRING', 'nullable': True},
                'equipment_condition': {'type': 'STRING', 'nullable': True},
                'unresolved_issues': {'type': 'STRING', 'nullable': True},
                'instructions': {'type': 'STRING', 'nullable': True},
            },
        },
        'attendance': {
            'type': 'OBJECT',
            'nullable': True,
            'properties': {
                'total_scheduled': {'type': 'INTEGER'},
                'present': {'type': 'INTEGER'},
                'absent': {'type': 'INTEGER'},
                'remarks': {'type': 'STRING', 'nullable': True},
            },
            'required': ['total_scheduled', 'present', 'absent'],
        },
    },
    'required': [
        'work_completed', 'equipment_breakdowns', 'production_delays',
        'maintenance_items', 'safety_observations', 'issues',
    ],
}


def _interactions_schema(schema):
    """Convert the existing Gemini schema to the JSON Schema used by Interactions."""
    if isinstance(schema, list):
        return [_interactions_schema(value) for value in schema]
    if not isinstance(schema, dict):
        return schema

    converted = {
        key: _interactions_schema(value)
        for key, value in schema.items()
        if key != 'nullable'
    }
    if isinstance(converted.get('type'), str):
        converted['type'] = converted['type'].lower()
    return converted


def extract_shift_report(file_bytes, mime_type):
    """Extract structured MineBrief report data from a PDF or image via Gemini."""
    api_key = current_app.config.get('GEMINI_API_KEY')
    if not api_key:
        raise RuntimeError(
            'Report extraction is not configured. Set GEMINI_API_KEY in backend/.env and restart Flask.'
        )

    model = current_app.config.get('GEMINI_MODEL') or 'gemini-3.8-flash'
    content_type = 'document' if mime_type == 'application/pdf' else 'image'
    prompt = (
        'Extract only information explicitly present in this mine shift report. '
        'Do not infer missing values or invent events. Omit unknown optional fields. '
        'Use empty arrays when a category is not reported. Return dates as YYYY-MM-DD. '
        'Map shifts to Morning, Afternoon, or Night when clear. Follow the requested JSON schema.'
    )
    document = {
        'type': content_type,
        'data': base64.b64encode(file_bytes).decode('ascii'),
        'mime_type': mime_type,
    }
    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(timeout=_GEMINI_TIMEOUT_MS),
    )
    try:
        interaction = client.interactions.create(
            model=model,
            input=[document, {'type': 'text', 'text': prompt}],
            response_format={
                'type': 'text',
                'mime_type': 'application/json',
                'schema': _interactions_schema(_REPORT_SCHEMA),
            },
        )
    except APIError as error:
        detail = str(error).replace(api_key, '[REDACTED]')
        logger.error('Gemini report extraction failed: %s', detail)
        if getattr(error, 'code', None) in (401, 403):
            raise RuntimeError(
                f'Gemini rejected GEMINI_API_KEY or API access: {detail}'
            ) from error
        raise RuntimeError(f'Gemini report extraction failed: {detail}') from error
    finally:
        client.close()

    try:
        text = interaction.output_text
        if not text:
            raise ValueError('The model returned an empty response.')
        extracted = json.loads(text)
    except (AttributeError, TypeError, ValueError, json.JSONDecodeError) as error:
        raise RuntimeError('Gemini returned no valid structured report data.') from error

    for field in (
        'work_completed', 'equipment_breakdowns', 'production_delays',
        'maintenance_items', 'safety_observations', 'issues',
    ):
        if not isinstance(extracted.get(field), list):
            extracted[field] = []
    return extracted
