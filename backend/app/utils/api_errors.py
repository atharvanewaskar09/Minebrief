from flask import current_app, jsonify


def internal_server_error(context):
    current_app.logger.exception(context)
    return jsonify({
        'code': 'internal_server_error',
        'message': 'The server could not complete this request.',
    }), 500
