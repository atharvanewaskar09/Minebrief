from flask import Blueprint, current_app, jsonify
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
    except Exception:
        current_app.logger.exception('Database health check failed.')
        db_status = 'unavailable'

    response = {
        'success': db_status == 'connected',
        'data': {
            'status': 'healthy' if db_status == 'connected' else 'degraded',
            'database': db_status,
            'service': 'minebrief-backend'
        }
    }
    if db_status != 'connected':
        response.update({
            'code': 'database_unavailable',
            'message': 'The database is temporarily unavailable.',
        })
    return jsonify(response), 200 if db_status == 'connected' else 503
