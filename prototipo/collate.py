#!/usr/bin/env python3
"""
Whole-novel density stats for the V27/Q40 collation.

Collates the two aligned transcriptions across all 38 chapters + intro, twice
(raw and normalised), and reports the op breakdown and size distribution. This
is the empirical check on the spec's §2 figures: it confirms ~1 variant every
7.2 words, and — the headline finding — that normalisation moves the locus count
by only ~0.2%, because the two plain-text transcriptions already share a
character repertoire (the 37% transcription-noise problem in §3.3 is a property
of the TEI files, not of these sources).

Unlike build_loci.py this does NOT classify or emit per-locus data; it only
counts. Run it to reproduce the numbers quoted in the review and the README.

Usage:
    python3 prototipo/collate.py        # run from the repo root

Standard library only.
"""

import os
import re
import unicodedata
import difflib
import collections

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(REPO, "01 - I promessi sposi")
F27 = [os.path.join(SRC, "01 - Tomo 1", "1.txt"),
       os.path.join(SRC, "02 - Tomo 2", "3.txt"),
       os.path.join(SRC, "03 - Tomo 3", "5.txt")]
F40 = [os.path.join(SRC, "01 - Tomo 1", "2.txt"),
       os.path.join(SRC, "02 - Tomo 2", "4.txt"),
       os.path.join(SRC, "03 - Tomo 3", "6.txt")]


def load(files):
    """{chapter: {paragraph: text}} from the [cNNN-pNNN] markers."""
    text = "".join(open(f, encoding="utf8").read() for f in files)
    text = re.sub(r"^(##|###|TOMO).*$", "", text, flags=re.M)
    out = collections.OrderedDict()
    parts = re.split(r"\[(c\d+)-(p\d+)\]", text)
    for chap, para, body in zip(parts[1::3], parts[2::3], parts[3::3]):
        out.setdefault(chap, collections.OrderedDict())["p%03d" % int(para[1:])] = \
            " ".join(body.split())
    return out


A, B = load(F27), load(F40)

FOLD = str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"',
                      "―": "—", "‐": "-"})


def norm(s):
    s = unicodedata.normalize("NFC", s).translate(FOLD).lower()
    for a, b in [("è", "e"), ("é", "e"), ("à", "a"), ("ì", "i"),
                 ("í", "i"), ("ò", "o"), ("ó", "o"), ("ù", "u")]:
        s = s.replace(a, b)
    return s


def trim_anchors(a, b):
    i = 0
    while i < len(a) and i < len(b) and norm(a[i]) == norm(b[i]):
        i += 1
    j = 0
    while j < len(a) - i and j < len(b) - i and norm(a[-1 - j]) == norm(b[-1 - j]):
        j += 1
    return i, j


def collate(ta, tb, normalise):
    key = (lambda x: [norm(w) for w in x]) if normalise else (lambda x: x)
    sm = difflib.SequenceMatcher(None, key(ta), key(tb), autojunk=False)
    out = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            continue
        a, b = ta[i1:i2], tb[j1:j2]
        if op == "replace":
            pre, suf = trim_anchors(a, b)
            if pre or suf:
                a, b = a[pre:len(a) - suf], b[pre:len(b) - suf]
                if not a:
                    op = "insert"
                elif not b:
                    op = "delete"
        out.append({"op": {"replace": "sub", "insert": "add",
                           "delete": "del"}[op],
                    "size": max(len(a), len(b))})
    return out


def run(normalise):
    sizes = collections.Counter()
    ops = collections.Counter()
    for c in A:
        if c not in B:
            continue
        keys = sorted(set(A[c]) | set(B[c]))
        for p in keys:
            for x in collate(A[c].get(p, "").split(),
                             B[c].get(p, "").split(), normalise):
                sizes[x["size"]] += 1
                ops[x["op"]] += 1
    return sizes, ops


def bucket(n):
    return ("1" if n == 1 else "2" if n == 2 else "3-4" if n < 5
            else "5-9" if n < 10 else "10-19" if n < 20
            else "20-49" if n < 50 else "50+")


def report():
    words = sum(len(v.split()) for c in B for v in B[c].values())
    for label, nm in (("RAW", False), ("NORMALISED", True)):
        sizes, ops = run(nm)
        total = sum(ops.values())
        allsz = sorted(s for s, n in sizes.items() for _ in range(n))
        med = allsz[len(allsz) // 2]
        p90 = allsz[int(len(allsz) * 0.9)]
        p99 = allsz[int(len(allsz) * 0.99)]
        bk = collections.Counter()
        for s, n in sizes.items():
            bk[bucket(s)] += n
        print("=== %s: %d loci over %d Q40 words  -> 1 per %.1f words"
              % (label, total, words, words / total))
        print("   ops:", dict(ops),
              " | median %d  p90 %d  p99 %d" % (med, p90, p99))
        print("   size:", {k: bk[k] for k in
                           ["1", "2", "3-4", "5-9", "10-19", "20-49", "50+"]
                           if bk[k]})


if __name__ == "__main__":
    report()
