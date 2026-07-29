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

## Left open — an editorial decision, not a mechanical one (3 segments)

In these three the **whole** segment is anchored inside text the new edition removes, and
the phrase occurs nowhere else in the chapter (verified: `abbiam detto` 1→0 in cap32,
`ho imparato a guardar` 1→0 in cap38). There is no surviving word between the neighbouring
anchors to move to, so they are deliberately left pointing at the dead ids — the validator
reports them, which is the honest state.

| file | line | anchor | segment text | Italian now removed |
|---|--:|---|---|---|
| translations/French_1877s/cap32.xml | 619 | `c32_13926..c32_13928` | comme nous l'avons dit, | «come abbiam detto;» |
| translations/Russian_1936s/cap32.xml | 606 | `c32_13926..c32_13928` | как мы уже сказали, | «come abbiam detto;» |
| translations/German_1880s/cap38.xml | 934 | `c38_15786..c38_15792` | ich habe gelernt, | «ho imparato a guardar con chi parlo:» |

Note that the surviving «come abbiam **veduto**,» later in cap32 (`c32_14261`–`14263`) is a
*different* phrase in a different place, untouched by the update. It is easy to mistake for
the removed one; the French and Russian segments here read *dit* / *сказали* — **said**,
not seen — so they translate the removed «come abbiam detto», not the survivor.

Three options, all needing a philologist:

1. **Merge** each segment into its neighbour. Preserves every translated word but
   misaligns it — the French *comme nous l'avons dit* would end up anchored to *sopra
   questi e quelli eran delegati*, which is not what it translates.
2. **Drop** the anchor and keep the segment unaligned, recording why.
3. **Reconsider the removal.** Worth noting before choosing: three independent
   nineteenth-century translators — French 1877, German 1880, Russian 1936 — render a
   phrase the new edition deletes. That is testimony that the phrases stood in the
   Quarantana text those translators worked from. It does not settle what the 1840 print
   reads, but it is evidence that belongs in the decision.

Until one is chosen the validator reports 6 broken references (3 segments × target +
targetEnd), plus the one monotonicity flag above. That is intended, not an oversight.

## Unrelated pre-existing failures

`commenti/xml/in_lavorazione/Nigro/cap1.xml` and `.../intro.xml` carry 12 malformed
`target="quarantana"` references with no file or id. They predate this update — no
commentary file was modified — and are listed here only so they are not mistaken for
fallout from it.
