import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from .database import Base

class RoleEnum(str, enum.Enum):
    engineer = "engineer"
    customer = "customer"
    admin = "admin"

class TicketStatus(str, enum.Enum):
    open = "Open"
    in_progress = "In Progress"
    resolved = "Resolved"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)

    tickets = relationship("Ticket", back_populates="customer", foreign_keys='Ticket.user_id')
    assigned_tickets = relationship("Ticket", back_populates="engineer", foreign_keys='Ticket.engineer_id')
    comments = relationship("Comment", back_populates="author")

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    engineer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.open)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("User", foreign_keys=[user_id], back_populates="tickets")
    engineer = relationship("User", foreign_keys=[engineer_id], back_populates="assigned_tickets")
    comments = relationship("Comment", back_populates="ticket")
    suggestions = relationship("Suggestion", back_populates="ticket")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("User", back_populates="comments")

class Suggestion(Base):
    __tablename__ = "suggestions"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    error_snippet = Column(Text, nullable=False)
    suggestion_text = Column(Text, nullable=False)

    ticket = relationship("Ticket", back_populates="suggestions")