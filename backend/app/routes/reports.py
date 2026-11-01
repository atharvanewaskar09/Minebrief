from flask import Blueprint, request, jsonify, g
from app.services.report_service import (
    list_reports,
    get_report_by_id,
    create_report,
    update_report,
    verify_report
)
from app.services.ai.report_extractor import extract_shift_report
from app.utils.file_utils import get_file_extension, is_allowed_extension, is_allowed_mime_type

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/reports/extract', methods=['POST'])
def extract_report():
    file_obj = request.files.get('file')
    if not file_obj or not file_obj.filename:
        return jsonify({'success': False, 'error': 'Choose a PDF or image report to extract.'}), 400

    extension = get_file_extension(file_obj.filename)
    if extension not in {'pdf', 'jpg', 'jpeg', 'png', 'webp'}:
        return jsonify({
            'success': False,
            'error': 'Report extraction supports PDF, JPG, JPEG, PNG, and WEBP files.',
        }), 400
    mime_type = (file_obj.mimetype or '').lower()
    if not is_allowed_extension(file_obj.filename) or not is_allowed_mime_type(mime_type):
        return jsonify({'success': False, 'error': 'The uploaded report file type is not supported.'}), 400

    try:
        extracted = extract_shift_report(file_obj.read(), mime_type)
        return jsonify({'success': True, 'data': extracted}), 200
    except RuntimeError as error:
        status = 503 if 'not configured' in str(error).lower() else 502
        return jsonify({'success': False, 'error': str(error)}), status

@reports_bp.route('/reports', methods=['GET'])
def get_reports():
    """List shift reports with optional filters and pagination."""
    filters = {
        'date': request.args.get('date'),
        'shift': request.args.get('shift'),
        'section': request.args.get('section'),
        'status': request.args.get('status'),
        'workspace_id': g.workspace_id
    }
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=10, type=int)

    try:
        data = list_reports(filters, page=page, per_page=per_page)
        return jsonify({
            'success': True,
            'data': data
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reports_bp.route('/reports', methods=['POST'])
def create_new_report():
    """Create a complete shift report with all categories."""
    payload = request.get_json()
    if not payload:
        return jsonify({
            'success': False,
            'error': 'Request body must be valid JSON.'
        }), 400

    try:
        payload['workspace_id'] = g.workspace_id
        if g.current_user:
            payload['submitted_by'] = g.current_user.name
        data = create_report(payload)
        return jsonify({
            'success': True,
            'data': data
        }), 201
    except ValueError as ve:
        return jsonify({
            'success': False,
            'error': str(ve)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to create report: {str(e)}'
        }), 500

@reports_bp.route('/reports/<int:report_id>', methods=['GET'])
def get_report_detail(report_id):
    """Get full details of a specific shift report."""
    data = get_report_by_id(report_id, workspace_id=g.workspace_id)
    if not data:
        return jsonify({
            'success': False,
            'error': f'Report with ID {report_id} not found.'
        }), 404

    return jsonify({
        'success': True,
        'data': data
    }), 200

@reports_bp.route('/reports/<int:report_id>', methods=['PUT'])
def update_existing_report(report_id):
    """Update top-level fields of a shift report."""
    payload = request.get_json()
    if not payload:
        return jsonify({
            'success': False,
            'error': 'Request body must be valid JSON.'
        }), 400

    try:
        if g.current_user:
            payload.pop('submitted_by', None)
            payload.pop('workspace_id', None)
        data = update_report(report_id, payload, workspace_id=g.workspace_id)
        if not data:
            return jsonify({
                'success': False,
                'error': f'Report with ID {report_id} not found.'
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
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reports_bp.route('/reports/<int:report_id>/verify', methods=['PUT'])
def verify_existing_report(report_id):
    """Mark report as verified."""
    payload = request.get_json(silent=True) or {}
    verified_by = g.current_user.name if g.current_user else payload.get('verified_by', 'Supervisor')

    try:
        data = verify_report(report_id, verified_by=verified_by, workspace_id=g.workspace_id)
        if not data:
            return jsonify({
                'success': False,
                'error': f'Report with ID {report_id} not found.'
            }), 404

        return jsonify({
            'success': True,
            'data': data
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
