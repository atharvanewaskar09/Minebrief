from datetime import date, datetime, timedelta
from app.models.base import db
from app.models.workspace import Workspace
from app.models.user import User
from app.models.equipment import Equipment
from app.models.shift_report import ShiftReport
from app.models.attendance import Attendance
from app.models.breakdown import EquipmentBreakdown
from app.models.maintenance import Maintenance
from app.models.work_completed import WorkCompleted
from app.models.delay import ProductionDelay
from app.models.safety import SafetyObservation
from app.models.handover import Handover
from app.models.issue import Issue

DEMO_WORKSPACE_NAME = "Rajmahal Coal Mine, Jharkhand"

def clear_demo_data():
    """Delete all records associated with demo workspace."""
    workspace = Workspace.query.filter_by(name=DEMO_WORKSPACE_NAME, is_demo=True).first()
    if not workspace:
        # Also clean up any lingering demo users or workspaces
        User.query.filter_by(is_demo=True).delete()
        Workspace.query.filter_by(is_demo=True).delete()
        db.session.commit()
        return

    # Delete reports and cascade
    reports = ShiftReport.query.filter_by(workspace_id=workspace.id).all()
    for rep in reports:
        db.session.delete(rep)

    # Delete equipment and cascade
    equipment = Equipment.query.filter_by(workspace_id=workspace.id).all()
    for eq in equipment:
        db.session.delete(eq)

    # Delete issues
    Issue.query.filter_by(workspace_id=workspace.id).delete()

    # Delete users
    User.query.filter_by(workspace_id=workspace.id).delete()

    # Delete workspace
    db.session.delete(workspace)
    db.session.commit()

def seed_demo_data(force=False):
    """
    Idempotent seeder for the Rajmahal Coal Mine demo workspace.
    If workspace exists and force=False, returns existing without re-seeding.
    """
    existing = Workspace.query.filter_by(name=DEMO_WORKSPACE_NAME, is_demo=True).first()
    if existing and not force:
        return existing

    if existing and force:
        clear_demo_data()

    # 1. Create Workspace
    workspace = Workspace(
        name=DEMO_WORKSPACE_NAME,
        location="Godda & Sahibganj Districts, Jharkhand, India",
        description="Large-scale opencast and underground coal extraction facility operated under Eastern Coalfields Limited (ECL).",
        is_demo=True
    )
    db.session.add(workspace)
    db.session.flush()

    # 2. Create 3 Demo Users (operator, supervisor, manager)
    operator = User(
        name="Ramesh Kumar",
        email="ramesh.operator@rajmahal.example.com",
        role="operator",
        workspace_id=workspace.id,
        is_demo=True
    )
    operator.set_password("operator123")

    supervisor = User(
        name="Amit Sharma",
        email="amit.supervisor@rajmahal.example.com",
        role="supervisor",
        workspace_id=workspace.id,
        is_demo=True
    )
    supervisor.set_password("supervisor123")

    manager = User(
        name="Sunita Verma",
        email="sunita.manager@rajmahal.example.com",
        role="manager",
        workspace_id=workspace.id,
        is_demo=True
    )
    manager.set_password("manager123")

    db.session.add_all([operator, supervisor, manager])
    db.session.flush()

    # 3. Create 10 Equipment Assets across sections
    sections = [
        "Open Cast Block A",
        "Open Cast Block B",
        "Underground Section 1",
        "Processing Plant"
    ]

    equipment_defs = [
        ("Dragline Marion 96/24", "DL-01", "Open Cast Block A", "Heavy walking dragline for deep overburden stripping", date(2021, 3, 15), "operational"),
        ("Hydraulic Shovel Komatsu PC2000", "SH-01", "Open Cast Block A", "High-capacity diesel hydraulic mining shovel", date(2022, 6, 20), "operational"),
        ("Heavy Dumper CAT 777E", "DP-01", "Open Cast Block A", "100-tonne payload off-highway haul truck", date(2020, 11, 10), "under_maintenance"),
        ("Heavy Dumper CAT 777E", "DP-02", "Open Cast Block B", "100-tonne payload off-highway haul truck", date(2021, 1, 18), "operational"),
        ("Blast Hole Drill Sandvik DR460", "DR-01", "Open Cast Block B", "Rotary blasthole drill rig for hard rock benching", date(2022, 9, 5), "operational"),
        ("Front End Wheel Loader CAT 988K", "FL-01", "Open Cast Block B", "High-production quarry and coal loader", date(2019, 7, 22), "out_of_service"),
        ("Continuous Miner Joy 12CM12", "CM-01", "Underground Section 1", "Heavy-duty continuous coal miner for room and pillar", date(2023, 2, 14), "operational"),
        ("Underground Shuttle Car Joy 10SC", "SC-01", "Underground Section 1", "Rubber-tired electric shuttle car for coal haulage", date(2021, 8, 30), "under_maintenance"),
        ("Primary Coal Crusher Nordberg C160", "CR-01", "Processing Plant", "Jaw crusher processing ROM coal from open cast pits", date(2020, 4, 12), "operational"),
        ("Overland Conveyor System CV-101", "CV-01", "Processing Plant", "2.5 km overland high-tension steel cord conveyor belt", date(2021, 12, 1), "operational")
    ]

    equipment_map = {}
    for name, tag, sec, desc, comm_date, status in equipment_defs:
        eq = Equipment(
            workspace_id=workspace.id,
            name=name,
            equipment_id_tag=tag,
            section=sec,
            description=desc,
            commissioned_date=comm_date,
            status=status
        )
        db.session.add(eq)
        db.session.flush()
        equipment_map[tag] = eq

    # 4. Generate 18 Shift Reports over the last 14 days
    today = date.today()

    report_blueprints = [
        # day_offset, shift, section, status, submitted_by, total_workers, present_workers, notes
        (13, "Morning", "Open Cast Block A", "verified", "Amit Sharma", 65, 62, "Full bench stripping operations on upper horizon."),
        (12, "Afternoon", "Open Cast Block B", "verified", "Ramesh Kumar", 58, 54, "Blasting conducted at 14:30 hrs. Bench clearance normal."),
        (11, "Night", "Underground Section 1", "verified", "Amit Sharma", 48, 45, "Heading excavation advance 12 meters in seam 3."),
        (10, "Morning", "Processing Plant", "verified", "Amit Sharma", 52, 49, "Crushing rate maintained at 1,100 TPH."),
        (9, "Morning", "Open Cast Block A", "verified", "Ramesh Kumar", 68, 64, "Shovel SH-01 matched with four 100T dumpers."),
        (8, "Afternoon", "Open Cast Block B", "verified", "Amit Sharma", 60, 56, "Haul road dust suppression completed twice."),
        (7, "Night", "Open Cast Block A", "verified", "Ramesh Kumar", 64, 59, "Night haulage focused on overburden dumping area 2."),
        (6, "Morning", "Underground Section 1", "verified", "Amit Sharma", 50, 47, "Roof bolting completed for cut-through 4."),
        (5, "Afternoon", "Processing Plant", "verified", "Ramesh Kumar", 54, 51, "Conveyor belt alignment verified during maintenance window."),
        (4, "Morning", "Open Cast Block A", "verified", "Amit Sharma", 70, 66, "Dragline walking sequence executed smoothly."),
        (3, "Afternoon", "Open Cast Block B", "verified", "Ramesh Kumar", 62, 58, "Drill rig DR-01 achieved target pattern 18 holes."),
        (3, "Night", "Underground Section 1", "verified", "Amit Sharma", 48, 44, "Ventilation flow normal; methane monitor 0.12%."),
        (2, "Morning", "Processing Plant", "submitted", "Ramesh Kumar", 55, 52, "Secondary screen mesh inspected for wear."),
        (2, "Afternoon", "Open Cast Block A", "submitted", "Amit Sharma", 68, 63, "Dumper DP-01 reported hydraulic temperature alert."),
        (1, "Morning", "Open Cast Block B", "submitted", "Ramesh Kumar", 60, 57, "Loader FL-01 engine trouble initiated maintenance cycle."),
        (1, "Night", "Underground Section 1", "submitted", "Amit Sharma", 49, 46, "Shuttle car cable drum spring replacement required."),
        (0, "Morning", "Open Cast Block A", "submitted", "Amit Sharma", 72, 68, "Peak production shift; all primary faces active."),
        (0, "Afternoon", "Processing Plant", "draft", "Ramesh Kumar", 53, 50, "Current shift ongoing; bunker level at 78% capacity.")
    ]

    for offset, shift, sec, status, sub_by, total_w, pres_w, note in report_blueprints:
        rep_date = today - timedelta(days=offset)
        absent_w = total_w - pres_w  # Guaranteed: pres_w + absent_w == total_w

        report = ShiftReport(
            workspace_id=workspace.id,
            report_date=rep_date,
            shift=shift,
            section=sec,
            submitted_by=sub_by,
            status=status,
            notes=note
        )
        if status == 'verified':
            report.verified_by = "Sunita Verma"
            report.verified_at = datetime.combine(rep_date, datetime.min.time()) + timedelta(hours=18)

        db.session.add(report)
        db.session.flush()

        # Attendance Record
        attendance = Attendance(
            report_id=report.id,
            report_date=rep_date,
            shift=shift,
            section=sec,
            total_scheduled=total_w,
            present=pres_w,
            absent=absent_w,
            remarks=f"Attendance confirmed by {sub_by}. All safety gear inspected.",
            confirmed_by=sub_by
        )
        db.session.add(attendance)

        # Work Completed Record
        work = WorkCompleted(
            report_id=report.id,
            description=f"Standard operations conducted in {sec}. Extraction and haulage targets reached.",
            remarks=f"Completed {offset + 5 * 10} metric tonnes coal/overburden handling."
        )
        db.session.add(work)

        # Handover Record
        handover = Handover(
            report_id=report.id,
            pending_work=f"Continue clearing face in {sec}. Monitor haul road grade.",
            equipment_condition="Major machinery in operational state. Pre-shift inspection completed.",
            unresolved_issues="No acute stoppage pending handover." if offset > 3 else "Keep watch on hydraulic oil temp.",
            instructions=f"Next shift in-charge to prioritize {sec} scheduled production.",
            created_by=sub_by
        )
        db.session.add(handover)

        # Equipment breakdowns & maintenance for specific shifts
        if tag_to_breakdown := _get_breakdown_for_shift(offset, shift, sec):
            eq_tag, fault_desc, bd_status, maint_prio, maint_stat, maint_req = tag_to_breakdown
            eq_asset = equipment_map.get(eq_tag)
            if eq_asset:
                bd_time = datetime.combine(rep_date, datetime.min.time()) + timedelta(hours=10)
                breakdown = EquipmentBreakdown(
                    report_id=report.id,
                    equipment_id=eq_asset.id,
                    fault_description=fault_desc,
                    location=sec,
                    reported_time=bd_time,
                    shift=shift,
                    status=bd_status,
                    resolved_at=bd_time + timedelta(hours=4) if bd_status == 'resolved' else None,
                    resolved_by="Sunita Verma" if bd_status == 'resolved' else None
                )
                db.session.add(breakdown)
                db.session.flush()

                # Link Maintenance record to breakdown and equipment
                maint = Maintenance(
                    report_id=report.id,
                    breakdown_id=breakdown.id,
                    equipment_id=eq_asset.id,
                    requirement=maint_req,
                    priority=maint_prio,
                    status=maint_stat,
                    assigned_to="Central Workshop Mechanical Team",
                    remarks=f"Maintenance logged during {shift} shift report."
                )
                db.session.add(maint)

        # Production delays for specific shifts
        if delay_info := _get_delay_for_shift(offset, shift):
            act, dur, reason, remarks = delay_info
            delay = ProductionDelay(
                report_id=report.id,
                affected_activity=act,
                duration_minutes=dur,
                reason=reason,
                remarks=remarks
            )
            db.session.add(delay)

        # Safety observations for specific shifts
        if safety_info := _get_safety_for_shift(offset, shift, sec):
            htype, loc, desc, sev = safety_info
            safety = SafetyObservation(
                report_id=report.id,
                hazard_type=htype,
                location=loc,
                description=desc,
                severity=sev
            )
            db.session.add(safety)

        # Issues for specific shifts
        if issue_info := _get_issue_for_shift(offset, sec):
            desc, iss_stat, assignee = issue_info
            issue = Issue(
                report_id=report.id,
                workspace_id=workspace.id,
                description=desc,
                section=sec,
                status=iss_stat,
                date_reported=rep_date,
                assigned_to=assignee,
                resolved_at=datetime.combine(rep_date, datetime.min.time()) + timedelta(days=1) if iss_stat == 'resolved' else None
            )
            db.session.add(issue)

    db.session.commit()
    return workspace

def _get_breakdown_for_shift(offset, shift, section):
    """Helper mapping specific historical days to realistic breakdowns."""
    if offset == 12 and shift == "Afternoon":
        return ("DR-01", "Compressor air filter clogged causing drill pressure drop.", "resolved", "medium", "resolved", "Replace high-flow air intake filter elements.")
    if offset == 7 and shift == "Night":
        return ("DP-02", "Steering cylinder hydraulic hose weeping fluid on front axle.", "resolved", "high", "resolved", "Swap out pressurized steering hydraulic lines.")
    if offset == 4 and shift == "Morning":
        return ("DL-01", "Drag rope guide pulley bearing vibration detected during slew.", "resolved", "medium", "resolved", "Grease guide assembly and realign bearing housing.")
    if offset == 2 and shift == "Afternoon":
        return ("DP-01", "Transmission overheating during uphill haulage route ramp.", "in_progress", "high", "in_progress", "Flush torque converter cooler and replace fluid.")
    if offset == 1 and shift == "Morning":
        return ("FL-01", "Engine turbocharger oil seal leakage and excessive black exhaust.", "open", "critical", "under_review", "Complete turbocharger overhaul and manifold check.")
    if offset == 1 and shift == "Night":
        return ("SC-01", "Trailing cable reel torque motor slippage.", "under_review", "medium", "open", "Inspect electrical slip rings and tension springs.")
    return None

def _get_delay_for_shift(offset, shift):
    """Helper mapping historical shifts to production delays."""
    if offset == 12:
        return ("Blasthole Loading", 45, "Delay in receiving explosive van clearance from safety officer.", "Resolved after site inspection.")
    if offset == 9:
        return ("Haul Road Transport", 30, "Water tanker breakdown on ramp blocked loaded dumper lane.", "Traffic redirected through bypass.")
    if offset == 6:
        return ("Underground Extraction", 50, "Auxiliary ventilation duct tear required patch repair.", "Air flow restored to normal velocity.")
    if offset == 2:
        return ("Primary Crushing", 40, "Oversized boulder jammed hopper feeder chute.", "Hydraulic rock breaker deployed.")
    if offset == 0:
        return ("Face Loading", 20, "Power dip in overhead 33kV transmission feeder line.", "Generator sync completed within 20 mins.")
    return None

def _get_safety_for_shift(offset, shift, section):
    """Helper mapping historical shifts to safety observations."""
    if offset == 11:
        return ("Ventilation", "Heading 3", "Slight dust concentration near continuous miner head.", "low")
    if offset == 8:
        return ("Haul Road", "Bench 4 Curve", "Soft berm embankment noticed after heavy watering.", "medium")
    if offset == 5:
        return ("Machinery", "Plant Conveyor CV-01", "Guarding mesh bracket loose near tail pulley.", "low")
    if offset == 2:
        return ("Pit Slope", "Highwall North Face", "Loose rock fragments on 3rd bench berm.", "high")
    if offset == 0:
        return ("Electrical", "Substation 2", "Safety signage faded on transformer bay gate.", "low")
    return None

def _get_issue_for_shift(offset, section):
    """Helper mapping historical shifts to tracked issues."""
    if offset == 10:
        return ("Belt scale calibration discrepancy on primary feed conveyor.", "resolved", "Instrumentation Engineer")
    if offset == 6:
        return ("Water seepage detected near sumphole sump pump 2.", "resolved", "Dewatering Team")
    if offset == 2:
        return ("Replacement hydraulic hoses for CAT 777E stock depleted in warehouse.", "in_progress", "Store Officer")
    if offset == 1:
        return ("Underground personnel tag reader at shaft 1 showing intermittent timeout.", "open", "IT Maintenance")
    if offset == 0:
        return ("Haul road illumination pole #14 light bulb blown.", "open", "Electrical Supervisor")
    return None
