from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from database import Base, engine, SessionLocal, backfill_ticket_owner_email, ensure_ticket_owner_column, fix_misattributed_employee_tickets
from routers.auth import router as auth_router
from routers.tickets import router as tickets_router
from services.bootstrap import seed_demo_tickets, seed_demo_users


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_ticket_owner_column()
    db = SessionLocal()
    try:
        seed_demo_users(db)
        seed_demo_tickets(db)
    finally:
        db.close()
    backfill_ticket_owner_email("employee@helpdesk.example.com")
    fix_misattributed_employee_tickets()
    yield


app = FastAPI(title=settings.project_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tickets_router)


@app.get("/")
def health_check():
    return {"message": "Helpdesk Ticket Management System API is running."}
