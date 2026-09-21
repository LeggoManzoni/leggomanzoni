#!/usr/bin/env python3
"""Collation rules for the V27/Q40 apparatus.

Copied VERBATIM from prototipo/build_loci.py (lines 77-244), which is the
version the team reviewed and voted on. Only the module docstring and the
imports differ. Do not "improve" these rules here: several plausible
simplifications were considered and rejected for reasons recorded in
docs/collazione_apparatus_spec.md.

The one rule that matters most: salience 3 means size >= 5, full stop
(docs/collazione_viewer_review.md section 7).
"""

import difflib
import unicodedata


PUNCT = "".join(chr(i) for i in range(0x20, 0x2F00)
                if unicodedata.category(chr(i)).startswith("P"))


def core(word):
    """The word stripped of leading/trailing punctuation."""
    return word.strip(PUNCT)


def fold(s):
    """Normalisation fold: case + accent + curly apostrophe.

    Applied only to decide *equality* (whether two tokens are the same word);
    the readings are always stored verbatim. On these sources normalisation
    changes the locus count by ~0.2% (see collate.py) — the two transcriptions
    already share a character repertoire, unlike the TEI.
    """
    s = unicodedata.normalize("NFC", s).lower()
    for a, b in [("è", "e"), ("é", "e"), ("à", "a"),
                 ("ì", "i"), ("í", "i"), ("ò", "o"),
                 ("ó", "o"), ("ù", "u"), ("’", "'")]:
        s = s.replace(a, b)
    return s


def fonomorf(a, b):
    """True if a 1:1 substitution matches a NAMED phono-morphological rule.

    A whitelist, not an edit-distance threshold: `cangiando`/`cambiando` and
    `guatare`/`guardare` are both distance 2 but are lexical/tonal, not
    orthographic, so they must NOT match here.
    """
    ca, cb = fold(core(a)), fold(core(b))
    if ca == cb:                       # pure case/accent difference
        return True
    for x, y in ((ca, cb), (cb, ca)):
        if x == y + "e" or x + "e" == y:                 # troncamento/apocope
            return True
        if x.endswith("uolo") and y == x.replace("uolo", "olo"):
            return True
        if x.endswith("uola") and y == x.replace("uola", "ola"):
            return True
        if "giuo" in x and y == x.replace("giuo", "gio"):
            return True
        if x.endswith("egli") and y == x[:-4] + "elli":  # capegli/capelli
            return True
        if x.endswith("ii") and y == x[:-1]:             # principii/principi
            return True
        if x == "ad" and y == "a":
            return True
        if x == "fra" and y == "tra":
            return True
        if x.startswith("dimand") and y.startswith("domand"):
            return True
        if x in ("dei", "nei", "quei") and y in ("de'", "ne'", "que'"):
            return True
    return False


def edits_only_in_punct(a, b):
    """True if a and b share a word core but differ (i.e. only punctuation)."""
    return core(a) == core(b) and a != b


def trim(a, b):
    """Longest common token prefix/suffix lengths of two token lists."""
    i = 0
    while i < len(a) and i < len(b) and a[i] == b[i]:
        i += 1
    j = 0
    while j < len(a) - i and j < len(b) - i and a[-1 - j] == b[-1 - j]:
        j += 1
    return i, j


def classify(op, a, b):
    """Coarse rule-based class. Everything the rules cannot name -> incerto."""
    if op == "sub" and len(a) == 1 and len(b) == 1:
        if edits_only_in_punct(a[0], b[0]):
            return "punteggiatura"
        if fonomorf(a[0], b[0]):
            return "fonomorfologia"
        return "lessico"
    if op in ("add", "del"):
        toks = a or b
        if len(toks) == 1 and all(c in PUNCT for c in toks[0]):
            return "punteggiatura"
        return "sintassi" if max(len(a), len(b)) < 5 else "incerto"
    if sorted(fold(x) for x in a) == sorted(fold(x) for x in b):
        return "sintassi"                 # same tokens reordered
    if len(a) != len(b):
        return "sintassi"
    return "incerto"


def salience(cls, size):
    """0-3, by extent. This is the ONLY grandezza the viewer exposes."""
    if cls == "punteggiatura":
        return 0
    if cls == "fonomorfologia" and size == 1:
        return 0
    if size == 1:
        return 1
    if size <= 4:
        return 2
    return 3


def chardiff(a, b):
    """Character-level diff of two single tokens (diff-match-patch convention)."""
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    out = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            out.append([0, a[i1:i2]])
        elif op == "delete":
            out.append([-1, a[i1:i2]])
        elif op == "insert":
            out.append([1, b[j1:j2]])
        else:
            out.append([-1, a[i1:i2]])
            out.append([1, b[j1:j2]])
    return out


def segments(ta, tb):
    """Collate two paragraphs into an ordered list of same/sub/add/del segments.

    Equality is tested on the fold, so case/accent-only differences survive as
    their own (salience-0) loci rather than being silently equated. Substitutions
    are trimmed of shared prefix/suffix so an insertion on a punctuation anchor is
    re-typed as add/del instead of a spurious many-word sub.
    """
    sm = difflib.SequenceMatcher(None, [fold(x) for x in ta],
                                 [fold(x) for x in tb], autojunk=False)
    segs = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        a, b = ta[i1:i2], tb[j1:j2]
        if op == "equal":
            if a != b:                    # fold-equal but not identical
                for x, y in zip(a, b):
                    segs.append({"t": "same" if x == y else "sub",
                                 "a": [x], "b": [y]})
                continue
            segs.append({"t": "same", "a": a, "b": b})
            continue
        if op == "replace":
            p, s = trim(a, b)
            if p:
                segs.append({"t": "same", "a": a[:p], "b": b[:p]})
                a, b = a[p:], b[p:]
            suf = []
            if s:
                suf = [{"t": "same", "a": a[len(a) - s:], "b": b[len(b) - s:]}]
                a, b = a[:len(a) - s], b[:len(b) - s]
            if not a:
                segs.append({"t": "add", "a": [], "b": b})
            elif not b:
                segs.append({"t": "del", "a": a, "b": []})
            else:
                segs.append({"t": "sub", "a": a, "b": b})
            segs += suf
        elif op == "insert":
            segs.append({"t": "add", "a": [], "b": b})
        else:
            segs.append({"t": "del", "a": a, "b": []})
    return [s for s in segs if s["a"] or s["b"]]

