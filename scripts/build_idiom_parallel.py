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

import glob
import logging
import os
import re

from lxml import etree

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


def _note_text(note):
    """Flatten a <note> to whitespace-normalised text.

    Note bodies in translations/ contain no nested markup (verified corpus-wide),
    but itertext() keeps this correct if that ever changes.
    """
    return re.sub(r"\s+", " ", "".join(note.itertext())).strip()


def _read_header(root):
    """(translator, date) from the teiHeader, or (None, None)."""
    translator = None
    for resp_stmt in root.iter(TEI + "respStmt"):
        resp = resp_stmt.find(TEI + "resp")
        name = resp_stmt.find(TEI + "persName")
        if resp is not None and name is not None and "Translated by" in (resp.text or ""):
            translator = (name.text or "").strip()

    date = None
    source_desc = root.find(f".//{TEI}sourceDesc")
    if source_desc is not None:
        date_el = source_desc.find(f".//{TEI}date")
        if date_el is not None:
            date = (date_el.text or "").strip()

    return translator, date


def load_edition(dirname):
    """Parse one translation directory.

    Returns (segments_by_chapter, translator, date), where each segment is
    (start_token, end_token, note_id, text) and each chapter list is sorted.
    """
    segments = {}
    translator = date = None

    pattern = os.path.join(BASE_DIR, "translations", dirname, "*.xml")
    for path in sorted(glob.glob(pattern)):
        chapter = os.path.basename(path)[:-4]
        root = etree.parse(path).getroot()

        if translator is None:
            translator, date = _read_header(root)

        chapter_segments = []
        for note in root.iter(TEI + "note"):
            if note.get("type") != "comm":
                continue
            target, target_end = note.get("target"), note.get("targetEnd")
            if not target or "#" not in target:
                continue
            start = toknum(target.split("#")[1])
            end = toknum(target_end.split("#")[1]) if target_end and "#" in target_end else start
            chapter_segments.append((start, end, note.get(XML_ID, ""), _note_text(note)))

        chapter_segments.sort()
        segments[chapter] = chapter_segments

    if translator is None:
        raise ValueError(f"No translator found in teiHeader for {dirname}")

    return segments, translator, date
