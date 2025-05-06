#!/usr/bin/env python3
"""
Helper script to auto-tag WorkflowSuggestions using vector similarity.
Requires the backend API and embedding service to be running.
"""
import os
import sys
import requests
import numpy as np

# Configuration via env vars
API_URL = os.getenv('API_URL', 'http://localhost:8080')
EMBED_URL = os.getenv('EMBED_API_URL', 'http://localhost:8000/embed-text')

# Predefined tags
TAGS = ["Helm", "Istio", "Keycloak", "CI/CD", "ArgoCD", "Redis"]

def embed(text: str) -> np.ndarray:
    """Get embedding vector for text from embed service."""
    resp = requests.post(EMBED_URL, json={"text": text})
    resp.raise_for_status()
    vec = resp.json().get('vector')
    return np.array(vec, dtype=float)

def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    if a.ndim != 1 or b.ndim != 1:
        return 0.0
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / denom) if denom > 0 else 0.0

def main():
    # Compute tag embeddings
    print("Embedding predefined tags...")
    tag_vecs = {tag: embed(tag) for tag in TAGS}

    # Fetch existing suggestions
    resp = requests.get(f"{API_URL}/suggestions")
    resp.raise_for_status()
    suggestions = resp.json()

    for sug in suggestions:
        text = f"{sug['summary']}\n\n{sug['steps']}"
        vec = embed(text)
        # find best matching tag
        sims = {tag: cosine_sim(vec, tag_vecs[tag]) for tag in TAGS}
        best_tag = max(sims, key=sims.get)
        if sug.get('tag') != best_tag:
            # update suggestion with new tag
            payload = {
                'tag': best_tag,
                'summary': sug['summary'],
                'steps': sug['steps'],
            }
            put = requests.put(f"{API_URL}/suggestions/{sug['id']}", json=payload)
            if put.status_code < 300:
                print(f"Updated {sug['id']}: {sug['tag']} -> {best_tag}")
            else:
                print(f"Failed to update {sug['id']}: {put.status_code}")
        else:
            print(f"No change for {sug['id']} (tag: {sug['tag']})")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)