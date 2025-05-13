from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from .models import RoleEnum, TicketStatus

class UserBase(BaseModel):
    username: str
    role: RoleEnum

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class CommentBase(BaseModel):
    text: str

class CommentCreate(CommentBase):
    pass

class CommentRead(CommentBase):
    id: int
    author_id: int
    ticket_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SuggestionBase(BaseModel):
    error_snippet: str
    suggestion_text: str

class SuggestionCreate(SuggestionBase):
    pass

class SuggestionRead(SuggestionBase):
    id: int
    ticket_id: Optional[int]
    model_config = ConfigDict(from_attributes=True)

class TicketBase(BaseModel):
    title: str
    description: str

class TicketRead(TicketBase):
    id: int
    user_id: int
    engineer_id: Optional[int]
    status: TicketStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TicketDetail(TicketRead):
    comments: List[CommentRead] = []
    suggestions: List[SuggestionRead] = []

class TicketUpdateStatus(BaseModel):
    status: TicketStatus
  
class Token(BaseModel):
    access_token: str
    token_type: str
    
class PastSuggestion(BaseModel):
    ticket_id: int
    snippet: str
    solved_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DocSuggestion(BaseModel):
    doc_id: str
    filename: str
    snippet: str
    full_text: str
    section_heading: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class VectorSuggestionsResponse(BaseModel):
    past: List[PastSuggestion]
    docs: List[DocSuggestion]