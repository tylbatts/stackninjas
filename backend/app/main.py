import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from . import models, schemas, crud
from .database import init_db, get_db, async_session
from sqlalchemy.ext.asyncio import AsyncSession
import requests
import time
from datetime import datetime, timedelta
from jose import jwk
 
# Vector embedding and Qdrant setup
import io
import re
import uuid
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
import torch
from transformers import AutoTokenizer, AutoModel
from PyPDF2 import PdfReader

# Load embedding model
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "distilbert-base-uncased")
tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL_NAME)
model = AutoModel.from_pretrained(EMBEDDING_MODEL_NAME)
EMBED_DIM = model.config.hidden_size

# Initialize Qdrant client
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

def embed_text(text: str) -> List[float]:
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1)[0]
    normalized = embeddings / embeddings.norm(p=2)
    return normalized.tolist()

# Environment settings
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

app = FastAPI()
# Add CORS middleware to allow frontend requests (e.g., Vite dev server)
from fastapi.middleware.cors import CORSMiddleware
origins = [
    os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup: initialize database and seed support engineer and sample suggestions
@app.on_event("startup")
async def on_startup():
    # Initialize database tables
    await init_db()

    # Seed support_engineer user, suggestions, customers, tickets, and comments
    async with async_session() as session:
        # Ensure support engineer account exists
        engineer = await crud.get_user_by_username(session, username="support_engineer")
        if not engineer:
            eng_in = schemas.UserCreate(
                username="support_engineer",
                password="password",
                role=models.RoleEnum.engineer,
            )
            engineer = await crud.create_user(session, eng_in)

        # Seed historical suggestions if none exist
        existing_suggestions = await crud.search_suggestions(session, query="TypeError")
        if not existing_suggestions:
            sample_suggestions = [
                schemas.SuggestionCreate(
                    error_snippet="TypeError: undefined is not a function",
                    suggestion_text="Ensure the variable is defined and is a function before invoking."
                ),
                schemas.SuggestionCreate(
                    error_snippet="ReferenceError: x is not defined",
                    suggestion_text="Declare or initialize 'x' before using it."
                ),
            ]
            for s in sample_suggestions:
                await crud.create_suggestion(session, ticket_id=None, suggestion=s)

        # Ensure customer account exists
        cust = await crud.get_user_by_username(session, username="customer1")
        if not cust:
            cust_in = schemas.UserCreate(
                username="customer1",
                password="password",
                role=models.RoleEnum.customer,
            )
            cust = await crud.create_user(session, cust_in)

        # Seed 10 sample DevSecOps tickets if none exist
        existing_tickets = await crud.list_tickets(session)
        if not existing_tickets:
            tickets_data = [
                {"title": "Outdated dependency: CVE-2021-44228 (Log4Shell)",
                 "description": "Our application uses Log4j 2.14.1, which is vulnerable to remote code execution (CVE-2021-44228). Please upgrade to the latest patched version."},
                {"title": "Unencrypted S3 bucket exposure",
                 "description": "Development S3 bucket 'dev-bucket' has public ACL enabled and no server-side encryption. Sensitive data may be exposed."},
                {"title": "Improper IAM permissions",
                 "description": "Lambda function role has '*' wildcard permission on all S3 actions. Need to follow least privilege principle."},
                {"title": "Hardcoded credentials in repository",
                 "description": "Found AWS access key and secret in code repository. Rotate credentials and use IAM roles or secrets manager."},
                {"title": "Open SSH port to the internet",
                 "description": "EC2 instance security group allows 0.0.0.0/0 on port 22. Restrict SSH access to known IP ranges."},
                {"title": "Missing input validation in API endpoint",
                 "description": "API endpoint at '/api/user' does not validate request body properly, leading to potential injection attacks."},
                {"title": "Cross-Site Scripting vulnerability",
                 "description": "User-generated content is rendered without sanitization. Implement proper escaping or input sanitization."},
                {"title": "Unpatched OS vulnerability on server",
                 "description": "Server is running Ubuntu 18.04 with unpatched CVE-2020-1234 kernel issue. Schedule immediate patch update."},
                {"title": "No logging for authentication failures",
                 "description": "Authentication failures are not logged, making it hard to audit brute-force attempts. Add centralized logging."},
                {"title": "Improper session timeout configuration",
                 "description": "Sessions are valid for 24 hours. Lower session TTL to 30 minutes of inactivity."},
            ]
            seeded_tickets = []
            for td in tickets_data:
                t = models.Ticket(
                    user_id=cust.id,
                    engineer_id=None,
                    title=td["title"],
                    description=td["description"],
                    status=models.TicketStatus.open,
                )
                session.add(t)
                seeded_tickets.append(t)
            await session.commit()
            for t in seeded_tickets:
                await session.refresh(t)
            # Seed initial comment on each ticket
            for t in seeded_tickets:
                await crud.create_comment(
                    session,
                    t.id,
                    engineer.id,
                    schemas.CommentCreate(text="Support engineer has been notified and is investigating this issue."),
                )
        # Fetch Keycloak JWKS for token validation
        for _ in range(5):
            try:
                resp = requests.get(JWKS_URI)
                JWKS.update(resp.json())
                break
            except Exception:
                time.sleep(1)
        else:
            raise RuntimeError("Failed to fetch JWKS from Keycloak")
        # Initialize Qdrant collections for tickets and docs if they do not exist
        existing_collections = {c.name for c in qdrant.get_collections().collections}
        if "tickets" not in existing_collections:
            qdrant.create_collection(
                collection_name="tickets",
                vectors_config=qdrant_models.VectorParams(size=EMBED_DIM, distance=qdrant_models.Distance.COSINE),
            )
        if "docs" not in existing_collections:
            qdrant.create_collection(
                collection_name="docs",
                vectors_config=qdrant_models.VectorParams(size=EMBED_DIM, distance=qdrant_models.Distance.COSINE),
            )
        # Seed sample docs into Qdrant if empty
        docs_count = qdrant.count(collection_name="docs").count
        if docs_count == 0:
            sample_docs = [
                {"filename": "README.md", "section_heading": "Introduction", "text": "Welcome to the docs…"},
                {"filename": "Troubleshooting.pdf", "section_heading": "Errors", "text": "Error code 500 means…"},
            ]
            points = []
            for doc in sample_docs:
                doc_id = uuid.uuid4().hex
                vec = embed_text(doc["text"])
                payload = {
                    "doc_id": doc_id,
                    "filename": doc["filename"],
                    "section_heading": doc["section_heading"],
                    "text_chunk": doc["text"],
                }
                point = qdrant_models.PointStruct(id=doc_id, vector=vec, payload=payload)
                points.append(point)
            qdrant.upsert(collection_name="docs", points=points)
        # Seed resolved tickets into DB and Qdrant if none exist
        resolved = await crud.list_tickets(session, status=models.TicketStatus.resolved)
        if not resolved:
            sample_resolved = [
                {"title": "Cannot login to account",
                 "description": "Users receive a 500 error when attempting to login via SSO. Please investigate authentication flow.",
                 "solved_at": datetime.utcnow() - timedelta(days=1)},
                {"title": "Payment processing timeout",
                 "description": "Payment requests are timing out due to network latency in our payment gateway integration.",
                 "solved_at": datetime.utcnow() - timedelta(days=2)},
                {"title": "Email notifications not sent",
                 "description": "Transactional emails (e.g., password reset) are not being sent. SMTP server logs indicate connection refused.",
                 "solved_at": datetime.utcnow() - timedelta(days=3)},
                {"title": "Slow dashboard load",
                 "description": "Dashboard metrics take over 30 seconds to load for large data sets. Need performance tuning.",
                 "solved_at": datetime.utcnow() - timedelta(days=4)},
                {"title": "API rate limit exceeded",
                 "description": "Clients are receiving 429 Too Many Requests errors despite low request volume. Throttling configuration review needed.",
                 "solved_at": datetime.utcnow() - timedelta(days=5)},
            ]
            new_resolved = []
            for rd in sample_resolved:
                t_res = models.Ticket(
                    user_id=cust.id,
                    engineer_id=engineer.id,
                    title=rd["title"],
                    description=rd["description"],
                    status=models.TicketStatus.resolved,
                    created_at=rd["solved_at"],
                )
                session.add(t_res)
                new_resolved.append(t_res)
            await session.commit()
            for t_res in new_resolved:
                await session.refresh(t_res)
                # Embed and upsert to Qdrant tickets collection
                vec = embed_text(f"{t_res.title}. {t_res.description}")
                payload = {
                    "ticket_id": t_res.id,
                    "description": t_res.description,
                    "status": t_res.status.value,
                    "solved_at": t_res.created_at.isoformat(),
                }
                point = qdrant_models.PointStruct(id=str(t_res.id), vector=vec, payload=payload)
                qdrant.upsert(collection_name="tickets", points=[point])
                # Seed a suggestion record for this resolved ticket
                snippet = t_res.description if len(t_res.description) <= 200 else t_res.description[:200] + "..."
                sug_in = schemas.SuggestionCreate(
                    error_snippet=snippet,
                    suggestion_text="Refer to resolution steps documented in internal knowledge base."
                )
                await crud.create_suggestion(session, t_res.id, sug_in)
# Keycloak and JWT setup

# Keycloak and JWT setup
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID")
JWKS_URI = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
JWKS: dict = {}

# HTTP Bearer for admin
bearer_scheme = HTTPBearer()

def decode_token(token: str) -> dict:
    # Allow dummy token for dev admin login
    if token == 'dummy_token':
        # Map to support_engineer user seeded at startup
        return {'preferred_username': 'support_engineer', 'sub': 'support_engineer'}
    try:
        unverified_header = jwt.get_unverified_header(token)
        key_dict = next(
            (k for k in JWKS.get("keys", []) if k.get("kid") == unverified_header.get("kid")),
            None
        )
        if not key_dict:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token key ID")
        public_key = jwk.construct(key_dict)
        pem_key = public_key.to_pem().decode('utf-8')
        issuer = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
        # Decode and verify token without enforcing issuer, to accommodate dynamic issuer URLs
        payload = jwt.decode(
            token,
            pem_key,
            algorithms=["RS256"],
            audience=KEYCLOAK_CLIENT_ID,
            # Do not enforce issuer to avoid mismatches in container vs host URLs
        )
        return payload
    except JWTError as e:
        # JWT decoding or validation failed
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token validation error: {str(e)}") from e

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> models.User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    username: str = payload.get("preferred_username") or payload.get("sub")
    if username is None:
        raise credentials_exception
    async with async_session() as session:
        user = await crud.get_user_by_username(session, username=username)
        if not user:
            raise credentials_exception
    return user

async def get_current_engineer(user: models.User = Depends(get_current_user)) -> models.User:
    if user.role != models.RoleEnum.engineer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as engineer")
    return user


### Admin endpoints ###
@app.get("/admin/tickets", response_model=List[schemas.TicketRead])
async def list_admin_tickets(
    status: Optional[models.TicketStatus] = None,
    unclaimed: bool = False,
    mine: bool = False,
    db: AsyncSession = Depends(get_db),
    engineer: models.User = Depends(get_current_engineer),
):
    engineer_id = engineer.id if mine else None
    tickets = await crud.list_tickets(db, status=status, unclaimed=unclaimed, engineer_id=engineer_id)
    return tickets

@app.patch("/admin/tickets/{ticket_id}/claim", response_model=schemas.TicketRead)
async def claim_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    engineer: models.User = Depends(get_current_engineer),
):
    ticket = await crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.engineer_id is not None:
        raise HTTPException(status_code=400, detail="Ticket already claimed")
    return await crud.claim_ticket(db, ticket_id, engineer.id)

@app.patch("/admin/tickets/{ticket_id}/status", response_model=schemas.TicketRead)
async def update_ticket_status(
    ticket_id: int,
    update: schemas.TicketUpdateStatus,
    db: AsyncSession = Depends(get_db),
    engineer: models.User = Depends(get_current_engineer),
):
    ticket = await crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.engineer_id != engineer.id:
        raise HTTPException(status_code=403, detail="Cannot update ticket not claimed by you")
    return await crud.update_ticket_status(db, ticket_id, update.status)

@app.get("/admin/tickets/{ticket_id}", response_model=schemas.TicketDetail)
async def get_ticket_detail(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    engineer: models.User = Depends(get_current_engineer),
):
    ticket = await crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.post("/admin/tickets/{ticket_id}/comments", response_model=schemas.CommentRead)
async def add_comment(
    ticket_id: int,
    comment: schemas.CommentCreate,
    db: AsyncSession = Depends(get_db),
    engineer: models.User = Depends(get_current_engineer),
):
    ticket = await crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return await crud.create_comment(db, ticket_id, engineer.id, comment)

@app.post("/admin/tickets/{ticket_id}/suggestions", response_model=schemas.SuggestionRead)
async def add_suggestion(
    ticket_id: int,
    suggestion: schemas.SuggestionCreate,
    db: AsyncSession = Depends(get_db),
    engineer: models.User = Depends(get_current_engineer),
):
    return await crud.create_suggestion(db, ticket_id, suggestion)

@app.get("/admin/search", response_model=List[schemas.SuggestionRead])
async def search_suggestions(
    query: str,
    db: AsyncSession = Depends(get_db),
    engineer: models.User = Depends(get_current_engineer),
):
    return await crud.search_suggestions(db, query)

@app.get("/admin/tickets/{ticket_id}/suggestions", response_model=schemas.VectorSuggestionsResponse)
async def get_suggestions(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_engineer),
):
    ticket = await crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    text = f"{ticket.title}. {ticket.description}"
    vector = embed_text(text)
    # Search past tickets (only resolved)
    ticket_filter = qdrant_models.Filter(
        must=[
            qdrant_models.FieldCondition(
                key="status",
                match=qdrant_models.MatchValue(value=models.TicketStatus.resolved.value),
            )
        ]
    )
    past_hits = qdrant.search(
        collection_name="tickets",
        query_vector=vector,
        limit=5,
        query_filter=ticket_filter,
        with_payload=True,
    )
    past = []
    for hit in past_hits:
        payload = hit.payload or {}
        tid = payload.get("ticket_id")
        snippet = payload.get("description", "")
        if len(snippet) > 200:
            snippet = snippet[:200] + "..."
        solved_at = payload.get("solved_at")
        past.append(schemas.PastSuggestion(ticket_id=tid, snippet=snippet, solved_at=solved_at))
    # Search documentation chunks
    # Search documentation chunks
    docs_hits = qdrant.search(
        collection_name="docs",
        query_vector=vector,
        limit=5,
        with_payload=True,
    )
    docs = []
    for hit in docs_hits:
        payload = hit.payload or {}
        doc_id = payload.get("doc_id")
        filename = payload.get("filename")
        text_chunk = payload.get("text_chunk", "")
        snippet = text_chunk if len(text_chunk) <= 200 else text_chunk[:200] + "..."
        section = payload.get("section_heading")
        docs.append(schemas.DocSuggestion(
            doc_id=doc_id,
            filename=filename,
            snippet=snippet,
            full_text=text_chunk,
            section_heading=section,
        ))
    return schemas.VectorSuggestionsResponse(past=past, docs=docs)

@app.post("/admin/docs/upload", status_code=status.HTTP_201_CREATED)
async def upload_docs(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    engineer: models.User = Depends(get_current_engineer),
):
    content = await file.read()
    ext = file.filename.lower().split('.')[-1]
    doc_id = uuid.uuid4().hex
    chunks = []
    if ext in ("md", "markdown"):
        text = content.decode('utf-8')
        # Split markdown by headings
        parts = re.split(r"(?m)^# (.+)$", text)
        if parts and parts[0].strip():
            chunks.append({'section_heading': None, 'text': parts[0].strip()})
        for i in range(1, len(parts), 2):
            heading = parts[i].strip()
            body = parts[i+1].strip() if i+1 < len(parts) else ''
            chunks.append({'section_heading': heading, 'text': body})
    elif ext == 'pdf':
        reader = PdfReader(io.BytesIO(content))
        for idx, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ''
            chunks.append({'section_heading': f"Page {idx}", 'text': text})
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")
    # Embed and upsert chunks
    points = []
    for chunk in chunks:
        vector = embed_text(chunk['text'])
        payload = {
            'doc_id': doc_id,
            'filename': file.filename,
            'section_heading': chunk.get('section_heading'),
            'text_chunk': chunk['text'],
        }
        point = qdrant_models.PointStruct(id=uuid.uuid4().hex, vector=vector, payload=payload)
        points.append(point)
    qdrant.upsert(collection_name="docs", points=points)
    return {'detail': f"Uploaded {len(points)} chunks from {file.filename}"}