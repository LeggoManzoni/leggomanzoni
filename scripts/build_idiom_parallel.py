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
import json
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

MARK_OPEN = "⟦"   # zero occurrences in quarantana/ and translations/
MARK_CLOSE = "⟧"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

_TOKEN_CACHE = {}


def chapter_tokens(chapter):
    """[(xml_id, surface)] for every <w>, in document order. Keyed by full id —
    intro_10740 ('mani.') and intro_10740_1 ('—') share token number 10740, so a
    number key would drop one."""
    if chapter not in _TOKEN_CACHE:
        path = os.path.join(BASE_DIR, "quarantana", f"{chapter}.xml")
        out = []
        for el in etree.parse(path).getroot().iter():
            tag = etree.QName(el.tag).localname if isinstance(el.tag, str) else ""
            if tag == "w":
                xid = el.get(XML_ID, "")
                if "_" in xid:
                    out.append((xid, "".join(el.itertext()).strip()))
        _TOKEN_CACHE[chapter] = out
    return _TOKEN_CACHE[chapter]


def mark_italian(tokens, seg_start, seg_end, start_id, end_id):
    """Italian text for token numbers [seg_start, seg_end], idiom wrapped in ⟦ ⟧.
    Brackets attach by id equality, so a split token sharing the end number stays out."""
    parts = []
    for xid, surface in tokens:
        n = toknum(xid)
        if n < seg_start or n > seg_end:
            continue
        if xid == start_id:
            surface = MARK_OPEN + surface
        if xid == end_id:
            surface = surface + MARK_CLOSE
        parts.append(surface)
    return " ".join(parts)


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
            start_id = target.split("#")[1]
            end_id = target_end.split("#")[1] if target_end and "#" in target_end else start_id
            start = toknum(start_id)
            end = toknum(end_id)
            chapter_segments.append(
                (start, end, note.get(XML_ID, ""), _note_text(note), start_id, end_id)
            )

        chapter_segments.sort()
        segments[chapter] = chapter_segments

    if translator is None:
        raise ValueError(f"No translator found in teiHeader for {dirname}")

    return segments, translator, date


def find_segments(chapter_segments, start, end):
    """Segments overlapping the token interval [start, end], in document order.

    Touching a boundary is containment, not crossing: an idiom ending exactly on a
    segment's last token overlaps that segment only.
    """
    return [s for s in chapter_segments if not (s[1] < start or s[0] > end)]


def merge_segments(found):
    """Collapse covering segments to (text, note_id, match_status).

    A straddling idiom's segments are concatenated in document order, joined with a
    single space; note_id records every contributing id, '+'-joined.
    """
    if not found:
        return "", "", "no_segment"

    ordered = sorted(found)
    text = " ".join(s[3].strip() for s in ordered if s[3].strip())
    note_id = "+".join(s[2] for s in ordered)
    return text, note_id, "ok" if len(ordered) == 1 else "straddle"


COLUMNS = [
    "idiom_id", "label", "tipologia", "parola_chiave",
    "chapter", "comma",
    "it_left", "it_span", "it_right", "it_segment",
    "edition", "translator", "en_segment",
    "start_id", "end_id", "seg_start_id", "seg_end_id", "note_id", "match_status",
]

# Asserted at build time. A TEI edit that breaks alignment must fail loudly rather
# than quietly shrink the corpus. 925 ok rows sit flush against a segment boundary,
# so a one-token re-segmentation would turn one of them into a straddle and trip this.
EXPECTED_ROWS = 2700
EXPECTED_STATUS = {"ok": 2697, "straddle": 2, "no_segment": 1}


def build_rows():
    """One row per idiom occurrence x edition, sorted for reading."""
    concordance_path = os.path.join(BASE_DIR, "data", "concordance.json")
    with open(concordance_path, encoding="utf-8") as handle:
        idioms = json.load(handle)["idioms"]

    editions = {}
    for label, dirname in EDITIONS:
        segments, translator, _date = load_edition(dirname)
        editions[label] = (segments, translator)
        log.info("Loaded %s (%s): %d chapters", label, translator, len(segments))

    rows = []
    for idiom_id, idiom in idioms.items():
        for occurrence in idiom["occurrences"]:
            chapter = occurrence["chapter"]
            start = toknum(occurrence["start_id"])
            end = toknum(occurrence["end_id"])

            for label, _dirname in EDITIONS:
                segments, translator = editions[label]
                found = find_segments(segments.get(chapter, []), start, end)
                text, note_id, status = merge_segments(found)

                if found:
                    seg_start = min(s[0] for s in found)
                    seg_end = max(s[1] for s in found)
                    seg_start_id = min(found, key=lambda s: s[0])[4]
                    seg_end_id = max(found, key=lambda s: s[1])[5]
                    it_segment = mark_italian(
                        chapter_tokens(chapter), seg_start, seg_end,
                        occurrence["start_id"], occurrence["end_id"],
                    )
                else:
                    it_segment = seg_start_id = seg_end_id = ""

                rows.append({
                    "idiom_id": int(idiom_id),
                    "label": idiom["label"],
                    "tipologia": idiom["tipologia"],
                    "parola_chiave": idiom["parola_chiave"],
                    "chapter": chapter,
                    "comma": occurrence["comma"],
                    "it_left": " ".join(occurrence["left"]),
                    "it_span": " ".join(occurrence["span_surface"]),
                    "it_right": " ".join(occurrence["right"]),
                    "it_segment": it_segment,
                    "edition": label,
                    "translator": translator,
                    "en_segment": text,
                    "start_id": occurrence["start_id"],
                    "end_id": occurrence["end_id"],
                    "seg_start_id": seg_start_id,
                    "seg_end_id": seg_end_id,
                    "note_id": note_id,
                    "match_status": status,
                })

    chapter_index = {c: i for i, c in enumerate(CHAPTER_ORDER)}
    # idiom_id must precede edition: five idiom pairs share a start token (Excel
    # duplicates, plus "è un uomo" nested inside "È un uomo di vaglia"). Without it
    # the two idioms' rows interleave and an idiom's three editions stop being
    # adjacent. Edition labels sort lexicographically into chronological order.
    rows.sort(key=lambda r: (
        chapter_index[r["chapter"]], toknum(r["start_id"]), r["idiom_id"], r["edition"],
    ))
    return rows


def write_json(rows, path):
    """The corpus as records, for the reader app and scripted reuse."""
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(rows, handle, ensure_ascii=False, indent=2)


def write_jsonl(rows, path):
    """Minimal input for a later LLM verification pass. Makes no LLM calls itself.

    One object per line so a batch job can stream it without a parser and retry any
    single line. row_id joins back onto the corpus. Rows with no English segment are
    excluded: there is nothing to verify.
    """
    skipped = 0
    with open(path, "w", encoding="utf-8") as handle:
        for row in rows:
            if row["match_status"] == "no_segment":
                skipped += 1
                continue
            record = {
                "row_id": f"{row['idiom_id']}_{row['edition']}",
                "idiom_it": row["label"],
                "it_segment": row["it_segment"],
                "en_segment": row["en_segment"],
            }
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

    log.info("Wrote %d verification lines (%d excluded: no English segment)", len(rows) - skipped, skipped)


def write_xlsx(rows, path):
    """The linguists' working surface: frozen header, autofilter, wrapped segments."""
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font
    from openpyxl.utils import get_column_letter

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "idioms"

    sheet.append(COLUMNS)
    for cell in sheet[1]:
        cell.font = Font(bold=True)

    for row in rows:
        sheet.append([row[column] for column in COLUMNS])

    widths = {
        "label": 28, "parola_chiave": 16, "tipologia": 10,
        "it_left": 30, "it_span": 30, "it_right": 30, "it_segment": 70,
        "translator": 22, "en_segment": 70,
        "start_id": 14, "end_id": 14, "seg_start_id": 14, "seg_end_id": 14,
        "note_id": 34, "match_status": 14,
    }
    for index, column in enumerate(COLUMNS, start=1):
        letter = get_column_letter(index)
        sheet.column_dimensions[letter].width = widths.get(column, 12)

    wrap = Alignment(wrap_text=True, vertical="top")
    for name in ("it_segment", "en_segment"):
        column = COLUMNS.index(name) + 1
        for row_cells in sheet.iter_rows(min_row=2, min_col=column, max_col=column):
            row_cells[0].alignment = wrap

    sheet.freeze_panes = "A2"
    sheet.auto_filter.ref = sheet.dimensions
    workbook.save(path)


def main():
    rows = build_rows()

    counts = {}
    for row in rows:
        counts[row["match_status"]] = counts.get(row["match_status"], 0) + 1
    log.info("Built %d rows: %s", len(rows), counts)

    if len(rows) != EXPECTED_ROWS or counts != EXPECTED_STATUS:
        raise AssertionError(
            f"Alignment changed. Expected {EXPECTED_ROWS} rows {EXPECTED_STATUS}, "
            f"got {len(rows)} rows {counts}. Investigate before regenerating."
        )

    data_dir = os.path.join(BASE_DIR, "data")
    write_json(rows, os.path.join(data_dir, "idioms_parallel.json"))
    write_jsonl(rows, os.path.join(data_dir, "idioms_llm_verify.jsonl"))
    write_xlsx(rows, os.path.join(data_dir, "idioms_parallel.xlsx"))
    log.info("Wrote 3 artefacts to %s", data_dir)


if __name__ == "__main__":
    main()
