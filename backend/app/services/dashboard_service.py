from datetime import date, datetime, timedelta
from sqlalchemy import func
from app.models.base import db
from app.models.shift_report import ShiftReport
from app.models.attendance import Attendance
from app.models.breakdown import EquipmentBreakdown
from app.models.maintenance import Maintenance
from app.models.issue import Issue
from app.models.work_completed import WorkCompleted
from app.models.safety import SafetyObservation
from app.models.equipment import Equipment

def get_dashboard_summary(period='7d', start_date_str=None, end_date_str=None, workspace_id=None):
    """
    Compute dashboard metrics dynamically from the database for the given period.
    Supported periods: 'today', '7d', '30d', 'custom'
    """
    today = date.today()

    # Determine date range
    if period == 'today':
        start_date = today
        end_date = today
    elif period == '30d':
        start_date = today - timedelta(days=29)
        end_date = today
    elif period == 'custom' and start_date_str and end_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            start_date = today - timedelta(days=6)
            end_date = today
    else:  # default '7d'
        period = '7d'
        start_date = today - timedelta(days=6)
        end_date = today

    # Base filters
    report_filter = [ShiftReport.report_date >= start_date, ShiftReport.report_date <= end_date]
    if workspace_id:
        report_filter.append(ShiftReport.workspace_id == workspace_id)

    # 1. Total reports in period
    total_reports = db.session.query(func.count(ShiftReport.id)).filter(*report_filter).scalar() or 0

    # 2. Reports today
    reports_today_query = db.session.query(func.count(ShiftReport.id)).filter(ShiftReport.report_date == today)
    if workspace_id:
        reports_today_query = reports_today_query.filter(ShiftReport.workspace_id == workspace_id)
    reports_today = reports_today_query.scalar() or 0

    # 3. Pending verification
    pending_query = db.session.query(func.count(ShiftReport.id)).filter(
        ShiftReport.status.in_(['submitted', 'draft'])
    )
    if workspace_id:
        pending_query = pending_query.filter(ShiftReport.workspace_id == workspace_id)
    pending_verification = pending_query.scalar() or 0

    # 4 & 5. Workers present & absent in period
    attendance_query = db.session.query(
        func.coalesce(func.sum(Attendance.present), 0).label('present'),
        func.coalesce(func.sum(Attendance.absent), 0).label('absent')
    ).filter(Attendance.report_date >= start_date, Attendance.report_date <= end_date)
    if workspace_id is not None:
        attendance_query = attendance_query.filter(Attendance.workspace_id == workspace_id)
    attendance_totals = attendance_query.first()
    workers_present = int(attendance_totals.present) if attendance_totals else 0
    workers_absent = int(attendance_totals.absent) if attendance_totals else 0

    # 6. Equipment breakdowns in period
    breakdowns_query = db.session.query(func.count(EquipmentBreakdown.id)).join(
        ShiftReport, EquipmentBreakdown.report_id == ShiftReport.id, isouter=True
    ).filter(
        (func.date(EquipmentBreakdown.reported_time) >= start_date) &
        (func.date(EquipmentBreakdown.reported_time) <= end_date)
    )
    if workspace_id:
        breakdowns_query = breakdowns_query.filter(EquipmentBreakdown.workspace_id == workspace_id)
    equipment_breakdowns_count = breakdowns_query.scalar() or 0

    # 7. Pending maintenance (open, under_review, in_progress)
    pending_maint_query = db.session.query(func.count(Maintenance.id)).filter(
        Maintenance.status.in_(['open', 'under_review', 'in_progress'])
    )
    if workspace_id is not None:
        pending_maint_query = pending_maint_query.filter(Maintenance.workspace_id == workspace_id)
    pending_maintenance = pending_maint_query.scalar() or 0

    # 8. Unresolved issues
    unresolved_issues_query = db.session.query(func.count(Issue.id)).filter(
        Issue.status.in_(['open', 'under_review', 'in_progress'])
    )
    if workspace_id:
        unresolved_issues_query = unresolved_issues_query.filter(Issue.workspace_id == workspace_id)
    unresolved_issues = unresolved_issues_query.scalar() or 0

    # Recent reports (last 10)
    recent_reports_query = ShiftReport.query
    if workspace_id:
        recent_reports_query = recent_reports_query.filter(ShiftReport.workspace_id == workspace_id)
    recent_reports = [
        r.to_dict() for r in recent_reports_query.order_by(ShiftReport.report_date.desc(), ShiftReport.created_at.desc()).limit(10).all()
    ]

    # Recent activities (from work_completed, breakdowns, safety)
    activities = []

    recent_work = db.session.query(WorkCompleted, ShiftReport).join(
        ShiftReport, WorkCompleted.report_id == ShiftReport.id
    )
    if workspace_id is not None:
        recent_work = recent_work.filter(ShiftReport.workspace_id == workspace_id)
    recent_work = recent_work.order_by(WorkCompleted.created_at.desc()).limit(5).all()
    for work, rep in recent_work:
        activities.append({
            'type': 'work_completed',
            'title': f"Work Completed: {rep.section}",
            'description': work.description,
            'section': rep.section,
            'shift': rep.shift,
            'timestamp': work.created_at.isoformat() if work.created_at else None
        })

    recent_bd = db.session.query(EquipmentBreakdown, Equipment).join(
        Equipment, EquipmentBreakdown.equipment_id == Equipment.id
    )
    if workspace_id is not None:
        recent_bd = recent_bd.filter(Equipment.workspace_id == workspace_id)
    recent_bd = recent_bd.order_by(EquipmentBreakdown.created_at.desc()).limit(5).all()
    for bd, eq in recent_bd:
        activities.append({
            'type': 'breakdown',
            'title': f"Breakdown: {eq.name} ({eq.equipment_id_tag})",
            'description': bd.fault_description,
            'section': eq.section,
            'status': bd.status,
            'timestamp': bd.reported_time.isoformat() if bd.reported_time else bd.created_at.isoformat()
        })

    recent_safety = db.session.query(SafetyObservation, ShiftReport).join(
        ShiftReport, SafetyObservation.report_id == ShiftReport.id
    )
    if workspace_id is not None:
        recent_safety = recent_safety.filter(ShiftReport.workspace_id == workspace_id)
    recent_safety = recent_safety.order_by(SafetyObservation.created_at.desc()).limit(5).all()
    for sf, rep in recent_safety:
        activities.append({
            'type': 'safety_observation',
            'title': f"Safety Hazard: {sf.hazard_type}",
            'description': sf.description,
            'severity': sf.severity,
            'section': rep.section,
            'timestamp': sf.created_at.isoformat() if sf.created_at else None
        })

    # Sort combined activities desc by timestamp
    activities.sort(key=lambda x: x['timestamp'] or '', reverse=True)
    recent_activities = activities[:10]

    # Pending actions (open issues + open maintenance)
    pending_actions = []
    open_maintenance_query = db.session.query(Maintenance, Equipment).outerjoin(
        Equipment, Maintenance.equipment_id == Equipment.id
    ).filter(Maintenance.status.in_(['open', 'under_review', 'in_progress']))
    if workspace_id is not None:
        open_maintenance_query = open_maintenance_query.filter(Maintenance.workspace_id == workspace_id)
    open_maintenance_items = open_maintenance_query.limit(10).all()

    for maint, eq in open_maintenance_items:
        pending_actions.append({
            'id': maint.id,
            'action_type': 'maintenance',
            'title': f"Maintenance: {eq.name if eq else 'Asset'}",
            'description': maint.requirement,
            'priority': maint.priority,
            'status': maint.status,
            'assigned_to': maint.assigned_to,
            'created_at': maint.created_at.isoformat() if maint.created_at else None
        })

    open_issues_query = Issue.query.filter(
        Issue.status.in_(['open', 'under_review', 'in_progress'])
    )
    if workspace_id is not None:
        open_issues_query = open_issues_query.filter(Issue.workspace_id == workspace_id)
    open_issues_items = open_issues_query.limit(10).all()
    for issue in open_issues_items:
        pending_actions.append({
            'id': issue.id,
            'action_type': 'issue',
            'title': f"Issue: {issue.section or 'General'}",
            'description': issue.description,
            'status': issue.status,
            'assigned_to': issue.assigned_to,
            'created_at': issue.created_at.isoformat() if issue.created_at else None
        })

    # Attendance trend (daily for period)
    attendance_records = db.session.query(
        Attendance.report_date,
        func.sum(Attendance.present).label('present'),
        func.sum(Attendance.absent).label('absent'),
        func.sum(Attendance.total_scheduled).label('total')
    ).filter(
        Attendance.report_date >= start_date,
        Attendance.report_date <= end_date
    )
    if workspace_id is not None:
        attendance_records = attendance_records.filter(Attendance.workspace_id == workspace_id)
    attendance_records = attendance_records.group_by(Attendance.report_date).order_by(Attendance.report_date.asc()).all()

    att_map = {r.report_date: {'present': int(r.present), 'absent': int(r.absent), 'total': int(r.total)} for r in attendance_records}

    # Build continuous day list
    attendance_trend = []
    report_trend = []

    # Report count by date query
    report_counts = db.session.query(
        ShiftReport.report_date,
        func.count(ShiftReport.id).label('count')
    ).filter(*report_filter).group_by(ShiftReport.report_date).all()
    rep_map = {r.report_date: int(r.count) for r in report_counts}

    curr = start_date
    while curr <= end_date:
        d_str = curr.isoformat()
        att_stat = att_map.get(curr, {'present': 0, 'absent': 0, 'total': 0})
        attendance_trend.append({
            'date': d_str,
            'present': att_stat['present'],
            'absent': att_stat['absent'],
            'total_scheduled': att_stat['total']
        })
        report_trend.append({
            'date': d_str,
            'count': rep_map.get(curr, 0)
        })
        curr += timedelta(days=1)

    # Breakdown frequency by equipment
    breakdown_freq_query = db.session.query(
        Equipment.name,
        func.count(EquipmentBreakdown.id).label('breakdown_count')
    ).join(
        EquipmentBreakdown, Equipment.id == EquipmentBreakdown.equipment_id
    )
    if workspace_id is not None:
        breakdown_freq_query = breakdown_freq_query.filter(Equipment.workspace_id == workspace_id)
    breakdown_freq_query = breakdown_freq_query.group_by(Equipment.name).order_by(
        func.count(EquipmentBreakdown.id).desc()
    ).limit(10).all()

    breakdown_frequency = [
        {'name': row.name, 'equipment_name': row.name, 'count': int(row.breakdown_count)}
        for row in breakdown_freq_query
    ]

    # Maintenance status breakdown (counts by status)
    status_counts = db.session.query(
        Maintenance.status,
        func.count(Maintenance.id).label('count')
    )
    if workspace_id is not None:
        status_counts = status_counts.filter(Maintenance.workspace_id == workspace_id)
    status_counts = status_counts.group_by(Maintenance.status).all()

    maintenance_status_breakdown = {
        'open': 0,
        'under_review': 0,
        'in_progress': 0,
        'resolved': 0
    }
    for row in status_counts:
        maintenance_status_breakdown[row.status] = int(row.count)

    maintenance_status = [
        {'status': k, 'count': v}
        for k, v in maintenance_status_breakdown.items()
    ]

    return {
        'period': period,
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'total_reports': total_reports,
        'reports_today': reports_today,
        'pending_verification': pending_verification,
        'workers_present': workers_present,
        'workers_absent': workers_absent,
        'equipment_breakdowns': equipment_breakdowns_count,
        'pending_maintenance': pending_maintenance,
        'unresolved_issues': unresolved_issues,
        'metrics': {
            'total_reports': total_reports,
            'reports_today': reports_today,
            'pending_verification': pending_verification,
            'workers_present': workers_present,
            'workers_absent': workers_absent,
            'equipment_breakdowns': equipment_breakdowns_count,
            'pending_maintenance': pending_maintenance,
            'unresolved_issues': unresolved_issues
        },
        'recent_reports': recent_reports,
        'recent_activities': recent_activities,
        'pending_actions': pending_actions,
        'attendance_trend': attendance_trend,
        'report_trend': report_trend,
        'breakdown_frequency': breakdown_frequency,
        'maintenance_status': maintenance_status,
        'maintenance_status_breakdown': maintenance_status_breakdown
    }
