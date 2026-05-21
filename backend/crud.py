from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from core.security import get_password_hash, verify_password
from models import Ticket, User
from schemas import TicketCreate, TicketUpdate


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, email: str, full_name: str, role: str, password: str) -> User:
    user = User(
        email=email,
        full_name=full_name,
        role=role,
        hashed_password=get_password_hash(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def get_tickets(db: Session, owner_email: str | None = None) -> list[Ticket]:
    query = db.query(Ticket)
    if owner_email is not None:
        query = query.filter(Ticket.owner_email == owner_email)
    return query.order_by(Ticket.created_at.desc()).all()


def get_ticket(db: Session, ticket_id: int, owner_email: str | None = None) -> Ticket | None:
    query = db.query(Ticket).filter(Ticket.ticket_id == ticket_id)
    if owner_email is not None:
        query = query.filter(Ticket.owner_email == owner_email)
    return query.first()


def create_ticket(db: Session, ticket_in: TicketCreate, owner_email: str | None = None) -> Ticket:
    ticket = Ticket(**ticket_in.model_dump(), owner_email=owner_email)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def update_ticket(db: Session, ticket: Ticket, ticket_in: TicketUpdate) -> Ticket:
    update_data = ticket_in.model_dump(exclude_unset=True)
    for field_name, value in update_data.items():
        setattr(ticket, field_name, value)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def delete_ticket(db: Session, ticket: Ticket) -> None:
    db.delete(ticket)
    db.commit()


def search_tickets(
    db: Session,
    query: str | None = None,
    category: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    owner_email: str | None = None,
) -> list[Ticket]:
    filters = []

    if query:
        like_query = f"%{query.lower()}%"
        filters.append(
            or_(
                Ticket.employee_name.ilike(like_query),
                Ticket.department.ilike(like_query),
                Ticket.issue_category.ilike(like_query),
                Ticket.description.ilike(like_query),
                Ticket.resolution_notes.ilike(like_query),
            )
        )

    if category:
        filters.append(Ticket.issue_category == category)
    if status:
        filters.append(Ticket.status == status)
    if priority:
        filters.append(Ticket.priority == priority)

    query_builder = db.query(Ticket)
    if owner_email is not None:
        query_builder = query_builder.filter(Ticket.owner_email == owner_email)
    if filters:
        query_builder = query_builder.filter(and_(*filters))

    return query_builder.order_by(Ticket.created_at.desc()).all()
