from sqlalchemy.future import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from passlib.context import CryptContext
from typing import Optional
from . import models, schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(models.User).filter(models.User.username == username))
    return result.scalars().first()

async def create_user(db: AsyncSession, user: schemas.UserCreate):
    hashed = get_password_hash(user.password)
    db_user = models.User(username=user.username, password_hash=hashed, role=user.role)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def list_tickets(db: AsyncSession, status=None, unclaimed=False, engineer_id=None):
    q = select(models.Ticket)
    if status:
        q = q.filter(models.Ticket.status == status)
    if unclaimed:
        q = q.filter(models.Ticket.engineer_id == None)
    if engineer_id is not None:
        q = q.filter(models.Ticket.engineer_id == engineer_id)
    result = await db.execute(q.order_by(models.Ticket.created_at.desc()))
    return result.scalars().all()

async def get_ticket(db: AsyncSession, ticket_id: int):
    # load ticket with related comments and suggestions to avoid lazy-loading outside async context
    stmt = (
        select(models.Ticket)
        .options(
            selectinload(models.Ticket.comments),
            selectinload(models.Ticket.suggestions),
        )
        .filter(models.Ticket.id == ticket_id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()

async def claim_ticket(db: AsyncSession, ticket_id: int, engineer_id: int):
    await db.execute(
        update(models.Ticket)
        .where(models.Ticket.id == ticket_id)
        .values(engineer_id=engineer_id)
    )
    await db.commit()
    return await get_ticket(db, ticket_id)

async def update_ticket_status(db: AsyncSession, ticket_id: int, status: models.TicketStatus):
    await db.execute(
        update(models.Ticket)
        .where(models.Ticket.id == ticket_id)
        .values(status=status)
    )
    await db.commit()
    return await get_ticket(db, ticket_id)

async def create_comment(db: AsyncSession, ticket_id: int, author_id: int, comment: schemas.CommentCreate):
    db_comment = models.Comment(ticket_id=ticket_id, author_id=author_id, text=comment.text)
    db.add(db_comment)
    await db.commit()
    await db.refresh(db_comment)
    return db_comment

async def create_suggestion(db: AsyncSession, ticket_id: Optional[int], suggestion: schemas.SuggestionCreate):
    db_sug = models.Suggestion(
        ticket_id=ticket_id,
        error_snippet=suggestion.error_snippet,
        suggestion_text=suggestion.suggestion_text
    )
    db.add(db_sug)
    await db.commit()
    await db.refresh(db_sug)
    return db_sug

async def search_suggestions(db: AsyncSession, query: str, limit: int = 5):
    q = select(models.Suggestion).filter(models.Suggestion.error_snippet.ilike(f"%{query}%"))
    result = await db.execute(q.limit(limit))
    return result.scalars().all()