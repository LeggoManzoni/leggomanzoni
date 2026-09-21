#!/usr/bin/env python3
"""
Build the classified variant loci for the collation prototype.

Reads the two aligned working transcriptions (Ventisettana 1827 / Quarantana
1840) from "01 - I promessi sposi/", collates them paragraph by paragraph on the
hand-made `[cNNN-pNNN]` cross-edition alignment, classifies each locus by rule,
and writes prototipo/loci.json — the data the viewer (collazione.html) embeds.

This is a THROWAWAY prototype pipeline built to let the team compare three
rendering modes at real variant density. It is NOT the production apparatus:
- it collates the plain-text sources, not the TEI, and does not map loci back
  onto the <w> xml:ids yet;
- the class rules are a coarse whitelist, deliberately leaving an `incerto`
  bucket rather than guessing;
- only four chapters are built (I, X, XX, XXVIII), the agreed test corpus.
See ../collazione-v27-q40-spec-prototipo.md for the full design and §6 for the
intended production data contract.

Direction is always chronological V27 -> Q40. `a` = 1827 reading, `b` = 1840.
`op`/`t`: sub = both present and different, add = 1840-only, del = 1827-only.

Usage:
    python3 prototipo/build_loci.py        # run from the repo root

No third-party dependencies; standard library only.
"""

import os
import re
import json
import unicodedata
import difflib
import collections

# ---------------------------------------------------------------------------
# Sources — the two aligned transcriptions, three tomi each.
# Odd files = Ventisettana 1827, even files = Quarantana 1840.
# ---------------------------------------------------------------------------
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(REPO, "01 - I promessi sposi")
F27 = [os.path.join(SRC, "01 - Tomo 1", "1.txt"),
       os.path.join(SRC, "02 - Tomo 2", "3.txt"),
       os.path.join(SRC, "03 - Tomo 3", "5.txt")]
F40 = [os.path.join(SRC, "01 - Tomo 1", "2.txt"),
       os.path.join(SRC, "02 - Tomo 2", "4.txt"),
       os.path.join(SRC, "03 - Tomo 3", "6.txt")]
OUT = os.path.join(REPO, "prototipo", "loci.json")

# The agreed test corpus (chapter key -> Roman numeral shown in the viewer).
CHAPTERS = {"c001": "I", "c010": "X", "c020": "XX", "c028": "XXVIII"}


def load(files):
    """Parse the [cNNN-pNNN] markers into {chapter: {paragraph: text}}.

    The p-number is an editorial cross-edition alignment, not a per-file
    counter: where 1840 adds a paragraph, 1827 simply lacks that key. One
    chapter (c022) is zero-padded inconsistently in the 1840 file (p10 vs
    p010); int() normalises it.
    """
    text = "".join(open(f, encoding="utf8").read() for f in files)
    text = re.sub(r"^(##|###|TOMO).*$", "", text, flags=re.M)
    out = collections.OrderedDict()
    parts = re.split(r"\[(c\d+)-(p\d+)\]", text)
    for chap, para, body in zip(parts[1::3], parts[2::3], parts[3::3]):
        key = "p%03d" % int(para[1:])
        out.setdefault(chap, {})[key] = " ".join(body.split())
    return out


A = load(F27)
B = load(F40)

# Every punctuation code point, used to isolate the "word core" from attached
# punctuation so that a comma insertion classifies as `punteggiatura`.
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


def build():
    out = {}
    for chap, roman in CHAPTERS.items():
        paras = []
        n = 0
        keys = sorted(set(A.get(chap, {})) | set(B.get(chap, {})))
        for p in keys:
            ta = A.get(chap, {}).get(p, "").split()
            tb = B.get(chap, {}).get(p, "").split()
            obj = []
            for s in segments(ta, tb):
                if s["t"] == "same":
                    obj.append({"t": "s", "w": " ".join(s["a"] or s["b"])})
                    continue
                n += 1
                size = max(len(s["a"]), len(s["b"]))
                cls = classify(s["t"], s["a"], s["b"])
                e = {"t": s["t"], "id": "%s-l%04d" % (chap, n),
                     "a": " ".join(s["a"]), "b": " ".join(s["b"]),
                     "cls": cls, "sal": salience(cls, size), "size": size}
                if s["t"] == "sub" and len(s["a"]) == 1 and len(s["b"]) == 1:
                    e["cd"] = chardiff(s["a"][0], s["b"][0])
                obj.append(e)
            only = None if (p in A.get(chap, {}) and p in B.get(chap, {})) \
                else ("b" if p in B.get(chap, {}) else "a")
            paras.append({"p": p, "seg": obj, "only": only})
        out[chap] = {"roman": roman, "paras": paras, "n": n}
        st = collections.Counter()
        sal = collections.Counter()
        for pa in paras:
            for s in pa["seg"]:
                if s.get("cls"):
                    st[s["cls"]] += 1
                    sal[s["sal"]] += 1
        print("%s (%s): %d loci | classes %s | salience %s"
              % (chap, roman, out[chap]["n"], dict(st), dict(sal)))
    json.dump(out, open(OUT, "w"), ensure_ascii=True, separators=(",", ":"))
    print("\nwrote %s (%d bytes)" % (OUT, os.path.getsize(OUT)))


if __name__ == "__main__":
    build()
