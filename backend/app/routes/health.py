from flask import Blueprint, jsonify
from sqlalchemy import text
from app.models.base import db

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint verifying application and database connectivity."""
    db_status = 'disconnected'
    try:
        db.session.execute(text('SELECT 1'))
        db_status = 'connected'
    except Exception as e:
        db_status = f'error: {str(e)}'

    return jsonify({
        'success': db_status == 'connected',
        'data': {
            'status': 'healthy' if db_status == 'connected' else 'degraded',
            'database': db_status,
            'service': 'minebrief-backend'
        }
    }), 200 if db_status == 'connected' else 500
