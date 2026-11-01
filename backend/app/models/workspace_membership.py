from datetime import datetime

from sqlalchemy import UniqueConstraint

from app.models.base import db


class WorkspaceMembership(db.Model):
    __tablename__ = 'workspace_memberships'
    __table_args__ = (
        UniqueConstraint('user_id', 'workspace_id', name='uq_workspace_membership'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    workspace_id = db.Column(db.Integer, db.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False, index=True)
    role = db.Column(db.String(50), nullable=False, default='operator')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user = db.relationship('User', backref='workspace_memberships')
    workspace = db.relationship('Workspace', backref='memberships')
