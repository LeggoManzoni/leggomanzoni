# Translation re-anchoring after the Quarantana documentary-text update

The 2026 Quarantana adopts the documentary text of the 1840 print and removes tokens the
earlier transcription carried but the print does not — the cap24 dittography, the cap38
interpolated clause, and the `come abbiam detto` / `come abbiam visto` parentheticals.
Ten `xml:id`s disappeared; 25 translation anchors pointed at them. No commentary anchor
was affected.

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

## Left open — an editorial decision, not a mechanical one (4 segments)

In these four the **whole** segment was anchored inside removed text, so there is no
surviving word between the neighbouring anchors to move to. They are deliberately left
pointing at the dead ids: the validator reports them, which is the honest state — the
source text these segments translate is no longer in the edition.

| file | line | anchor | segment text | Italian now removed |
|---|--:|---|---|---|
| translations/French_1877s/cap32.xml | 619 | `c32_13926..c32_13928` | comme nous l'avons dit, | «come abbiam detto;» |
| translations/Russian_1936s/cap32.xml | 606 | `c32_13926..c32_13928` | как мы уже сказали, | «come abbiam detto;» |
| translations/Polish_1882s/cap12.xml | 671 | `c12_14045..c12_14047` | jakeśmy to widzieli, | «come abbiam visto,» |
| translations/German_1880s/cap38.xml | 934 | `c38_15786..c38_15792` | ich habe gelernt, | «ho imparato a guardar con chi parlo:» |

Three options, all needing a philologist:

1. **Merge** each segment into its neighbour. Preserves every translated word but
   misaligns it — the French *comme nous l'avons dit* would end up anchored to *sopra
   questi e quelli eran delegati*, which is not what it translates.
2. **Drop** the anchor and keep the segment unaligned, recording why.
3. **Reconsider the removal.** Worth noting before choosing: four independent
   nineteenth-century translators — French 1877, Polish 1882, German 1880, Russian 1936 —
   each render a phrase the new edition deletes. That is testimony that the phrases stood
   in the Quarantana text those translators worked from. It does not settle what the 1840
   print reads, but it is evidence that belongs in the decision.

Until one is chosen the validator reports 8 broken references (4 segments × target +
targetEnd). That is intended, not an oversight.

## Unrelated pre-existing failures

`commenti/xml/in_lavorazione/Nigro/cap1.xml` and `.../intro.xml` carry 12 malformed
`target="quarantana"` references with no file or id. They predate this update — no
commentary file was modified — and are listed here only so they are not mistaken for
fallout from it.
