# Russian idiom-span extraction & alignment audit

**Corpus:** `data/idioms_verified_ru_span.xlsx` (sheet `verified`)
**Editions:** 1936 (tr. I. I. Schitz) · 1999 (tr. Н. Георгиевская, А. Эфрос)
**Date:** 2026-07-17

The Russian counterpart of [`idiom_en_span_analysis.md`](idiom_en_span_analysis.md).
Same two-step flow — (1) check the Italian↔Russian segment alignment, (2) extract
the Russian rendering of each idiom — run against the two Russian translations.
The English corpus is untouched.

---

## 1. What was produced

| | Count |
|---|---|
| Rows (900 idioms × 2 editions) | 1,800 |
| `ru_span` filled | **1,783** |
| — of which `[omitted]` (idiom dropped by translator) | 13 |
| Blank (non-clean rows, not extracted) | 17 |
| **Verbatim-substring failures** | **0** |

Artefacts:

| File | Contents |
|---|---|
| `data/idioms_parallel_ru.{xlsx,json}` | the joined corpus, 1798 ok + 2 straddle |
| `data/idioms_ru_llm_verify.jsonl` | input to the alignment check |
| `data/idioms_verified_ru.xlsx` | + `aligned` / `confidence` / `note` |
| `data/idioms_verified_ru_span.xlsx` | **+ `ru_span`** — the deliverable |

Pipeline (all new, English pipeline unchanged):

- `scripts/build_idiom_parallel_ru.py` — imports the shared helpers from
  `build_idiom_parallel.py`; only the edition list, the `ru_segment` column and
  the output paths differ. Asserts 1800 rows / `{ok:1798, straddle:2}`.
- `scripts/verify_alignment_ru.workflow.js` — step 1, one Sonnet subagent per
  60-record shard → `data/verify_ru/verdicts/`.
- `scripts/extract_ru_span.workflow.js` — step 2, one Sonnet subagent per
  ~50-row chunk.

---

## 2. Why this worked out of the box

The Russian translations already carry the same `<note target/targetEnd>` token
alignment as the English ones, so nothing had to be built from scratch:

```
<note xml:id="russian_1936_cap13-n1" type="comm"
      target="quarantana/cap13.xml#c13_10001"
      targetEnd="quarantana/cap13.xml#c13_10045">Злосчастный заведующий…</note>
```

Coverage is in fact **better than English**: every one of the 900 idioms lands in
a Russian segment with non-empty text in both editions (899 ok + 1 straddle
each), with **no `no_segment` gaps** — English has one (Logan, cap24).

---

## 3. Orthography: the ё/е trap — the single biggest risk

**The two editions follow opposite conventions, and both are correct.**

| Edition | ё | е | The same phrase |
|---|---|---|---|
| 1936 (Schitz) | 17 | 13,273 | "Хорошо **еще**, что…" |
| 1999 (Георгиевская–Эфрос) | 980 | 12,141 | "Хорошо **ещё**, что…" |

The 1936 text follows the academic «е» convention; the 1999 text writes «ё»
regularly. A blanket "always е" rule would corrupt 1999; "always ё" would corrupt
1936. The only correct rule is **copy character-for-character from the segment in
front of you**, which is exactly what the verbatim-substring requirement enforces
— mechanically, per row.

Both prompts carry an explicit "never normalise ё↔е; both conventions are correct
for their edition" rule. The result across 1,783 spans:

| | spans containing ё |
|---|---|
| 1936 | **1** |
| 1999 | **138** |

That distribution tracks each edition's actual usage, and every span is a verbatim
substring — so no normalisation occurred anywhere. The decisive case:

> `decidersi a ciarle` → 1936 **решалось болтовней** · 1999 **решалось болтовнёй**

Same word, each edition's own spelling.

---

## 4. Alignment check (step 1)

One Sonnet subagent per 60-record shard judged "is this Russian passage a
translation of this Italian passage?" (yes / partial / no). Verdict files were
validated for coverage: 1800 in → 1800 out, **0 missing, 0 invented, 0 duplicated**.

| | Before source fixes | After (§5) |
|---|---|---|
| yes | 1778 | **1785** |
| partial | 21 | **15** |
| no | 1 | **0** |

Russian alignment is markedly cleaner than English (0.8% partial vs 2.7%).

### Audit of the 24 non-clean rows

Reading all 24 against the actual Russian text (same method as the English audit):

| Verdict | Count |
|---|---|
| **Idiom present** — the `partial` flag was about neighbouring clauses, not the idiom | 19 |
| **Boundary offset** — the rendering sat in the *adjacent* segment | 4 |
| **Translator insertion** — see §6 | 1 |

As in English, `partial` is a *segment-boundary* flag and does **not** mean the
idiom is missing.

---

## 5. Source fixes applied (4 boundary bugs)

Four passages had the same bug found (and fixed) in the English cap13/cap19: the
note boundary sat one clause too late, so the idiom's tokens attached to the
preceding note whose Russian does not translate them. Each was verified by mapping
the Russian note text back onto the Italian tokens.

| File | target..targetEnd (before → after) | Idiom recovered |
|---|---|---|
| `Russian_1936/cap4.xml` | n76 `…12211`→`…12227`; n77 `12212…`→`12228…` | `Sta fresco anche lui` → **Ему тоже досталось** |
| `Russian_1999/cap4.xml` | n78 `…12198`→`…12223`; n79 `12199..12223`→`12224..12227`; n80 `12224…`→`12228…` | same idiom (this was the only **"no"**) |
| `Russian_1936/cap11.xml` | n110 `…12578`→`…12587`; n111 `12579…`→`12588…` | `Era un'anima del purgatorio` → **Это душа, пришедшая из чистилища** |
| `Russian_1999/cap19.xml` | n121 `…13462`→`…13456`; n122 `13463…`→`13457…` | `come se niente fosse` → **как ни в чём не бывало** |

Note the cap19 fix point (13456) **differs from the English one** (13448): each
translator grouped the clauses differently, so these are genuinely independent
bugs, not a copied one.

`build_idiom_parallel_ru.py` was rerun (no LLM calls); the diff touched exactly
10 rows — the 4 above plus 6 neighbours whose `seg_start_id` shifted while their
`ru_segment` text stayed identical. The 4 affected shards were re-verified and the
7 newly-clean rows re-extracted. **No previously-extracted span was invalidated.**

Recovered:

| Idiom | Russian |
|---|---|
| `come se niente fosse` | как ни в чём не бывало |
| `Sta fresco anche lui` | Ему тоже досталось |
| `Era un'anima del purgatorio` | Это душа, пришедшая из чистилища |
| `era un'anima dannata` | осужденная душа |
| `Chi cerca trova` | не лезь |
| `Una le paga tutte` | Раз — да здорово |
| `che ci venga in taglio` | пригодятся нам |

---

## 6. `status="insertion"` — a convention, not a bug

A scan initially flagged **59 notes across 11 translations with no `target`**,
which looked like a repo-wide data-quality problem. **It is not.** All 59 carry
`status="insertion"` — a deliberate annotation marking text the *translator added*
that has no Italian counterpart. Repo-wide there are 112,694 plain `type="comm"`
notes and only 70 `insertion` ones (59 unanchored + 11 that also carry a target).

This matters for one row. `Russian_1999/cap13-n167` reads *"Плохо придётся ему,
плохо."* — which looks like a rendering of `Sta fresco, sta fresco` (cap13,
tokens 14683–14686) — but the annotator marked it an **insertion**. It was
therefore **left alone**: anchoring it would override a human judgment with a
guess. The corpus correctly records that the 1999 edition drops that idiom
(row `7530_1999`, `partial`).

The other 58 insertions are unrelated to the idiom corpus and were not touched.

---

## 7. What idioms did the translators drop?

Only **13 of 1,783** renderings are `[omitted]`.

### By edition

| Edition | Dropped | Rate |
|---|---|---|
| 1936 (Schitz) | 6 / 900 | **0.7 %** |
| 1999 (Георгиевская–Эфрос) | 7 / 900 | **0.8 %** |

Both Russian translators drop idioms far less often than any of the English
three (Logan 3.3 %, Moore 3.0 %, Penman 2.2 %) — roughly a **quarter** of the
English rate.

### By idiom type

| Type | | Dropped | Rate |
|---|---|---|---|
| `EI` | idiomatic expression | 13 / 1554 | 0.8 % |
| `Pr` | proverbial phrase | **0 / 164** | **0 %** |
| `P` | proverb | **0 / 60** | **0 %** |
| `BI` | biblical idiom | **0 / 22** | **0 %** |

**Every proverb, proverbial phrase and biblical idiom is rendered in both Russian
editions.** The same protective tendency appears in English (proverbial phrases
dropped least, 1.2 %), but here it is absolute.

### What gets dropped

Four idioms are dropped by **both** editions — `venendogli all'orecchio`,
`avrebbe fatto volentieri di meno`, `non vedeva l'ora d'andarsene`, and
`con le buone`. As in English, these are semantically light or
grammatically-diffuse turns rather than vivid images; `non vedeva l'ora
d'andarsene` is also dropped by Logan in English.

### An observation to follow up, not a conclusion

Of the 877 idioms where both editions yield a span, **394 (44.9 %) are
character-identical**. That is high, and raises the question of whether the 1999
text is partly a revision of Schitz rather than an independent translation.
It is **not** evidence on its own: many spans are short, high-frequency phrases
(`умываю руки`, `за пояс заткнули`) where independent translators would plausibly
converge. Testing it properly would need a comparison over running text, not
idiom spans.

---

## 8. Remaining gaps

- **17 blank rows** — 15 `partial` + 2 `straddle`, not extracted (same scope rule
  as English: `match_status = ok` AND `aligned = yes`). The audit found the idiom
  is present in most of them; they are simply outside the clean set.
- **15 `partial` rows** — all segment-boundary artefacts (the Russian window pulls
  in or drops a neighbouring clause), not misalignments. Listed in the appendix.
- No `no` rows and no `no_segment` rows remain.

---

## Appendix A — the 13 dropped idioms

| Chapter | Idiom (Italian) | Edition |
|---|---|---|
| cap6 | fuor dell'unghie di questo ribaldo | 1999 |
| cap8 | frugavan la casa, dall'alto al basso | 1999 |
| cap9 | si lasciava vedere per aria | 1999 |
| cap11 | me ne rido | 1936 |
| cap11 | venendogli all'orecchio | 1936 |
| cap11 | venendogli all'orecchio | 1999 |
| cap11 | avrebbe fatto volentieri di meno | 1936 |
| cap11 | avrebbe fatto volentieri di meno | 1999 |
| cap14 | non vedeva l'ora d'andarsene | 1936 |
| cap14 | non vedeva l'ora d'andarsene | 1999 |
| cap17 | alzan la cresta | 1936 |
| cap21 | con le buone | 1936 |
| cap21 | con le buone | 1999 |

## Appendix B — the 15 remaining `partial` rows

| Chapter | Edition | Idiom | Why partial |
|---|---|---|---|
| cap1 | 1936 | congegnate come in cifra | Russian omits the closing clause identifying them as bravi |
| cap4 | 1936 | Chi cerca trova | Russian also covers preceding dialogue lines |
| cap4 | 1936 | Una le paga tutte | Russian includes extra crowd exclamations at the start |
| cap4 | 1936 | Sta fresco anche lui | Russian includes extra crowd exclamations at the start |
| cap7 | 1999 | Non son pesci che si piglino… | Russian drops the 'not with every net' half of the metaphor |
| cap8 | 1936 | È stata proprio grossa! | Russian adds a clause from the next Italian sentence |
| cap8 | 1936 | C'è il diavolo in casa | Russian adds a sentence not in the Italian segment |
| cap8 | 1999 | C'è il diavolo in casa | Russian adds a sentence not in the Italian segment |
| cap11 | 1936 | buttare all'aria un'impresa | Russian adds a sentence about a strict order and threats |
| cap11 | 1999 | buttare all'aria un'impresa | Russian adds a sentence about a strict order and threats |
| cap13 | 1999 | Sta fresco, sta fresco | Russian omits the idiom clause (see §6, insertion) |
| cap15 | 1936 | uscirne a bene | Russian appends an extra interjection |
| cap16 | 1999 | bagnar le labbra | Italian's closing exclamation not rendered |
| cap19 | 1999 | ci hanno un gusto matto | Russian stops before the closing clause |
| cap23 | 1999 | con la bocca […] aperta | Russian drops the final Latin quotation |
