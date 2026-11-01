from flask import Blueprint, request, jsonify, g
from app.services.dashboard_service import get_dashboard_summary

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/summary', methods=['GET'])
def dashboard_summary():
    """
    Get aggregated dashboard operational summary metrics.
    Query params: period (today, 7d, 30d, custom), start_date (YYYY-MM-DD), end_date (YYYY-MM-DD), workspace_id
    """
    period = request.args.get('period', '7d')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    workspace_id = g.workspace_id

    try:
        data = get_dashboard_summary(
            period=period,
            start_date_str=start_date,
            end_date_str=end_date,
            workspace_id=workspace_id
        )
        return jsonify({
            'success': True,
            'data': data
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
