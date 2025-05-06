#!/usr/bin/env python3
"""
FastAPI endpoint for local LLM generation using llama-cpp-python and a quantized GGUF model.
Exposes /generate to accept question + context and return a generated response.
"""
import os
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from llama_cpp import Llama

# Load GGUF model
MODEL_PATH = os.getenv("GGUF_MODEL_PATH", "mistral-7b-instruct.Q4_K_M.gguf")
llm = Llama(model_path=MODEL_PATH, n_ctx=2048)

app = FastAPI(title="Local LLM Inference API")

class ContextItem(BaseModel):
    file_name: str
    chunk_id: int
    text: str
    score: float

class GenerateRequest(BaseModel):
    question: str
    context: List[ContextItem]

class GenerateResponse(BaseModel):
    answer: str

@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    """
    Generate a response using the local LLM model.
    The prompt includes a system message, retrieved context, and the user question.
    """
    # Basic prompt template
    system_prompt = (
        "You are a helpful assistant. Use the provided context to answer the question."
    )
    # Concatenate context chunks
    context_text = "\n---\n".join([item.text for item in req.context])
    prompt = (
        f"{system_prompt}\n\n"
        f"Context:\n{context_text}\n\n"
        f"Question: {req.question}\n"
        "Answer:"
    )
    try:
        # Generate completion
        response = llm.create(
            prompt=prompt,
            max_tokens=256,
            temperature=0.7,
            top_p=0.9,
            stop=["\n"]
        )
        answer = response.choices[0].text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return GenerateResponse(answer=answer)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8001)