import os
import tempfile

from app import create_app
from app.utils.api_errors import internal_server_error
from config import BASE_DIR, _upload_folder


def test_vercel_upload_folder_uses_writable_temporary_directory(monkeypatch):
    monkeypatch.setenv('VERCEL', '1')

    upload_folder = _upload_folder()

    assert upload_folder == os.path.join(tempfile.gettempdir(), 'minebrief', 'uploads')
    assert os.path.commonpath((upload_folder, tempfile.gettempdir())) == tempfile.gettempdir()


def test_local_upload_folder_stays_in_backend(monkeypatch):
    monkeypatch.delenv('VERCEL', raising=False)

    assert _upload_folder() == os.path.join(BASE_DIR, 'uploads')


def test_internal_errors_are_logged_and_return_safe_json(caplog):
    app = create_app('testing')

    with app.app_context():
        try:
            raise RuntimeError('private database detail')
        except RuntimeError:
            response, status = internal_server_error('Dashboard summary request failed.')

    assert status == 500
    assert response.get_json() == {
        'code': 'internal_server_error',
        'message': 'The server could not complete this request.',
    }
    assert 'private database detail' in caplog.text
