import json
from urllib.request import Request

import pytest

from app import create_app
from app.models.base import db


@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.drop_all()
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


def test_bearer_session_syncs_user_and_returns_profile(app, monkeypatch):
    from app import security

    app.testing = False
    captured = {}

    def fake_load_supabase_user(access_token):
        captured['access_token'] = access_token
        return {
            'id': '00000000-0000-0000-0000-000000000001',
            'email': 'authenticated@example.com',
            'user_metadata': {'full_name': 'Authenticated User'},
        }, None

    monkeypatch.setattr(security, '_load_supabase_user', fake_load_supabase_user)

    response = app.test_client().get(
        '/api/auth/profile',
        headers={'Authorization': 'Bearer test-access-token'},
    )

    assert response.status_code == 200
    assert captured['access_token'] == 'test-access-token'
    assert response.get_json()['data']['email'] == 'authenticated@example.com'
    assert response.get_json()['data']['workspace_id'] is not None


def test_supabase_validation_sends_access_token_as_bearer(monkeypatch):
    app = create_app('testing')
    app.config.update(
        SUPABASE_URL='https://project.example.supabase.co',
        SUPABASE_PUBLISHABLE_KEY='test-publishable-key',
    )
    captured = {}

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def read(self):
            return json.dumps({
                'id': 'user-id',
                'email': 'user@example.com',
            }).encode()

    def fake_urlopen(auth_request, timeout):
        assert isinstance(auth_request, Request)
        captured['authorization'] = auth_request.get_header('Authorization')
        captured['apikey'] = auth_request.get_header('Apikey')
        captured['timeout'] = timeout
        return Response()

    monkeypatch.setattr('app.security.urlopen', fake_urlopen)

    with app.app_context():
        from app.security import _load_supabase_user

        user, error = _load_supabase_user('test-access-token')

    assert error is None
    assert user['id'] == 'user-id'
    assert captured == {
        'authorization': 'Bearer test-access-token',
        'apikey': 'test-publishable-key',
        'timeout': 8,
    }
