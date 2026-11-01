from datetime import datetime
from app.models.base import db
from app.models.equipment import Equipment
from app.models.breakdown import EquipmentBreakdown
from app.models.maintenance import Maintenance

def list_equipment(filters):
    """List equipment assets with optional section and status filters."""
    query = Equipment.query

    if 'section' in filters and filters['section']:
        query = query.filter(Equipment.section.ilike(f"%{filters['section']}%"))

    if 'status' in filters and filters['status']:
        query = query.filter(Equipment.status == filters['status'])

    if 'workspace_id' in filters and filters['workspace_id']:
        query = query.filter(Equipment.workspace_id == filters['workspace_id'])

    records = query.order_by(Equipment.name.asc()).all()
    return [rec.to_dict() for rec in records]

def get_equipment_by_id(equipment_id, workspace_id=None):
    query = Equipment.query.filter_by(id=equipment_id)
    if workspace_id is not None:
        query = query.filter_by(workspace_id=workspace_id)
    rec = query.first()
    return rec.to_dict() if rec else None

def create_equipment(data):
    """Register a new physical equipment asset."""
    name = data.get('name')
    tag = data.get('equipment_id_tag')
    section = data.get('section')

    if not name or not tag or not section:
        raise ValueError("Fields 'name', 'equipment_id_tag', and 'section' are required.")

    # Check uniqueness of equipment_id_tag
    existing = Equipment.query.filter_by(equipment_id_tag=tag).first()
    if existing:
        raise ValueError(f"Equipment tag '{tag}' is already registered.")

    comm_date = data.get('commissioned_date')
    if comm_date and isinstance(comm_date, str):
        try:
            comm_date = datetime.strptime(comm_date, '%Y-%m-%d').date()
        except ValueError:
            comm_date = None

    asset = Equipment(
        workspace_id=data.get('workspace_id'),
        name=name,
        equipment_id_tag=tag,
        section=section,
        description=data.get('description'),
        commissioned_date=comm_date,
        status=data.get('status', 'operational')
    )
    db.session.add(asset)
    db.session.commit()
    return asset.to_dict()

def update_equipment(equipment_id, data, workspace_id=None):
    """Update equipment asset details."""
    query = Equipment.query.filter_by(id=equipment_id)
    if workspace_id is not None:
        query = query.filter_by(workspace_id=workspace_id)
    asset = query.first()
    if not asset:
        return None

    if 'equipment_id_tag' in data and data['equipment_id_tag'] != asset.equipment_id_tag:
        existing = Equipment.query.filter_by(equipment_id_tag=data['equipment_id_tag']).first()
        if existing:
            raise ValueError(f"Equipment tag '{data['equipment_id_tag']}' is already in use.")
        asset.equipment_id_tag = data['equipment_id_tag']

    if 'name' in data:
        asset.name = data['name']
    if 'section' in data:
        asset.section = data['section']
    if 'description' in data:
        asset.description = data['description']
    if 'status' in data:
        asset.status = data['status']
    if 'commissioned_date' in data and data['commissioned_date']:
        if isinstance(data['commissioned_date'], str):
            asset.commissioned_date = datetime.strptime(data['commissioned_date'], '%Y-%m-%d').date()
        else:
            asset.commissioned_date = data['commissioned_date']

    db.session.commit()
    return asset.to_dict()

def get_equipment_history(equipment_id, workspace_id=None):
    """Retrieve all historical breakdowns and maintenance logs for this asset."""
    query = Equipment.query.filter_by(id=equipment_id)
    if workspace_id is not None:
        query = query.filter_by(workspace_id=workspace_id)
    asset = query.first()
    if not asset:
        return None

    breakdowns = EquipmentBreakdown.query.filter_by(equipment_id=equipment_id) \
                                        .order_by(EquipmentBreakdown.reported_time.desc()) \
                                        .all()

    maintenance = Maintenance.query.filter_by(equipment_id=equipment_id) \
                                   .order_by(Maintenance.created_at.desc()) \
                                   .all()

    return {
        'equipment': asset.to_dict(),
        'breakdowns': [b.to_dict() for b in breakdowns],
        'maintenance': [m.to_dict() for m in maintenance]
    }

def list_maintenance(filters):
    """List maintenance records with status and priority filtering."""
    query = Maintenance.query

    if 'status' in filters and filters['status']:
        query = query.filter(Maintenance.status == filters['status'])

    if 'priority' in filters and filters['priority']:
        query = query.filter(Maintenance.priority == filters['priority'])

    if 'equipment_id' in filters and filters['equipment_id']:
        query = query.filter(Maintenance.equipment_id == filters['equipment_id'])
    if filters.get('workspace_id') is not None:
        query = query.filter(Maintenance.workspace_id == filters['workspace_id'])

    records = query.order_by(Maintenance.created_at.desc()).all()
    return [rec.to_dict() for rec in records]

def update_maintenance(maintenance_id, data, workspace_id=None):
    """Update maintenance status, remarks, or priority."""
    query = Maintenance.query.filter_by(id=maintenance_id)
    if workspace_id is not None:
        query = query.filter_by(workspace_id=workspace_id)
    maint = query.first()
    if not maint:
        return None

    if 'status' in data:
        maint.status = data['status']
    if 'remarks' in data:
        maint.remarks = data['remarks']
    if 'priority' in data:
        maint.priority = data['priority']
    if 'assigned_to' in data:
        maint.assigned_to = data['assigned_to']
    if 'requirement' in data:
        maint.requirement = data['requirement']

    db.session.commit()
    return maint.to_dict()
