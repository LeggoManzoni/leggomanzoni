# Ventisettana XML rebuild — design

**Date:** 2026-07-29
**Status:** approved, ready for implementation
**Branch:** `prototipo-collazione`

## Goal

Produce a **reliable Ventisettana (1827) XML** that can stand as the second
witness in the V27/Q40 collation. The Quarantana (1840) side already exists and
is the anchor (`quarantana/`); only the Ventisettana needs rebuilding. The output
is a **collation substrate**, not a scholarly edition: it carries the text, the
comma-aligned structure, and word-level `xml:id`s, and nothing else.

## Why the existing `ventisettana/` XML cannot be used

Verified 2026-07-29, unchanged since the review:

- **No usable structure.** Every chapter is a single `<p>`; the comma milestones
  are unaligned to Q40 (cap1: 191 V27 commi vs 78 Q40) and the intro's use
  invalid `xml:id="1"` (an NCName may not start with a digit).
- **Chapters do not pair 1:1.** `cap31`/`cap32` are one merged `cap3132.xml`;
  `cap33.xml` is a 39-byte empty stub — chapter 33 is absent.
- **IDs collide with Q40.** 196,529 word ids are shared between the two
  witnesses, so no merged addressing is possible.

The txt sources fix all of this; the existing XML cannot fix it from itself.

## Source of truth

`01 - I promessi sposi/` — the two aligned working transcriptions (odd files
1827, even files 1840). Their `[cNNN-pNNN]` markers are a hand-made
**cross-edition comma alignment**: the marker count equals Q40's `<milestone>`
count in every chapter (cap1 78=78, cap10 95=95, cap20 52=52), and the 1827 and
1840 files carry the same comma count per chapter. This is the shared coordinate
the collation runs on. See memory `project_v27_txt_alignment`.

The txt unit is the **comma** (Manzoni's numbered segment = Q40
`<milestone unit="comma">`), *not* the typographic `<p>`.

## Decisions (approved)

1. **Fidelity: collation substrate.** Text + comma structure + `<w xml:id>`. No
   inline markup, no figures, no typographic paragraphs, no sub-comma milestones.
   The pipeline regenerates from txt, so richer markup can be added later without
   redoing this.
2. **Text authority: txt + QA diff.** Regenerate from the txt; emit every
   txt-vs-existing-XML token disagreement (~50/chapter, ~2000 total) to
   `TRANSCRIPTION-QA.md` for editorial adjudication. Nothing silently
   overwritten. The differences are real orthography (`publica`/`pubblica`,
   `Notò`/`Noto`, `paese,`/`paese;`, elision splits), so the choice is editorial,
   not mechanical — per the project's transcription-fidelity rule.
3. **ID scheme: `v27_c<chap>_<seq>`,** e.g. `v27_c1_10001`. Re-prefixed per spec
   §3.1 so V27 ids never collide with Q40's `c1_10001`. Provisional until the QA
   pass lands; frozen thereafter.
4. **Output to `ventisettana_rebuilt/`.** `ventisettana/` is left untouched. The
   team validates on the four test chapters (I, X, XX, XXVIII), then approves a
   swap. No processed data is overwritten before review.
5. **Sentences deferred.** Sentence milestones are a later pass (only
   `crosses_sentence` needs them).

## File shape

One `<div type="capitolo">` fragment per chapter, matching the Quarantana shape:

```xml
<div type="capitolo" n="1" xml:id="v27_cap1">
  <head>CAPITOLO I</head>
  <p>
    <milestone unit="comma" n="1"/>
    <w xml:id="v27_c1_10001">Quel</w>
    <w xml:id="v27_c1_10002">ramo</w>
    <w xml:id="v27_c1_10003">del</w>
    <milestone unit="comma" n="2"/>
    ...
  </p>
</div>
```

- `<milestone unit="comma" n="M"/>` — the alignment carrier, same element as Q40.
  `M` = the **txt comma number**, which is the cross-edition alignment key (same
  number = same comma across editions). The sequence may have **gaps**: where the
  1840 edition added a comma, that number is absent from V27 (e.g. cap19 skips
  20, 21). A gap is meaningful — it marks a comma present only in the Quarantana.
- `xml:id="v27_c1_10001"` — `v27_` prefix + chapter + running index from 10001.
- Punctuation glued to the word (`Como,`), the txt's convention and Q40's.
- Typographic `<p>` reconstructed from the txt line breaks (**updated 2026-07-29**;
  was a single `<p>` wrapper). Each physical txt line = one paragraph; a comma may
  span several, a paragraph may carry several commas or none. Purely additive —
  same ids, words, commas. It is the 1827 paragraphing, which diverges per chapter
  from Q40's 1840 (total 2718 vs 2676; largest cap1 +17, cap24 +14, cap33 −8).
- 39 chapters: `intro`, `cap1`–`cap38`, with `cap31`/`cap32` correctly split and
  `cap33` filled.

## Pipeline

Extends `prototipo/`. Standard-library Python only.

1. **Parse** the txt → `{chapter: {comma: text}}` (reuse `prototipo/build_loci.py`
   loader).
2. **Emit** per chapter: for each comma in order, a `<milestone n>` then one
   `<w xml:id>` per whitespace token (the txt already glues punctuation).
3. **QA diff:** token-align the txt against the *existing* V27 XML per chapter
   (`difflib`), write `TRANSCRIPTION-QA.md` with every disagreement as
   `chapter | comma | txt-reading | existing-XML-reading | kind`.
4. **Validate** (companion check + extend `scripts/validate_alignment_ids.js`):
   ids unique and well-formed; no id shared with any `quarantana/` file;
   milestone `@n` equals the txt comma number (gaps allowed, strictly
   increasing); V27 word count == txt27 word count per chapter.
5. **Reconcile report:** the txt comma structure does **not** match the Q40 XML
   milestone count in every chapter (verified 2026-07-29). Emit
   `MILESTONE-RECONCILE.md` classifying each chapter:
   - **aligned** (30 chapters) — txt27 ⊆ txt40 == Q40;
   - **1840-added** (cap15, 19, 28, 31, 32) — expected, V27 lacks those commi;
   - **discrepant** (cap6, 13, 23: off by one; intro: 15 vs 35) — the Q40 XML
     milestone segmentation disagrees with the txt and needs editorial/structural
     reconciliation. This is a **reported finding, not a build failure**.

## Validation invariants (acceptance)

- 39 output files; each parses as XML.
- Zero `xml:id` collisions between `ventisettana_rebuilt/` and `quarantana/`.
- Per chapter: milestone `@n` values == the txt27 comma numbers exactly
  (the alignment key is carried faithfully; gaps where 1840 added commi).
- Per chapter: V27 word count == txt27 word count exactly (no tokens dropped).
- `cap31`, `cap32` present and non-empty; `cap33` non-empty; no `cap3132`.
- `MILESTONE-RECONCILE.md` produced; the four discrepant chapters (intro, cap6,
  cap13, cap23) listed for review, not silently emitted.

The V27↔Q40 alignment the collation runs on is txt27↔txt40, which is internally
consistent by construction. The Q40-XML-milestone reconciliation is a **separate**
concern (it feeds the later xml:id-anchoring step), deliberately surfaced rather
than forced.

## Deliverables

- `prototipo/build_ventisettana_xml.py` — the generator.
- `ventisettana_rebuilt/*.xml` — 39 files.
- `ventisettana_rebuilt/TRANSCRIPTION-QA.md` — the editorial diff (~2000 rows).
- `ventisettana_rebuilt/MILESTONE-RECONCILE.md` — the comma-count reconciliation.
- Validation output, green.
- A short note in `prototipo/README.md` pointing at this.

## Deferred / downstream (explicitly not this cut)

- Sentence milestones (`crosses_sentence`).
- ~~Typographic `<p>` reconstruction.~~ Done 2026-07-29 (see file shape above).
- Inline markup (italics `_..._`, quotes `«»`, source citations, footnotes).
- Anchoring collation loci to *both* witnesses' `xml:id`s in `build_loci.py` —
  the apparatus step, which this rebuild enables.
- Q40 accent reconciliation (the TEI has `perché` where the txt has `perchè`);
  belongs to the parallel Quarantana rebuild, noted here because the same QA
  method applies.

## Open editorial question (not blocking implementation)

Who adjudicates `TRANSCRIPTION-QA.md`, and against what authority (a facsimile of
the 1827)? The rebuild produces the list; resolving it is editorial work. Until
resolved, the txt reading stands and the XML is usable for the comparison.
