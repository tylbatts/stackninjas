#!/usr/bin/env python3
"""
A pipeline to extract, chunk, embed documents and upload to Qdrant.
Supports PDF (.pdf) via PyMuPDF and Markdown (.md) via markdown lib.

Usage:
  python embed_pipeline.py <folder> --collection <collection_name> [--qdrant-url <url>] [--max-tokens N]
"""
import os
import re
import argparse
import requests

from sentence_transformers import SentenceTransformer
from chunker import clean_text, chunk_text
import fitz  # PyMuPDF
import markdown


def extract_pdf_text(path: str) -> str:
    """Extract plain text from a PDF file."""
    doc = fitz.open(path)
    text = []
    for page in doc:
        text.append(page.get_text())
    return "\n".join(text)


def extract_md_text(path: str) -> str:
    """Convert Markdown to HTML and strip tags to get plain text."""
    with open(path, 'r', encoding='utf-8') as f:
        raw = f.read()
    html = markdown.markdown(raw)
    # Remove HTML tags
    return re.sub(r'<[^>]+>', '', html)




def send_to_qdrant(qdrant_url: str, collection: str, points: list) -> dict:
    """POST a batch of points to Qdrant via REST API."""
    url = f"{qdrant_url.rstrip('/')}/collections/{collection}/points?wait=true"
    payload = {"points": points}
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    return resp.json()


def main():
    parser = argparse.ArgumentParser(description="Embed docs and upload to Qdrant.")
    parser.add_argument('folder', help='Folder containing .pdf and .md files')
    parser.add_argument('--qdrant-url', default='http://localhost:6333',
                        help='Base URL of Qdrant instance (default: http://localhost:6333)')
    parser.add_argument('--collection', required=True,
                        help='Qdrant collection name to upsert points into')
    parser.add_argument('--max-tokens', type=int, default=500,
                        help='Approximate max tokens (words) per chunk')
    args = parser.parse_args()

    # Load embedding model
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # Walk directory
    for root, _, files in os.walk(args.folder):
        for fname in files:
            ext = os.path.splitext(fname)[1].lower()
            if ext not in ('.pdf', '.md'):
                continue
            path = os.path.join(root, fname)
            print(f"Processing {path}...")
            # Extract text
            try:
                if ext == '.pdf':
                    text = extract_pdf_text(path)
                else:
                    text = extract_md_text(path)
            except Exception as e:
                print(f"Failed to extract text from {path}: {e}")
                continue

            # Clean and chunk text
            cleaned = clean_text(text)
            chunks = chunk_text(cleaned, args.max_tokens)
            print(f"  Split into {len(chunks)} chunks.")

            # Embed and prepare points
            points = []
            for idx, chunk in enumerate(chunks):
                emb = model.encode(chunk)
                # id can be filename-index
                pid = f"{fname}-{idx}"
                points.append({
                    "id": pid,
                    "vector": emb.tolist(),
                    "payload": {
                        "file_name": fname,
                        "chunk_id": idx,
                        "text": chunk,
                    }
                })

            # Send to Qdrant
            try:
                result = send_to_qdrant(args.qdrant_url, args.collection, points)
                print(f"  Uploaded {len(points)} points: {result}")
            except Exception as e:
                print(f"Error uploading to Qdrant for {fname}: {e}")


if __name__ == '__main__':
    main()