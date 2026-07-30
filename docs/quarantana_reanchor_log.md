# Translation re-anchoring after the Quarantana documentary-text update

The 2026 Quarantana adopts the documentary text of the 1840 print and removes tokens the
earlier transcription carried but the print does not — the cap24 dittography, the cap38
interpolated clause, and the `come abbiam detto` / `come abbiam visto` parentheticals.
Ten `xml:id`s disappeared; 25 translation anchors pointed at them. No commentary anchor
was affected.

Not every dead identifier means deleted text. Of the ten, checked individually against the
old and new files: `cap32` and `cap38` are genuine removals; `cap12` is a **transposition**
(the phrase moved and was re-identified); `cap9` is a **token merge** (`s'uni` +
`formavano,` → `s'uniformavano,`, one of the run-together splits the CHANGELOG records);
`cap24` is the dittography (`come ha fatto a quest'altro` occurred twice, now once); `cap1`
and `cap27` drop single words the print lacks (`il Signor` → `Don Giovanni`, and
`sicuramente`). A dead id is a question, not a verdict.

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

## An upstream error, corrected locally: cap32 «come abbiam detto»

**This was not a deletion either.** The phrase is in the 1840 print — page 616,
`z_0622_l04` — but positioned after *delegati*, not after *commissari* where the earlier
Poggi Salani-based encoding had it:

> …dati per superiori de' commissari**;** sopra questi e quelli eran dele-gati**, come
> abbiam detto,** in ogni quartiere, magistrati e nobili…

The upstream edition removed it from the old position and never restored it at the new
one, so three words of the print were lost. Its own documentation shows how:
`id-changes.md` records the three tokens as *"documentary deletion — absent from the 1840
print; certified 2026-07-25: the surrounding line matches the verified ground truth"*, and
the collation table that drove it (`quarantana-poggisalani-collation.md:69`) quotes the
context as *"…eran dele"* — truncated one word before the evidence. The certification
checked the line the deletion was on; the phrase had moved to the line below. The same
file's summary shows the pipeline handles this case correctly elsewhere: *"The p.251
transposition moves three tokens, which receive new `…_b/_c/_d` identifiers."* That is
cap12. cap32 is the same transposition, misclassified.

**Restored** in `quarantana/cap32.xml` following the print and the pipeline's own
convention: `c32_13934` gains the print's comma (`delegati,`) and three new tokens
`c32_13934_b`/`_c`/`_d` carry `come abbiam detto,`. The French and Russian segments are
re-anchored to them, so both are now true alignments rather than dead references.

**Report this upstream.** The fix belongs at the source; ours will be overwritten by the
next import otherwise. Worth asking the maintainers whether the truncated-context
certification affected other entries — cap38 below carries the identical wording.

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
