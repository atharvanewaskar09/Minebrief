from flask import Blueprint, g, jsonify

from app.models.workspace_membership import WorkspaceMembership
from app.security import _sync_profile

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/auth/profile', methods=['GET', 'POST'])
def sync_current_profile():
    """Return the verified Supabase identity and its workspace memberships."""
    auth_user = getattr(g, 'supabase_user', None)
    user = getattr(g, 'current_user', None)
    if auth_user and user is None:
        try:
            user = _sync_profile(auth_user)
        except ValueError as error:
            return jsonify({'success': False, 'error': str(error)}), 403
    if user is None:
        return jsonify({'success': False, 'error': 'Authenticated profile is unavailable.'}), 401

    memberships = WorkspaceMembership.query.filter_by(user_id=user.id).all()
    return jsonify({
        'success': True,
        'data': {
            'id': user.id,
            'supabase_user_id': user.supabase_user_id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'workspace_id': g.workspace_id,
            'workspaces': [
                {
                    'id': membership.workspace_id,
                    'name': membership.workspace.name,
                    'role': membership.role,
                }
                for membership in memberships
            ],
        },
    }), 200
