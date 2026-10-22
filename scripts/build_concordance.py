#!/usr/bin/env python3
"""
Build the concordance index for LeggoManzoni.

Parses all TEI XML chapter files, normalises tokens, lemmatises with Stanza,
resolves idioms from the Excel file, and writes data/concordance.json.

Usage:
    scripts/venv/bin/python scripts/build_concordance.py
"""

import gzip
import json
import os
import logging
import re
from collections import defaultdict
from datetime import datetime, timezone

from lxml import etree
import openpyxl
import stanza

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XML_DIR = os.path.join(BASE_DIR, "quarantana")
EXCEL_PATH = os.path.join(BASE_DIR, "Locuzioni Leggo Manzoni.xlsx")
OUTPUT_PATH = os.path.join(BASE_DIR, "data", "concordance.json")
UNRESOLVED_PATH = os.path.join(BASE_DIR, "scripts", "unresolved_idioms.txt")
STANZA_MODEL_DIR = os.path.join(BASE_DIR, "scripts", "stanza_resources")
# Reviewed Stanza errors: form, the wrong lemma Stanza gives it, the right lemma
LEMMA_FIXES_PATH = os.path.join(BASE_DIR, "scripts", "lemma_fixes.tsv")

CHAPTER_ORDER = ["intro"] + [f"cap{i}" for i in range(1, 39)]
CONTEXT_WINDOW = 5
STANZA_CHUNK_SIZE = 200
PHRASE_MATCH_THRESHOLD = 0.7

# Seicento register boundary — removed, no longer flagging tokens

# Character names that collide with common words.
# Surface forms starting with uppercase get their own lemma (the name itself),
# overriding whatever Stanza assigned.
CHARACTER_NAMES = {
    "perpetua",  # Perpetua (person) vs perpetuo (adjective)
}

# Manual lemma corrections for forms Stanza consistently gets wrong
# (especially archaic/seicento spellings)
LEMMA_OVERRIDES = {
    "hauendo": "avere",    # archaic "avendo" (gerund of avere)
    "pag": "pagina",       # abbreviation "pag." (the lemmatiser sees it without its full stop)
    "etc": "eccetera",     # abbreviation "etc."
}

# Articulated and apocopated prepositions take the simple preposition as lemma.
# Stanza's word splitting garbles them on pretokenised input («col» → cossemél,
# «alla» → allo, «dal» → dare, «ai» → avere). Keyed on the lower-cased word with
# its apostrophe. «collo» is left out: in the novel it is always the noun.
PREPOSITION_LEMMAS = {
    form: prep
    for prep, forms in {
        "di": "del dello della dei degli delle de' dell' degl'",
        "a": "al allo alla ai agli alle a' all' agl'",
        "da": "dal dallo dalla dai dagli dalle da' dall' dagl'",
        "in": "nel nello nella nei negli nelle ne' nell' negl'",
        "con": "col coi co'",
        "su": "sul sullo sulla sui sugli sulle su' sull' sugl'",
        "per": "pel pei pe'",
    }.items()
    for form in forms.split()
}

# Roman numeral to integer mapping for Excel chapter column
ROMAN_TO_INT = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7,
    "VIII": 8, "IX": 9, "X": 10, "XI": 11, "XII": 12, "XIII": 13,
    "XIV": 14, "XV": 15, "XVI": 16, "XVII": 17, "XVIII": 18, "XIX": 19,
    "XX": 20, "XXI": 21, "XXII": 22, "XXIII": 23, "XXIV": 24, "XXV": 25,
    "XXVI": 26, "XXVII": 27, "XXVIII": 28, "XXIX": 29, "XXX": 30,
    "XXXI": 31, "XXXII": 32, "XXXIII": 33, "XXXIV": 34, "XXXV": 35,
    "XXXVI": 36, "XXXVII": 37, "XXXVIII": 38,
}

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Normalisation
# ---------------------------------------------------------------------------

def normalise(surface: str):
    """Normalise a surface form to a lookup key.
    Returns None for punctuation-only tokens."""
    s = surface.lower()
    s = s.strip("\u00ab\u00bb\u2014\u2013\u2019\u2018\"',.;:!?()[]{}*")
    # unify apostrophe variants
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    if "'" in s:
        parts = s.split("'")
        right = parts[-1].strip()
        left = parts[0].strip()
        candidate = right if len(right) >= 2 else left
        return candidate if len(candidate) >= 1 else None
    return s if len(s) >= 1 else None


EDGE_PUNCT = "«»—–\"“”,.;:!?()[]{}*…"


def split_punct(surface: str):
    """Split a token into leading marks, the word, and trailing marks, for the
    lemmatiser. Apostrophes stay with the word (po', de', dell'). Each mark is its
    own item; a run of dots is one item. Returns (lead, core, trail)."""
    def marks(s):
        out = []
        for m in re.finditer(r"\.{2,}|.", s):
            out.append(m.group())
        return out
    i, j = 0, len(surface)
    while i < j and surface[i] in EDGE_PUNCT:
        i += 1
    while j > i and surface[j - 1] in EDGE_PUNCT:
        j -= 1
    return marks(surface[:i]), surface[i:j], marks(surface[j:])


def split_elision(core: str):
    """Split an elided word («c'era», «dell'uomo», «tutt'a») into the parts given to
    the lemmatiser, and return (parts, k): k is the part whose lemma the token takes,
    the same part normalise() files the token under (the right one unless it is a
    single letter)."""
    m = re.match(r"^(.*\w['’])(\w.*)$", core)
    if not m:
        return [core], 0
    left, right = m.group(1), m.group(2)
    if len(right.strip("'’")) >= 2:
        return [left, right], 1
    first = re.match(r"^(\w+['’])(.*)$", core)
    return [first.group(1), first.group(2)], 0


# ---------------------------------------------------------------------------
# Step 1: Parse XML and build token sequences
# ---------------------------------------------------------------------------

def parse_chapter(xml_path, chapter_name):
    """Parse a TEI XML chapter file and return a list of token dicts."""
    tree = etree.parse(xml_path)
    root = tree.getroot()

    tokens = []
    current_comma = 0

    # Walk all elements in document order
    for elem in root.iter():
        tag = etree.QName(elem.tag).localname if isinstance(elem.tag, str) else elem.tag

        if tag == "milestone":
            unit = elem.get("unit", "")
            if unit == "comma":
                # Handle both n="3" and xml:id="c1" patterns
                n_val = elem.get("n")
                if n_val is not None:
                    try:
                        current_comma = int(n_val)
                    except ValueError:
                        current_comma += 1
                else:
                    # xml:id pattern — just increment
                    current_comma += 1

        elif tag == "w":
            xml_id = elem.get("{http://www.w3.org/XML/1998/namespace}id", "")
            # itertext() gets full text content including children
            # (e.g. <w> nested inside <persName>)
            surface = "".join(elem.itertext()).strip()
            if not surface:
                continue

            tokens.append({
                "id": xml_id,
                "surface": surface,
                "pos": len(tokens),
                "comma": current_comma,
            })

    log.info(f"  {chapter_name}: {len(tokens)} tokens, {current_comma} commas")
    return tokens


def load_all_chapters():
    """Load all chapter XML files in order."""
    all_tokens = {}
    for ch in CHAPTER_ORDER:
        xml_file = os.path.join(XML_DIR, f"{ch}.xml")
        if not os.path.exists(xml_file):
            log.warning(f"  Missing file: {xml_file}")
            continue
        all_tokens[ch] = parse_chapter(xml_file, ch)
    return all_tokens


# ---------------------------------------------------------------------------
# Step 2: Lemmatisation with Stanza
# ---------------------------------------------------------------------------

def load_lemma_fixes():
    """(form, wrong Stanza lemma) -> right lemma, from LEMMA_FIXES_PATH. A fix applies
    only where Stanza gives exactly that wrong lemma, so its right readings stay."""
    fixes = {}
    with open(LEMMA_FIXES_PATH, encoding="utf-8") as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            form, wrong, right = line.rstrip("\n").split("\t")[:3]
            fixes[(form, wrong)] = right
    return fixes


def lemmatise_tokens(all_tokens):
    """Run Stanza lemmatiser on all tokens and add lemma field."""
    lemma_fixes = load_lemma_fixes()
    log.info("Loading Stanza Italian model...")
    nlp = stanza.Pipeline(
        lang="it",
        processors="tokenize,mwt,pos,lemma",
        tokenize_pretokenized=True,
        model_dir=STANZA_MODEL_DIR,
        logging_level="WARN",
    )

    for ch in CHAPTER_ORDER:
        if ch not in all_tokens:
            continue
        tokens = all_tokens[ch]
        if not tokens:
            continue

        surfaces = [t["surface"] for t in tokens]

        # Each TEI token carries its punctuation («parole,», «disse:»). Stanza gets the
        # punctuation as separate tokens and the lemma is read from the word itself;
        # otherwise «parole,» is unknown to it and comes back as its own lemma.
        # Elided words are split the same way («c'era» → c' + era, lemma of «era»).
        all_lemmas = []
        for i in range(0, len(surfaces), STANZA_CHUNK_SIZE):
            chunk, core_at = [], []
            for s in surfaces[i:i + STANZA_CHUNK_SIZE]:
                lead, core, trail = split_punct(s)
                chunk += lead
                if core:
                    parts, k = split_elision(core)
                    core_at.append(len(chunk) + k)
                    chunk += [p for p in parts if p]
                else:
                    core_at.append(None)
                chunk += trail
            doc = nlp([chunk])
            stanza_tokens = [t for sent in doc.sentences for t in sent.tokens]
            for s, k in zip(surfaces[i:i + STANZA_CHUNK_SIZE], core_at):
                if k is None:
                    all_lemmas.append(s)
                else:
                    word = stanza_tokens[k].words[0]
                    all_lemmas.append(word.lemma if word.lemma else word.text)

        if len(all_lemmas) != len(tokens):
            log.warning(
                f"  {ch}: lemma count mismatch ({len(all_lemmas)} vs {len(tokens)}), "
                "falling back to surface forms for missing"
            )

        for idx, token in enumerate(tokens):
            if idx < len(all_lemmas):
                token["lemma"] = all_lemmas[idx].lower()
            else:
                norm = normalise(token["surface"])
                token["lemma"] = norm if norm else token["surface"].lower()

            # Apply manual lemma overrides for known Stanza errors
            surface = token["surface"]
            norm_surface = normalise(surface)
            token["lemma"] = lemma_fixes.get((norm_surface, token["lemma"]), token["lemma"])
            if norm_surface and norm_surface in LEMMA_OVERRIDES:
                token["lemma"] = LEMMA_OVERRIDES[norm_surface]
            word = split_punct(surface)[1].lower().replace("’", "'")
            if word in PREPOSITION_LEMMAS:
                token["lemma"] = PREPOSITION_LEMMAS[word]

            # Fix character names: if surface is capitalised and normalised
            # form matches a known character name, override the lemma
            if norm_surface and norm_surface in CHARACTER_NAMES:
                # Check first alphabetic character for uppercase
                first_alpha = next((c for c in surface if c.isalpha()), "")
                if first_alpha.isupper():
                    token["lemma"] = norm_surface

        log.info(f"  {ch}: lemmatised {len(tokens)} tokens")


# ---------------------------------------------------------------------------
# Step 3: Build the concordance index
# ---------------------------------------------------------------------------


def build_word_index(all_tokens):
    """Build the word index with KWIC context windows."""
    word_index = defaultdict(list)
    lemma_map = defaultdict(set)  # lemma -> set of normalised surface keys
    form_lemma_votes = {}  # norm_surface -> {lemma: count} for majority-vote
    total_tokens = 0
    unique_forms = set()

    for ch in CHAPTER_ORDER:
        if ch not in all_tokens:
            continue
        tokens = all_tokens[ch]
        total_tokens += len(tokens)

        for i, token in enumerate(tokens):
            norm = normalise(token["surface"])
            if norm is None:
                continue

            unique_forms.add(norm)

            # Context windows
            left = [tokens[j]["surface"] for j in range(max(0, i - CONTEXT_WINDOW), i)]
            right = [tokens[j]["surface"] for j in range(i + 1, min(len(tokens), i + CONTEXT_WINDOW + 1))]

            entry = {
                "id": token["id"],
                "chapter": ch,
                "surface": token["surface"],
                "lemma": token.get("lemma", norm),
                "left": left,
                "right": right,
                "comma": token["comma"],
            }

            word_index[norm].append(entry)

            # Count lemma assignments per surface form for majority-vote
            raw_lemma = token.get("lemma", norm)
            if raw_lemma:
                clean_lemma = normalise(raw_lemma)
                if clean_lemma:
                    if norm not in form_lemma_votes:
                        form_lemma_votes[norm] = defaultdict(int)
                    form_lemma_votes[norm][clean_lemma] += 1

    # Build lemma index using majority-vote: each surface form belongs
    # only to the lemma most frequently assigned to it by Stanza
    for norm, votes in form_lemma_votes.items():
        best_lemma = max(votes, key=votes.get)
        lemma_map[best_lemma].add(norm)

    # Convert sets to sorted lists
    lemma_index = {k: sorted(v) for k, v in lemma_map.items() if len(v) >= 1}

    log.info(f"Total tokens: {total_tokens}")
    log.info(f"Unique normalised forms: {len(unique_forms)}")
    log.info(f"Unique lemmas: {len(lemma_index)}")

    return word_index, lemma_index, total_tokens, len(unique_forms)


# ---------------------------------------------------------------------------
# Step 4: Idiom resolution
# ---------------------------------------------------------------------------

def parse_idioms_excel():
    """Parse the idiom list from the Excel file.
    Returns list of dicts with Quarantana-specific fields."""
    if not os.path.exists(EXCEL_PATH):
        log.warning(f"Idiom file not found: {EXCEL_PATH}")
        return []

    wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True)
    ws = wb.active
    idioms = []

    for row_idx, row in enumerate(ws.iter_rows(min_row=3, values_only=True), start=3):
        # Row structure: 0=ID, ..., 16=Q text, 17=Q chapter, 18=Q comma, 19=Q personaggio, 20=tipologia, 21=parola-chiave
        if row[0] is None:
            continue

        idiom_id = row[0]
        q_text = row[16] if len(row) > 16 else None
        q_chapter = row[17] if len(row) > 17 else None
        q_comma = row[18] if len(row) > 18 else None
        q_personaggio = row[19] if len(row) > 19 else None
        tipologia = row[20] if len(row) > 20 else None
        parola_chiave = row[21] if len(row) > 21 else None

        if not q_text or not q_chapter or q_text.strip() == "" or str(q_text).strip() == " ":
            continue

        # Normalise chapter name
        ch_raw = str(q_chapter).strip()
        if ch_raw.lower() in ("intr.", "intr", "intro", "introduzione"):
            chapter = "intro"
        elif ch_raw.upper() in ROMAN_TO_INT:
            chapter = f"cap{ROMAN_TO_INT[ch_raw.upper()]}"
        else:
            try:
                chapter = f"cap{int(ch_raw)}"
            except ValueError:
                chapter = ch_raw

        try:
            comma = int(q_comma) if q_comma is not None else None
        except (ValueError, TypeError):
            comma = None

        idioms.append({
            "id": int(idiom_id) if isinstance(idiom_id, (int, float)) else idiom_id,
            "label": str(q_text).strip(),
            "chapter": chapter,
            "comma": comma,
            "personaggio": str(q_personaggio).strip() if q_personaggio else None,
            "tipologia": str(tipologia).strip() if tipologia else None,
            "parola_chiave": str(parola_chiave).strip() if parola_chiave else None,
        })

    wb.close()
    log.info(f"Parsed {len(idioms)} idioms from Excel")
    return idioms


def build_comma_ranges(tokens):
    """Build a mapping from comma number to (start_pos, end_pos) in the token array."""
    comma_ranges = {}
    current_comma = None
    start_pos = 0

    for i, token in enumerate(tokens):
        if token["comma"] != current_comma:
            if current_comma is not None:
                comma_ranges[current_comma] = (start_pos, i - 1)
            current_comma = token["comma"]
            start_pos = i

    # Last range
    if current_comma is not None and tokens:
        comma_ranges[current_comma] = (start_pos, len(tokens) - 1)

    return comma_ranges


def find_phrase(tokens_in_window, phrase_words, threshold=PHRASE_MATCH_THRESHOLD):
    """Sliding window phrase match. Returns (start_id, end_id) or (None, None)."""
    n = len(phrase_words)
    if n == 0 or len(tokens_in_window) < n:
        return None, None

    for i in range(len(tokens_in_window) - n + 1):
        window = tokens_in_window[i:i + n]
        matches = sum(
            1 for a, b in zip(window, phrase_words)
            if normalise(a["surface"]) == normalise(b)
        )
        if matches / n >= threshold:
            return window[0]["id"], window[-1]["id"]

    return None, None


def resolve_idioms(all_tokens, idiom_list):
    """Resolve idioms to their exact token positions in the text."""
    idiom_index = {}
    unresolved = []

    # Pre-build comma ranges and ID-to-position maps per chapter
    comma_ranges_cache = {}
    id_to_pos = {}
    for ch in CHAPTER_ORDER:
        if ch in all_tokens:
            comma_ranges_cache[ch] = build_comma_ranges(all_tokens[ch])
            id_to_pos[ch] = {t["id"]: i for i, t in enumerate(all_tokens[ch])}

    for idiom in idiom_list:
        ch = idiom["chapter"]
        if ch not in all_tokens:
            unresolved.append(f"ID {idiom['id']}: chapter '{ch}' not found")
            continue

        tokens = all_tokens[ch]
        comma_ranges = comma_ranges_cache[ch]
        comma = idiom["comma"]

        # Tokenise the phrase
        phrase_words = idiom["label"].split()

        start_id, end_id = None, None

        # First try: search in comma window (with expansion)
        if comma is not None and comma in comma_ranges:
            start, end = comma_ranges[comma]
            search_start = max(0, start - 20)
            search_end = min(len(tokens) - 1, end + 20)
            search_tokens = tokens[search_start:search_end + 1]
            start_id, end_id = find_phrase(search_tokens, phrase_words)

        # Fallback: search entire chapter
        if start_id is None:
            start_id, end_id = find_phrase(tokens, phrase_words)

        if start_id is None:
            unresolved.append(
                f"ID {idiom['id']}: '{idiom['label']}' in {ch} comma {comma} — not found"
            )
            continue

        # Find position indices for context
        start_idx = id_to_pos[ch].get(start_id)
        end_idx = id_to_pos[ch].get(end_id)

        if start_idx is None or end_idx is None:
            unresolved.append(
                f"ID {idiom['id']}: '{idiom['label']}' — IDs found but position lookup failed"
            )
            continue

        # Build context
        left = [tokens[j]["surface"] for j in range(max(0, start_idx - CONTEXT_WINDOW), start_idx)]
        span_surface = [tokens[j]["surface"] for j in range(start_idx, end_idx + 1)]
        right = [tokens[j]["surface"] for j in range(end_idx + 1, min(len(tokens), end_idx + CONTEXT_WINDOW + 1))]

        occurrence = {
            "start_id": start_id,
            "end_id": end_id,
            "chapter": ch,
            "comma": idiom["comma"],
            "left": left,
            "span_surface": span_surface,
            "right": right,
        }

        idiom_key = str(idiom["id"])
        if idiom_key not in idiom_index:
            idiom_index[idiom_key] = {
                "label": idiom["label"],
                "tipologia": idiom["tipologia"],
                "parola_chiave": idiom["parola_chiave"],
                "occurrences": [],
            }
        idiom_index[idiom_key]["occurrences"].append(occurrence)

    # Write unresolved idioms
    with open(UNRESOLVED_PATH, "w", encoding="utf-8") as f:
        f.write(f"Unresolved idioms — {datetime.now().isoformat()}\n")
        f.write(f"Total: {len(unresolved)} / {len(idiom_list)}\n\n")
        for line in unresolved:
            f.write(line + "\n")

    log.info(f"Resolved {len(idiom_index)} idioms, {len(unresolved)} unresolved")
    return idiom_index


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    log.info("=" * 60)
    log.info("Building concordance index for LeggoManzoni")
    log.info("=" * 60)

    # Step 1: Parse all chapters
    log.info("Step 1: Parsing TEI XML files...")
    all_tokens = load_all_chapters()

    # Step 2: Lemmatise
    log.info("Step 2: Lemmatising tokens with Stanza...")
    lemmatise_tokens(all_tokens)

    # Step 3: Build word index
    log.info("Step 3: Building word index with KWIC contexts...")
    word_index, lemma_index, total_tokens, unique_forms = build_word_index(all_tokens)

    # Step 4: Resolve idioms
    log.info("Step 4: Parsing and resolving idioms...")
    idiom_list = parse_idioms_excel()
    idiom_index = resolve_idioms(all_tokens, idiom_list)

    # Step 5: Write output
    log.info("Step 5: Writing concordance.json...")
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    output = {
        "meta": {
            "built": datetime.now(timezone.utc).isoformat(),
            "chapters": [ch for ch in CHAPTER_ORDER if ch in all_tokens],
            "total_tokens": total_tokens,
            "unique_forms": unique_forms,
            "unique_lemmas": len(lemma_index),
        },
        "words": dict(word_index),
        "lemmas": lemma_index,
        "idioms": idiom_index,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False)

    file_size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    log.info(f"Output: {OUTPUT_PATH} ({file_size_mb:.1f} MB)")

    # Pre-compress for serving
    gz_path = OUTPUT_PATH + ".gz"
    import shutil
    with open(OUTPUT_PATH, "rb") as f_in:
        with gzip.open(gz_path, "wb", compresslevel=9) as f_out:
            shutil.copyfileobj(f_in, f_out)

    gz_size_mb = os.path.getsize(gz_path) / (1024 * 1024)
    log.info(f"Gzipped: {gz_path} ({gz_size_mb:.1f} MB)")
    log.info("Done!")


if __name__ == "__main__":
    main()
