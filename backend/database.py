from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_ticket_owner_column() -> None:
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("tickets")}
    if "owner_email" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE tickets ADD COLUMN owner_email VARCHAR(255) NULL"))


def fix_misattributed_employee_tickets() -> None:
    """Correct seeded tickets that were accidentally linked to the employee account
    but show a different person's name. Sets them to 'Demo Employee' so the demo
    employee only sees tickets that are genuinely theirs."""
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                UPDATE tickets
                SET employee_name = 'Demo Employee'
                WHERE owner_email = 'employee@helpdesk.example.com'
                  AND employee_name IN ('Marcus Chen', 'Daniel Brown')
                """
            )
        )


def backfill_ticket_owner_email(default_owner_email: str) -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                UPDATE tickets
                SET owner_email = CASE
                    WHEN MOD(ticket_id, 2) = 1 THEN :employee_owner
                    ELSE :admin_owner
                END
                WHERE owner_email IS NULL
                """
            ),
            {"employee_owner": default_owner_email, "admin_owner": "admin@helpdesk.example.com"},
        )
