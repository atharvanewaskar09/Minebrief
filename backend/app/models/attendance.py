from datetime import datetime
from sqlalchemy import UniqueConstraint
from app.models.base import db

class Attendance(db.Model):
    __tablename__ = 'attendance'
    __table_args__ = (
        UniqueConstraint('report_date', 'shift', 'section', name='uq_attendance_date_shift_section'),
    )

    id = db.Column(db.Integer, primary_key=True)
    workspace_id = db.Column(db.Integer, db.ForeignKey('workspaces.id'), nullable=True, index=True)
    report_id = db.Column(db.Integer, db.ForeignKey('shift_reports.id'), nullable=True)
    report_date = db.Column(db.Date, nullable=False)
    shift = db.Column(db.String(50), nullable=False)
    section = db.Column(db.String(100), nullable=False)
    total_scheduled = db.Column(db.Integer, nullable=False)
    present = db.Column(db.Integer, nullable=False)
    absent = db.Column(db.Integer, nullable=False)
    remarks = db.Column(db.Text, nullable=True)
    confirmed_by = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def validate_totals(self):
        if (self.present is not None and self.absent is not None and self.total_scheduled is not None):
            if self.present + self.absent != self.total_scheduled:
                raise ValueError(
                    f"Invalid attendance numbers: present ({self.present}) + absent ({self.absent}) "
                    f"must equal total_scheduled ({self.total_scheduled})"
                )

    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'report_date': self.report_date.isoformat() if self.report_date else None,
            'shift': self.shift,
            'section': self.section,
            'total_scheduled': self.total_scheduled,
            'present': self.present,
            'absent': self.absent,
            'remarks': self.remarks,
            'confirmed_by': self.confirmed_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
