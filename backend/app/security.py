import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from flask import current_app, g, jsonify, request

from app.models.base import db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_membership import WorkspaceMembership


def _unauthorized(message='Authentication is required.'):
    return jsonify({'success': False, 'error': message}), 401


def _load_supabase_user(access_token):
    base_url = current_app.config.get('SUPABASE_URL')
    publishable_key = current_app.config.get('SUPABASE_PUBLISHABLE_KEY')
    if not base_url or not publishable_key:
        return None, (jsonify({
            'success': False,
            'error': 'Supabase authentication is not configured on the backend.',
        }), 503)

    auth_request = Request(
        f'{base_url}/auth/v1/user',
        headers={
            'apikey': publishable_key,
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json',
        },
    )
    try:
        with urlopen(auth_request, timeout=8) as response:
            user = json.loads(response.read())
    except HTTPError as error:
        if error.code in (401, 403):
            return None, _unauthorized('The access token is invalid or expired.')
        return None, (jsonify({
            'success': False,
            'error': 'Supabase could not validate the access token.',
        }), 502)
    except (URLError, TimeoutError, json.JSONDecodeError):
        return None, (jsonify({
            'success': False,
            'error': 'Supabase authentication is temporarily unavailable.',
        }), 503)

    if not isinstance(user, dict) or not user.get('id') or not user.get('email'):
        return None, _unauthorized('Supabase returned an invalid user identity.')
    return user, None


def _sync_profile(auth_user):
    user_id = auth_user['id']
    email = auth_user['email'].strip().lower()
    metadata = auth_user.get('user_metadata') or {}
    name = (
        metadata.get('full_name')
        or metadata.get('name')
        or email.partition('@')[0]
    )[:120]
    user = User.query.filter_by(supabase_user_id=user_id).first()
    if user is None:
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            if existing_email.is_demo:
                raise ValueError('This email is reserved for a demo account.')
            raise ValueError(
                'An account already exists for this email. Ask a workspace administrator to link it.'
            )
        else:
            workspace = Workspace(
                name=f'{name} Workspace',
                description='Private workspace created during Supabase account setup.',
                is_demo=False,
            )
            db.session.add(workspace)
            db.session.flush()
            user = User(
                name=name,
                email=email,
                supabase_user_id=user_id,
                role='admin',
                workspace_id=workspace.id,
                is_demo=False,
            )
            db.session.add(user)
            db.session.flush()
            db.session.add(WorkspaceMembership(
                user_id=user.id,
                workspace_id=workspace.id,
                role='admin',
            ))
    elif user.email != email:
        user.email = email
    elif user.name != name and metadata.get('full_name'):
        user.name = name

    if user.workspace_id and not WorkspaceMembership.query.filter_by(
        user_id=user.id,
        workspace_id=user.workspace_id,
    ).first():
        db.session.add(WorkspaceMembership(
            user_id=user.id,
            workspace_id=user.workspace_id,
            role=user.role,
        ))
    db.session.commit()
    return user


def load_request_identity():
    if not request.path.startswith('/api/') or request.endpoint == 'health.health_check':
        return None

    if request.method == 'OPTIONS':
        return None

    if current_app.testing:
        g.is_demo = False
        g.current_user = None
        g.workspace_id = None
        return None

    is_demo = request.headers.get('X-Minebrief-Demo', '').lower() == 'true'
    authorization = request.headers.get('Authorization', '')
    if is_demo and authorization:
        return _unauthorized('Demo mode cannot be combined with a customer access token.')
    if is_demo:
        demo_workspace = Workspace.query.filter_by(is_demo=True).first()
        if demo_workspace is None:
            return jsonify({
                'success': False,
                'error': 'The Rajmahal demo workspace has not been seeded.',
            }), 503
        g.is_demo = True
        g.current_user = None
        g.workspace_id = demo_workspace.id
        return None

    if not authorization.startswith('Bearer '):
        return _unauthorized()

    auth_user, error_response = _load_supabase_user(authorization[7:].strip())
    if error_response:
        return error_response
    try:
        user = _sync_profile(auth_user)
    except ValueError as error:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(error)}), 403

    memberships = WorkspaceMembership.query.filter_by(user_id=user.id).all()
    if not memberships:
        return jsonify({
            'success': False,
            'error': 'This account does not belong to an authorized workspace.',
        }), 403
    g.is_demo = False
    g.current_user = user
    g.access_token = authorization[7:].strip()
    g.supabase_user = auth_user
    g.workspace_ids = {membership.workspace_id for membership in memberships}
    g.workspace_id = user.workspace_id if user.workspace_id in g.workspace_ids else memberships[0].workspace_id
    return None
