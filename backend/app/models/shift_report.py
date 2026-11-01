from datetime import datetime
from app.models.base import db

class ShiftReport(db.Model):
    __tablename__ = 'shift_reports'

    id = db.Column(db.Integer, primary_key=True)
    workspace_id = db.Column(db.Integer, db.ForeignKey('workspaces.id'), nullable=True)
    report_date = db.Column(db.Date, nullable=False)
    shift = db.Column(db.String(50), nullable=False)  # Morning, Afternoon, Night
    section = db.Column(db.String(100), nullable=False)
    submitted_by = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), default='draft')  # draft, submitted, verified
    verified_by = db.Column(db.String(100), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    attendance = db.relationship('Attendance', backref='report', uselist=False, cascade='all, delete-orphan')
    work_completed = db.relationship('WorkCompleted', backref='report', cascade='all, delete-orphan')
    equipment_breakdowns = db.relationship('EquipmentBreakdown', backref='report', cascade='all, delete-orphan')
    production_delays = db.relationship('ProductionDelay', backref='report', cascade='all, delete-orphan')
    safety_observations = db.relationship('SafetyObservation', backref='report', cascade='all, delete-orphan')
    maintenance_items = db.relationship('Maintenance', backref='report', cascade='all, delete-orphan')
    handover = db.relationship('Handover', backref='report', uselist=False, cascade='all, delete-orphan')
    issues = db.relationship('Issue', backref='report', cascade='all, delete-orphan')
    attachments = db.relationship('Attachment', backref='report', cascade='all, delete-orphan')

    def to_dict(self, include_relations=False):
        data = {
            'id': self.id,
            'workspace_id': self.workspace_id,
            'report_date': self.report_date.isoformat() if self.report_date else None,
            'shift': self.shift,
            'section': self.section,
            'submitted_by': self.submitted_by,
            'status': self.status,
            'verified_by': self.verified_by,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_relations:
            data['attendance'] = self.attendance.to_dict() if self.attendance else None
            data['work_completed'] = [item.to_dict() for item in self.work_completed]
            data['equipment_breakdowns'] = [item.to_dict() for item in self.equipment_breakdowns]
            data['production_delays'] = [item.to_dict() for item in self.production_delays]
            data['safety_observations'] = [item.to_dict() for item in self.safety_observations]
            data['maintenance_items'] = [item.to_dict() for item in self.maintenance_items]
            data['handover'] = self.handover.to_dict() if self.handover else None
            data['issues'] = [item.to_dict() for item in self.issues]
            data['attachments'] = [item.to_dict() for item in self.attachments]

        return data
