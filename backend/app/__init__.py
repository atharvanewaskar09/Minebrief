import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import config
from app.models.base import db
from flask_migrate import Migrate
import app.models  # ensure all models are registered with SQLAlchemy

migrate = Migrate()

def create_app(config_name=None):
    """Flask application factory."""
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'default')

    app = Flask(__name__)
    app.config.from_object(config.get(config_name, config['default']))
    if config_name == 'production':
        config['production'].validate()

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db, compare_type=True)
    allowed_origins = [
        origin.strip() for origin in os.environ.get(
            'FRONTEND_ORIGINS',
            'http://localhost:5173,http://127.0.0.1:5173'
        ).split(',') if origin.strip()
    ]
    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        allow_headers=['Content-Type', 'Authorization', 'X-Minebrief-Demo'],
        methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    )

    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register blueprints under /api prefix
    from app.routes.health import health_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.reports import reports_bp
    from app.routes.attendance import attendance_bp
    from app.routes.equipment import equipment_bp
    from app.routes.maintenance import maintenance_bp
    from app.routes.issues import issues_bp
    from app.routes.search import search_bp
    from app.routes.uploads import uploads_bp
    from app.routes.demo import demo_bp
    from app.routes.auth import auth_bp

    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(reports_bp, url_prefix='/api')
    app.register_blueprint(attendance_bp, url_prefix='/api')
    app.register_blueprint(equipment_bp, url_prefix='/api')
    app.register_blueprint(maintenance_bp, url_prefix='/api')
    app.register_blueprint(issues_bp, url_prefix='/api')
    app.register_blueprint(search_bp, url_prefix='/api')
    app.register_blueprint(uploads_bp, url_prefix='/api')
    app.register_blueprint(demo_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')

    from app.security import load_request_identity
    app.before_request(load_request_identity)

    @app.cli.command('seed-demo')
    def seed_demo_command():
        """Create or verify the fictional Rajmahal demo workspace."""
        from app.utils.seed_data import seed_demo_data

        seed_demo_data()
        print('Rajmahal demo workspace is ready.')

    # Register error handlers returning JSON
    @app.errorhandler(400)
    def bad_request(error):
        msg = getattr(error, 'description', 'Bad request.')
        return jsonify({
            'success': False,
            'error': msg
        }), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Resource not found.'
        }), 404

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            'success': False,
            'error': 'File size exceeds maximum allowed limit (20MB).'
        }), 413

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({
            'success': False,
            'error': 'Internal server error occurred.'
        }), 500

    # SQLite remains a convenient local/test fallback. Production uses Alembic.
    if app.config.get('AUTO_CREATE_SCHEMA'):
        with app.app_context():
            db.create_all()

    return app
