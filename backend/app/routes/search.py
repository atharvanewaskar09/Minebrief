from flask import Blueprint, request, jsonify, g
from app.services.search_service import search_operations
from app.utils.api_errors import internal_server_error

search_bp = Blueprint('search', __name__)

@search_bp.route('/search', methods=['GET'])
def search_endpoint():
    """
    Search across reports, breakdowns, issues, safety observations, and work completed.
    Params: q, date, shift, section, category, status, workspace_id
    """
    params = {
        'q': request.args.get('q', ''),
        'date': request.args.get('date'),
        'date_from': request.args.get('date_from'),
        'date_to': request.args.get('date_to'),
        'shift': request.args.get('shift'),
        'section': request.args.get('section'),
        'category': request.args.get('category'),
        'status': request.args.get('status'),
        'workspace_id': g.workspace_id
    }
    try:
        results = search_operations(params)
        return jsonify({
            'success': True,
            'data': results
        }), 200
    except Exception:
        return internal_server_error('Operational search request failed.')
