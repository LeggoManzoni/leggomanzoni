# Ventisettana / Quarantana comparison — prototype spec

**Status:** draft for team discussion.
**Goal:** choose between three rendering modes by looking at real text at real variant density.
**Timebox:** ~5 working days, after the prerequisites in §3 have landed.

---

## 1. Scope

**Building:** one viewer, one chapter at a time, rendering the V27/Q40 collation in three switchable modes, with salience presets, class filters, and a base-witness switch. Collation is precomputed offline.

**Not building:** integration with `/confronta`, the commentary rail, translations, search. Deferred until a mode is chosen.

**Why throwaway:** the disagreement in the team is about reading experience at real variant density. That is not settleable on a mockup, because density *is* the problem.

---

## 2. What makes this collation hard

The two editions are **structurally identical and lexically pervasive**. Same 38 chapters, same paragraphs, same sentences — and almost no sentence untouched. The structural surgery happened earlier, between *Fermo e Lucia* and the Ventisettana. What remains between the two printed editions is tens of thousands of micro-loci.

A full-novel run over a plain-text serialisation gives ~30,200 variants across ~218,000 words per edition — **one variant every 7.2 words** — with this size distribution (size = words on the longer side):

| words | variants | share |
|---|---|---|
| 1 | 18,306 | 59.3% |
| 2 | 6,600 | 21.4% |
| 3–4 | 3,936 | 12.7% |
| 5–9 | 1,533 | 5.0% |
| 10–19 | 385 | 1.2% |
| 20–49 | 100 | 0.3% |
| 50+ | 19 | 0.06% |

Median 1, p90 4, p99 12. Of 11,929 one-to-one replacements: 98 pure case, 6,244 within edit distance 2, 5,587 genuine lexical substitutions.

**Consequences that shape the whole design:**

- The design problem is *suppression*, not revelation. Any view that shows all loci is illegible.
- No class filter yields a clean reading text. Even the lexical layer alone is one variant per 39 words. **Salience presets do the subtracting; class filters add back.**
- 225 loci are ≥15 words. They cannot be rendered in an interline. They are also the loci scholars most want.
- These numbers are **provisional** and must be recomputed (see §3.4). They were produced over a tokenisation that differs from the TEI's.

### 2.1 Prior art in the project

PhiloEditor renders the same pair interlinearly, V27 as base, Q40 as superscript gloss. Three defects the prototype must not reproduce:

1. **No scope marking.** The gloss floats with no indication of which base tokens it replaces. Tolerable for `ricomincia`/`rincomincia`; ambiguous for `dai bastioni di Milano che rispondono` → `di su le mura di Milano che guardano`. **Every locus must mark the extent of the base reading.**
2. **No deletions.** Where the non-base witness has text the base drops, there is no base span, and the idiom loses the variant silently.
3. **No salience.** A comma and a rewritten clause render identically.

Secondary: uniform line-height on every line whether or not it carries a gloss; glosses drift from their anchors across line wraps.

---

## 3. Prerequisites

None of §4 onwards can start until these land.

### 3.1 The word ids collide across witnesses

Both witnesses number their `<w>` elements independently from `10001`. In `intro.xml`, **1,261 of the Quarantana's 1,262 word ids also exist in the Ventisettana file**, and Q40's `<figure xml:id="intro_11264">` collides with a V27 `<w>` of the same id.

Nothing is broken today, because `target`/`targetEnd` carry the path. But a fragment can never address a locus, `?loc=intro_10001` is meaningless in URL state, and no merged document is possible.

**Re-prefix the V27 ids** (`v27_intro_10001`, `v27_c20_10001`) across all chapters. Add `@corresp` where a 1:1 word correspondence is known.

### 3.2 The V27 milestones are invalid XML

```xml
<milestone unit="comma" n="1"/>       <!-- Quarantana: correct -->
<milestone unit="comma" xml:id="1"/>  <!-- Ventisettana: invalid -->
```

`xml:id` must be an NCName and cannot begin with a digit. Any conformant validation rejects the file, and the value collides across all 41 chapters. Change to `@n`.

Separately: V27's introduction has 34 commi, Q40's has 35. The comma segmentation must be reconciled before `crosses_comma` means anything.

### 3.3 Normalisation is an editorial act, and it must be written down

The two transcriptions do not share a character repertoire. On the introduction alone:

| | V27 | Q40 |
|---|---|---|
| Apostrophe | `’` U+2019 ×49 | `'` U+0027 ×61 |
| Quotation | `“ ”` U+201C/D | `« »` U+00AB/BB |
| Dash | 5× U+2014, 1× U+2015 | 6× U+2014 |

Disjoint. Every apostrophe-bearing token diffs. Beyond that: the Q40 file is modernised in accentuation (`perché`, `Né`, `Imperciocché`) while V27 keeps the grave (`perchè`, `Nè`, `Imperciocchè`); Q40 is internally inconsistent (`sè` → `se` in one place, `sé` in another); and inside the seicentesco quotation the u/v policy runs in both directions (`vna → una` but `sollevarsi → solleuarsi`).

Collating the introduction as it stands:

| Stage | Loci | Density |
|---|---|---|
| Raw `<w>` tokens | 143 | 1 per 8.8 words |
| After Unicode normalisation | 100 | 1 per 12.6 |
| After case + accent + u/v folding | 90 | 1 per 14.0 |

**37% of the raw diff is a disagreement between our two transcriptions, not between Manzoni's two editions.**

Produce `NORMALISATION.md`: a versioned, written fold policy, signed off by an editor. Minimum folds: Unicode repertoire, accent, case, u/v. Deciding that `perchè ≡ perché` is an editorial judgement and has to be citable.

### 3.4 Recompute the statistics against `<w>`

The figures in §2 came from a plain-text serialisation with free punctuation tokens. Under `<w>` tokenisation a comma insertion is a `sub` with a one-character diff, not an `add`. The introduction, normalised, yields an op breakdown of 96 `replace` / 2 `insert` / 2 `delete` against the plain-text run's novel-wide 77/15/8.

Re-run over `<w>`, after normalisation, and report the new op breakdown and size distribution. **Every density figure in §6.3 and §7.1 depends on this.**

Two internal inconsistencies in the existing figures to resolve while you are there: the op breakdown sums to 30,209 but the size table sums to 30,879 (the published shares reconcile against the latter); and 18,306 size-1 variants minus 4,061 single-word insertions minus 1,911 single-word deletions leaves 12,334 one-word replacements against a reported 11,929. Both gaps are ~2%. Establish which run is authoritative before any number is quoted in a paper.

---

## 4. Input audit

Ship `INPUT-AUDIT.md` before writing a renderer. It must answer:

- **Paragraph and comma counts** per chapter, per witness. V27's introduction is a single `<p>`; Q40's has nine, plus `<hi rend="italic">`, `<figure>`, `<foreign>`. Where V27 has no paragraph structure, `crosses_paragraph` is undefined and the comma is the only usable unit.
- **Tokenisation divergence.** Count standalone-punctuation `<w>` tokens and split elided forms (`d'`, `l'`, `dell'`, …) per chapter per witness. In the Quarantana these are 694 and a handful, against 43,231 glued. Wherever the witnesses tokenise identical text differently, the collation emits a spurious locus.
- **Token arity.** Elision changes it: `una abilità` is 2 `<w>` in V27, `un'abilità` is 1 `<w>` in Q40. Loci are inherently many-to-one and must be range-anchored, never id-paired.
- **Orthographic fidelity.** Grep both witnesses for `capegli`, `giuoco`, `figliuolo`, `spagnuolo`, `de'`, `ne'`, `que'`, `io aveva`. If either file has been silently modernised, that layer of loci does not exist in the source.
- **Are commi 1–5 of the introduction collatable at all?** Inside the seicentesco quotation our two files archaise in opposite directions. Somebody must open a facsimile of each edition. Until then the introduction is the *worst* chapter to demo.

---

## 5. Pipeline (offline, Python)

```
chapter XML (V27) ─┐
                   ├─→ normalise ─→ tokenise ─→ collate ─→ trim_anchors ─→ char-diff ─→ classify ─→ apparatus
chapter XML (Q40) ─┘
```

### 5.1 Normalise

Apply the §3.3 policy as an explicit, versioned stage.

**Run the collation twice — raw and normalised.** A locus present in the raw run and absent from the normalised one is not a variant; it is a discrepancy between our two transcriptions. Emit those to `TRANSCRIPTION-QA.md` with `orthographic_artifact: true`. They never reach the reader. They are a bug report for the editorial team — 53 of them in the introduction alone.

Do not silently discard them. A folded-away locus is a claim that two spellings are the same word, and a philologist must be able to audit that claim.

### 5.2 Tokenise: the `<w>` element is the atom, and it is not ours to change

The TEI is already word-tokenised, with a stable `xml:id` on every `<w>`, and those ids are load-bearing: 41 commentary sets and 35 translation sets anchor to them.

**Do not re-tokenise.** Punctuation is glued to the word (`<w>uggiosa,</w>`). Splitting it into free tokens would renumber every `xml:id` and break every alignment in the project.

Instead:

1. **Normalise the tokenisation exceptions.** Re-glue the standalone-punctuation tokens and the split elided forms into their neighbour, keeping a map back to the original ids. A locus may address a 2-id range where one witness split and the other did not.
2. **Punctuation variants are found by `chardiff`, not by tokenisation.** `Como` → `Como,` is a `sub` on one `<w>` whose character edits fall entirely in the trailing punctuation run. Class `punteggiatura` is assigned on *where the edits land*.

Carry, per token: its `<w>` `xml:id`, its `p` index, its `comma` number. Milestones never enter the token stream as text.

### 5.3 Collate

Chapter-scoped, not paragraph-scoped. Thirteen variants in the novel cross a paragraph boundary; a per-paragraph pipeline with a count assertion would halt on them.

`difflib.SequenceMatcher(autojunk=False)` on token lists is sufficient and deterministic. Do not use an embedding-based aligner: this is same-language, same-structure text, and the loci must be reproducible and citable.

A locus spanning more than one `p` gets `crosses_paragraph: true`; more than one comma, `crosses_comma: true`. Either makes it class `structural`.

### 5.4 `trim_anchors()` — mandatory post-pass

For every `sub` locus, strip the longest common token prefix and the longest common token suffix from the two readings and re-emit them as `same`. If one side empties, re-type the locus as `add` or `del`.

Without this, the aligner reports insertions as substitutions on an adjacent surviving token: `")" → 171 words`, `"malcomposta" → 136 words`. These are not one-word-to-many rewritings; they are new 1840 passages whose seam landed on a punctuation anchor. After the pass, `")" → 171 words` becomes `same(")")` + `add(171 words)`, which is the correct description.

Record `seam_trimmed: n` (tokens shed) on each affected locus.

**Acceptance test.** After `trim_anchors()`, the median and p90 of the size distribution are unchanged (1 and 4). The p99 drops. The "longest variant" table is substantially re-typed from `sub` to `add`/`del`. **If the median moves, the pass is wrong.**

### 5.5 Intra-locus character diff

For every `sub` locus where both readings are a single token, compute a character-level diff and store it. About 21% of all variants are single-token replacements at edit distance ≤2 or pure case. Rendering them as one or two highlighted characters instead of a highlighted word removes a fifth of the visual noise at zero information cost.

The word remains the locus atom — ids, salience, citation all operate on words. The character diff is display metadata.

### 5.6 Do not diff in the browser

Chapter I alone produces several hundred loci. Precompute.

---

## 6. Data contract

The three modes are pure renderers over this.

### 6.1 Locus anchoring

A locus addresses each witness the way a comment lemma or a translation segment already does:

```xml
<note xml:id="finnish_1910_cap20-n1" type="comm"
      target="quarantana/cap20.xml#c20_10001"
      targetEnd="quarantana/cap20.xml#c20_10062">
```

So:

```json
{
  "id": "cap20-l0031",
  "anchor": {
    "V27": { "target": "ventisettana/cap20.xml#v27_c20_10011", "targetEnd": "…#v27_c20_10014" },
    "Q40": { "target": "quarantana/cap20.xml#c20_10011",       "targetEnd": "…#c20_10013" }
  },
  "op": "sub",
  "rdg": { "V27": "la canizie dei pochi capegli", "Q40": "bianchi i pochi capelli" },
  "chardiff": null,
  "class": "lessico",
  "confidence": 0.5,
  "salience": 3,
  "distance": 14,
  "size": 5,
  "comma": 3,
  "p": 2,
  "crosses_paragraph": false,
  "crosses_comma": false,
  "crosses_sentence": false,
  "seam_trimmed": 0,
  "linked_with": null,
  "orthographic_artifact": false
}
```

Canonical `id` derives from the V27 range. Add a `witness_sha` per witness to the file header: the base text moves (the last commit on `main` is *"Rebuild concordance after Quarantana corrections"*), and when it does the apparatus must be revalidated, not silently trusted.

### 6.2 Field notes

- **`op` is stated in chronological direction (V27 → Q40) and never flips.** `add` = present in Q40 only. `del` = present in V27 only. `sub` = both, different. Which witness is *base* is a rendering choice, not a data property. This makes the base switch a one-line change, and it declines to treat either edition as the corrected form of the other.
- **`rdg` is witness-keyed**, never `base`/`variant`. Same reason.
- **`chardiff`** — for single-token `sub` only: `[[0,"cap"],[-1,"eg"],[1,"ell"],[0,"i"]]` (diff-match-patch convention). `null` otherwise.
- **`size`** = words on the longer side, computed **after** `trim_anchors()`.
- **`crosses_sentence`** — spans a full stop. 335 in the novel. Relevant to interlinear layout.
- **`linked_with`** — locus id of a hand-confirmed counterpart. See §6.5. Null by default.

### 6.3 Classification

`class` ∈ `punteggiatura` | `fonomorfologia` | `lessico` | `sintassi` | `tono` | `structural` | `incerto`, with a `confidence` float.

| Class | Rule | Confidence |
|---|---|---|
| `structural` | `crosses_paragraph` or `crosses_comma` | 1.0 |
| `punteggiatura` | all `chardiff` edits fall in a leading/trailing punctuation run | 1.0 |
| `fonomorfologia` | 1:1 sub **and** matches a named rule below | 0.9 |
| `sintassi` | token counts differ, or same token multiset reordered | 0.5 |
| `lessico` | 1:1 sub, different lemma, no rule match | 0.5 |
| `tono` | never auto-assigned | — |
| `incerto` | everything else | 0.0 |

**The rule table is a whitelist, not a distance threshold.** A 1:1 replacement is `fonomorfologia` only if it matches a *named* rule. Edit distance alone misclassifies: `cangiando → cambiando` and `guatare → guardare` are both distance 2 and both are lowerings of literary tone, not orthography.

```
troncamento / apocope   trascrivere→trascriver, pensare→pensar, prendere→prender,
                        abbiamo→abbiam, erano→eran, risolvono→risolvon
elisione                una abilità→un'abilità, come è→com'è, che è→ch'è, ci erano→c'eran
                        [changes token arity: 2 <w> → 1 <w>]
-uolo → -olo            figliuolo→figliolo, spagnuola→spagnola
uo → o after palatal    giuoco→gioco
-egli → -elli           capegli→capelli
dei/nei/quei → de'/ne'/que'
imperfect -a → -o       io aveva→io avevo, diceva io→dicevo
ad + cons → a           ad ogni→a ogni, ad→a
-ii → -i                principii→principi, testimonii→testimoni, dubbii→dubbi
doppioni                fra→tra, dimandare→domandare
enclisi → proclisi      suol dirsi→si suol dire, mettervi→metterci
```

`tono` is a human judgement. Ship `overrides.csv` (`locus_id,class,linked_with,note`), applied last, overriding the rules. Populate one chapter so we can see whether the class filters earn their keep.

### 6.4 Salience

Integer 0–3, computed **after** `trim_anchors()` — raw span length before trimming is contaminated by seam placement.

| Salience | Rule | Approx. count | Per chapter | Density |
|---|---|---|---|---|
| 0 | punctuation-only, pure case, or `fonomorfologia` at distance ≤1 | — | — | — |
| 1 | any other single-word variant | 18,306 | ~482 | 1 / 12 words |
| 2 | size 2–4 | 10,536 | ~277 | 1 / 21 words |
| 3 | size ≥5, **or** `structural`, **or** `linked_with` set | 2,037 | ~54 | 1 / 107 words |

Recompute against `<w>` (§3.4) before these drive a default. Expose the threshold.

### 6.5 Split and moved loci

Two cases the aligner cannot resolve.

**Split loci.** `suol dirsi → si suol dire` arrives as two *non-adjacent* loci: an `insert` of `si`, then a `replace` of `dirsi` → `dire`, with equal tokens between. `trim_anchors()` cannot merge them. Detect candidates — an `insert`/`delete` of a clitic (`si`, `ci`, `vi`, `ne`) within N tokens of a `replace` whose readings differ by an enclitic suffix — and surface them as `linked_with` suggestions for human confirmation. Never link automatically.

**Moved loci.** A relocated passage surfaces as an unrelated `del` in one place and an `add` in another. Do not build move detection. Emit a candidate list of all `add`/`del` loci with `size >= 15` (225 in the novel; 22 at ≥40 words), pairwise-scored by token Jaccard. A philologist links true moves by hand in `overrides.csv`. Twenty-two candidates is hand-checkable; a detector is not worth building for it.

---

## 7. Presets and modes

### 7.1 Presets

| Preset | Rule | Approx. loci | Per chapter |
|---|---|---|---|
| `Lettura` | salience 3 only | 2,037 | ~54 |
| `Lingua` | everything except `punteggiatura` | ~24,000 | ~630 |
| `Tutto` | everything | ~30,200 | ~795 |

Default: `Lettura`. Class filters operate within the preset.

### 7.2 `riv` — Base + rivelazione (build first)

Clean reading text of the base witness. Loci marked. Readings disclosed on demand.

- The **span** of the base reading is underlined. Not a point marker, not a superscript. `border-bottom`, `text-decoration-skip-ink: auto`.
- Underline style encodes salience, not class:
  - salience 1–2: `1px dotted var(--border-strong)`
  - salience 3: `1px solid var(--border-stronger)`
- **Single-token `sub` loci use `chardiff`**: underline only the differing characters. `capegli` shows one marked letter, not a marked word.
- **`del` loci have no base span.** Render `‸` (U+2038) between the adjacent base tokens, `tabindex="0"`, same interaction as a span. With Q40 as base this is 2,522 loci (1,911 single-word, nearly all suppressed by the `Lettura` preset); with V27 as base, 4,535. Carets obey filters like everything else.
- Hover **and** focus **and** tap all disclose. Must work on touch and via keyboard.
- Disclosure target is a **fixed readout region** below the text column, never a floating tooltip. Tooltips fight the commentary popovers in `/confronta` and are hostile on touch. Show: siglum + reading per witness, class, salience, permalink.
- Keyboard: `Tab` between loci; `←`/`→` on a focused locus moves to previous/next and scrolls it into view.
- Filtered-out loci render as plain base text, no underline, out of the tab order.
- Colour never carries information alone. The underline is the marker.
- **Escalation.** A locus with `size >= 15` (~6 per chapter) opens, on activation, a **paragraph-scoped synoptic view** rather than dumping 263 words into the readout.

### 7.3 `int` — Interlineare

Base text at normal size; alternate reading set **beneath** the base span.

- **Only available under the `Lettura` preset.** At `Lingua` or `Tutto` it is one gloss every 7–12 words, i.e. every line. Not ugly — unusable. Disable it there, with a tooltip saying why.
- The gloss goes below the line, not above. Reading order is left-to-right, top-to-bottom; a gloss above interrupts the line before it has been read.
- The base span is still underlined. The gloss aligns to its left edge.
- **Line-height is not uniform.** Only lines carrying a visible gloss get the extra leading. `display: inline-block` on the locus, gloss as a `display: block` child at 13px. Fiddly; do it anyway.
- **Never negative margins on a large locus.** Any locus with `size >= 15` or `crosses_paragraph` collapses to an inline marker — `[+ 171 parole]`, `[≈ 26 → 263 parole]` — that expands to a block below the paragraph. The interline cannot hold them.
- `crosses_sentence` loci (335 in the novel): the gloss may not straddle a sentence break inline; break it or collapse it.
- If a base span wraps across a line, either `white-space: nowrap` below some token count, or repeat the gloss on the continuation line with a leading `…`. Pick one, document which.

### 7.4 `syn` — Sinottico

Two columns, V27 left, Q40 right, chronological order regardless of base.

- **The only mode that handles the 225 long loci natively**, because two columns absorb any length.
- Both readings tinted, one hue per witness. **Not red/green** — those read as wrong/right, and neither witness is wrong. Two neutral hues plus a legend.
- **Scroll sync by paragraph, not by pixel.** The panes have different heights. Anchor on paragraph tops.
- Clicking a locus in either pane highlights its counterpart and brings it into view. `linked_with` pairs get a connector and scroll together.
- Below ~700px width, fall back to stacked paragraph pairs.

### 7.5 Shared chrome

- **Mode switch:** `Sinottico` / `Interlineare` / `Base + rivelazione`.
- **Preset switch:** `Lettura` / `Lingua` / `Tutto`.
- **Base witness switch:** `Ventisettana ⇄ Quarantana`. Affects `riv` and `int` only.
- **Class filters:** seven toggles. Off classes render as plain base text.
- **Locus counter:** `n loci visibili su N`. Non-negotiable — it is how the modes will be compared.
- **Legend:** sigla, hues, underline weights, the caret glyph.
- **URL state:** `?cap=20&mode=riv&base=Q40&preset=lettura&cls=lessico,tono&loc=cap20-l0031`. A scholar must be able to cite a locus. The focused locus scrolls into view on load.

---

## 8. Test corpus

| Chapter | Why |
|---|---|
| I | The incipit. Descriptive prose, moderate density. |
| X | Gertrude. Heavily reworked, long periods. |
| XIX | Contains the `")" → 171 words` insertion. **Acceptance case for `trim_anchors()`**: after the pass it must be `same(")")` + `add`. |
| XX | The Innominato's portrait: `la canizie dei pochi capegli…` → `bianchi i pochi capelli…`, and a clean 2-word `del` (`appena varcati`). **Acceptance case for caret rendering.** |
| XXVIII | The governor's departure. A 26 → 263-word replacement adjacent to an 85 → 15-word replacement — one restructuring reported as two loci. **Acceptance case for block overflow and `linked_with`.** |
| XXXVIII | The ending. Dialogue-heavy. |

Not the introduction — see §4.

Report, per chapter: loci counts by class, by salience, by preset.

---

## 9. Where this lands in the codebase

The app is Express 4 + EJS with server-side XSLT (`xslt-processor`, `xmldom`, `fast-xml-parser`), i18n by cookie, `tify` for IIIF. One `routes/*.js` and one `views/*.ejs` per section.

**Pipeline:** `scripts/collate.py`, alongside `validate_alignment_ids.js`. One command per chapter, `normalise()` and `trim_anchors()` separately testable. Commit it — `scripts/build_concordance.py` is referenced in `package.json` but absent from the repo, so the concordance is not currently reproducible from a clean clone. Do not repeat that.

**Apparatus:** `apparato/capNN.xml`, a stand-off TEI file per chapter, structurally a sibling of `commenti/xml/…/capNN.xml`, with `target`/`targetEnd` into both witnesses. This is the durable artefact; the JSON of §6 is its serialisation for the browser.

**Validation:** extend `scripts/validate_alignment_ids.js` with `apparato/` as a third `REF_DIR`. Route it through the **monotonicity** pass, not the comment pass — that pass is currently applied to translations and skipped for comments, because comment lemmas legitimately nest and overlap. Variant loci are monotonic and non-overlapping by construction, so the strict pass is a free correctness net on the collation itself.

**Viewer:** `routes/collaziono.js` + `views/collaziono.ejs` + `assets/js/collaziono.js`, following the `confronta` pattern. Vanilla JS, no bundler, JSON via `fetch` from `/data`.

**Branch:** `feature/confronta` already exists. Check for conflicts before branching.

**Housekeeping:** `.env` is committed (no credentials leak — `service-account.json` is correctly ignored — but `GA_PROPERTY_ID` and `URL_PATH` are in git history; ship `.env.example` instead). `package-lock.json` is listed in `.gitignore` and committed anyway.

---

## 10. Deliverables

1. `INPUT-AUDIT.md` (§3.4, §4). **First. Before any code that renders anything.**
2. `NORMALISATION.md` — the versioned fold policy. Signed off by an editor, not a developer.
3. `TRANSCRIPTION-QA.md` — every locus present in the raw collation and absent from the normalised one.
4. A patch re-prefixing the V27 `xml:id`s and fixing the milestone `@xml:id` → `@n` across all V27 chapters.
5. `scripts/collate.py`.
6. `apparato/capNN.xml` for the six test chapters.
7. `data/loci/cap*.json`.
8. `scripts/validate_alignment_ids.js`, extended. Green before anything renders.
9. `routes/collaziono.js` + `views/collaziono.ejs` + `assets/js/collaziono.js`.
10. `overrides.csv` — template; one chapter populated if a philologist has time.
11. A paragraph in the PR describing what surprised you.

---

## 11. Decisions required before implementation

Blocking. Not the developer's to make.

1. **Who owns the normalisation policy, and who fixes the files?** Everything waits on this. Until §3.3 is written and signed, the collation has no evidentiary status.
2. **Which witness is base by default?** PhiloEditor uses V27, giving the genetic reading direction. Q40 is the text everyone has read and the one our commentaries and translations anchor to. Q40 as base also yields fewer carets (2,522 vs 4,535), though `Lettura` suppresses most either way. The prototype makes it a toggle so we decide by using it.
3. **Does `Lettura` at ~54 loci per chapter satisfy anyone?** It is the only density at which the novel reads. It also shows ~6.6% of the revision, and the least characteristic 6.6%. If nobody finds it useful, `riv` is not our default and the layering must be rethought.
4. **Is the apparatus a `<listApp>` of `<app>`, or a `<note type="var">` reusing the commentary schema?** The second is cheaper — `convert.js` already parses it, the validator already walks it, the rendering path exists. The first is what TEI is for and what a reviewer will expect.
5. **Do variant loci compete with commentary lemmas for the same anchor?** A comment on `c20_10011–10014` and a variant on `c20_10011–10013` will both want to underline. Two layers, one span. Decide the rule first.
6. **Route name.** `/confronta` is taken by commentary comparison. `/collaziono` fits the first-person pattern of `leggo` / `traduco` / `vedo` / `ricerco`.
7. **What is the V27 source, and can we cite it?** If our XML derives from a modernised e-text, we have a philological problem, not an engineering one.
