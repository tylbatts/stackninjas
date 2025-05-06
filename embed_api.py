#!/usr/bin/env python3
"""
FastAPI wrapper for the embed_pipeline logic.
Exposes /embed endpoint to upload .pdf/.md files, chunk, embed and store in Qdrant.
"""
import os
import tempfile
from typing import List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

from sentence_transformers import SentenceTransformer
from embed_pipeline import extract_pdf_text, extract_md_text, send_to_qdrant
from chunker import clean_text, chunk_text

app = FastAPI(title="Embedding API")
# Load embedding model once at startup
model = SentenceTransformer('all-MiniLM-L6-v2')

@app.post("/embed")
async def embed_endpoint(
    files: List[UploadFile] = File(...),
    collection: str = Form(...),
    qdrant_url: str = Form('http://localhost:6333'),
    max_tokens: int = Form(500)
) -> JSONResponse:
    """
    Accept multiple .pdf/.md uploads, embed and store in Qdrant.
    Returns per-file metadata: number of chunks and status.
    """
    results = []
    for upload in files:
        fname = upload.filename
        ext = os.path.splitext(fname)[1].lower()
        # Save to temp file
        fd, tmp_path = tempfile.mkstemp(suffix=ext)
        os.close(fd)
        try:
            content = await upload.read()
            with open(tmp_path, 'wb') as f:
                f.write(content)
            # Extract text
            if ext == '.pdf':
                text = extract_pdf_text(tmp_path)
            elif ext in ('.md', '.markdown'):
                text = extract_md_text(tmp_path)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
            # Clean and chunk text
            text = clean_text(text)
            chunks = chunk_text(text, max_tokens)
            # Embed chunks
            embeddings = model.encode(chunks)
            # Prepare points
            points = []
            for idx, emb in enumerate(embeddings):
                pid = f"{fname}-{idx}"
                points.append({
                    "id": pid,
                    "vector": emb.tolist(),
                    "payload": {"file_name": fname, "chunk_id": idx, "text": chunks[idx]},
                })
            # Upload to Qdrant
            send_to_qdrant(qdrant_url, collection, points)
            results.append({"file_name": fname, "chunks": len(chunks), "status": "success"})
        except Exception as e:
            results.append({"file_name": fname, "chunks": 0, "status": "error", "error": str(e)})
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass
    return JSONResponse(content={"results": results})
@app.post("/embed-text")
async def embed_text_endpoint(payload: dict):
    """
    Embed a raw text string and return a vector.
    Expected JSON: {"text": "..."}
    """
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="text field required")
    vector = model.encode(text)
    return {"vector": vector.tolist()}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)