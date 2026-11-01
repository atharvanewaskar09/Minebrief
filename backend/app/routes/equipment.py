from flask import Blueprint, request, jsonify, g
from app.services.equipment_service import (
    list_equipment,
    get_equipment_by_id,
    create_equipment,
    update_equipment,
    get_equipment_history
)
from app.utils.api_errors import internal_server_error

equipment_bp = Blueprint('equipment', __name__)

@equipment_bp.route('/equipment', methods=['GET'])
def get_equipment_list():
    """List equipment assets with section/status filters."""
    filters = {
        'section': request.args.get('section'),
        'status': request.args.get('status'),
        'workspace_id': g.workspace_id
    }
    try:
        data = list_equipment(filters)
        return jsonify({
            'success': True,
            'data': data
        }), 200
    except Exception:
        return internal_server_error('Equipment list request failed.')

@equipment_bp.route('/equipment/<int:equipment_id>', methods=['GET'])
def get_single_equipment(equipment_id):
    """Get single equipment asset by ID."""
    data = get_equipment_by_id(equipment_id, workspace_id=g.workspace_id)
    if not data:
        return jsonify({
            'success': False,
            'error': f'Equipment asset with ID {equipment_id} not found.'
        }), 404
    return jsonify({
        'success': True,
        'data': data
    }), 200

@equipment_bp.route('/equipment', methods=['POST'])
def register_equipment():
    """Register a new physical equipment asset."""
    payload = request.get_json()
    if not payload:
        return jsonify({
            'success': False,
            'error': 'Request body must be valid JSON.'
        }), 400

    try:
        payload['workspace_id'] = g.workspace_id
        data = create_equipment(payload)
        return jsonify({
            'success': True,
            'data': data
        }), 201
    except ValueError as ve:
        return jsonify({
            'success': False,
            'error': str(ve)
        }), 400
    except Exception:
        return internal_server_error('Equipment creation request failed.')

@equipment_bp.route('/equipment/<int:equipment_id>', methods=['PUT'])
def update_existing_equipment(equipment_id):
    """Update equipment asset details."""
    payload = request.get_json()
    if not payload:
        return jsonify({
            'success': False,
            'error': 'Request body must be valid JSON.'
        }), 400

    try:
        if g.current_user:
            payload.pop('workspace_id', None)
        data = update_equipment(equipment_id, payload, workspace_id=g.workspace_id)
        if not data:
            return jsonify({
                'success': False,
                'error': f'Equipment asset with ID {equipment_id} not found.'
            }), 404
        return jsonify({
            'success': True,
            'data': data
        }), 200
    except ValueError as ve:
        return jsonify({
            'success': False,
            'error': str(ve)
        }), 400
    except Exception:
        return internal_server_error('Equipment update request failed.')

@equipment_bp.route('/equipment/<int:equipment_id>/history', methods=['GET'])
def get_equipment_history_log(equipment_id):
    """Get complete historical logs of breakdowns and maintenance for this asset."""
    data = get_equipment_history(equipment_id, workspace_id=g.workspace_id)
    if not data:
        return jsonify({
            'success': False,
            'error': f'Equipment asset with ID {equipment_id} not found.'
        }), 404

    return jsonify({
        'success': True,
        'data': data
    }), 200
