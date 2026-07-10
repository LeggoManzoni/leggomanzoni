#!/usr/bin/env python3
"""
Split data/idioms_llm_verify.jsonl into fixed-size shards for parallel verification.

Usage:
    scripts/venv/bin/python scripts/shard_verify.py
"""

import json
import logging
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_PATH = os.path.join(BASE_DIR, "data", "idioms_llm_verify.jsonl")
SHARD_DIR = os.path.join(BASE_DIR, "data", "verify", "shards")
SHARD_SIZE = 60

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def shard_records(records):
    """Contiguous chunks of SHARD_SIZE; the last chunk holds the remainder."""
    return [records[i:i + SHARD_SIZE] for i in range(0, len(records), SHARD_SIZE)]


def main():
    with open(INPUT_PATH, encoding="utf-8") as handle:
        records = [json.loads(line) for line in handle if line.strip()]

    shards = shard_records(records)
    os.makedirs(SHARD_DIR, exist_ok=True)

    manifest = []
    for index, shard in enumerate(shards):
        name = f"shard_{index:02d}.jsonl"
        with open(os.path.join(SHARD_DIR, name), "w", encoding="utf-8") as handle:
            for record in shard:
                handle.write(json.dumps(record, ensure_ascii=False) + "\n")
        manifest.append({"index": index, "name": name, "count": len(shard)})

    with open(os.path.join(SHARD_DIR, "manifest.json"), "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)

    log.info("Wrote %d shards (%d records) to %s", len(shards), len(records), SHARD_DIR)


if __name__ == "__main__":
    main()
