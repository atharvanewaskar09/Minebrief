from datetime import datetime
from app.models.base import db

class EquipmentBreakdown(db.Model):
    __tablename__ = 'equipment_breakdowns'

    id = db.Column(db.Integer, primary_key=True)
    workspace_id = db.Column(db.Integer, db.ForeignKey('workspaces.id'), nullable=True, index=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    report_id = db.Column(db.Integer, db.ForeignKey('shift_reports.id'), nullable=True)
    fault_description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(150), nullable=True)
    reported_time = db.Column(db.DateTime, default=datetime.utcnow)
    shift = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(50), default='open')  # open, under_review, in_progress, resolved
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolved_by = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    maintenance_records = db.relationship('Maintenance', backref='breakdown', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        equipment_name = self.equipment.name if self.equipment else None
        equipment_tag = self.equipment.equipment_id_tag if self.equipment else None
        return {
            'id': self.id,
            'equipment_id': self.equipment_id,
            'equipment_name': equipment_name,
            'equipment_tag': equipment_tag,
            'report_id': self.report_id,
            'fault_description': self.fault_description,
            'location': self.location,
            'reported_time': self.reported_time.isoformat() if self.reported_time else None,
            'shift': self.shift,
            'status': self.status,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolved_by': self.resolved_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
