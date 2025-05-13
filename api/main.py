import os
from datetime import datetime
from typing import List

import requests
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import (Column, DateTime, ForeignKey, String, create_engine)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID")

# Initialize FastAPI
app = FastAPI()

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TicketModel(Base):
    __tablename__ = "tickets"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    comments = relationship("CommentModel", back_populates="ticket")

class CommentModel(Base):
    __tablename__ = "comments"
    id = Column(String, primary_key=True, index=True)
    ticket_id = Column(String, ForeignKey("tickets.id"), nullable=False)
    author = Column(String, nullable=False)
    text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    ticket = relationship("TicketModel", back_populates="comments")

# Create tables with retry loop until the database is ready
import time
from sqlalchemy.exc import OperationalError

def init_db(retries: int = 5, delay: float = 2.0):
    while True:
        try:
            Base.metadata.create_all(bind=engine)
            break
        except OperationalError:
            if retries <= 0:
                raise
            retries -= 1
            time.sleep(delay)

init_db()

# JWT authentication
bearer_scheme = HTTPBearer()

# Fetch JWKS from Keycloak
jwks_uri = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
JWKS = requests.get(jwks_uri).json()

def decode_token(token: str) -> dict:
    try:
        # Log the token for debugging
        print(f"Decoding token: {token}")
        unverified_header = jwt.get_unverified_header(token)
        key_dict = next(
            (k for k in JWKS.get("keys", []) if k.get("kid") == unverified_header.get("kid")),
            None
        )
        if not key_dict:
            print("Invalid token key ID")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token key ID")
        from jose import jwk
        public_key = jwk.construct(key_dict)
        pem_key = public_key.to_pem().decode('utf-8')
        issuer = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
        token_issuer = f"http://localhost:8080/realms/{KEYCLOAK_REALM}"  # External URL used in the token

        payload = jwt.decode(
            token,
            pem_key,
            algorithms=["RS256"],
            audience=KEYCLOAK_CLIENT_ID,
            issuer=token_issuer
        )
        print(f"Decoded payload: {payload}")
        return payload
    except JWTError as e:
        print(f"JWTError: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from e

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    return decode_token(token)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic schemas
class TicketCreate(BaseModel):
    title: str
    description: str

class CommentCreate(BaseModel):
    text: str

class Comment(BaseModel):
    id: str
    ticket_id: str
    author: str
    text: str
    created_at: datetime

    class Config:
        orm_mode = True

class Ticket(BaseModel):
    id: str
    title: str
    description: str
    user_id: str
    status: str
    created_at: datetime
    comments: List[Comment] = []

    class Config:
        orm_mode = True

# Routes
@app.post('/tickets', response_model=Ticket)
def create_ticket(
    ticket: TicketCreate,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    import uuid
    ticket_id = str(uuid.uuid4())
    db_ticket = TicketModel(
        id=ticket_id,
        title=ticket.title,
        description=ticket.description,
        user_id=user.get('sub'),
        status='Open'
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@app.get('/tickets', response_model=List[Ticket])
def list_tickets(
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    tickets = db.query(TicketModel).filter(TicketModel.user_id == user.get('sub')).all()
    return tickets

@app.get('/tickets/{ticket_id}', response_model=Ticket)
def get_ticket(
    ticket_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    ticket = db.query(TicketModel).filter(
        TicketModel.id == ticket_id,
        TicketModel.user_id == user.get('sub')
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail='Ticket not found')
    return ticket

@app.post('/tickets/{ticket_id}/comments', response_model=Comment)
def add_comment(
    ticket_id: str,
    comment: CommentCreate,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    import uuid
    ticket = db.query(TicketModel).filter(TicketModel.id == ticket_id).first()
    if not ticket or ticket.user_id != user.get('sub'):
        raise HTTPException(status_code=404, detail='Ticket not found')
    comment_id = str(uuid.uuid4())
    db_comment = CommentModel(
        id=comment_id,
        ticket_id=ticket_id,
        author=user.get('preferred_username', user.get('sub')),
        text=comment.text
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment