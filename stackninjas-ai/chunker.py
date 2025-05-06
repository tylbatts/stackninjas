"""
Module for cleaning and chunking text:
 - clean_text: remove headers, page numbers, excessive whitespace
 - chunk_text: split text into ~max_tokens-word chunks without breaking sentences
"""
import re

def clean_text(text: str) -> str:
    """
    Normalize and clean raw text:
      - Remove lines that are page numbers or headers
      - Collapse multiple spaces and newlines
    """
    lines = text.splitlines()
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # skip pure page numbers
        if re.fullmatch(r"\d+", stripped):
            continue
        # skip 'Page N' headers
        if re.match(r"page\s+\d+", stripped, re.IGNORECASE):
            continue
        cleaned_lines.append(line)
    cleaned = "\n".join(cleaned_lines)
    # collapse multiple spaces
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    # collapse multiple newlines
    cleaned = re.sub(r"\n{2,}", "\n\n", cleaned)
    return cleaned.strip()

def chunk_text(text: str, max_tokens: int = 500) -> list:
    """
    Split text into chunks of approx max_tokens words, preserving sentences.
    """
    # split on sentence boundaries
    sentences = re.split(r"(?<=[\.\?!])\s+", text)
    chunks = []
    current = []
    current_len = 0
    for sentence in sentences:
        # count words in sentence
        word_count = len(sentence.split())
        # if adding this sentence exceeds limit, flush current chunk
        if current and current_len + word_count > max_tokens:
            chunks.append(" ".join(current))
            current = []
            current_len = 0
        current.append(sentence)
        current_len += word_count
    # append any remaining sentences
    if current:
        chunks.append(" ".join(current))
    return chunks