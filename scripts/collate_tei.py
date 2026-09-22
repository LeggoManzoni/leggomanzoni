#!/usr/bin/env python3
"""Collate the Ventisettana against the Quarantana, from the TEI, keyed on comma.

Replaces the former scripts/loci_shim.py, which read prototipo/loci.json, which held
four chapters collated from the plain-text sources; this reads the TEI
witnesses directly, for all 39 chapters, as the locked decisions require.

Rows are keyed on the shared comma @n, not the paragraph: paragraphing
genuinely differs between the editions, while the comma index is the editorial
cross-edition alignment. A comma present in one witness only yields a row with
that side empty — the viewer renders "[paragrafo assente da questo testimone]".

The rules that decide what counts as a locus live in scripts/collate_rules.py,
copied verbatim from the reviewed prototype. This file is only the loader and
the emitter.

Output: data/loci/capNN.json + index.json, in the project-1 contract.

Usage:  scripts/venv/bin/python scripts/collate_tei.py [--chapter capN]
"""

import json
import os
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import collate_rules as R

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "loci")
XMLID = "{http://www.w3.org/XML/1998/namespace}id"

CHAPTERS = ["intro"] + ["cap%d" % i for i in range(1, 39)]
ROMAN = {"intro": "Introduzione"}
for _i in range(1, 39):
    _n, _out = _i, ""
    for _v, _s in ((10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")):
        while _n >= _v:
            _out += _s
            _n -= _v
    ROMAN["cap%d" % _i] = _out


def commi(path):
    """comma @n -> ([word text], [xml:id]).

    Uses itertext(): BOTH witnesses now carry element children inside <w> —
    the Quarantana has intra-word <lb/>, and the Ventisettana has inline
    <hi rend="italic">. Reading w.text silently drops those words.
    """
    root = ET.parse(path).getroot()
    words, ids, current = {}, {}, 0
    for el in root.iter():
        if el.tag == "milestone" and el.get("unit") == "comma" and el.get("n"):
            current = int(el.get("n"))
            words.setdefault(current, [])
            ids.setdefault(current, [])
        elif el.tag == "w":
            t = "".join(el.itertext()).strip()
            if not t:
                continue
            words.setdefault(current, []).append(t)
            ids.setdefault(current, []).append(el.get(XMLID))
    return words, ids


def collate_row(chapter, comma, va, vids, qb, qids, counter):
    """One comma -> two witness segment lists, plus the loci they introduce."""
    out_v, out_q, loci = [], [], {}

    if not va or not qb:                       # present in one witness only
        if va:
            out_v.append({"t": "s", "w": " ".join(va)})
        if qb:
            out_q.append({"t": "s", "w": " ".join(qb)})
        return out_v, out_q, loci

    ia = ib = 0
    for seg in R.segments(va, qb):
        a, b = seg["a"], seg["b"]
        if seg["t"] == "same":
            out_v.append({"t": "s", "w": " ".join(a)})
            out_q.append({"t": "s", "w": " ".join(b)})
        else:
            counter[0] += 1
            lid = "%s-l%04d" % (chapter, counter[0])
            size = max(len(a), len(b))
            cls = R.classify(seg["t"], a, b)
            entry = {
                # "op" is the collator's own verdict — sub / add / del. The
                # viewer used to re-derive it from which reading was empty,
                # which duplicated the logic in segments().
                "op": seg["t"],
                "sal": R.salience(cls, size),
                "size": size,
                "cls": cls,
                "cd": R.chardiff(a[0], b[0]) if (
                    seg["t"] == "sub" and len(a) == 1 and len(b) == 1) else None,
                "rdg": {"V27": " ".join(a), "Q40": " ".join(b)},
                "anchor": {
                    "V27": [vids[ia], vids[ia + len(a) - 1]] if a else [],
                    "Q40": [qids[ib], qids[ib + len(b) - 1]] if b else [],
                },
            }
            loci[lid] = entry
            out_v.append({"t": seg["t"], "id": lid, "w": " ".join(a)})
            out_q.append({"t": seg["t"], "id": lid, "w": " ".join(b)})
        ia += len(a)
        ib += len(b)

    return out_v, out_q, loci


def collate_chapter(chapter):
    vw, vids = commi(os.path.join(ROOT, "ventisettana", chapter + ".xml"))
    qw, qids = commi(os.path.join(ROOT, "quarantana", chapter + ".xml"))

    vmax = max(vw) if vw else 0
    qmax = max(qw) if qw else 0
    aligned = vmax == qmax

    rows, loci, counter = [], {}, [0]

    if not aligned:
        # Segmentation genuinely differs (only the introduction). Collating
        # comma-by-comma would pair unrelated passages, so degrade to one row.
        va = [w for n in sorted(vw) for w in vw[n]]
        qb = [w for n in sorted(qw) for w in qw[n]]
        vi = [i for n in sorted(vids) for i in vids[n]]
        qi = [i for n in sorted(qids) for i in qids[n]]
        v, q, lo = collate_row(chapter, 0, va, vi, qb, qi, counter)
        rows.append({"comma": 0, "V27": v, "Q40": q})
        loci.update(lo)
    else:
        for n in sorted(set(vw) | set(qw)):
            v, q, lo = collate_row(chapter, n, vw.get(n, []), vids.get(n, []),
                                   qw.get(n, []), qids.get(n, []), counter)
            rows.append({"comma": n, "V27": v, "Q40": q})
            loci.update(lo)

    return {"chapter": chapter, "roman": ROMAN[chapter], "aligned": aligned,
            "rows": rows, "loci": loci}


def main():
    only = None
    if "--chapter" in sys.argv:
        only = sys.argv[sys.argv.index("--chapter") + 1]

    os.makedirs(OUT, exist_ok=True)
    entries, totals = [], {"loci": 0, "sal3": 0}

    for chapter in CHAPTERS:
        if only and chapter != only:
            continue
        obj = collate_chapter(chapter)
        with open(os.path.join(OUT, chapter + ".json"), "w", encoding="utf-8") as fh:
            json.dump(obj, fh, ensure_ascii=False, separators=(",", ":"))

        n = len(obj["loci"])
        s3 = sum(1 for v in obj["loci"].values() if v["sal"] == 3)
        totals["loci"] += n
        totals["sal3"] += s3
        entries.append({"chapter": chapter, "roman": obj["roman"],
                        "n": n, "aligned": obj["aligned"]})
        print("%-7s %-13s %4d rows %6d loci  %4d riscritture%s"
              % (chapter, obj["roman"], len(obj["rows"]), n, s3,
                 "" if obj["aligned"] else "   (one row: segmentation differs)"))

    if not only:
        with open(os.path.join(OUT, "index.json"), "w", encoding="utf-8") as fh:
            json.dump({"chapters": entries, "source": "TEI (scripts/collate_tei.py)"},
                      fh, ensure_ascii=False, indent=1)
        print("\n%d chapters, %d loci, %d riscritture"
              % (len(entries), totals["loci"], totals["sal3"]))


if __name__ == "__main__":
    main()
