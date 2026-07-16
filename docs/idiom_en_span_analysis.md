# English idiom-span extraction & alignment audit

**Corpus:** `data/idioms_verified_en_span.xlsx` (sheet `verified`)
**Source of truth:** `data/idioms_verified.xlsx` (unchanged)
**Date:** 2026-07-16

This document records how the `en_span` column was produced, the audit of the
non-cleanly-aligned rows, the alignment fixes applied, and an exploration of
which idioms the three English translators dropped.

---

## 1. What was produced

A new final column **`en_span`** was added to each of the 2,700 rows: the exact
English phrase that renders the Italian idiom marked in `it_span` (between the
`⟦ ⟧` brackets inside `it_segment`), copied **verbatim** as a contiguous
substring of `en_segment`.

| | Count |
|---|---|
| Total rows | 2,700 |
| `en_span` filled | **2,699** |
| — of which `[omitted]` (idiom dropped by translator) | 77 |
| Blank | 1 (row 2582 — no English segment exists) |

The three translators are Henry Francis C. Logan (1845), Bruce Penman (1972),
and Michael Moore (2022); each idiom occurrence appears once per translator
(900 idiom occurrences × 3 = 2,700 rows).

---

## 2. Method

1. **Scope.** The 2,622 "clean" rows (`match_status = ok` AND `aligned = yes`)
   were extracted first; the remaining 78 rows were audited separately (§3).
2. **Extraction.** A fan-out workflow ran one **Claude Sonnet** sub-agent per
   ~50-row chunk (53 chunks). Each returned `{rid, en_span}`, where `en_span`
   is the minimal contiguous English idiomatic phrase, or `[omitted]` when the
   translator dropped the idiom.
3. **Model choice.** A head-to-head on the same 50 rows showed Sonnet matched
   Opus on quality *and* correctly preserved **negation/polarity** words that a
   naive "minimal phrase" instruction had caused Opus to strip (e.g. `non era
   nato con un cuor di leone` → "**not** born with the heart of a lion", not
   "born with the heart of a lion"). The extraction prompt was patched with an
   explicit preserve-polarity rule before the full run.
4. **Validation.** Every span was checked to be an exact substring of its
   `en_segment` (0 failures across 2,622 rows; 1 manual negation fix, row 102).

---

## 3. Alignment audit of the 78 non-clean rows

The 78 rows carried `aligned = partial` (74), `aligned = no` (1),
`straddle` (2), or `no_segment` (1). **Key finding: "not cleanly aligned" does
not mean "the idiom is missing."** `partial` is a *segment-boundary* flag — the
aligner's English window pulled in adjacent sentences or omitted a neighbouring
clause. The note attached to each row describes the whole segment and is shared
by every idiom in that sentence.

Reading all 78 against the actual English text gave:

| Verdict | Count | Meaning |
|---|---|---|
| **Idiom present** | 54 | The idiom *is* rendered; only the boundary is off. Extracted normally. |
| **Idiom genuinely dropped** | 18 | Translator cut/compressed the idiom clause. Correct alignment. Marked `[omitted]`. |
| **Boundary offset (recoverable)** | 4 | The idiom *was* translated, but it landed in the adjacent segment. Recovered (§4). |
| **Free paraphrase** | 1 | row 795 — Penman rendered the idiom non-literally; alignment verified correct (§4). |
| **No segment** | 1 | row 2582 — Logan's edition has no counterpart; left blank. |

The 54 "present" rows were filled with verbatim spans located in their own
`en_segment` — no model calls, matched with quote/dash-tolerant search so every
value is a guaranteed exact substring.

---

## 4. Alignment fixes applied

Five rows were corrected beyond the plain extraction:

| Row | Idiom | Fix | `en_span` |
|---|---|---|---|
| **795** | `Eccone un'altra delle vostre` | Verified **correctly aligned** via Penman note `n154` (n153/n155 line up). Free paraphrase, not a drop. | `What do you think you're talking about?` |
| **1604** | `li faremo rigar diritto i fornai` | **Source alignment bug — fixed at source** (§7, cap13). | `make the bakers keep to a straight path` |
| **2290** | `un monte di disordini, un'iliade di guai` | **Source alignment bug — fixed at source** (§7, cap19). | `a mountain of troubles, an Iliad of disorder` |
| **2327** | `come se niente fosse` (Logan) | **Source alignment bug — fixed at source** (§7, cap19). | `as though nothing had been` |
| **2329** | `come se niente fosse` (Moore) | **Source alignment bug — fixed at source** (§7, cap19). | `as if nothing had happened` |

All four boundary bugs (1604, 2290, 2327, 2329) were fixed at the source and the
corpus rebuilt, so **every filled `en_span` is now a verbatim substring of its
own `en_segment`** — the cross-segment whitelist is empty. Row 795 was verified
correctly aligned (a free paraphrase) and filled normally.

### Alignment bug found in the source annotation (row 1604)

In the macaronic Ferrer passage (`cap13`), Logan *did* translate `li faremo
rigar diritto i fornai` as **"we will make the bakers keep to a straight path"**,
but that text sits in note **`English_1845_cap13-n169`** (tokens
`c13_14618–14651`). The idiom's tokens were mapped to the **following** note
`n170` ("Long live the King… He is badly off… Animo; estamos ya quasi fuera"),
which is why it appeared dropped. This was a genuine boundary error in the
translation `<note target/targetEnd>` annotation. **It has now been fixed at the
source and the corpus rebuilt — see §7.**

---

## 5. What idioms did the translators drop?

Across the corpus, **77 idiom occurrences were dropped** (`en_span = [omitted]`):
60 in cleanly-aligned rows plus the 17 genuine drops from §3 (the 18th, `Sta
fresco` in cap13, turned out to be rendered once the source alignment was fixed
— §7).

### Drop rate by translator

| Translator | Dropped | Rate |
|---|---|---|
| Logan (1845) | 30 / 900 | **3.3 %** |
| Moore (2022) | 27 / 900 | 3.0 % |
| Penman (1972) | 20 / 900 | **2.2 %** |

Logan (the oldest, most abridging translation) drops the most; Penman the
fewest. All three are within a narrow 2–3.5 % band — idiom omission is rare.

### Drop rate by idiom type

| Type | | Dropped | Rate |
|---|---|---|---|
| `EI` | idiomatic expression | 70 / 2331 | 3.0 % |
| `P` | proverb | 3 / 90 | 3.3 % |
| `BI` | biblical idiom | 1 / 33 | 3.0 % |
| `Pr` | proverbial phrase | 3 / 246 | **1.2 %** |

Fixed proverbial phrases are dropped least — translators evidently work harder
to preserve set proverbs than ordinary idiomatic turns.

### What gets dropped — the pattern

The idioms dropped by **more than one** translator are almost all
**semantically light discourse markers**, not vivid images:

| Dropped by | Idiom | Sense |
|---|---|---|
| all 3 | `a buon conto` | "in any case / for now" (filler) — the single most-dropped idiom, cut across several occurrences |
| all 3 | `alla fin de' fatti` | "when all's said and done" (filler) |
| all 3 | `che starebbe fresco` / `sta fresco` | "he'd be in for it / fat chance" (hard-to-render colloquialism) |
| 2 | `Pezzo d'asino` | "you blockhead" (vocative insult) |

The takeaway: translators drop **connective filler** (`a buon conto`, `alla fin
de' fatti`) and **untranslatable colloquial retorts** (`sta fresco`) far more
than concrete metaphors — vivid idioms like `lavarsene le mani` or `uccel di
bosco` are essentially always rendered. Drops also cluster in the
dialogue-dense early chapters (cap7–9 account for ~30 % of all drops).

---

## 6. Remaining gap

- **row 2582** (`la piglia con me?`, Logan) — `match_status = no_segment`; the
  1845 edition has no aligned English segment (both `it_segment` and
  `en_segment` are empty). Left blank; nothing to recover without locating the
  passage in Logan's text.

---

## 7. Source fix applied (cap13 Ferrer passage)

The row-1604 bug was **fixed at the source**, not just patched in the corpus.
Inspecting the raw tokens showed the *whole* passage's note alignment was
shifted by one clause — `n169`/`n170`/`n171` each pointed one segment too early.
Mapping each English note to the Italian tokens it actually translates:

| Note (English_1845/cap13.xml) | target..targetEnd (before → after) |
|---|---|
| `n169` …villain → *"make the bakers keep to a straight path"* | `14618..14651` → `14618..14672` |
| `n170` Viva il re → *"He is badly off"* → Animo | `14652..14682` → `14673..14692` |
| `n171` *"They had, in fact, passed through…"* | `14683..14709` → `14693..14709` |

`scripts/build_idiom_parallel.py` was rerun (no LLM calls); the diff changed
**exactly 3 rows** and cascaded to all three idioms in the passage:

| Row | Idiom | Before | After (correct) |
|---|---|---|---|
| 1601 | `La passerà male, la passerà male` | "He is badly off—he is badly off" *(wrong)* | "He will pass a miserable quarter of an hour — he will pass a miserable quarter of an hour" |
| 1604 | `li faremo rigar diritto i fornai` | *appeared dropped* | "make the bakers keep to a straight path" |
| 1607 | `Sta fresco, sta fresco` | `[omitted]` *(wrong)* | "He is badly off—he is badly off" |

All three are now `match_status = ok`, `aligned = yes`, with `en_span` a clean
substring of the corrected `en_segment`. `data/idioms_parallel.{xlsx,json}`,
`data/idioms_verified.xlsx`, and `data/idioms_verified_en_span.xlsx` were all
updated; the LLM verification pass was **not** rerun (the fix was verified by
hand). This is why the drop total is 77, not 78.

### The same bug in cap19 (three more idioms)

The three "offset" cases turned out to be **identical boundary bugs** and were
fixed the same way. In both the "measure" speech and the Ripamonti passage the
note boundary sat one clause too late, so the idiom's tokens attached to the
preceding note whose English does not translate them:

| File / notes | target..targetEnd (before → after) | Idiom recovered |
|---|---|---|
| `English_2022/cap19.xml` `n67`/`n68` | `…12112` / `12113…` → `…12095` / `12096…` | `un monte di disordini` → "a mountain of troubles, an Iliad of disorder" |
| `English_1845/cap19.xml` `n122`/`n123` | `…13462` / `13463…` → `…13448` / `13449…` | `come se niente fosse` (Logan) → "as though nothing had been" |
| `English_2022/cap19.xml` `n126`/`n127` | `…13462` / `13463…` → `…13448` / `13449…` | `come se niente fosse` (Moore) → "as if nothing had happened" |

The rebuild touched 6 rows: the 3 idioms above (now `ok`/`aligned`) plus 3
neighbours (`Si stuzzica un vespaio`, `che ci venga in taglio` ×2) whose
`seg_start_id` shifted but whose `en_segment` text and `en_span` are unchanged.
Penman's versions were already aligned, so `English_1972` was left untouched.

**Net effect of all source fixes (cap13 + cap19): 6 idioms across 4 note-boundary
corrections, and the cross-segment `en_span` whitelist is now empty.**

---

## Appendix — full list of dropped idioms (77)

`clean` = cleanly-aligned row where the translator dropped the idiom;
`partial` = partial-alignment row confirmed as a genuine drop.

| Chapter | Idiom (Italian) | Translator | Alignment |
|---|---|---|---|
| cap1 | congegnate come in cifra | Logan 1845 | clean |
| cap1 | lei ci metterebbe in sacco | Moore 2022 | clean |
| cap2 | Che abbia qualche pensiero per la testa | Penman 1972 | partial |
| cap2 | stava all'erta | Moore 2022 | clean |
| cap3 | non sapeva dove batter la testa | Logan 1845 | clean |
| cap3 | è come la valle di Giosafat | Penman 1972 | clean |
| cap4 | comprandosi così a contanti inimicizie | Logan 1845 | clean |
| cap4 | c'è stato tirato per i capelli | Logan 1845 | partial |
| cap4 | restassero serviti (così si diceva allora) di venir da lui | Logan 1845 | clean |
| cap5 | tirar dalla mia | Logan 1845 | clean |
| cap5 | quel signor dottor delle cause perse | Logan 1845 | clean |
| cap5 | L'avrebbe mandato a spasso volentieri | Moore 2022 | clean |
| cap6 | Esci con le tue gambe | Logan 1845 | partial |
| cap6 | non arrivavano agli orecchi del padrone | Moore 2022 | clean |
| cap6 | fare il diavolo | Penman 1972 | clean |
| cap7 | vado in furia | Penman 1972 | clean |
| cap7 | si sentiva venir, come si dice, i bordoni | Logan 1845 | clean |
| cap7 | e me ne rido | Moore 2022 | partial |
| cap7 | portare il soccorso di Pisa | Logan 1845 | clean |
| cap7 | Si starebbe freschi | Penman 1972 | clean |
| cap7 | con tanta gente che va e viene | Penman 1972 | clean |
| cap7 | di punto in bianco | Logan 1845 | clean |
| cap8 | alla fin de' fatti | Penman 1972 | clean |
| cap8 | alla fin de' fatti | Logan 1845 | partial |
| cap8 | alla fin de' fatti | Moore 2022 | partial |
| cap8 | a buon conto | Penman 1972 | clean |
| cap8 | a buon conto | Logan 1845 | clean |
| cap8 | a buon conto | Moore 2022 | clean |
| cap8 | a buon conto | Penman 1972 | clean |
| cap8 | a buon conto | Moore 2022 | clean |
| cap8 | andati a monte | Logan 1845 | clean |
| cap8 | non si sente uno zitto | Moore 2022 | partial |
| cap8 | a man salva | Moore 2022 | clean |
| cap8 | non sentendo un alito all'intorno | Logan 1845 | partial |
| cap9 | è della costola d'Adamo | Logan 1845 | partial |
| cap9 | anche lei può far alto e basso nel monastero | Moore 2022 | partial |
| cap9 | mettervi nelle sue mani | Moore 2022 | partial |
| cap9 | sarete sicure come sull'altare | Moore 2022 | partial |
| cap9 | do la cosa per fatta | Penman 1972 | clean |
| cap9 | in un batter d'occhio | Logan 1845 | clean |
| cap9 | a ogni conto | Logan 1845 | clean |
| cap10 | dar l'ultima mano | Penman 1972 | clean |
| cap10 | rimaner lì testa testa | Moore 2022 | clean |
| cap10 | vi terrà sulla corda | Moore 2022 | clean |
| cap11 | me ne rido | Penman 1972 | partial |
| cap11 | a buon conto | Logan 1845 | clean |
| cap11 | farebbe un bel colpo | Moore 2022 | partial |
| cap11 | non vedeva l’ora di | Logan 1845 | clean |
| cap12 | fosse per celia | Moore 2022 | partial |
| cap13 | Riuscirvi, lì stava il punto | Moore 2022 | clean |
| cap13 | chi l’avesse preso con le brusche | Logan 1845 | clean |
| cap13 | tant’occhi addosso a lui | Penman 1972 | clean |
| cap14 | Anche questa è nuova | Penman 1972 | clean |
| cap14 | Pezzo d’asino | Logan 1845 | clean |
| cap14 | Pezzo d’asino | Moore 2022 | clean |
| cap14 | per fargli perdere il filo | Moore 2022 | clean |
| cap15 | quelli che le dicon più grosse | Moore 2022 | partial |
| cap15 | cogliere sul fatto | Penman 1972 | clean |
| cap15 | che già aveva in testa | Penman 1972 | clean |
| cap16 | senza metter mano alla borsa | Logan 1845 | clean |
| cap16 | quando la pera è matura, convien che caschi | Penman 1972 | clean |
| cap17 | Sta in orecchi | Moore 2022 | clean |
| cap19 | non rimanesse al di sotto | Logan 1845 | clean |
| cap19 | che gli stava tanto a cuore | Moore 2022 | clean |
| cap19 | che starebbe fresco | Penman 1972 | clean |
| cap19 | che starebbe fresco | Logan 1845 | clean |
| cap19 | che starebbe fresco | Moore 2022 | clean |
| cap19 | che vadano il lungo | Logan 1845 | clean |
| cap20 | era stato, facendo l’indiano, sulla porta | Logan 1845 | clean |
| cap21 | io non son più uomo, io | Moore 2022 | clean |
| cap23 | di sotto in su | Logan 1845 | clean |
| cap23 | fare il diavolo | Moore 2022 | clean |
| cap23 | la cosa sarebbe chiara | Logan 1845 | partial |
| cap24 | son fuori di sentimento | Moore 2022 | clean |
| cap24 | A buon conto | Penman 1972 | clean |
| cap24 | a buon conto | Penman 1972 | clean |
| cap24 | a buon conto | Logan 1845 | clean |
