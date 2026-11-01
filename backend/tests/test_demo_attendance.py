import pytest

from app import create_app
from app.models.attendance import Attendance
from app.models.base import db
from app.services.attendance_service import list_attendance
from app.services.dashboard_service import get_dashboard_summary
from app.utils.seed_data import seed_demo_data


@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.drop_all()
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


def test_demo_attendance_is_visible_to_workforce_and_dashboard(app):
    with app.app_context():
        workspace = seed_demo_data()

        attendance = list_attendance({'workspace_id': workspace.id})
        summary = get_dashboard_summary(period='30d', workspace_id=workspace.id)
        recent_summary = get_dashboard_summary(period='7d', workspace_id=workspace.id)

        assert attendance
        assert all(record['present'] > 0 for record in attendance)
        assert sum(point['present'] for point in summary['attendance_trend']) > 0
        assert len(summary['attendance_trend']) == 30
        assert len(recent_summary['attendance_trend']) == 7
        assert summary['total_reports'] > recent_summary['total_reports']


def test_seeding_repairs_existing_demo_attendance_workspace_ids(app):
    with app.app_context():
        workspace = seed_demo_data()
        Attendance.query.update(
            {Attendance.workspace_id: None},
            synchronize_session=False,
        )
        db.session.commit()

        seed_demo_data()

        assert Attendance.query.filter_by(workspace_id=workspace.id).count() > 0
