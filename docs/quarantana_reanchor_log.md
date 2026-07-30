# Translation re-anchoring after the Quarantana documentary-text update

## Validation state (2026-07-30)

**Structurally and functionally confirmed.** Checked against our copy, including the
cap32 restoration:

| check | result |
|---|---|
| upstream Schematron (`schema/promessi-sposi.sch`) | 42/42 files pass |
| `xml:id` uniqueness across the corpus | 239,335 ids, 0 duplicates |
| `@facs` references resolving into `facsimile.xml` | 21,759 refs, 0 dangling |
| `<w>` tokens | 215,960 |
| all 39 chapters render through both chapter XSLTs | pass |
| commentary anchors | 0 broken of 618k refs |
| translation anchors | 0 broken; 3 monotonicity flags describing real transpositions |
| app routes (reader, confronta, concordanza, chapter/comment/translation fetches) | all 200 |
| concordance | rebuilt, token count agrees |

**Not confirmed philologically, and it should not be read as if it were.** Of the 33
`documentary deletion` entries the edition records, **4 have been checked against the
facsimile**: cap32 (wrong — restored), cap38, cap24, cap12. The other 14 single-token
removals are unverified; the checklist is `quarantana_deletion_audit.md`.

Entirely unexamined here: the edition's **1,274 accent reversions, 140 accent removals,
54 capitalisations and 39 heading changes**. None was checked against the print by us. The
edition's own `editorial-decisions-quarantana.md` flags 68 interior-accent cases as
unreadable even at high magnification and defers them for dedicated review.

Note also that the upstream `docs/validation-report.md` is dated 2026-07-20 and reports
215,954 `<w>`, while the files we received carry 215,957. It predates their final
correction pass and does not describe exactly these files.

The 2026 Quarantana adopts the documentary text of the 1840 print and removes tokens the
earlier transcription carried but the print does not — the cap24 dittography, the cap38
interpolated clause, and the `come abbiam detto` / `come abbiam visto` parentheticals.
Ten `xml:id`s disappeared; 25 translation anchors pointed at them. No commentary anchor
was affected.

Not every dead identifier means deleted text. Of the ten, checked individually against the
old and new files and, where it mattered, against the facsimile image:

| chapter | what actually happened |
|---|---|
| `cap32` | **transposition the upstream missed** — the phrase is in the print, three words later. Restored here; see below |
| `cap12` | transposition, correctly handled upstream (moved and re-identified `…_b/_c/_d`) |
| `cap9` | token merge — `s'uni` + `formavano,` → `s'uniformavano,` |
| `cap24` | dittography — `come ha fatto a quest'altro` occurred twice, now once |
| `cap1`, `cap27` | single words absent from the print (`il Signor`, `sicuramente`) |
| `cap38` | genuine removal — **verified on the facsimile** (p.745): the print runs the two *ho imparato* clauses together |

**A dead id is a question, not a verdict.** Only one of the ten was a plain deletion of text
the print lacks. The rest were moves, merges, or duplicate removals — and one was an error.

## Fixed mechanically (21 references, 17 files)

A dead `target` was moved forward to the next surviving word, a dead `targetEnd` back to
the previous one, so no range extends over text that no longer exists. Order-preserving;
the validator's monotonicity pass is green on all of them.

| file | attribute | was | now |
|---|---|---|---|
| translations/Finnish_1910s/cap24.xml | target | `c24_15276` | `c24_15281` |
| translations/Finnish_1910s/cap27.xml | targetEnd | `c27_12855` | `c27_12854` |
| translations/Finnish_1910s/cap32.xml | targetEnd | `c32_13928` | `c32_13925` |
| translations/French_1877s/cap24.xml | target | `c24_15276` | `c24_15281` |
| translations/German_1880s/cap12.xml | targetEnd | `c12_14047` | `c12_14044` |
| translations/German_1880s/cap24.xml | target | `c24_15276` | `c24_15281` |
| translations/German_1880s/cap27.xml | targetEnd | `c27_12855` | `c27_12854` |
| translations/German_1880s/cap32.xml | targetEnd | `c32_13928` | `c32_13925` |
| translations/Polish_1882s/cap24.xml | target | `c24_15276` | `c24_15281` |
| translations/Polish_1882s/cap27.xml | targetEnd | `c27_12855` | `c27_12854` |
| translations/Polish_1882s/cap32.xml | target | `c32_13926` | `c32_13929` |
| translations/Polish_1882s/cap38.xml | targetEnd | `c38_15792` | `c38_15785` |
| translations/Polish_1882s/cap9.xml | targetEnd | `c9_15843` | `c9_15842` |
| translations/Russian_1936s/cap1.xml | target | `c1_12055` | `c1_12057` |
| translations/Russian_1936s/cap12.xml | target | `c12_14045` | `c12_14048` |
| translations/Russian_1936s/cap24.xml | target | `c24_15276` | `c24_15281` |
| translations/Russian_1936s/cap27.xml | targetEnd | `c27_12855` | `c27_12854` |
| translations/Russian_1936s/cap32.xml | target | `c32_13926` | `c32_13929` |

## cap32 «come abbiam detto» — FIXED HERE, still open upstream

Status: **corrected in `quarantana/cap32.xml`** (commit `15ccc67`). Not yet reported to
`promessi-sposi-quarantana`, so **the next import will silently revert it.**

Everything from here to the end of this section is written to be copied into an upstream
issue as it stands.

---

### Bug report for `promessi-sposi-quarantana`

**Summary.** Three words of the 1840 print are missing from `quarantana/cap32.xml`. The
reading «come abbiam detto» was classified as a Poggi Salani addition and deleted, but it
is present in the print — transposed, not absent. It was removed from the old position and
never emitted at the new one.

**Affected identifiers.** `c32_13926` (`come`), `c32_13927` (`abbiam`), `c32_13928`
(`detto;`) — retired by the 2026-07-20 documentary-text pass.

**Evidence.** Print page 616, facsimile surface `surf_0622`. The phrase falls on line 4
(`z_0622_l04`), while the deletion was assessed on line 3 (`z_0622_l03`):

```
line 3   dati per superiori de' commissari; sopra questi e quelli eran dele-
line 4   gati, come abbiam detto, in ogni quartiere, magistrati e nobili,
```

The eScriptorium HTR for `z_0622_l04` reads: `gati, come abbiam detto, in ogni quartiere,
magistrati e nobili,`. So the print has the phrase after *delegati*, where the Poggi
Salani-based encoding had it after *commissari*.

**Why the certification passed.** `docs/id-changes.md` records all three tokens as
*"documentary deletion — reading present in the initial (Poggi Salani-based) encoding but
absent from the 1840 print; certified 2026-07-25: the surrounding line matches the verified
ground truth (certify_documentary)"*. The check compares the line the deleted token sits
on. Here the phrase moved to the **following** line, so the line it was deleted from does
match ground truth — the token is genuinely absent there — and the check passes while three
words are lost.

`docs/quarantana-poggisalani-collation.md:69` shows the same blind spot in its context
column, which stops one word short of the evidence:

```
| 616 | de'commissari; | de'commissari, come abbiam detto; | …dati per superiori de' commissari; sopra questi e quelli eran dele… |
```

**The pipeline already handles this case correctly elsewhere.**
`docs/editorial-decisions-quarantana.md:108` reports: *"The p.251 transposition moves three
tokens, which receive new `…_b/_c/_d` identifiers per the stable-identifier policy."* That
is cap12 «come abbiam visto», the same phenomenon, correctly detected. cap32 is the same
shape, classified as a deletion instead.

**Suggested fixes.**
1. Restore the reading at its printed position (see the patch below).
2. Widen the certification window: a deleted token must be sought on the neighbouring lines,
   not only its own, before "absent from the print" is concluded. Same for the collation
   table's context column.
3. Re-run the check over the other 32 certified deletions — the multi-token ones especially,
   since a moved phrase is exactly what the current window misses. Two have since been
   checked by eye and are **correct**: `cap24` (the `come ha fatto a quest'altro`
   dittography) and `cap38` («ho imparato a guardar con chi parlo:», 7 tokens, p. 745 —
   the print runs the two *ho imparato* clauses straight together, so nothing is missing
   there). `cap12` was correctly detected as a transposition by the pipeline itself. That
   leaves the remaining single-token deletions unverified; a downstream checklist with page
   and line for each is at `docs/quarantana_deletion_audit.md`.

**Patch applied downstream**, following the print and the `_b/_c/_d` convention:

```xml
<!-- was: <w xml:id="c32_13934">dele<lb .../>gati</w><w xml:id="c32_13935">in</w> -->
<w xml:id="c32_13934">dele<lb n="4" facs="facsimile.xml#z_0622_l04" break="no" rend="hyphen"/>gati,</w>
<w xml:id="c32_13934_b">come</w>
<w xml:id="c32_13934_c">abbiam</w>
<w xml:id="c32_13934_d">detto,</w>
<w xml:id="c32_13935">in</w>
```

Note `c32_13934` also gains the comma the print shows before *come*. Token count 215,957 →
215,960.

**Corroboration.** Two nineteenth-century translations aligned to this edition carry the
phrase as its own segment and had been left with dead anchors by the deletion: French 1877
*"comme nous l'avons dit,"* and Russian 1936 *"как мы уже сказали,"*. German 1880, Polish
1882 and Finnish 1910 do not render it, which is unremarkable in free translation of a
discourse marker.

---

### Consequences here

`translations/French_1877s/cap32.xml` (line 619) and `translations/Russian_1936s/cap32.xml`
(line 606) are re-anchored to `c32_13934_b..c32_13934_d`. Both are true alignments now
rather than dead references. Each trips the monotonicity pass, correctly: the phrase moved
past text their neighbouring segments already cover, so the translation order and the
Italian order genuinely cross. The mechanical fixes in the table above were re-checked after
the restoration and remain correct — Finnish and German end at `c32_13925`, and the Polish
segment `c32_13929..c32_13940` now simply contains the restored phrase.

## A transposition, correctly re-anchored (1 segment)

**`translations/Polish_1882s/cap12.xml` line 671 — «come abbiam visto,».** An earlier
draft of this note listed it as orphaned. That was wrong: the phrase is **not** removed,
it moved.

- **old:** quel pensiero gli era venuto, *come abbiam visto,* da principio, e gli tornava, ogni momento.
- **new:** quel pensiero gli era venuto da principio, e gli tornava, *come abbiam visto,* ogni momento.

The move minted new identifiers (`c12_14052_b`–`_d`, per the edition's stable-identifier
policy) and retired the old ones. The Polish segment now points at the phrase's real
position, so the alignment is true.

It does trip the validator's monotonicity pass, because the phrase moved *into* the span
the next Polish segment already covers (`c12_14048..c12_14054`), so the Polish segment
order and the Italian order now genuinely cross. That flag is a correct report of a
transposition, not a data error. Forcing monotonicity here would mean falsifying the
alignment to satisfy the checker.

## cap38 — removal verified against the facsimile, German segment repaired

**Checked on the page (2026-07-30), page 745, `z_0751_l15`–`l20`. The print reads:**

> ho imparato a non predicare in piazza: ho imparato a non alzar…

There is no «ho imparato a guardar con chi parlo:» — the two *ho imparato* clauses run
straight into each other. **The upstream removal of `c38_15786`–`c38_15792` is correct**,
and cap38 is not a second cap32. This is the check that had to be done by eye: the phrase
occurs nowhere else in the novel (1→0), and four of five translations already skipped the
span, but after cap32 neither of those was sufficient to conclude on.

What remained was a defect on our side, older than this update. The German 1880 rendering
of the passage is an anaphora, *ich habe gelernt, …* repeated for each clause, and the
aligner had split one instance of the opener onto the deleted span, leaving the following
segment without it:

| | before | after |
|---|---|---|
| `c38_15779..15785` | ich habe gelernt, auf offener Straße nicht zu predigen, | unchanged |
| `c38_15786..15792` | *ich habe gelernt,* ← orphan on deleted text | **removed** |
| `c38_15793..15800` | nicht über den Durst zu trinken; | **ich habe gelernt,** nicht über den Durst zu trinken; |

The Italian at `c38_15793..15800` is «ho imparato a non alzar troppo il gomito:», so the
merged segment is now a complete and correct rendering of it, and the German anaphora runs
unbroken across `n898`, `n900`, `n901`, `n903` as it does in the source. `note`
`german_1880_cap38-n899` is removed; it was referenced nowhere.

**With this, no broken reference remains from the update.** The validator reports 15
issues: 12 pre-existing malformed refs in `commenti/Nigro/` (unrelated, see below) and 3
monotonicity flags that correctly describe real transpositions (Polish cap12, French and
Russian cap32).

A note on a look-alike: the surviving «come abbiam **veduto**,» later in cap32
(`c32_14261`–`14263`) is a *different* phrase in a different place, untouched throughout. It
is easy to mistake for the restored one; the French and Russian segments read *dit* /
*сказали* — **said**, not seen.

### What the other translations say

Checked across all five translation sets rather than only the broken ones.

**cap38 — the translations corroborate the removal, and the facsimile confirms it.** French, Polish, Russian and Finnish
all jump straight from `c38_15785` to `c38_15793`: none of them has a segment over the
removed clause, exactly as the new edition has no text there. Only German does, and its
content is not a rendering of «ho imparato a guardar con chi parlo:» — it is the stock
anaphora opener, mis-split off the following clause:

```
15779..15785  ich habe gelernt, auf offener Straße nicht zu predigen,   complete
15786..15792  ich habe gelernt,                                         orphan
15793..15800  nicht über den Durst zu trinken;                          missing its opener
```

Merging the orphan into the following segment restores *ich habe gelernt, nicht über den
Durst zu trinken;* = «ho imparato a non alzar troppo il gomito:». **Recommended fix:** do
that merge. It is a repair of a pre-existing alignment defect that the update exposed, not
a concession to it.

**cap32 — the two translations that rendered it were right.** French 1877 (*comme nous
l'avons dit,*) and Russian 1936 (*как мы уже сказали,*) carry the phrase; German, Polish and
Finnish show no corresponding words. An earlier draft of this note read that 2-of-5 split as
weak testimony against the phrase. The facsimile then showed the phrase is in the print, so
the two that render it were simply right and the three that do not had dropped a discourse
marker, which is ordinary in a free translation.

The general lesson, since this note got it wrong in both directions before the image
settled it: **a translation's silence is not evidence of absence, and a machine-certified
deletion is not evidence of absence either.** Only the page is. Where a removal matters,
look at the facsimile — `<pb>`/`<lb>` give the surface and line for every token.

## Unrelated pre-existing failures

`commenti/xml/in_lavorazione/Nigro/cap1.xml` and `.../intro.xml` carry 12 malformed
`target="quarantana"` references with no file or id. They predate this update — no
commentary file was modified — and are listed here only so they are not mistaken for
fallout from it.
