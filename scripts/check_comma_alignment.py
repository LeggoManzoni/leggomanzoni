#!/usr/bin/env python3
"""Report comma-milestone alignment between the Ventisettana and the Quarantana.

Rows in the collation are keyed on the comma @n, which is a shared
cross-edition index. So a chapter is healthy when both witnesses carry the same
set of @n — and a *skipped* number is not automatically a fault: it is how "this
comma has no counterpart in this witness" is encoded.

The two are told apart by asking whether the gapped witness contains the text
at all:

  text present  -> the milestone was dropped; it needs inserting
  text absent   -> the number is intentionally skipped; leave it alone

Run after any edit to ventisettana/*.xml or quarantana/*.xml.

Usage:  scripts/venv/bin/python scripts/check_comma_alignment.py [--verbose]
"""

import difflib
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET

CHAPTERS = ["intro"] + ["cap%d" % i for i in range(1, 39)]
COVERAGE_PRESENT = 0.35     # share of the comma's words found in the gapped host


def word_text(w):
    """Full text of a <w>, including any tail after an intra-word <lb/>."""
    return "".join(w.itertext()).strip()


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^\w]", "", s)


def commi(path):
    """comma @n -> list of words. Also returns milestones lacking @n."""
    root = ET.parse(path).getroot()
    out, unnumbered, current = {}, 0, 0
    for el in root.iter():
        if el.tag == "milestone" and el.get("unit") == "comma":
            if not el.get("n"):
                unnumbered += 1
                continue
            current = int(el.get("n"))
            out.setdefault(current, [])
        elif el.tag == "w":
            out.setdefault(current, []).append(word_text(el))
    return out, unnumbered


def coverage(target, host):
    """How much of `target` appears inside `host`, as a share of target."""
    if not target:
        return 0.0
    t = [norm(x) for x in target]
    h = [norm(x) for x in host]
    sm = difflib.SequenceMatcher(None, t, h, autojunk=False)
    return sum(b.size for b in sm.get_matching_blocks()) / len(t)


def classify(gapped, whole, n):
    """A gap is a dropped milestone only if the text is there to be split."""
    host = n - 1
    while host not in gapped and host > 0:
        host -= 1
    return coverage(whole.get(n, []), gapped.get(host, []))


def main():
    verbose = "--verbose" in sys.argv
    clean, skips, faults = [], [], []

    for ch in CHAPTERS:
        v, v_un = commi("ventisettana/%s.xml" % ch)
        q, q_un = commi("quarantana/%s.xml" % ch)

        if v_un or q_un:
            faults.append((ch, "milestone(s) without @n: V27=%d Q40=%d" % (v_un, q_un)))
            continue

        vmax, qmax = max(v), max(q)
        if vmax != qmax:
            skips.append((ch, "different segmentation — max %d vs %d" % (vmax, qmax)))
            continue

        for ed, gapped, whole in (("V27", v, q), ("Q40", q, v)):
            for n in sorted(set(range(1, vmax + 1)) - set(gapped)):
                cov = classify(gapped, whole, n)
                if cov >= COVERAGE_PRESENT:
                    faults.append((ch, "%s comma %d: text present (%.0f%%) — milestone dropped"
                                   % (ed, n, cov * 100)))
                else:
                    skips.append((ch, "%s comma %d absent (%.0f%%) — intentional skip"
                                  % (ed, n, cov * 100)))

        if not any(f[0] == ch for f in faults) and not any(s[0] == ch for s in skips):
            clean.append(ch)

    print("%d/%d chapters align exactly." % (len(clean), len(CHAPTERS)))

    if skips:
        print("\n%d expected gap(s) — no counterpart text, correct as encoded:" % len(skips))
        for ch, msg in skips:
            print("  %-6s %s" % (ch, msg))

    if faults:
        print("\n%d FAULT(S) — need fixing:" % len(faults))
        for ch, msg in faults:
            print("  %-6s %s" % (ch, msg))
    else:
        print("\nNo faults.")

    if verbose:
        print("\nclean: %s" % ", ".join(clean))

    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main())
