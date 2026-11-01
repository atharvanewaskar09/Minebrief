from flask import Blueprint, request, jsonify, g
from app.services.attendance_service import (
    list_attendance,
    get_attendance_by_id,
    create_attendance,
    update_attendance
)

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/attendance', methods=['GET'])
def get_attendance_list():
    """List attendance records with filters: date, shift, section, start_date, end_date."""
    filters = {
        'date': request.args.get('date'),
        'shift': request.args.get('shift'),
        'section': request.args.get('section'),
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'workspace_id': g.workspace_id,
    }
    try:
        data = list_attendance(filters)
        return jsonify({
            'success': True,
            'data': data
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@attendance_bp.route('/attendance/<int:attendance_id>', methods=['GET'])
def get_single_attendance(attendance_id):
    """Get single attendance record by ID."""
    data = get_attendance_by_id(attendance_id, workspace_id=g.workspace_id)
    if not data:
        return jsonify({
            'success': False,
            'error': f'Attendance record with ID {attendance_id} not found.'
        }), 404
    return jsonify({
        'success': True,
        'data': data
    }), 200

@attendance_bp.route('/attendance', methods=['POST'])
def create_new_attendance():
    """Create a new attendance record with validation."""
    payload = request.get_json()
    if not payload:
        return jsonify({
            'success': False,
            'error': 'Request body must be valid JSON.'
        }), 400

    try:
        payload['workspace_id'] = g.workspace_id
        if g.current_user:
            payload['confirmed_by'] = g.current_user.name
        data = create_attendance(payload)
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
            'error': str(e)
        }), 500

@attendance_bp.route('/attendance/<int:attendance_id>', methods=['PUT'])
def update_existing_attendance(attendance_id):
    """Update an existing attendance record with validation."""
    payload = request.get_json()
    if not payload:
        return jsonify({
            'success': False,
            'error': 'Request body must be valid JSON.'
        }), 400

    try:
        if g.current_user:
            payload.pop('workspace_id', None)
        data = update_attendance(attendance_id, payload, workspace_id=g.workspace_id)
        if not data:
            return jsonify({
                'success': False,
                'error': f'Attendance record with ID {attendance_id} not found.'
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
