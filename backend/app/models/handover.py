from datetime import datetime
from app.models.base import db

class Handover(db.Model):
    __tablename__ = 'handovers'

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('shift_reports.id'), nullable=False)
    pending_work = db.Column(db.Text, nullable=True)
    equipment_condition = db.Column(db.Text, nullable=True)
    unresolved_issues = db.Column(db.Text, nullable=True)
    instructions = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'pending_work': self.pending_work,
            'equipment_condition': self.equipment_condition,
            'unresolved_issues': self.unresolved_issues,
            'instructions': self.instructions,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
