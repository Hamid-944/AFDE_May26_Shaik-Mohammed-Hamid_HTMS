from sqlalchemy.orm import Session

from crud import create_ticket, create_user, get_tickets, get_user_by_email
from core.security import get_password_hash
from models import User
from schemas import TicketCreate


def seed_demo_users(db: Session) -> None:
    demo_users = [
        {
            "email": "employee@helpdesk.example.com",
            "full_name": "Demo Employee",
            "role": "employee",
            "password": "employee123",
        },
        {
            "email": "marcus.chen@helpdesk.example.com",
            "full_name": "Marcus Chen",
            "role": "employee",
            "password": "marcus123",
        },
        {
            "email": "priya.patel@helpdesk.example.com",
            "full_name": "Priya Patel",
            "role": "employee",
            "password": "priya123",
        },
        {
            "email": "admin@helpdesk.example.com",
            "full_name": "Support Admin",
            "role": "admin",
            "password": "admin123",
        },
    ]

    for seed_user in demo_users:
        existing_user = get_user_by_email(db, seed_user["email"])
        if not existing_user:
            existing_user = (
                db.query(User)
                .filter(User.full_name == seed_user["full_name"], User.role == seed_user["role"])
                .first()
            )
        if existing_user:
            existing_user.email = seed_user["email"]
            existing_user.full_name = seed_user["full_name"]
            existing_user.role = seed_user["role"]
            existing_user.hashed_password = get_password_hash(seed_user["password"])
            db.commit()
            continue
        create_user(
            db,
            email=seed_user["email"],
            full_name=seed_user["full_name"],
            role=seed_user["role"],
            password=seed_user["password"],
        )


def _seed_user_tickets(db: Session, owner_email: str, tickets: list) -> None:
    if get_tickets(db, owner_email=owner_email):
        return
    for ticket_in in tickets:
        create_ticket(db, ticket_in, owner_email=owner_email)


def seed_demo_tickets(db: Session) -> None:
    _seed_user_tickets(db, "employee@helpdesk.example.com", [
        TicketCreate(
            employee_name="Demo Employee",
            department="Finance",
            issue_category="VPN Issue",
            description="VPN client disconnects every 10 minutes when on hotel Wi-Fi. Affects remote work sessions daily.",
            priority="High",
            status="In Progress",
            resolution_notes="Investigating endpoint client logs and network stability.",
        ),
        TicketCreate(
            employee_name="Demo Employee",
            department="Finance",
            issue_category="Software Installation",
            description="Requesting installation of Microsoft Power BI Desktop for monthly financial reporting.",
            priority="Medium",
            status="Open",
            resolution_notes=None,
        ),
        TicketCreate(
            employee_name="Demo Employee",
            department="Finance",
            issue_category="Laptop Issue",
            description="Laptop battery drains from 100% to 20% within two hours under normal workload.",
            priority="High",
            status="Closed",
            resolution_notes="Battery health test completed and replacement scheduled by hardware team.",
        ),
    ])

    _seed_user_tickets(db, "marcus.chen@helpdesk.example.com", [
        TicketCreate(
            employee_name="Marcus Chen",
            department="Engineering",
            issue_category="Network Connectivity",
            description="Unable to connect to the internal development server from the office network since the router was replaced last week.",
            priority="High",
            status="Open",
            resolution_notes=None,
        ),
        TicketCreate(
            employee_name="Marcus Chen",
            department="Engineering",
            issue_category="Software Installation",
            description="Need access to the company licensed JetBrains IDE suite for backend development. Current license expired.",
            priority="Medium",
            status="In Progress",
            resolution_notes="License assigned, waiting for activation confirmation from vendor.",
        ),
        TicketCreate(
            employee_name="Marcus Chen",
            department="Engineering",
            issue_category="VPN Issue",
            description="VPN drops connection when switching between office Wi-Fi and docked Ethernet. Requires manual reconnect each time.",
            priority="Low",
            status="Resolved",
            resolution_notes="Updated VPN client to latest version and configured auto-reconnect on network change.",
        ),
    ])

    _seed_user_tickets(db, "priya.patel@helpdesk.example.com", [
        TicketCreate(
            employee_name="Priya Patel",
            department="Operations",
            issue_category="Email Access",
            description="Outlook desktop app does not sync new emails after a recent password change. Re-authentication attempts have not resolved the issue.",
            priority="Critical",
            status="Open",
            resolution_notes=None,
        ),
        TicketCreate(
            employee_name="Priya Patel",
            department="Operations",
            issue_category="Hardware Request",
            description="Requesting a second monitor for dual-screen setup to improve productivity during data analysis and reporting tasks.",
            priority="Low",
            status="Resolved",
            resolution_notes="Monitor delivered and configured by the IT team. User confirmed setup is working.",
        ),
    ])

    _seed_user_tickets(db, "admin@helpdesk.example.com", [
        TicketCreate(
            employee_name="Aisha Khan",
            department="Human Resources",
            issue_category="Password Reset",
            description="Cannot access payroll portal after multiple failed login attempts triggered an account lockout.",
            priority="Medium",
            status="Open",
            resolution_notes=None,
        ),
        TicketCreate(
            employee_name="James Wright",
            department="Finance",
            issue_category="Email Access",
            description="Email client stopped syncing after migrating to a new laptop. Credentials appear correct but sync fails silently with no error shown.",
            priority="Critical",
            status="In Progress",
            resolution_notes="Re-configuring mail profile with updated Exchange server settings.",
        ),
    ])
