from flask import Blueprint, request, jsonify, g
from app.services.equipment_service import list_maintenance, update_maintenance

maintenance_bp = Blueprint('maintenance', __name__)

@maintenance_bp.route('/maintenance', methods=['GET'])
def get_maintenance_list():
    """List maintenance records with status and priority filtering."""
    filters = {
        'status': request.args.get('status'),
        'priority': request.args.get('priority'),
        'equipment_id': request.args.get('equipment_id', type=int),
        'workspace_id': g.workspace_id,
    }
    try:
        data = list_maintenance(filters)
        return jsonify({
            'success': True,
            'data': data
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@maintenance_bp.route('/maintenance/<int:maintenance_id>', methods=['PUT'])
def update_existing_maintenance(maintenance_id):
    """Update maintenance task status, priority, or remarks."""
    payload = request.get_json()
    if not payload:
        return jsonify({
            'success': False,
            'error': 'Request body must be valid JSON.'
        }), 400

    try:
        data = update_maintenance(maintenance_id, payload, workspace_id=g.workspace_id)
        if not data:
            return jsonify({
                'success': False,
                'error': f'Maintenance record with ID {maintenance_id} not found.'
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
