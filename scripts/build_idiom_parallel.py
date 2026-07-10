#!/usr/bin/env python3
"""
Build the parallel Italian-English idiom corpus for LeggoManzoni.

Joins the resolved idioms in data/concordance.json to their renderings in the
three complete English translations, via the <note target/targetEnd> spans that
align each translation to Quarantana <w xml:id> tokens.

Writes:
    data/idioms_parallel.xlsx    -- the linguists' corpus (tidy, 2700 rows)
    data/idioms_parallel.json    -- identical records, for the app / scripts
    data/idioms_llm_verify.jsonl -- minimal input for a later LLM verification pass

Makes no LLM calls and never modifies quarantana/ or translations/.

Usage:
    scripts/venv/bin/python scripts/build_idiom_parallel.py
"""

import logging
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEI = "{http://www.tei-c.org/ns/1.0}"
XML_ID = "{http://www.w3.org/XML/1998/namespace}id"

# (edition label, translations/ subdirectory). Chronological; also lexicographic,
# which the row sort relies on.
EDITIONS = [
    ("1845", "English_1845"),
    ("1972", "English_1972"),
    ("2022", "English_2022"),
]

# Duplicated from build_concordance.py on purpose: importing that module would
# pull in stanza at import time.
CHAPTER_ORDER = ["intro"] + [f"cap{i}" for i in range(1, 39)]

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def toknum(xid):
    """Token number from an xml:id shaped <chapter>_<token>[_<split>].

    The token number is the SECOND underscore-separated field. Quarantana ids may
    carry a _n split suffix (intro_10736_1), so anchoring on the trailing digits
    silently reads the split index as the token number.
    """
    return int(xid.split("_")[1])
