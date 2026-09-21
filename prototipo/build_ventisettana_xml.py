#!/usr/bin/env python3
"""
Rebuild the Ventisettana (1827) as collation-substrate XML from the txt sources.

See DESIGN-ventisettana-rebuild.md for the full design. In brief: the existing
`ventisettana/` XML cannot support the V27/Q40 collation (no aligned structure,
merged cap31/32, empty cap33, ids colliding with Q40). This regenerates it from
the aligned txt transcriptions as one `<div type="capitolo">` fragment per
chapter, matching the Quarantana shape, with typographic <p> reconstructed from
the txt line breaks (each physical line = one paragraph; a comma may span
several, and a paragraph may carry several commas or none):

    <div type="capitolo" n="1" xml:id="v27_capitolo1">
      <head>CAPITOLO I</head>
      <p>
        <milestone unit="comma" n="1"/>
        <w xml:id="v27_c1_10001">Quel</w> ...
      </p>
      <p>
        <milestone unit="comma" n="8"/>
        <w xml:id="v27_c1_10684">Per</w> ...
      </p>
    </div>

Ground truth is the txt. Where the txt disagrees with the *existing* V27 XML on a
word form, the disagreement is written to TRANSCRIPTION-QA.md for an editor — not
silently resolved. Where the txt comma structure disagrees with the Q40 XML
milestone count, that is written to MILESTONE-RECONCILE.md.

Outputs to `ventisettana_rebuilt/`; `ventisettana/` is left untouched.

Usage:
    python3 prototipo/build_ventisettana_xml.py     # from the repo root

Standard library only.
"""

import os
import re
import html
import glob
import difflib
import collections
from xml.dom import minidom

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(REPO, "01 - I promessi sposi")
F27 = [os.path.join(SRC, "01 - Tomo 1", "1.txt"),
       os.path.join(SRC, "02 - Tomo 2", "3.txt"),
       os.path.join(SRC, "03 - Tomo 3", "5.txt")]
F40 = [os.path.join(SRC, "01 - Tomo 1", "2.txt"),
       os.path.join(SRC, "02 - Tomo 2", "4.txt"),
       os.path.join(SRC, "03 - Tomo 3", "6.txt")]
OUTDIR = os.path.join(REPO, "ventisettana_rebuilt")   # staging; swap into ventisettana/ after review
EXISTING = os.path.join(REPO, "ventisettana_old")     # the pre-rebuild XML, kept as the QA baseline
QUARANTANA = os.path.join(REPO, "quarantana")

ROMAN = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"),
         (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"),
         (5, "V"), (4, "IV"), (1, "I")]


def roman(n):
    out = ""
    for v, s in ROMAN:
        while n >= v:
            out += s
            n -= v
    return out


def load_paragraphs(files):
    """{chapter_key: [paragraph, ...]}, paragraph = [(comma|None, [tokens]), ...].

    Each physical line of the txt is one paragraph; the [cNNN-pNNN] markers
    within it delimit commas (the cross-edition alignment key). A marker-less
    line is a dialogue turn — its own paragraph that continues the surrounding
    comma (comma=None), exactly as a Q40 comma can span several <p>. The chapter
    of each line is taken from its markers, so continuation lines inherit the
    current chapter.
    """
    out = collections.OrderedDict()
    cur = None
    for f in files:
        for raw in open(f, encoding="utf8"):
            s = raw.strip()
            if not s or s.startswith("#") or s.startswith("TOMO"):
                continue
            markers = re.findall(r"\[(c\d+)-p\d+\]", s)
            if markers:
                cur = markers[0]
            if cur is None:
                continue
            parts = re.split(r"\[c\d+-(p\d+)\]", s)
            segs = []
            lead = parts[0].strip()
            if lead:                       # text before the first marker: continues prev comma
                segs.append((None, lead.split()))
            for pnum, body in zip(parts[1::2], parts[2::2]):
                segs.append((int(pnum[1:]), body.split()))
            if segs:
                out.setdefault(cur, []).append(segs)
    return out


def comma_counts(files):
    """{chapter_key: number of distinct commas} — used only for the reconcile."""
    text = "".join(open(f, encoding="utf8").read() for f in files)
    out = collections.defaultdict(set)
    for chap, para in re.findall(r"\[(c\d+)-(p\d+)\]", text):
        out[chap].add(para)
    return {c: len(v) for c, v in out.items()}


def flat_tokens(paras):
    """All word tokens of a chapter, in order (for the QA diff / word count)."""
    return [t for segs in paras for _, toks in segs for t in toks]


def comma_numbers(paras):
    """All comma numbers of a chapter, in document order."""
    return [c for segs in paras for c, _ in segs if c is not None]


def chap_meta(ckey):
    """(filename, div_type, n, xml:id, head, word-id prefix)."""
    n = int(ckey[1:])
    if n == 0:
        return ("intro", "introduzione", 0, "v27_introduzione",
                "INTRODUZIONE", "v27_intro")
    return ("cap%d" % n, "capitolo", n, "v27_capitolo%d" % n,
            "CAPITOLO %s" % roman(n), "v27_c%d" % n)


def esc(s):
    """Escape &, <, > for XML text content (leaves quotes/guillemets/apostrophes)."""
    return html.escape(s, quote=False)


def build_xml(ckey, paras):
    """Return (filename, xml_string, word_count, [comma_numbers], paragraph_count).

    One <p> per txt paragraph; <milestone> where a comma begins (a paragraph may
    carry several, or none when it continues a comma). Word ids run continuously
    across the chapter, unaffected by the paragraph breaks.
    """
    filename, dtype, n, xmlid, head, wprefix = chap_meta(ckey)
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<div type="%s" n="%d" xml:id="%s">' % (dtype, n, xmlid),
             "   <head>%s</head>" % head]
    seq = 10001
    comma_ns = []
    for segs in paras:
        lines.append("   <p>")
        for comma, toks in segs:
            if comma is not None:
                comma_ns.append(comma)
                lines.append('      <milestone unit="comma" n="%d"/>' % comma)
            for tok in toks:
                lines.append('      <w xml:id="%s_%d">%s</w>' % (wprefix, seq, esc(tok)))
                seq += 1
        lines.append("   </p>")
    lines += ["</div>", ""]
    return filename, "\n".join(lines), seq - 10001, comma_ns, len(paras)


def existing_v27_tokens(filename):
    """Word tokens from the existing V27 XML, or None if absent/empty."""
    path = os.path.join(EXISTING, filename + ".xml")
    if not os.path.exists(path) or os.path.getsize(path) < 100:
        return None
    return re.findall(r"<w [^>]*>([^<]*)</w>", open(path, encoding="utf8").read())


def quarantana_ids():
    ids = set()
    for f in glob.glob(os.path.join(QUARANTANA, "*.xml")):
        ids |= set(re.findall(r'xml:id="([^"]+)"', open(f, encoding="utf8").read()))
    return ids


def q40_milestone_counts():
    out = {}
    for f in glob.glob(os.path.join(QUARANTANA, "*.xml")):
        name = os.path.basename(f)[:-4]
        out[name] = len(re.findall(r"<milestone", open(f, encoding="utf8").read()))
    return out


def main():
    os.makedirs(OUTDIR, exist_ok=True)
    paras27 = load_paragraphs(F27)
    counts40 = comma_counts(F40)
    qids = quarantana_ids()
    qms = q40_milestone_counts()

    all_ids = set()
    qa_rows = []
    reconcile = []
    problems = []
    n_files = 0
    n_words = 0
    n_paras = 0

    for ckey in sorted(paras27, key=lambda c: int(c[1:])):
        paras = paras27[ckey]
        filename, xml, wc, comma_ns, pcount = build_xml(ckey, paras)
        n_files += 1
        n_words += wc
        n_paras += pcount

        # --- write + parse-check
        path = os.path.join(OUTDIR, filename + ".xml")
        with open(path, "w", encoding="utf8") as fh:
            fh.write(xml)
        try:
            minidom.parseString(xml)
        except Exception as e:  # noqa: BLE001
            problems.append("%s: does not parse as XML (%s)" % (filename, e))

        # --- id checks
        ids = re.findall(r'xml:id="([^"]+)"', xml)
        wids = [i for i in ids if "_1" in i and "capitolo" not in i and "introduzione" not in i]
        dupes = [i for i, c in collections.Counter(ids).items() if c > 1]
        if dupes:
            problems.append("%s: duplicate xml:id %s" % (filename, dupes[:3]))
        clash = all_ids & set(ids)
        if clash:
            problems.append("%s: xml:id reused across chapters %s" % (filename, list(clash)[:3]))
        all_ids |= set(ids)
        qclash = qids & set(ids)
        if qclash:
            problems.append("%s: xml:id collides with Quarantana %s" % (filename, list(qclash)[:3]))

        # --- comma-number fidelity: milestones must equal the txt27 comma numbers,
        #     each once, in increasing order (paragraph breaks must not drop/dupe them)
        txt_ns = comma_numbers(paras)
        if comma_ns != sorted(set(txt_ns)) or len(comma_ns) != len(set(comma_ns)):
            problems.append("%s: milestone n != txt27 comma numbers (dup/disorder)" % filename)

        # --- word-count fidelity
        txt_wc = len(flat_tokens(paras))
        if wc != txt_wc:
            problems.append("%s: emitted %d words, txt27 has %d" % (filename, wc, txt_wc))

        # --- QA diff vs existing V27 XML
        exist = existing_v27_tokens(filename)
        if exist is None:
            qa_rows.append((filename, "-", "(no prior XML: chapter was merged/stub/new)", ""))
        else:
            txt_tokens = flat_tokens(paras)
            sm = difflib.SequenceMatcher(None, txt_tokens, exist, autojunk=False)
            for op, i1, i2, j1, j2 in sm.get_opcodes():
                if op == "equal":
                    continue
                qa_rows.append((filename, op,
                                " ".join(txt_tokens[i1:i2]) or "∅",
                                " ".join(exist[j1:j2]) or "∅"))

        # --- milestone reconcile vs Q40 XML
        t27 = len(set(txt_ns))
        t40 = counts40.get(ckey, 0)
        q = qms.get(filename)
        if t27 == t40 == q:
            cls = "aligned"
        elif t40 == q and t27 < t40:
            cls = "1840-added"
        else:
            cls = "DISCREPANT"
        reconcile.append((filename, t27, t40, q, cls))

    # --- write reports
    with open(os.path.join(OUTDIR, "TRANSCRIPTION-QA.md"), "w", encoding="utf8") as fh:
        fh.write("# Transcription QA — txt (1827) vs existing Ventisettana XML\n\n")
        fh.write("Every token disagreement between the txt (authoritative for this "
                 "rebuild) and the previous `ventisettana/` XML. For an editor to "
                 "adjudicate against a 1827 facsimile; the txt reading stands until "
                 "then. `op`: replace = both differ, insert = only in txt, "
                 "delete = only in old XML.\n\n")
        fh.write("| chapter | op | txt (1827) | old XML |\n|---|---|---|---|\n")
        for fn, op, a, b in qa_rows:
            fh.write("| %s | %s | %s | %s |\n" % (fn, op, a.replace("|", "\\|"),
                                                  b.replace("|", "\\|")))
        fh.write("\n**%d disagreements across %d chapters.**\n"
                 % (sum(1 for r in qa_rows if r[1] != "-"), n_files))

    with open(os.path.join(OUTDIR, "MILESTONE-RECONCILE.md"), "w", encoding="utf8") as fh:
        fh.write("# Milestone reconciliation — txt commas vs Q40 XML milestones\n\n")
        fh.write("`1840-added`: expected — 1840 has commi the 1827 lacks; V27 "
                 "carries the txt27 subset. `DISCREPANT`: the Q40 XML milestone "
                 "count disagrees with the txt and needs reconciling before "
                 "loci are anchored to Q40 xml:ids.\n\n")
        fh.write("| chapter | txt27 | txt40 | Q40 XML | class |\n|---|--:|--:|--:|---|\n")
        for fn, t27, t40, q, cls in reconcile:
            fh.write("| %s | %d | %d | %s | %s |\n" % (fn, t27, t40, q, cls))
        disc = [r[0] for r in reconcile if r[4] == "DISCREPANT"]
        fh.write("\n**DISCREPANT: %s** — reported, not resolved.\n" % (", ".join(disc) or "none"))

    # --- summary
    print("Generated %d files -> %s" % (n_files, os.path.relpath(OUTDIR, REPO)))
    print("  total V27 words: %d   paragraphs: %d   unique xml:ids: %d"
          % (n_words, n_paras, len(all_ids)))
    print("  QA disagreements: %d   milestone-discrepant chapters: %s"
          % (sum(1 for r in qa_rows if r[1] not in ("-", "equal")),
             ", ".join(r[0] for r in reconcile if r[4] == "DISCREPANT") or "none"))
    have = {os.path.basename(p)[:-4] for p in glob.glob(os.path.join(OUTDIR, "*.xml"))}
    for must in ["cap31", "cap32", "cap33"]:
        print("  %s present: %s" % (must, must in have))
    print("  cap3132 present (should be False): %s" % ("cap3132" in have))
    if problems:
        print("\nVALIDATION FAILURES (%d):" % len(problems))
        for p in problems:
            print("  - " + p)
        raise SystemExit(1)
    print("\nAll acceptance invariants passed.")


if __name__ == "__main__":
    main()
