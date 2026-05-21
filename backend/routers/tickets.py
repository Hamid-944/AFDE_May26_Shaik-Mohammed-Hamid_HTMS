from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from crud import create_ticket, delete_ticket, get_ticket, get_tickets, search_tickets, update_ticket
from database import get_db
from routers.auth import get_current_user, require_admin
from schemas import TicketCreate, TicketRead, TicketUpdate

router = APIRouter(prefix="", tags=["tickets"])


@router.get("/tickets", response_model=list[TicketRead])
def list_tickets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    category: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    priority: str | None = Query(default=None),
    query: str | None = Query(default=None),
):
    owner_email = None if current_user.role == "admin" else current_user.email
    if query or category or status_filter or priority:
        return search_tickets(
            db,
            query=query,
            category=category,
            status=status_filter,
            priority=priority,
            owner_email=owner_email,
        )
    return get_tickets(db, owner_email=owner_email)


@router.get("/tickets/{ticket_id}", response_model=TicketRead)
def read_ticket(ticket_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    owner_email = None if current_user.role == "admin" else current_user.email
    ticket = get_ticket(db, ticket_id, owner_email=owner_email)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return ticket


@router.post("/tickets", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
def create_new_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return create_ticket(db, ticket_in, owner_email=current_user.email)


@router.put("/tickets/{ticket_id}", response_model=TicketRead)
def modify_ticket(
    ticket_id: int,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    ticket = get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return update_ticket(db, ticket, ticket_in)


@router.delete("/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_ticket(ticket_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    ticket = get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    delete_ticket(db, ticket)
    return None


@router.get("/search", response_model=list[TicketRead])
def search_ticket_records(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    query: str | None = Query(default=None),
    category: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    priority: str | None = Query(default=None),
):
    owner_email = None if current_user.role == "admin" else current_user.email
    return search_tickets(
        db,
        query=query,
        category=category,
        status=status_filter,
        priority=priority,
        owner_email=owner_email,
    )
