from flask import Blueprint, jsonify, g
from flask import current_app
from app.utils.seed_data import seed_demo_data

demo_bp = Blueprint('demo', __name__)

@demo_bp.route('/demo/reset', methods=['POST'])
def reset_demo():
    """Reset all demo workspace data and re-seed consistent dataset."""
    if not g.is_demo and not current_app.testing:
        return jsonify({
            'success': False,
            'error': 'Demo reset is only available in the fictional demo workspace.',
        }), 403
    try:
        workspace = seed_demo_data(force=True)
        return jsonify({
            'success': True,
            'data': {
                'message': 'Demo data reset and re-seeded successfully.',
                'workspace': workspace.to_dict()
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to reset demo data: {str(e)}'
        }), 500
