from datetime import datetime
from app.models.base import db

class SafetyObservation(db.Model):
    __tablename__ = 'safety_observations'

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('shift_reports.id'), nullable=False)
    hazard_type = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(150), nullable=True)
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(50), default='low')  # low, medium, high, critical
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'hazard_type': self.hazard_type,
            'location': self.location,
            'description': self.description,
            'severity': self.severity,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
