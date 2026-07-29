# Collazione V27/Q40 — the apparatus (project 1 of 2)

**Date:** 2026-07-29
**Status:** design, for review
**Supersedes for implementation:** `collazione-v27-q40-spec-prototipo.md` §5, §6, §9, §10
**Prerequisites, both met:** the rebuilt Ventisettana is on `main` (PR #4, `35e411e`);
the documentary-text Quarantana replaced the earlier transcription (`4036b62`), which is
what reduced the transcription-noise problem of §2.1 from ~2,200 loci to almost none

## 0. Where this sits

The prototype (`prototipo/collazione.html`) put three rendering modes in front of the
team at real variant density. **Sinottico won.** Producing it as a page of
leggomanzoni is two projects, and this spec is the first:

| | scope | deliverable |
|---|---|---|
| **Project 1 — this spec** | the collation, the apparatus, the data contract | `scripts/collate.py`, `apparato/capNN.xml`, `data/loci/capNN.json.gz`, validator, tests. **No UI.** |
| Project 2 — separate spec | the page | `routes/collaziono.js`, `views/collaziono.ejs`, `assets/js/collaziono.js`, `assets/css/collaziono.css` |

The split exists because the data contract is the interface between them. Freezing
it before a renderer exists stops the viewer from silently defining the philology,
and it puts `TRANSCRIPTION-QA.md` in front of an editor weeks earlier — adjudicating
`perchè ≡ perché` is the longest-lead item in the whole effort and no code blocks on it.

## 1. Decisions taken

1. **Collate the merged TEI, not the txt.** `ventisettana/*.xml` against
   `quarantana/*.xml`, aligned on the shared `<milestone unit="comma" n="N"/>`.
   Consequences: the pipeline is reproducible from a clean clone (the txt sources in
   `01 - I promessi sposi/` are gitignored and cannot be); every locus anchors to
   `<w>` `xml:id` ranges in both witnesses, so loci are citable and can later share a
   span with a commentary lemma (prototype spec §11.5).
2. **The durable artefact is TEI.** `apparato/capNN.xml`, stand-off, a structural
   sibling of `commenti/xml/…/capNN.xml`. The JSON the browser loads is generated
   from it and is a build output, never hand-edited.
3. **Normalisation folds at collation time, and every fold is auditable.**
   `docs/NORMALISATION.md` is the versioned policy; the collation runs twice, raw and
   folded, and every locus present raw but absent folded is emitted to
   `apparato/TRANSCRIPTION-QA.md` as a transcription artifact. Nothing is silently
   dropped.
4. **All 39 chapters ship.** The four with disagreeing comma segmentation
   (`intro`, `cap6`, `cap13`, `cap23`) degrade to a single chapter-level row and carry
   a machine-readable flag the viewer turns into a visible note.
5. **Row unit is the comma**, not the paragraph. Commi are the only unit with a
   cross-edition correspondence; the two editions' paragraphing genuinely differs
   (V27 2718 `<p>`, Q40 2682) and each witness keeps its own inside a row.

## 2. What the inputs actually look like

Measured 2026-07-29 against `main`, **after the documentary-text Quarantana landed**
(`4036b62`), not assumed:

| | Ventisettana | Quarantana |
|---|--:|--:|
| `<w>` | 217,668 | 215,957 |
| `<p>` | 2,718 | 2,673 |
| `<milestone>` | 2,585 | 2,611 |
| `<lb>` / `<pb>` | 0 / 0 | 20,541 / 742 |
| standalone-punctuation `<w>` | 458 | ~700 |
| inline markup around `<w>` | none | `persName` 407, `hi` 102, `bibl` 87, `foreign` 73, `quote` 35, `note` 28, `sic` 5 |

Six properties of this table drive the pipeline.

**2.1 The witnesses now very nearly share a character repertoire — this problem has
largely dissolved.** The earlier Quarantana was modernised in accentuation and used
curly apostrophes, which made roughly 2,200 token pairs differ by our transcription
convention alone. The 2026 edition reverts to the orthography of the print, which is
the same convention the Ventisettana inherited from the txt:

| | V27 | Q40 (old) | Q40 (current) |
|---|--:|--:|--:|
| `perché` / `perchè` | 1 / 285 | 287 / 0 | 0 / 276 |
| `né` / `nè` | 0 / 287 | 268 / 0 | 0 / 268 |
| `sé` / `sè` | 0 / 103 | 86 / 0 | 0 / 88 |
| `’` U+2019 | 4 | 1,534 | **0** |

Measured effect on the collation: normalisation now removes **0–5 loci per chapter**,
where against the old Quarantana it removed 18–25. The fold policy of decision 3 stays
— it is what makes the residue auditable, and it is cheap — but it is no longer
load-bearing, and `TRANSCRIPTION-QA.md` will be short rather than ~800 rows.

**The headline figures are unchanged by the swap**, which is the reassuring part:
cap1 still yields 754 loci and **26 at salience 3, one per 234 words**, the same as
against the old Quarantana and the same as the txt-based prototype the team reviewed.

**2.1a Tokenising Q40 with a regex is now actively wrong.** The edition carries 20,541
`<lb>`, many *inside* `<w>`: `<w xml:id="c1_10010">mez<lb/>zogiorno,</w>`. A pattern
like `<w [^>]*>([^<]*)</w>` silently drops every such token — it does not error, it
under-counts. Parse the tree and use the element's full string value. (The rendering
XSLT is already safe: `value-of` flattens. `build_concordance.py` is safe: `itertext()`.)

**2.2 Q40 wraps `<w>` in inline markup and V27 does not.** A tokeniser that assumes
`<w>` is a direct child of `<p>` silently drops 1,100+ Q40 words. Walk the tree.

**2.3 365 Q40 `<w>` live inside `<note>`/`<bibl>`, and they are Manzoni's own notes.**
His source citations, concentrated in the plague chapters (cap28, cap31, cap32) plus
cap9, cap12 and cap37 — *Ripamonti*, *Tadino*, *Cavatio della Somaglia*, *Lampugnano*.
They are text of the edition and **are collated**.

The two witnesses hold them differently. Q40 wraps each in `<note place="bottom">`
anchored at its reference point; the V27 rebuild dropped inline markup, so the same
notes sit in the `<w>` flow as unmarked running text — verified: `Ripamontii`,
`Cavatio`, `Lampugnano` and the `prestin` note all appear in both witnesses.

Two consequences. First, excluding them would fabricate ~365 words of
Ventisettana-only text — the opposite error from the one it looks like it avoids.
Second, **where the two witnesses place the note text may differ**, and a note anchored
mid-sentence in Q40 but sitting at a paragraph end in V27 collates as a deletion in one
place and an addition in another. That is the *moved locus* case of prototype spec §6.5:
do not build move detection, emit the `add`/`del` pairs as candidates for a philologist
to link by hand. **Audit item for the first implementation step: measure, per chapter
carrying notes, whether the note text aligns in place or is displaced.**

**2.4 Tokenisation diverges.** 700 standalone-punctuation tokens in Q40 against 458 in
V27, and 1,427 vs 577 tokens ending in an apostrophe. Wherever the two witnesses
tokenise identical text differently, the collation invents a locus.

Within that, one convention still genuinely differs and belongs in the fold policy: the
**dialogue dash**. The 2026 Quarantana normalised it to the em dash `—` (432 standalone
tokens); the Ventisettana has the en dash `–` (327). This is the one repertoire
difference the documentary-text update did not remove, because it runs the other way —
Q40 normalised, V27 did not.

**2.5 Three Q40 milestones carry `xml:id` instead of `@n`.** All in
`quarantana/cap1.xml` — commi 1, 2 and 5. The comma number is the alignment key, so
it is missing for three commi of the chapter every demo opens. Fix in the file; assert
in the validator.

## 3. Pipeline — `scripts/collate.py`

```
ventisettana/capNN.xml ─┐
                        ├→ load → reglue → normalise → collate → trim_anchors
quarantana/capNN.xml   ─┘                                              │
                                                                       ↓
                                             classify → salience → rows → emit
```

Standard library plus nothing. Each stage is a module-level function with no I/O, so
each is testable in isolation. One command runs all 39 chapters:

```sh
npm run build-collazione        # scripts/venv/bin/python scripts/collate.py
python3 scripts/collate.py --chapter cap20 --dry-run
```

### 3.1 `load(path) -> [Token]`

Walks the XML tree (not a regex over `<p>` children — see §2.2), descending into every
element that can wrap a `<w>`, `<note>` and `<bibl>` included (§2.3). Each token carries
`text`, `xml_id`, `comma` (from the most recent `milestone/@n`), `para` (index of its
containing `<p>` within the chapter), and `in_note` — true for tokens inside a `<note>`
or `<bibl>`, so the viewer can set Manzoni's notes typographically apart from the
running text as both editions do, and so displaced-note candidates are identifiable.
Milestones never enter the token stream as text.

`quarantana/header.xml` has no Ventisettana counterpart and is not a chapter; chapter
pairing is by filename, so it never enters the collation.

### 3.2 `reglue(tokens) -> [Token]`

Merges a standalone-punctuation token into its predecessor, so the two witnesses
present the same token shape. Verified to be needed: 700 such tokens in Q40 against 458
in V27. The merged token keeps **both** `xml_id`s: a locus may address a 2-id range on
one side and a 1-id range on the other. **Never renumber a `<w>`** — 41 commentary sets
and 35 translation sets anchor to those ids.

**Elided forms are an open audit item, not yet a rule.** Q40 has 1,427 tokens ending in
an apostrophe against V27's 577, but the frequent ones (`de'` 545, `que'` 256, `po'` 247)
are apocopes — complete words — and merging them forward would be wrong. Whether the
files also contain genuinely *split* proclitics (`<w>dell'</w><w>acqua</w>`) is
unmeasured. **First implementation step: count them.** If the count is zero, this
paragraph is deleted and `reglue` handles punctuation only; if not, the rule applies to
proclitics alone and the list is enumerated in the code. Do not write the merge before
the count exists.

### 3.3 `normalise(s) -> str`

Implements `docs/NORMALISATION.md`. Applied **only** to decide token equality; readings
are always stored and displayed verbatim. Minimum folds: Unicode NFC, the **dash family**
(`—` ≡ `–` ≡ `―`, now the largest residual class — see §2.4), case, accent (grave/acute),
u/v, and the apostrophe and quotation repertoire (`’`→`'`, `“”`→`"`) which costs nothing
to keep even though the current Quarantana no longer needs it.

Deciding that `perchè ≡ perché` is an editorial judgement. `NORMALISATION.md` is
versioned, carries a rationale per fold, and is signed off by an editor — not by
whoever writes the code.

### 3.4 `collate(a, b) -> [Opcode]`

`difflib.SequenceMatcher(autojunk=False)` over the folded token lists,
**chapter-scoped, not comma-scoped**: variants that cross a comma boundary exist, and a
per-comma pipeline with a count assertion halts on them. Deterministic and reproducible;
no embedding aligner — this is same-language, same-structure text and the loci must be
citable.

### 3.5 `trim_anchors(a, b)`

For every `replace`, strip the longest common folded token prefix and suffix and
re-emit them as shared; re-type to `add`/`del` if a side empties. Records
`seam_trimmed`. Without it the aligner reports new passages as substitutions on an
adjacent surviving punctuation token.

**Acceptance test (from prototype spec §5.4): after the pass, the median and p90 of the
size distribution are unchanged. If the median moves, the pass is wrong.**

### 3.6 `classify` / `salience`

Classes are computed and stored (`punteggiatura`, `fonomorfologia`, `lessico`,
`sintassi`, `structural`, `incerto`) with a confidence, using the named-rule whitelist
from prototype spec §6.3 — **not** an edit-distance threshold. They are **not exposed in
the v1 UI**: we have no editorial data behind a typology, and a rule-generated guess
shown on a public edition page reads as an attribution. `tono` is never auto-assigned.

Salience 0–3 by extent, computed after `trim_anchors`, is the only quantity the viewer
surfaces. It drives the presets.

### 3.7 `rows(loci, tokens) -> [Row]`

Groups both witnesses' streams into rows keyed by comma number. A locus belongs to the
row where it starts and is flagged `crosses_comma` if it does not end there. Where the
two witnesses' comma sets disagree beyond expected 1840 additions — the four chapters of
decision 4 — the whole chapter becomes one row with `"aligned": false`.

## 4. Artefacts

### 4.1 `apparato/capNN.xml` — the durable one

Stand-off TEI, `<listApp>` of `<app>`, `target`/`targetEnd` into both witnesses in
exactly the form the commentary files already use:

```xml
<app xml:id="cap20-l0031" type="sub" n="3">
  <rdg wit="#V27" target="ventisettana/cap20.xml#v27_c20_10011"
                  targetEnd="ventisettana/cap20.xml#v27_c20_10014">la canizie dei pochi capegli</rdg>
  <rdg wit="#Q40" target="quarantana/cap20.xml#c20_10011"
                  targetEnd="quarantana/cap20.xml#c20_10013">bianchi i pochi capelli</rdg>
</app>
```

The `<teiHeader>` records the pipeline version, the `NORMALISATION.md` version, a
`witness_sha` per source file, and the `note`/`bibl` exclusion. When a witness changes —
and it does; `1f60cf7` rebuilt the concordance after Quarantana corrections — the sha
mismatch makes the apparatus revalidate rather than be silently trusted.

`op` is stated chronologically, V27 → Q40, and never flips. `add` = Q40 only, `del` =
V27 only. Readings are witness-keyed, never base/variant: neither edition is the
corrected form of the other.

### 4.2 `data/loci/capNN.json` (+ `.gz`) — the serialisation

Generated from 4.1, committed alongside it as `data/concordance.json[.gz]` already is.

```jsonc
{
  "chapter": "cap20", "roman": "XX", "aligned": true,
  "witness": {
    "V27": { "file": "ventisettana/cap20.xml", "sha": "…", "words": 4772 },
    "Q40": { "file": "quarantana/cap20.xml",   "sha": "…", "words": 4669 }
  },
  "normalisation": "1.0",
  "n": 670,
  "rows": [
    { "comma": 3, "aligned": true,
      "V27": [ {"t":"s","w":"Il suo aspetto"},
               {"t":"sub","id":"cap20-l0031","w":"la canizie dei pochi capegli"},
               {"t":"pb"},
               {"t":"s","w":"…"} ],
      "Q40": [ {"t":"s","w":"Il suo aspetto"},
               {"t":"sub","id":"cap20-l0031","w":"bianchi i pochi capelli"},
               {"t":"s","w":"…"} ] }
  ],
  "loci": {
    "cap20-l0031": { "op":"sub", "sal":3, "size":5, "cls":"lessico", "conf":0.5,
                     "cd":null, "crosses_comma":false, "seam_trimmed":0,
                     "anchor": { "V27":["v27_c20_10011","v27_c20_10014"],
                                 "Q40":["c20_10011","c20_10013"] } }
  }
}
```

Two things about this shape, both deliberate:

**Each witness gets its own segment stream.** The prototype flattened both into one
list carrying `a`/`b`. That works only if the witnesses share paragraphing — they do
not (2,718 vs 2,682 `<p>`). Per-witness streams cost one duplicated copy of the shared
text per chapter (~40 KB gzipped) and buy each column its own real paragraphing, with
`{"t":"pb"}` marking a break. A locus id appears in both streams; that is what links
the columns.

**Locus metadata is factored out of the streams** into `loci`, so a locus that spans a
paragraph break is described once.

### 4.3 Reports

- `docs/NORMALISATION.md` — versioned fold policy, editor-signed.
- `apparato/TRANSCRIPTION-QA.md` — every raw-minus-folded locus, i.e. every claim the
  pipeline makes that two spellings are the same word. Roughly 20 per chapter on the
  trial run; a philologist must be able to audit each.
- `apparato/STATS.md` — per chapter: loci by class, by salience, by preset; density;
  op breakdown; size distribution. Prototype spec §3.4 requires these recomputed
  against `<w>`; §8 requires them reported per chapter.

## 5. Validation

`scripts/validate_alignment_ids.js` gains `apparato/` as a third `REF_DIR`. Two changes
beyond adding a path:

- `collectQuarantanaIds()` becomes two-witness — it must resolve `ventisettana/…#v27_*`
  targets too, which it cannot today.
- Apparatus entries route through the **monotonicity** pass, not the comment pass. That
  pass is currently applied to translations and skipped for comments because comment
  lemmas legitimately nest and overlap. Variant loci are monotonic and non-overlapping by
  construction, so the strict pass is a free correctness net.

New assertions: every `@n` on a `<milestone unit="comma">` is present and numeric in both
witnesses (this is what catches §2.5); no apparatus references a witness whose recorded
`witness_sha` no longer matches.

Green before project 2 begins.

## 6. Tests — `tests/test_collate.py`

pytest, alongside the existing `tests/test_*.py`, run with `scripts/venv`.

- `normalise` — each documented fold, and that unfolded text round-trips unchanged.
- `reglue` — punctuation and elision cases, and that both `xml_id`s survive the merge.
- `load` — a `<w>` nested in `persName`/`hi`/`quote` is found; a `<w>` in `note`/`bibl` is not.
- `trim_anchors` — the median/p90 acceptance of §3.5, on the real cap19 data.
- `rows` — a locus crossing a comma lands in its starting row and is flagged; the four
  discrepant chapters produce one row with `aligned: false`.
- `classify` — `cangiando`/`cambiando` and `guatare`/`guardare` are **not**
  `fonomorfologia`, the case the whitelist exists for.
- End-to-end on cap1: 755 loci, 26 at salience 3 — the figures the team reviewed.

## 7. Acceptance

1. 39 apparatus files, 39 JSON files; every one parses; `n` agrees between the pair.
2. Validator green, including the two-witness pass.
3. cap1 yields **26 loci of size ≥ 5**, one per 234 Q40 words — reproducing the
   reviewed prototype figure from a different input. This is the cross-check that the
   change of substrate did not change what the team approved. Salience 3 additionally
   admits `structural` loci, which the prototype did not compute; if that raises the
   cap1 salience-3 count above 26, the delta is **reported in `STATS.md`, not absorbed
   silently** — the presets are what the team voted on and a preset that quietly widens
   is a changed decision.
4. Whole-novel density between 1 per 6.5 and 1 per 8 words, consistent with the trial
   run and with prototype spec §2.
5. `TRANSCRIPTION-QA.md` non-empty and every row attributable to a documented fold.
6. `apparato/STATS.md` produced, including the per-chapter note-displacement audit of
   §2.3. In the six chapters carrying notes, no note is reported as wholly absent from
   either witness — if one is, the collation has displaced it rather than lost it, and
   the pair goes to the moved-locus candidate list.
7. A clean clone can run `npm run build-collazione` and reproduce every artefact
   byte-for-byte. This requires deterministic output: sorted keys, no timestamps and no
   absolute paths in the TEI header, and no dependency on filesystem iteration order.

Point 7 is the one that failed for `scripts/build_concordance.py`, which is referenced in
`package.json` and untracked in the repo. Not repeating it is a deliverable, not a nicety.

## 8. Out of scope

Deferred to project 2: the route, the view, the columns, presets, counter, readout, URL
state, keyboard and mobile. Deferred beyond both: class filters in the UI, `overrides.csv`,
`linked_with` and move detection, sentence milestones, the V27 notes, and any integration
with `/confronta` or the commentary rail.

One clarification on that list: Manzoni's notes are **collated** (§2.3); what is deferred
is marking them up as `<note>` in the Ventisettana TEI, so that both witnesses carry the
same structure rather than the same words in different shapes. Until then `in_note` is
known for Q40 and inferred for V27 only through its alignment to a Q40 note token.

Not addressed here, and still open: who signs `NORMALISATION.md`, and against what
authority the `TRANSCRIPTION-QA.md` rows are adjudicated. The pipeline produces the list
and stands on the folded reading until someone rules otherwise; that is an editorial
decision with no code blocked behind it.
