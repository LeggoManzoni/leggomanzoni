# Translation re-anchoring after the Quarantana documentary-text update

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
| `cap38` | removal, not yet checked against the facsimile — see the open item below |

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
   since a moved phrase is exactly what the current window misses. `cap38`
   («ho imparato a guardar con chi parlo:», 7 tokens, p. 745 `z_0751_l15`–`l20`) is the
   largest and carries identical certification wording.

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

## Left open — one segment

| file | line | anchor | segment text | Italian removed |
|---|--:|---|---|---|
| translations/German_1880s/cap38.xml | 934 | `c38_15786..c38_15792` | ich habe gelernt, | «ho imparato a guardar con chi parlo:» |

`ho imparato a guardar` occurs nowhere else in the novel (1→0), so unlike cap32 and cap12
there is no position to re-anchor to. **But cap38 carries the same "certified 2026-07-25:
the surrounding line matches the verified ground truth" wording that proved unreliable for
cap32, so it deserves the same check against the facsimile** — page 745, `z_0751_l15`–`l20`,
before anything is concluded. The evidence currently available points the other way from
cap32: French, Polish, Russian and Finnish all skip `c38_15785` → `c38_15793`, so no
translation renders the clause.

A note on a look-alike: the surviving «come abbiam **veduto**,» later in cap32
(`c32_14261`–`14263`) is a *different* phrase in a different place, untouched throughout. It
is easy to mistake for the restored one; the French and Russian segments read *dit* /
*сказали* — **said**, not seen.

Three options, all needing a philologist:

1. **Merge** each segment into its neighbour. Preserves every translated word but
   misaligns it — the French *comme nous l'avons dit* would end up anchored to *sopra
   questi e quelli eran delegati*, which is not what it translates.
2. **Drop** the anchor and keep the segment unaligned, recording why.
3. **Reconsider the removal** — but the evidence does not support this, and for cap38 it
   runs the other way. See below.

Until one is chosen the validator reports 6 broken references (3 segments × target +
targetEnd), plus the one monotonicity flag above. That is intended, not an oversight.

### What the other translations say

Checked across all five translation sets rather than only the broken ones.

**cap38 — the translations corroborate the removal.** French, Polish, Russian and Finnish
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
