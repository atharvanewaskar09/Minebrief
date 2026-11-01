from datetime import datetime
from app.models.base import db

class Issue(db.Model):
    __tablename__ = 'issues'

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('shift_reports.id'), nullable=True)
    workspace_id = db.Column(db.Integer, db.ForeignKey('workspaces.id'), nullable=True)
    description = db.Column(db.Text, nullable=False)
    section = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(50), default='open')  # open, under_review, in_progress, resolved
    date_reported = db.Column(db.Date, nullable=True)
    assigned_to = db.Column(db.String(100), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'workspace_id': self.workspace_id,
            'description': self.description,
            'section': self.section,
            'status': self.status,
            'date_reported': self.date_reported.isoformat() if self.date_reported else None,
            'assigned_to': self.assigned_to,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
