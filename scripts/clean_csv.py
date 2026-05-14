#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# ///

import csv
import re
import sys
from io import StringIO
from pathlib import Path


def clean_text(text: str) -> str:
    # Remove markdown citations like ([Some Text][1]) or ([text][ref])
    text = re.sub(r'\s*\(\[[^\]]+\]\[\d+\]\)', '', text)
    # Replace markdown links [link text](url) with just the url
    text = re.sub(r'\[[^\]]*\]\((https?://[^\)]+)\)', r'\1', text)
    return text.strip()


def clean_csv(path: Path) -> None:
    raw = path.read_text(encoding='utf-8')
    reader = csv.reader(StringIO(raw))
    rows = [row for row in reader]

    cleaned_rows = [[clean_text(cell) for cell in row] for row in rows]

    with path.open('w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerows(cleaned_rows)

    print(f"Cleaned {len(cleaned_rows)} rows in {path}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: uv run clean_csv.py <file.csv>")
        sys.exit(1)

    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        print(f"Error: file not found: {csv_path}")
        sys.exit(1)

    clean_csv(csv_path)
