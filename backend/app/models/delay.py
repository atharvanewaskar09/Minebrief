from datetime import datetime
from app.models.base import db

class ProductionDelay(db.Model):
    __tablename__ = 'production_delays'

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('shift_reports.id'), nullable=False)
    affected_activity = db.Column(db.String(150), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    remarks = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'affected_activity': self.affected_activity,
            'duration_minutes': self.duration_minutes,
            'reason': self.reason,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
