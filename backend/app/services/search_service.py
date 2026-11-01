from datetime import date, datetime, time

from sqlalchemy import DateTime, or_

from app.models.attendance import Attendance
from app.models.breakdown import EquipmentBreakdown
from app.models.delay import ProductionDelay
from app.models.equipment import Equipment
from app.models.handover import Handover
from app.models.issue import Issue
from app.models.maintenance import Maintenance
from app.models.safety import SafetyObservation
from app.models.shift_report import ShiftReport
from app.models.work_completed import WorkCompleted


SEARCH_GROUPS = {
    'reports': ('report', 'reports'),
    'breakdowns': ('breakdown', 'breakdowns'),
    'issues': ('issue', 'issues'),
    'safety': ('safety', 'safety_observations'),
    'work_completed': ('work', 'work_completed'),
    'production_delays': ('delay', 'delays', 'production_delays'),
    'maintenance': ('maintenance', 'maintenance_items'),
    'handovers': ('handover', 'handovers'),
    'attendance': ('attendance',),
}


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except (TypeError, ValueError):
        return None


def _apply_date_range(query, column, start_date, end_date):
    if isinstance(column.type, DateTime):
        if start_date:
            query = query.filter(column >= datetime.combine(start_date, time.min))
        if end_date:
            query = query.filter(column <= datetime.combine(end_date, time.max))
    else:
        if start_date:
            query = query.filter(column >= start_date)
        if end_date:
            query = query.filter(column <= end_date)
    return query


def _apply_report_or_event_date(query, report, event_column, start_date, end_date):
    if start_date:
        query = query.filter(or_(
            report.report_date >= start_date,
            (report.id.is_(None) & (event_column >= datetime.combine(start_date, time.min))),
        ))
    if end_date:
        query = query.filter(or_(
            report.report_date <= end_date,
            (report.id.is_(None) & (event_column <= datetime.combine(end_date, time.max))),
        ))
    return query


def _requested_groups(category):
    if not category or category == 'all':
        return set(SEARCH_GROUPS)
    return {
        group for group, aliases in SEARCH_GROUPS.items()
        if category in aliases
    }


def search_operations(params):
    """Search report categories and their associated records with shared filters."""
    query_text = (params.get('q') or '').strip()
    section = params.get('section')
    shift = params.get('shift')
    status = params.get('status')
    workspace_id = params.get('workspace_id')
    groups = _requested_groups(params.get('category'))

    start_date = _parse_date(params.get('date_from'))
    end_date = _parse_date(params.get('date_to'))
    exact_date = _parse_date(params.get('date'))
    if exact_date:
        start_date = exact_date
        end_date = exact_date

    results = {
        'query': query_text,
        'filters': {key: value for key, value in params.items() if value},
        'reports': [],
        'breakdowns': [],
        'issues': [],
        'safety': [],
        'work_completed': [],
        'production_delays': [],
        'maintenance': [],
        'handovers': [],
        'attendance': [],
    }
    like_term = f'%{query_text}%'

    if 'reports' in groups:
        query = ShiftReport.query
        if query_text:
            query = query.filter(or_(
                ShiftReport.notes.ilike(like_term),
                ShiftReport.submitted_by.ilike(like_term),
                ShiftReport.section.ilike(like_term),
            ))
        query = _apply_date_range(query, ShiftReport.report_date, start_date, end_date)
        if shift:
            query = query.filter(ShiftReport.shift.ilike(f'%{shift}%'))
        if section:
            query = query.filter(ShiftReport.section.ilike(f'%{section}%'))
        if status:
            query = query.filter(ShiftReport.status == status)
        if workspace_id:
            query = query.filter(ShiftReport.workspace_id == workspace_id)
        results['reports'] = [
            row.to_dict()
            for row in query.order_by(ShiftReport.report_date.desc()).limit(100).all()
        ]

    if 'breakdowns' in groups:
        query = EquipmentBreakdown.query.join(
            Equipment, EquipmentBreakdown.equipment_id == Equipment.id
        ).outerjoin(ShiftReport, EquipmentBreakdown.report_id == ShiftReport.id)
        if query_text:
            query = query.filter(or_(
                EquipmentBreakdown.fault_description.ilike(like_term),
                EquipmentBreakdown.location.ilike(like_term),
                Equipment.name.ilike(like_term),
                Equipment.equipment_id_tag.ilike(like_term),
            ))
        query = _apply_report_or_event_date(
            query, ShiftReport, EquipmentBreakdown.reported_time, start_date, end_date
        )
        if shift:
            query = query.filter(EquipmentBreakdown.shift.ilike(f'%{shift}%'))
        if section:
            query = query.filter(or_(
                EquipmentBreakdown.location.ilike(f'%{section}%'),
                Equipment.section.ilike(f'%{section}%'),
                ShiftReport.section.ilike(f'%{section}%'),
            ))
        if status:
            query = query.filter(EquipmentBreakdown.status == status)
        if workspace_id:
            query = query.filter(or_(
                ShiftReport.workspace_id == workspace_id,
                Equipment.workspace_id == workspace_id,
            ))
        for breakdown, report, equipment in query.with_entities(
            EquipmentBreakdown, ShiftReport, Equipment
        ).order_by(EquipmentBreakdown.reported_time.desc()).limit(100).all():
            item = breakdown.to_dict()
            item.update({
                'section': report.section if report else equipment.section,
                'report_date': report.report_date.isoformat() if report and report.report_date else None,
                'shift': breakdown.shift or (report.shift if report else None),
            })
            results['breakdowns'].append(item)

    if 'issues' in groups:
        query = Issue.query.outerjoin(ShiftReport, Issue.report_id == ShiftReport.id)
        if query_text:
            query = query.filter(or_(
                Issue.description.ilike(like_term),
                Issue.assigned_to.ilike(like_term),
                Issue.section.ilike(like_term),
            ))
        query = _apply_date_range(query, Issue.date_reported, start_date, end_date)
        if shift:
            query = query.filter(ShiftReport.shift.ilike(f'%{shift}%'))
        if section:
            query = query.filter(or_(
                Issue.section.ilike(f'%{section}%'),
                ShiftReport.section.ilike(f'%{section}%'),
            ))
        if status:
            query = query.filter(Issue.status == status)
        if workspace_id:
            query = query.filter(or_(
                Issue.workspace_id == workspace_id,
                ShiftReport.workspace_id == workspace_id,
            ))
        for issue, report in query.with_entities(Issue, ShiftReport).order_by(
            Issue.created_at.desc()
        ).limit(100).all():
            item = issue.to_dict()
            item.update({
                'report_date': report.report_date.isoformat() if report and report.report_date else item['date_reported'],
                'shift': report.shift if report else None,
            })
            results['issues'].append(item)

    if 'safety' in groups:
        query = SafetyObservation.query.join(
            ShiftReport, SafetyObservation.report_id == ShiftReport.id
        )
        if query_text:
            query = query.filter(or_(
                SafetyObservation.description.ilike(like_term),
                SafetyObservation.hazard_type.ilike(like_term),
                SafetyObservation.location.ilike(like_term),
            ))
        query = _apply_date_range(query, ShiftReport.report_date, start_date, end_date)
        if shift:
            query = query.filter(ShiftReport.shift.ilike(f'%{shift}%'))
        if section:
            query = query.filter(or_(
                SafetyObservation.location.ilike(f'%{section}%'),
                ShiftReport.section.ilike(f'%{section}%'),
            ))
        if workspace_id:
            query = query.filter(ShiftReport.workspace_id == workspace_id)
        for observation, report in query.with_entities(
            SafetyObservation, ShiftReport
        ).order_by(SafetyObservation.created_at.desc()).limit(100).all():
            item = observation.to_dict()
            item.update({
                'section': report.section,
                'report_date': report.report_date.isoformat() if report.report_date else None,
                'shift': report.shift,
                'status': report.status,
            })
            results['safety'].append(item)

    if 'work_completed' in groups:
        query = WorkCompleted.query.join(
            ShiftReport, WorkCompleted.report_id == ShiftReport.id
        )
        if query_text:
            query = query.filter(or_(
                WorkCompleted.description.ilike(like_term),
                WorkCompleted.remarks.ilike(like_term),
            ))
        query = _apply_date_range(query, ShiftReport.report_date, start_date, end_date)
        if shift:
            query = query.filter(ShiftReport.shift.ilike(f'%{shift}%'))
        if section:
            query = query.filter(ShiftReport.section.ilike(f'%{section}%'))
        if status:
            query = query.filter(ShiftReport.status == status)
        if workspace_id:
            query = query.filter(ShiftReport.workspace_id == workspace_id)
        for work, report in query.with_entities(WorkCompleted, ShiftReport).order_by(
            WorkCompleted.created_at.desc()
        ).limit(100).all():
            item = work.to_dict()
            item.update({
                'section': report.section,
                'report_date': report.report_date.isoformat() if report.report_date else None,
                'shift': report.shift,
                'status': report.status,
            })
            results['work_completed'].append(item)

    if 'production_delays' in groups:
        query = ProductionDelay.query.join(
            ShiftReport, ProductionDelay.report_id == ShiftReport.id
        )
        if query_text:
            query = query.filter(or_(
                ProductionDelay.affected_activity.ilike(like_term),
                ProductionDelay.reason.ilike(like_term),
                ProductionDelay.remarks.ilike(like_term),
            ))
        query = _apply_date_range(query, ShiftReport.report_date, start_date, end_date)
        if shift:
            query = query.filter(ShiftReport.shift.ilike(f'%{shift}%'))
        if section:
            query = query.filter(ShiftReport.section.ilike(f'%{section}%'))
        if status:
            query = query.filter(ShiftReport.status == status)
        if workspace_id:
            query = query.filter(ShiftReport.workspace_id == workspace_id)
        for delay, report in query.with_entities(ProductionDelay, ShiftReport).order_by(
            ProductionDelay.created_at.desc()
        ).limit(100).all():
            item = delay.to_dict()
            item.update({
                'section': report.section,
                'report_date': report.report_date.isoformat() if report.report_date else None,
                'shift': report.shift,
                'status': report.status,
            })
            results['production_delays'].append(item)

    if 'maintenance' in groups:
        query = Maintenance.query.outerjoin(
            ShiftReport, Maintenance.report_id == ShiftReport.id
        ).outerjoin(Equipment, Maintenance.equipment_id == Equipment.id)
        if query_text:
            query = query.filter(or_(
                Maintenance.requirement.ilike(like_term),
                Maintenance.remarks.ilike(like_term),
                Equipment.name.ilike(like_term),
                Equipment.equipment_id_tag.ilike(like_term),
            ))
        query = _apply_report_or_event_date(
            query, ShiftReport, Maintenance.created_at, start_date, end_date
        )
        if shift:
            query = query.filter(ShiftReport.shift.ilike(f'%{shift}%'))
        if section:
            query = query.filter(or_(
                ShiftReport.section.ilike(f'%{section}%'),
                Equipment.section.ilike(f'%{section}%'),
            ))
        if status:
            query = query.filter(Maintenance.status == status)
        if workspace_id:
            query = query.filter(or_(
                ShiftReport.workspace_id == workspace_id,
                Equipment.workspace_id == workspace_id,
            ))
        for maintenance, report, equipment in query.with_entities(
            Maintenance, ShiftReport, Equipment
        ).order_by(Maintenance.created_at.desc()).limit(100).all():
            item = maintenance.to_dict()
            item.update({
                'section': report.section if report else equipment.section if equipment else '',
                'report_date': report.report_date.isoformat() if report and report.report_date else None,
                'shift': report.shift if report else None,
            })
            results['maintenance'].append(item)

    if 'handovers' in groups:
        query = Handover.query.join(ShiftReport, Handover.report_id == ShiftReport.id)
        if query_text:
            query = query.filter(or_(
                Handover.pending_work.ilike(like_term),
                Handover.equipment_condition.ilike(like_term),
                Handover.unresolved_issues.ilike(like_term),
                Handover.instructions.ilike(like_term),
            ))
        query = _apply_date_range(query, ShiftReport.report_date, start_date, end_date)
        if shift:
            query = query.filter(ShiftReport.shift.ilike(f'%{shift}%'))
        if section:
            query = query.filter(ShiftReport.section.ilike(f'%{section}%'))
        if status:
            query = query.filter(ShiftReport.status == status)
        if workspace_id:
            query = query.filter(ShiftReport.workspace_id == workspace_id)
        for handover, report in query.with_entities(Handover, ShiftReport).order_by(
            Handover.created_at.desc()
        ).limit(100).all():
            item = handover.to_dict()
            item.update({
                'section': report.section,
                'report_date': report.report_date.isoformat() if report.report_date else None,
                'shift': report.shift,
                'status': report.status,
            })
            results['handovers'].append(item)

    if 'attendance' in groups:
        query = Attendance.query.outerjoin(ShiftReport, Attendance.report_id == ShiftReport.id)
        if query_text:
            query = query.filter(or_(
                Attendance.section.ilike(like_term),
                Attendance.remarks.ilike(like_term),
                Attendance.confirmed_by.ilike(like_term),
            ))
        query = _apply_date_range(query, Attendance.report_date, start_date, end_date)
        if shift:
            query = query.filter(Attendance.shift.ilike(f'%{shift}%'))
        if section:
            query = query.filter(Attendance.section.ilike(f'%{section}%'))
        if status:
            query = query.filter(ShiftReport.status == status)
        if workspace_id:
            query = query.filter(ShiftReport.workspace_id == workspace_id)
        results['attendance'] = [
            row.to_dict()
            for row in query.order_by(Attendance.report_date.desc()).limit(100).all()
        ]

    results['total_matches'] = sum(
        len(results[group]) for group in SEARCH_GROUPS
    )
    return results
