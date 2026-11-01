from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.models.base import db
from app.models.issue import Issue
from app.models.shift_report import ShiftReport

issues_bp = Blueprint('issues', __name__)

@issues_bp.route('/issues', methods=['GET'])
def get_issues_list():
    """List operational issues filtered by status and section."""
    status = request.args.get('status')
    section = request.args.get('section')
    workspace_id = g.workspace_id

    query = Issue.query
    if status:
        query = query.filter(Issue.status == status)
    if section:
        query = query.filter(Issue.section.ilike(section))
    if workspace_id:
        query = query.filter(Issue.workspace_id == workspace_id)

    records = query.order_by(Issue.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [rec.to_dict() for rec in records]
    }), 200

@issues_bp.route('/issues/<int:issue_id>', methods=['GET'])
def get_single_issue(issue_id):
    """Get single issue details by ID."""
    issue = Issue.query.filter_by(id=issue_id, workspace_id=g.workspace_id).first()
    if not issue:
        return jsonify({
            'success': False,
            'error': f'Issue with ID {issue_id} not found.'
        }), 404
    return jsonify({
        'success': True,
        'data': issue.to_dict()
    }), 200

@issues_bp.route('/issues', methods=['POST'])
def create_new_issue():
    """Create a new tracked operational issue."""
    payload = request.get_json()
    if not payload:
        return jsonify({
            'success': False,
            'error': 'Request body must be valid JSON.'
        }), 400

    desc = payload.get('description')
    if not desc:
        return jsonify({
            'success': False,
            'error': "Field 'description' is required."
        }), 400

    date_rep = payload.get('date_reported')
    if date_rep and isinstance(date_rep, str):
        try:
            date_rep = datetime.strptime(date_rep, '%Y-%m-%d').date()
        except ValueError:
            date_rep = None

    report_id = payload.get('report_id')
    if report_id and not ShiftReport.query.filter_by(
        id=report_id,
        workspace_id=g.workspace_id,
    ).first():
        return jsonify({
            'success': False,
            'error': 'The referenced report does not belong to this workspace.',
        }), 400

    issue = Issue(
        report_id=report_id,
        workspace_id=g.workspace_id,
        description=desc,
        section=payload.get('section'),
        status=payload.get('status', 'open'),
        date_reported=date_rep,
        assigned_to=payload.get('assigned_to')
    )
    db.session.add(issue)
    db.session.commit()

    return jsonify({
        'success': True,
        'data': issue.to_dict()
    }), 201

@issues_bp.route('/issues/<int:issue_id>', methods=['PUT'])
def update_existing_issue(issue_id):
    """Update issue status, resolution, or assignee."""
    payload = request.get_json()
    if not payload:
        return jsonify({
            'success': False,
            'error': 'Request body must be valid JSON.'
        }), 400

    issue = Issue.query.filter_by(id=issue_id, workspace_id=g.workspace_id).first()
    if not issue:
        return jsonify({
            'success': False,
            'error': f'Issue with ID {issue_id} not found.'
        }), 404

    if 'status' in payload:
        issue.status = payload['status']
        if issue.status == 'resolved' and not issue.resolved_at:
            issue.resolved_at = datetime.utcnow()
    if 'description' in payload:
        issue.description = payload['description']
    if 'section' in payload:
        issue.section = payload['section']
    if 'assigned_to' in payload:
        issue.assigned_to = payload['assigned_to']

    db.session.commit()
    return jsonify({
        'success': True,
        'data': issue.to_dict()
    }), 200
