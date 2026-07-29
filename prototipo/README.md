# Prototipo di collazione Ventisettana / Quarantana

A **throwaway prototype** built to settle one question by using it rather than
arguing it on a mockup: *how do you render the V27→Q40 revision at real variant
density?* The novel changes about **one word in seven** between the 1827 and 1840
editions, so the design problem is suppression, not display.

Companion to the design spec at
[`../collazione-v27-q40-spec-prototipo.md`](../collazione-v27-q40-spec-prototipo.md).
This folder is the working answer to §4/§8 of that spec; it is **not** the
production apparatus (§6, §9) and does not touch the TEI or the `<w>` xml:ids.

## What's here

| File | What it is |
|---|---|
| `collazione.html` | The viewer. Self-contained, no build step, no server needed — open it in a browser. Embeds `loci.json`. Same file as the shared artifact. |
| `loci.json` | The classified loci for the four test chapters. Produced by `build_loci.py`; also embedded in `collazione.html`. |
| `build_loci.py` | Collates + classifies the four chapters → `loci.json`. |
| `collate.py` | Whole-novel density statistics (no per-locus data). |
| `build_ventisettana_xml.py` | Rebuilds the Ventisettana as collation-substrate XML → `../ventisettana_rebuilt/` (see below). |
| `DESIGN-ventisettana-rebuild.md` | Design doc for that rebuild. |

## Ventisettana XML rebuild

The previous `ventisettana/` XML could not support the collation (single `<p>`
per chapter, commi unaligned to Q40, `cap31/32` merged, `cap33` an empty stub,
ids colliding with Q40). `build_ventisettana_xml.py` regenerates it from the txt
sources as one `<div type="capitolo">` fragment per chapter — matching the
Quarantana shape — carrying text, comma-aligned `<milestone n>`, and `v27_`-
prefixed `<w xml:id>`:

```sh
python3 prototipo/build_ventisettana_xml.py    # from the repo root
```

**Swapped in on 2026-07-29:** `../ventisettana/` now holds this rebuilt content;
the previous XML is archived at `../ventisettana_old/` (untracked, gitignored) and
serves as the QA baseline. Re-running the script regenerates to a
`../ventisettana_rebuilt/` staging dir (never overwriting the live `ventisettana/`,
so editorial fixes there are safe); promote a new build with a manual swap.

It also writes two review files (now inside `../ventisettana/`):
`TRANSCRIPTION-QA.md` (every word-form disagreement between the txt and the old
XML — the txt is authoritative but the list is for an editor) and
`MILESTONE-RECONCILE.md` (chapters where the txt comma count disagrees with the
Q40 milestone count: `intro`, `cap6`, `cap13`, `cap23`). Full rationale in
`DESIGN-ventisettana-rebuild.md`.

## Reproduce

Both scripts are standard-library Python 3, run from the repo root, and read the
aligned transcriptions in `../01 - I promessi sposi/`:

```sh
python3 prototipo/build_loci.py    # rebuilds loci.json (4 test chapters)
python3 prototipo/collate.py       # prints whole-novel density stats
```

`build_loci.py` reproduces the committed `loci.json` byte-for-byte. After
rebuilding, re-embed it in the viewer if you changed the data (the `<script
id="data">` block near the end of `collazione.html`).

## The viewer

One reading surface, three switchable **modi**, one density **preset**, a base
switch. The **contatore** (top right) is the point: it is how the modes are
compared.

- **Sinottico** — two columns, 1827 left / 1840 right, chronological. The only
  mode that natively holds the long rewritings, because two columns absorb any
  length. Neither column is a reading text.
- **Interlineare** — base line with the alternate reading glossed beneath.
  Available only under the *Riscritture* preset; a gloss that will not fit is
  dropped and the locus stays underlined (dashed), its reading one click away in
  the readout.
- **Base + rivelazione** — clean base text, loci underlined by salience, both
  readings disclosed in a fixed readout region below the column.

**Preset** (the only filter; it subtracts by extent):

| Preset | Rule | ~loci in cap. I | density |
|---|---|---|---|
| Riscritture | salience 3 (≥5 words) | 26 | 1 / 234 words |
| Lingua | everything but punctuation | 607 | 1 / 10 |
| Ogni variante | everything | 769 | 1 / 8 |

**Base** switches which edition reads as the running text — a rendering choice,
never a data property. `op` is always stated chronologically (V27→Q40) and never
flips.

There are **no class filters**. The rule-derived variant classes exist in the
data (`cls`) but are not exposed, because we have no editorial data behind a
typology yet and a rule-generated guess shown in a decision-making prototype
reads as an attribution.

## Findings the prototype produced

1. **~29,800 variants, 1 every 7.2 words** across the whole novel — reproducing
   the spec's §2 figure from independent inputs (`collate.py`).
2. **Normalisation changes the count by ~0.2%** (29,866 → 29,803), *not* the 37%
   the spec feared. That transcription noise is a property of the **TEI** files;
   these plain-text sources already share one character repertoire. Relevant to
   the ongoing Quarantana TEI rebuild.
3. **The interlinear only works with the wordier witness as base.** The 1840
   revision tightens the prose, so with Quarantana as base the 1827 gloss is
   usually longer than the passage it glosses and cannot fit: 13 dropped glosses
   in cap. I with Q40 as base vs 4 with V27. The base switch is therefore *not*
   neutral for this mode — contra the spec's "one-line change" claim (§6.2).
4. **The `[cNNN-pNNN]` markers in the txt sources are a hand-made cross-edition
   paragraph alignment** — the paragraph structure the Ventisettana TEI lacks.
   This is why the prototype collates the txt, not the TEI. See the project
   memory note `project_v27_txt_alignment`.

## Data shape (`loci.json`)

```
{ "c001": { "roman": "I", "n": 769, "paras": [
    { "p": "p001", "only": null, "seg": [
        { "t": "s", "w": "Quel ramo del lago di" },              // shared run
        { "t": "sub", "id": "c001-l0001", "a": "Como", "b": "Como,",
          "cls": "punteggiatura", "sal": 0, "size": 1,
          "cd": [[0,"Como"],[1,","]] },                          // char diff
        ...
] } ] } }
```

`t`: `s` shared · `sub` both differ · `add` 1840-only · `del` 1827-only.
`a` = 1827, `b` = 1840. `sal` 0–3 = extent. `only` = `"a"`/`"b"` when a whole
paragraph exists in one witness only. `cd` present on single-token subs.

## Scope / caveats

- Four chapters only: **I, X, XX, XXVIII** (the §8 test corpus).
- Collated from the plain-text sources; **loci are not yet anchored to the `<w>`
  xml:ids**. That mapping is the first production step (spec §5.2, §6.1).
- Classes are a coarse whitelist with a deliberate `incerto` bucket; not
  editorial.
- `cap31`/`cap32` are one merged file in the V27 TEI and `cap33.xml` is an empty
  stub, so the TEI cannot support this collation as-is — another reason the
  prototype uses the txt.
