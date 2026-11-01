from datetime import datetime, date
from app.models.base import db
from app.models.shift_report import ShiftReport
from app.models.attendance import Attendance
from app.models.work_completed import WorkCompleted
from app.models.breakdown import EquipmentBreakdown
from app.models.delay import ProductionDelay
from app.models.safety import SafetyObservation
from app.models.maintenance import Maintenance
from app.models.handover import Handover
from app.models.issue import Issue
from app.models.attachment import Attachment
from app.models.workspace import Workspace
from app.models.equipment import Equipment

def list_reports(filters, page=1, per_page=10):
    """List reports with filtering and pagination."""
    query = ShiftReport.query

    if 'date' in filters and filters['date']:
        try:
            target_date = datetime.strptime(filters['date'], '%Y-%m-%d').date()
            query = query.filter(ShiftReport.report_date == target_date)
        except ValueError:
            pass

    if 'shift' in filters and filters['shift']:
        query = query.filter(ShiftReport.shift.ilike(f"%{filters['shift']}%"))

    if 'section' in filters and filters['section']:
        query = query.filter(ShiftReport.section.ilike(f"%{filters['section']}%"))

    if 'status' in filters and filters['status']:
        query = query.filter(ShiftReport.status == filters['status'])

    if 'workspace_id' in filters and filters['workspace_id']:
        query = query.filter(ShiftReport.workspace_id == filters['workspace_id'])

    total = query.count()
    items = query.order_by(ShiftReport.report_date.desc(), ShiftReport.id.desc()) \
                 .offset((page - 1) * per_page) \
                 .limit(per_page) \
                 .all()

    report_list = [item.to_dict(include_relations=False) for item in items]
    return {
        'items': report_list,
        'reports': report_list,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page if per_page else 1
    }

def get_report_by_id(report_id, workspace_id=None):
    """Retrieve complete shift report with all related categories."""
    query = ShiftReport.query.filter_by(id=report_id)
    if workspace_id is not None:
        query = query.filter_by(workspace_id=workspace_id)
    report = query.first()
    if not report:
        return None
    return report.to_dict(include_relations=True)

def create_report(data):
    """
    Create a complete shift report with all 8 operational categories in one payload.
    """
    report_date_raw = data.get('report_date')
    if not report_date_raw:
        raise ValueError("Field 'report_date' is required.")
    if isinstance(report_date_raw, str):
        report_date = datetime.strptime(report_date_raw, '%Y-%m-%d').date()
    else:
        report_date = report_date_raw

    shift = data.get('shift')
    section = data.get('section')
    submitted_by = data.get('submitted_by')

    if not shift or not section or not submitted_by:
        raise ValueError("Fields 'shift', 'section', and 'submitted_by' are required.")

    # Validate attendance uniqueness and balance if attendance payload provided
    attendance_data = data.get('attendance')
    if attendance_data:
        att_date = attendance_data.get('report_date')
        if att_date:
            if isinstance(att_date, str):
                att_date = datetime.strptime(att_date, '%Y-%m-%d').date()
        else:
            att_date = report_date

        att_shift = attendance_data.get('shift', shift)
        att_section = attendance_data.get('section', section)

        # Check existing attendance record with same (report_date, shift, section)
        existing_att_query = Attendance.query.filter_by(
            report_date=att_date, shift=att_shift, section=att_section
        )
        if data.get('workspace_id') is not None:
            existing_att_query = existing_att_query.filter_by(workspace_id=data['workspace_id'])
        existing_att = existing_att_query.first()
        if existing_att:
            raise ValueError(
                f"Attendance for date '{att_date}', shift '{att_shift}', and section '{att_section}' already exists."
            )

        total_scheduled = int(attendance_data.get('total_scheduled', 0))
        present = int(attendance_data.get('present', 0))
        absent = int(attendance_data.get('absent', 0))
        if present + absent != total_scheduled:
            raise ValueError(
                f"Attendance numbers invalid: present ({present}) + absent ({absent}) != total_scheduled ({total_scheduled})"
            )

    workspace_id = data.get('workspace_id')
    if workspace_id is not None and not Workspace.query.filter_by(id=workspace_id).first():
        raise ValueError('The selected workspace does not exist.')

    report = ShiftReport(
        workspace_id=workspace_id,
        report_date=report_date,
        shift=shift,
        section=section,
        submitted_by=submitted_by,
        status=data.get('status', 'draft'),
        notes=data.get('notes')
    )
    db.session.add(report)
    db.session.flush()  # assign report.id

    # 1. Attendance
    if attendance_data:
        attendance = Attendance(
            report_id=report.id,
            workspace_id=report.workspace_id,
            report_date=att_date,
            shift=att_shift,
            section=att_section,
            total_scheduled=int(attendance_data.get('total_scheduled', 0)),
            present=int(attendance_data.get('present', 0)),
            absent=int(attendance_data.get('absent', 0)),
            remarks=attendance_data.get('remarks'),
            confirmed_by=attendance_data.get('confirmed_by', submitted_by)
        )
        db.session.add(attendance)

    # 2. Work Completed
    for wc in data.get('work_completed', []):
        db.session.add(WorkCompleted(
            report_id=report.id,
            description=wc.get('description', ''),
            remarks=wc.get('remarks')
        ))

    # 3. Equipment Breakdowns
    breakdown_obj_map = {}
    for idx, eb in enumerate(data.get('equipment_breakdowns', [])):
        equipment = Equipment.query.filter_by(
            id=eb.get('equipment_id'),
            workspace_id=report.workspace_id,
        ).first()
        if not equipment:
            raise ValueError('A breakdown must reference equipment in this workspace.')
        reported_time = eb.get('reported_time')
        if reported_time and isinstance(reported_time, str):
            try:
                reported_time = datetime.fromisoformat(reported_time)
            except ValueError:
                reported_time = datetime.utcnow()
        elif not reported_time:
            reported_time = datetime.utcnow()

        breakdown = EquipmentBreakdown(
            workspace_id=report.workspace_id,
            report_id=report.id,
            equipment_id=eb.get('equipment_id'),
            fault_description=eb.get('fault_description', ''),
            location=eb.get('location', section),
            reported_time=reported_time,
            shift=eb.get('shift', shift),
            status=eb.get('status', 'open'),
            resolved_at=datetime.fromisoformat(eb['resolved_at']) if eb.get('resolved_at') else None,
            resolved_by=eb.get('resolved_by')
        )
        db.session.add(breakdown)
        db.session.flush()
        breakdown_obj_map[idx] = breakdown.id
        if eb.get('ref_id'):
            breakdown_obj_map[eb['ref_id']] = breakdown.id

    # 4. Production Delays
    for pd in data.get('production_delays', []):
        db.session.add(ProductionDelay(
            report_id=report.id,
            affected_activity=pd.get('affected_activity', ''),
            duration_minutes=int(pd.get('duration_minutes', 0)),
            reason=pd.get('reason', ''),
            remarks=pd.get('remarks')
        ))

    # 5. Safety Observations
    for so in data.get('safety_observations', []):
        db.session.add(SafetyObservation(
            report_id=report.id,
            hazard_type=so.get('hazard_type', 'General'),
            location=so.get('location', section),
            description=so.get('description', ''),
            severity=so.get('severity', 'low')
        ))

    # 6. Maintenance Items
    for mi in data.get('maintenance_items', []):
        if mi.get('equipment_id') is not None and not Equipment.query.filter_by(
            id=mi['equipment_id'],
            workspace_id=report.workspace_id,
        ).first():
            raise ValueError('A maintenance item must reference equipment in this workspace.')
        bd_id = mi.get('breakdown_id')
        if bd_id is None and mi.get('breakdown_ref_id') in breakdown_obj_map:
            bd_id = breakdown_obj_map[mi['breakdown_ref_id']]

        db.session.add(Maintenance(
            workspace_id=report.workspace_id,
            report_id=report.id,
            breakdown_id=bd_id,
            equipment_id=mi.get('equipment_id'),
            requirement=mi.get('requirement', ''),
            priority=mi.get('priority', 'medium'),
            status=mi.get('status', 'open'),
            assigned_to=mi.get('assigned_to'),
            remarks=mi.get('remarks')
        ))

    # 7. Handover
    handover_data = data.get('handover')
    if handover_data:
        db.session.add(Handover(
            report_id=report.id,
            pending_work=handover_data.get('pending_work'),
            equipment_condition=handover_data.get('equipment_condition'),
            unresolved_issues=handover_data.get('unresolved_issues'),
            instructions=handover_data.get('instructions'),
            created_by=handover_data.get('created_by', submitted_by)
        ))

    # 8. Issues
    for iss in data.get('issues', []):
        date_rep = iss.get('date_reported')
        if date_rep and isinstance(date_rep, str):
            try:
                date_rep = datetime.strptime(date_rep, '%Y-%m-%d').date()
            except ValueError:
                date_rep = report_date
        else:
            date_rep = report_date

        db.session.add(Issue(
            report_id=report.id,
            workspace_id=report.workspace_id,
            description=iss.get('description', ''),
            section=iss.get('section', section),
            status=iss.get('status', 'open'),
            date_reported=date_rep,
            assigned_to=iss.get('assigned_to'),
            resolved_at=datetime.fromisoformat(iss['resolved_at']) if iss.get('resolved_at') else None
        ))

    # Link existing attachments if attachment IDs provided
    attachment_ids = data.get('attachment_ids', [])
    if attachment_ids:
        Attachment.query.filter(
            Attachment.id.in_(attachment_ids),
            Attachment.workspace_id == report.workspace_id,
        ).update(
            {'report_id': report.id}, synchronize_session=False
        )

    db.session.commit()
    return report.to_dict(include_relations=True)

def update_report(report_id, data, workspace_id=None):
    """Update top-level report details."""
    query = ShiftReport.query.filter_by(id=report_id)
    if workspace_id is not None:
        query = query.filter_by(workspace_id=workspace_id)
    report = query.first()
    if not report:
        return None

    if 'report_date' in data and data['report_date']:
        if isinstance(data['report_date'], str):
            report.report_date = datetime.strptime(data['report_date'], '%Y-%m-%d').date()
        else:
            report.report_date = data['report_date']

    if 'shift' in data:
        report.shift = data['shift']
    if 'section' in data:
        report.section = data['section']
    if 'notes' in data:
        report.notes = data['notes']
    if 'status' in data:
        report.status = data['status']
    if 'submitted_by' in data:
        report.submitted_by = data['submitted_by']

    db.session.commit()
    return report.to_dict(include_relations=True)

def verify_report(report_id, verified_by, workspace_id=None):
    """Mark report as verified with verifier name and timestamp."""
    query = ShiftReport.query.filter_by(id=report_id)
    if workspace_id is not None:
        query = query.filter_by(workspace_id=workspace_id)
    report = query.first()
    if not report:
        return None

    report.status = 'verified'
    report.verified_by = verified_by or 'Supervisor'
    report.verified_at = datetime.utcnow()
    db.session.commit()
    return report.to_dict(include_relations=True)
