#!/usr/bin/env python3
"""
PROTOTYPE: derive typographic <p> for the Ventisettana from the txt line breaks.

The collation-substrate rebuild uses one <p> per chapter (comma milestones carry
the alignment). This demo shows what real paragraph structure looks like if we
take it from the 1827 txt, where each physical line is a paragraph and the commas
flow inside it. Marker-less lines are dialogue turns — genuine paragraph breaks
that continue the surrounding comma, exactly as a Q40 comma can span several <p>.

Rule (documented, deliberately simple):
  * a new <p> opens at every physical line break in the txt;
  * <milestone unit="comma" n="M"/> is emitted where a [cNNN-pM] marker appears
    (so a paragraph may carry several milestones, or none if it continues a comma).

Writes prototipo/paragraph-demo/<chapter>.xml. Does NOT touch ventisettana/.
Compares the paragraph count against Q40 so the divergence is visible.

Usage: python3 prototipo/paragraph_demo.py [cap1]      # from repo root
"""

import os
import re
import sys
import html

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(REPO, "01 - I promessi sposi")
F27 = [os.path.join(SRC, "01 - Tomo 1", "1.txt"),
       os.path.join(SRC, "02 - Tomo 2", "3.txt"),
       os.path.join(SRC, "03 - Tomo 3", "5.txt")]
OUTDIR = os.path.join(REPO, "prototipo", "paragraph-demo")

ROMAN = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"),
         (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"),
         (5, "V"), (4, "IV"), (1, "I")]


def roman(n):
    out = ""
    for v, s in ROMAN:
        while n >= v:
            out, n = out + s, n - v
    return out


def chapter_lines(ckey):
    """Physical (non-empty) lines of one chapter, in document order."""
    want = "INTRODUZIONE" if ckey == "c000" else "CAPITOLO %s" % roman(int(ckey[1:]))
    text = "".join(open(f, encoding="utf8").read() for f in F27)
    lines = text.split("\n")
    heads = [i for i, l in enumerate(lines) if l.strip().startswith("###")]
    starts = [i for i in heads if lines[i].strip() == "### " + want]
    if not starts:
        raise SystemExit("chapter %s (%s) not found" % (ckey, want))
    s = starts[0]
    nxt = next((h for h in heads if h > s), len(lines))
    return [l.strip() for l in lines[s + 1:nxt] if l.strip()]


def parse_paragraphs(ckey):
    """[[(comma_or_None, [tokens]), ...], ...] — one inner list per <p>."""
    paras = []
    for line in chapter_lines(ckey):
        # split the line into (comma_number|None, text) segments on the markers
        parts = re.split(r"\[c\d+-(p\d+)\]", line)
        segs = []
        lead = parts[0].strip()
        if lead:                          # text before the first marker: continues prev comma
            segs.append((None, lead.split()))
        for pnum, body in zip(parts[1::2], parts[2::2]):
            segs.append((int(pnum[1:]), body.split()))
        if segs:
            paras.append(segs)
    return paras


def esc(s):
    return html.escape(s, quote=False)


def build(ckey):
    n = int(ckey[1:])
    dtype = "introduzione" if n == 0 else "capitolo"
    xmlid = "v27_introduzione" if n == 0 else "v27_capitolo%d" % n
    head = "INTRODUZIONE" if n == 0 else "CAPITOLO %s" % roman(n)
    wpref = "v27_intro" if n == 0 else "v27_c%d" % n

    paras = parse_paragraphs(ckey)
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<div type="%s" n="%d" xml:id="%s">' % (dtype, n, xmlid),
           "   <head>%s</head>" % head]
    seq, wc, milestones = 10001, 0, 0
    for segs in paras:
        out.append("   <p>")
        for comma, toks in segs:
            if comma is not None:
                out.append('      <milestone unit="comma" n="%d"/>' % comma)
                milestones += 1
            for t in toks:
                out.append('      <w xml:id="%s_%d">%s</w>' % (wpref, seq, esc(t)))
                seq += 1
                wc += 1
        out.append("   </p>")
    out += ["</div>", ""]
    return "\n".join(out), len(paras), milestones, wc


def main():
    ckey = "c%03d" % int(re.sub(r"\D", "", sys.argv[1]) or 1) if len(sys.argv) > 1 else "c001"
    os.makedirs(OUTDIR, exist_ok=True)
    xml, nparas, nms, wc = build(ckey)
    ch = "intro" if ckey == "c000" else "cap%d" % int(ckey[1:])
    path = os.path.join(OUTDIR, ch + ".xml")
    open(path, "w", encoding="utf8").write(xml)

    # comparison figures
    def count(pat, f):
        return len(re.findall(pat, open(f, encoding="utf8").read())) if os.path.exists(f) else "-"
    q40p = count(r"<p[ >]", os.path.join(REPO, "quarantana", ch + ".xml"))
    livep = count(r"<p[ >]", os.path.join(REPO, "ventisettana", ch + ".xml"))
    print("Wrote %s" % os.path.relpath(path, REPO))
    print("  paragraphs derived from txt: %d   milestones (commas): %d   words: %d"
          % (nparas, nms, wc))
    print("  vs current canonical V27 <p>: %s   vs Q40 <p>: %s" % (livep, q40p))


if __name__ == "__main__":
    main()
