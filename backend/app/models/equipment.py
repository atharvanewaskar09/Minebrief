from datetime import datetime
from app.models.base import db

class Equipment(db.Model):
    __tablename__ = 'equipment'

    id = db.Column(db.Integer, primary_key=True)
    workspace_id = db.Column(db.Integer, db.ForeignKey('workspaces.id'), nullable=True)
    name = db.Column(db.String(150), nullable=False)
    equipment_id_tag = db.Column(db.String(100), unique=True, nullable=False)
    section = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    commissioned_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), default='operational')  # operational, under_maintenance, out_of_service
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    breakdowns = db.relationship('EquipmentBreakdown', backref='equipment', cascade='all, delete-orphan', lazy=True)
    maintenance_records = db.relationship('Maintenance', backref='equipment', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'workspace_id': self.workspace_id,
            'name': self.name,
            'equipment_id_tag': self.equipment_id_tag,
            'section': self.section,
            'description': self.description,
            'commissioned_date': self.commissioned_date.isoformat() if self.commissioned_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
