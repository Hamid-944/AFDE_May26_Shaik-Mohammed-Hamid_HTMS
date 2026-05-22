import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import EtlRun, ReportingTicket
from routers.auth import require_admin
from services.etl import run_etl

router = APIRouter(prefix="/analytics", tags=["analytics"])

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "datasets", "helpdesk_historical.csv")


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), _=Depends(require_admin)):
    total = db.query(func.count(ReportingTicket.id)).scalar() or 0
    resolved = db.query(func.count(ReportingTicket.id)).filter(
        ReportingTicket.status == "Resolved"
    ).scalar() or 0
    open_count = db.query(func.count(ReportingTicket.id)).filter(
        ReportingTicket.status == "Open"
    ).scalar() or 0
    in_progress = db.query(func.count(ReportingTicket.id)).filter(
        ReportingTicket.status == "In Progress"
    ).scalar() or 0
    avg_hours = db.query(func.avg(ReportingTicket.resolution_hours)).filter(
        ReportingTicket.resolution_hours.isnot(None)
    ).scalar()
    return {
        "total_tickets": total,
        "resolved_tickets": resolved,
        "open_tickets": open_count,
        "in_progress_tickets": in_progress,
        "avg_resolution_hours": round(float(avg_hours), 2) if avg_hours else None,
    }


@router.get("/categories")
def get_categories(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = (
        db.query(ReportingTicket.issue_category, func.count(ReportingTicket.id).label("count"))
        .group_by(ReportingTicket.issue_category)
        .order_by(func.count(ReportingTicket.id).desc())
        .all()
    )
    return [{"category": r.issue_category, "count": r.count} for r in rows]


@router.get("/priority-distribution")
def get_priority_distribution(db: Session = Depends(get_db), _=Depends(require_admin)):
    total = db.query(func.count(ReportingTicket.id)).scalar() or 1
    rows = (
        db.query(ReportingTicket.priority, func.count(ReportingTicket.id).label("count"))
        .group_by(ReportingTicket.priority)
        .order_by(func.count(ReportingTicket.id).desc())
        .all()
    )
    return [
        {"priority": r.priority, "count": r.count, "percentage": round(r.count / total * 100, 1)}
        for r in rows
    ]


@router.get("/department-stats")
def get_department_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = (
        db.query(
            ReportingTicket.department,
            func.count(ReportingTicket.id).label("total"),
            func.sum(
                func.if_(ReportingTicket.status == "Resolved", 1, 0)
            ).label("resolved"),
            func.avg(ReportingTicket.resolution_hours).label("avg_hours"),
        )
        .group_by(ReportingTicket.department)
        .order_by(func.count(ReportingTicket.id).desc())
        .all()
    )
    return [
        {
            "department": r.department,
            "total": r.total,
            "resolved": int(r.resolved or 0),
            "avg_resolution_hours": round(float(r.avg_hours), 2) if r.avg_hours else None,
        }
        for r in rows
    ]


@router.get("/resolution-trends")
def get_resolution_trends(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = (
        db.query(
            ReportingTicket.year,
            ReportingTicket.month,
            ReportingTicket.month_label,
            func.count(ReportingTicket.id).label("count"),
        )
        .group_by(ReportingTicket.year, ReportingTicket.month, ReportingTicket.month_label)
        .order_by(ReportingTicket.year, ReportingTicket.month)
        .all()
    )
    return [
        {"year": r.year, "month": r.month, "month_label": r.month_label, "count": r.count}
        for r in rows
    ]


@router.get("/etl-status")
def get_etl_status(db: Session = Depends(get_db), _=Depends(require_admin)):
    last = db.query(EtlRun).order_by(EtlRun.ran_at.desc()).first()
    if not last:
        return None
    return {
        "id": last.id,
        "ran_at": last.ran_at.isoformat(),
        "rows_in_csv": last.rows_in_csv,
        "bad_rows_dropped": last.bad_rows_dropped,
        "duplicates_removed": last.duplicates_removed,
        "rows_loaded": last.rows_loaded,
        "csv_path": last.csv_path,
    }


@router.post("/run-etl")
def trigger_etl(db: Session = Depends(get_db), _=Depends(require_admin)):
    csv_abs = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "datasets", "helpdesk_historical.csv"))
    if not os.path.exists(csv_abs):
        raise HTTPException(status_code=404, detail=f"CSV not found at {csv_abs}")
    result = run_etl(db, csv_abs)
    return result
