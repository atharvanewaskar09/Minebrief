from datetime import datetime, date
from app.models.base import db
from app.models.attendance import Attendance

def list_attendance(filters):
    """Query attendance records filtered by date, shift, section, or date range."""
    query = Attendance.query

    if 'date' in filters and filters['date']:
        try:
            target_date = datetime.strptime(filters['date'], '%Y-%m-%d').date()
            query = query.filter(Attendance.report_date == target_date)
        except ValueError:
            pass
    if filters.get('workspace_id') is not None:
        query = query.filter(Attendance.workspace_id == filters['workspace_id'])

    if 'start_date' in filters and filters['start_date']:
        try:
            start = datetime.strptime(filters['start_date'], '%Y-%m-%d').date()
            query = query.filter(Attendance.report_date >= start)
        except ValueError:
            pass

    if 'end_date' in filters and filters['end_date']:
        try:
            end = datetime.strptime(filters['end_date'], '%Y-%m-%d').date()
            query = query.filter(Attendance.report_date <= end)
        except ValueError:
            pass

    if 'shift' in filters and filters['shift']:
        query = query.filter(Attendance.shift.ilike(filters['shift']))

    if 'section' in filters and filters['section']:
        query = query.filter(Attendance.section.ilike(filters['section']))

    records = query.order_by(Attendance.report_date.desc(), Attendance.id.desc()).all()
    return [rec.to_dict() for rec in records]

def get_attendance_by_id(attendance_id, workspace_id=None):
    query = Attendance.query.filter_by(id=attendance_id)
    if workspace_id is not None:
        query = query.filter_by(workspace_id=workspace_id)
    rec = query.first()
    return rec.to_dict() if rec else None

def create_attendance(data):
    """Create an attendance record with uniqueness and balance validation."""
    date_val = data.get('report_date')
    if not date_val:
        raise ValueError("Field 'report_date' is required.")
    if isinstance(date_val, str):
        report_date = datetime.strptime(date_val, '%Y-%m-%d').date()
    else:
        report_date = date_val

    shift = data.get('shift')
    section = data.get('section')
    if not shift or not section:
        raise ValueError("Fields 'shift' and 'section' are required.")

    total_scheduled = int(data.get('total_scheduled', 0))
    present = int(data.get('present', 0))
    absent = int(data.get('absent', 0))

    if present + absent != total_scheduled:
        raise ValueError(
            f"Validation error: present ({present}) + absent ({absent}) must equal total_scheduled ({total_scheduled})."
        )

    # Check unique constraint on (report_date, shift, section)
    existing = Attendance.query.filter_by(
        report_date=report_date, shift=shift, section=section
    ).first()
    if existing:
        raise ValueError(
            f"Attendance record already exists for date '{report_date}', shift '{shift}', section '{section}'."
        )

    attendance = Attendance(
        workspace_id=data.get('workspace_id'),
        report_id=data.get('report_id'),
        report_date=report_date,
        shift=shift,
        section=section,
        total_scheduled=total_scheduled,
        present=present,
        absent=absent,
        remarks=data.get('remarks'),
        confirmed_by=data.get('confirmed_by')
    )
    db.session.add(attendance)
    db.session.commit()
    return attendance.to_dict()

def update_attendance(attendance_id, data, workspace_id=None):
    """Update existing attendance record and re-verify constraints."""
    query = Attendance.query.filter_by(id=attendance_id)
    if workspace_id is not None:
        query = query.filter_by(workspace_id=workspace_id)
    rec = query.first()
    if not rec:
        return None

    # Target values
    if 'report_date' in data and data['report_date']:
        new_date = datetime.strptime(data['report_date'], '%Y-%m-%d').date() if isinstance(data['report_date'], str) else data['report_date']
    else:
        new_date = rec.report_date

    new_shift = data.get('shift', rec.shift)
    new_section = data.get('section', rec.section)

    # Check uniqueness if date, shift, or section changed
    if new_date != rec.report_date or new_shift != rec.shift or new_section != rec.section:
        existing = Attendance.query.filter(
            Attendance.report_date == new_date,
            Attendance.shift == new_shift,
            Attendance.section == new_section,
            Attendance.id != rec.id
        ).first()
        if existing:
            raise ValueError(
                f"Attendance conflict: Record for date '{new_date}', shift '{new_shift}', section '{new_section}' already exists."
            )

    new_present = int(data['present']) if 'present' in data else rec.present
    new_absent = int(data['absent']) if 'absent' in data else rec.absent
    new_total = int(data['total_scheduled']) if 'total_scheduled' in data else rec.total_scheduled

    if new_present + new_absent != new_total:
        raise ValueError(
            f"Validation error: present ({new_present}) + absent ({new_absent}) must equal total_scheduled ({new_total})."
        )

    rec.report_date = new_date
    rec.shift = new_shift
    rec.section = new_section
    rec.total_scheduled = new_total
    rec.present = new_present
    rec.absent = new_absent

    if 'remarks' in data:
        rec.remarks = data['remarks']
    if 'confirmed_by' in data:
        rec.confirmed_by = data['confirmed_by']
    if 'report_id' in data:
        rec.report_id = data['report_id']

    db.session.commit()
    return rec.to_dict()
