from datetime import datetime
from app.models.base import db

class Maintenance(db.Model):
    __tablename__ = 'maintenance'

    id = db.Column(db.Integer, primary_key=True)
    workspace_id = db.Column(db.Integer, db.ForeignKey('workspaces.id'), nullable=True, index=True)
    breakdown_id = db.Column(db.Integer, db.ForeignKey('equipment_breakdowns.id'), nullable=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=True)
    report_id = db.Column(db.Integer, db.ForeignKey('shift_reports.id'), nullable=True)
    requirement = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(50), default='medium')  # low, medium, high, critical
    status = db.Column(db.String(50), default='open')  # open, under_review, in_progress, resolved
    assigned_to = db.Column(db.String(100), nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        equipment_name = None
        equipment_tag = None
        if self.equipment:
            equipment_name = self.equipment.name
            equipment_tag = self.equipment.equipment_id_tag
        elif self.breakdown and self.breakdown.equipment:
            equipment_name = self.breakdown.equipment.name
            equipment_tag = self.breakdown.equipment.equipment_id_tag

        return {
            'id': self.id,
            'breakdown_id': self.breakdown_id,
            'equipment_id': self.equipment_id,
            'equipment_name': equipment_name,
            'equipment_tag': equipment_tag,
            'report_id': self.report_id,
            'requirement': self.requirement,
            'priority': self.priority,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
