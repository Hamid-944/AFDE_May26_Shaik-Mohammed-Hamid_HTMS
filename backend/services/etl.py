import os
from datetime import timezone

import pandas as pd
from sqlalchemy.orm import Session

from models import EtlRun, ReportingTicket

CATEGORY_MAP = {
    "vpn issue": "VPN Issue",
    "vpn issues": "VPN Issue",
    "vpn": "VPN Issue",
    "software install": "Software Installation",
    "software installation": "Software Installation",
    "laptop problem": "Laptop Issue",
    "laptop issue": "Laptop Issue",
    "network": "Network Connectivity",
    "network issue": "Network Connectivity",
    "network connectivity": "Network Connectivity",
    "email": "Email Access",
    "email issue": "Email Access",
    "email access": "Email Access",
    "hardware": "Hardware Request",
    "hardware request": "Hardware Request",
    "pasword reset": "Password Reset",
    "password reset": "Password Reset",
    "printer": "Printer Issue",
    "printer problem": "Printer Issue",
    "printer issue": "Printer Issue",
    "monitor": "Monitor Request",
    "monitor request": "Monitor Request",
    "office365": "Office 365 Issue",
    "office365 issue": "Office 365 Issue",
    "o365 issue": "Office 365 Issue",
    "office 365 issue": "Office 365 Issue",
    "jetbrains": "JetBrains License",
    "jetbrains license": "JetBrains License",
    "server access": "Server Access",
}

PRIORITY_MAP = {
    "low": "Low",
    "med": "Medium",
    "medium": "Medium",
    "high": "High",
    "critical": "Critical",
}

STATUS_MAP = {
    "open": "Open",
    "in progress": "In Progress",
    "resolved": "Resolved",
    "done": "Resolved",
    "closed": "Closed",
}


def _normalize_category(val: str) -> str:
    key = val.strip().lower()
    return CATEGORY_MAP.get(key, val.strip().title())


def _normalize_priority(val: str) -> str:
    key = val.strip().lower()
    return PRIORITY_MAP.get(key, val.strip().title())


def _normalize_status(val: str) -> str:
    key = val.strip().lower()
    return STATUS_MAP.get(key, val.strip().title())


def run_etl(db: Session, csv_path: str) -> dict:
    df = pd.read_csv(csv_path, dtype=str, keep_default_na=False)
    rows_in_csv = len(df)

    # Strip whitespace from all string columns
    df = df.apply(lambda col: col.str.strip() if col.dtype == object else col)

    # Drop bad rows: empty employee_name or unparseable created_at
    df = df[df["employee_name"].str.len() > 0]
    df["created_at_parsed"] = pd.to_datetime(df["created_at"], errors="coerce", utc=True)
    bad_rows_dropped = rows_in_csv - len(df[df["created_at_parsed"].notna()])
    df = df[df["created_at_parsed"].notna()].copy()

    # Parse resolved_at (nullable)
    df["resolved_at_parsed"] = pd.to_datetime(
        df["resolved_at"].replace("", pd.NaT), errors="coerce", utc=True
    )

    # Normalize lookup columns
    df["issue_category"] = df["issue_category"].apply(_normalize_category)
    df["priority"] = df["priority"].apply(_normalize_priority)
    df["status"] = df["status"].apply(_normalize_status)
    df["department"] = df["department"].str.title()

    # Compute resolution_hours
    has_both = df["resolved_at_parsed"].notna() & df["created_at_parsed"].notna()
    df["resolution_hours"] = None
    df.loc[has_both, "resolution_hours"] = (
        (df.loc[has_both, "resolved_at_parsed"] - df.loc[has_both, "created_at_parsed"])
        .dt.total_seconds() / 3600
    )

    # Add time dimension columns
    df["month"] = df["created_at_parsed"].dt.month
    df["year"] = df["created_at_parsed"].dt.year
    df["month_label"] = df["created_at_parsed"].dt.strftime("%b %Y")

    # Deduplicate on natural key
    before_dedup = len(df)
    df = df.drop_duplicates(subset=["employee_name", "department", "issue_category", "created_at"])
    duplicates_removed = before_dedup - len(df)

    rows_loaded = len(df)

    # Full reload: truncate then insert
    db.query(ReportingTicket).delete()
    db.flush()

    for _, row in df.iterrows():
        rt = ReportingTicket(
            employee_name=row["employee_name"],
            department=row["department"],
            issue_category=row["issue_category"],
            description=row["description"],
            priority=row["priority"],
            status=row["status"],
            created_at=row["created_at_parsed"].to_pydatetime().astimezone(timezone.utc),
            resolved_at=(
                row["resolved_at_parsed"].to_pydatetime().astimezone(timezone.utc)
                if pd.notna(row["resolved_at_parsed"]) else None
            ),
            resolution_hours=(
                float(row["resolution_hours"]) if row["resolution_hours"] is not None
                and pd.notna(row["resolution_hours"]) else None
            ),
            month=int(row["month"]),
            year=int(row["year"]),
            month_label=row["month_label"],
        )
        db.add(rt)

    etl_run = EtlRun(
        rows_in_csv=rows_in_csv,
        bad_rows_dropped=bad_rows_dropped,
        duplicates_removed=duplicates_removed,
        rows_loaded=rows_loaded,
        csv_path=os.path.abspath(csv_path),
    )
    db.add(etl_run)
    db.commit()

    return {
        "rows_in_csv": rows_in_csv,
        "bad_rows_dropped": bad_rows_dropped,
        "duplicates_removed": duplicates_removed,
        "rows_loaded": rows_loaded,
    }
