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

__all__ = [
    'health_bp',
    'dashboard_bp',
    'reports_bp',
    'attendance_bp',
    'equipment_bp',
    'maintenance_bp',
    'issues_bp',
    'search_bp',
    'uploads_bp',
    'demo_bp'
]
