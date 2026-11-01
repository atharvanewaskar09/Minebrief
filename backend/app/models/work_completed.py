from datetime import datetime
from app.models.base import db

class WorkCompleted(db.Model):
    __tablename__ = 'work_completed'

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('shift_reports.id'), nullable=False)
    description = db.Column(db.Text, nullable=False)
    remarks = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'description': self.description,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
