# Commenti — alignment fixes needed

> **UPDATE 2026-07-07 (later):** the expert-corrected delivery (`XML definitivi`, 184 files,
> 35 authors) was deployed into the per-chapter folders. It already incorporated all
> section-2 fixes and almost all of section 3. Two files were repaired during deployment
> (Petrocchi/cap20.xml: missing `</note>` on n37; Russo/cap16.xml: missing `<hi>` opening
> tag in n14). Pre-deployment state saved in `commenti/in_lavorazione_backup_20260707.tar.gz`.
> Still open: section 3b heading anchors (Badini_Confalonieri intro, Bricchi intro,
> DeCristofaro cap1+intro, TittaRosa cap1), section 3c Nigro image notes (author not in the
> delivery), and the stale flat `<Author>.xml` aggregates (not read by the app — regenerate
> or retire them).

Status as of 2026-07-07. Every `target`/`targetEnd` in the comment files must resolve to an
existing `xml:id` in `quarantana/*.xml`. The validator found **84 broken references** in the
per-chapter comment files (`commenti/xml/in_lavorazione/<Author>/*.xml`); each is duplicated
in the flat aggregate file (`<Author>.xml`), so fixes must be applied in **both**, or the
aggregate regenerated.

Check at any time with:

```
node scripts/validate_alignment_ids.js            # summary, first 10 issues per file
node scripts/validate_alignment_ids.js --verbose  # all issues
```

**Important for the new expert-corrected comment files:** run the validator on them before
integration, and apply the id migration map (section 1) — if they were aligned against an
older tokenization, they may reference renamed or retired ids.

---

## 1. Id migration map (Quarantana renames applied 2026-07-07)

Ids on the left no longer exist. Any reference to them (in old or newly delivered files)
must be rewritten:

| Old id | New id | What it is |
|---|---|---|
| `c7_113111` | `c7_11311_1` | `«Ho` — split off from `rispaventarsi.«Ho` (cap7) |
| `c25_135651` | `c25_13565_1` | `«signor` (cap25) |
| `intro_107401` | `intro_10740_1` | `—` closing the manuscript quote (intro) |
| `intro_10481` | `intro_10480` | old standalone comma, merged into `intro_10480` `accidenti,` — only valid as `targetEnd` |

Split semantics for cap7: `c7_11311` is now `rispaventarsi.` (a range **ending** there is
still correct); a range **starting** at `«Ho promesso...` must start at `c7_11311_1`.

Current suffixed ids in the corpus (valid, do not "fix"): `c21_11556_1`, `c7_11311_1`,
`c25_13565_1`, `intro_10740_1`. Known harmless id gaps from past merges: `c10_11213`,
`intro_10481`.

---

## 2. Mechanical fixes (scriptable, verified) — ✅ APPLIED 2026-07-07

All fixes in this section were applied on 2026-07-07 to both the per-chapter files and the
`<Author>.xml` aggregates (86 references in 20 files). The section is kept as documentation
for checking newly delivered files against the same error patterns.

### 2a. Wrong file part: `targetEnd="quarantana/intro.xml#c1_…"` → `quarantana/cap1.xml#c1_…`

37 references in cap1 comment files carry a correct `c1_*` id but point at `intro.xml`.
All 37 ids verified to exist in `cap1.xml`. Fix = replace the file part only.

| File | Notes affected |
|---|---|
| `Bonora/cap1.xml` | n6 (`c1_10264`), n19 (`c1_10978`), n43 (`c1_12724`), n44 (`c1_12794`), n45 (`c1_12832`), n47 (`c1_12878`), n73 (`c1_14812`) |
| `Caretti/cap1.xml` | n54 (`c1_14262`) |
| `Jacomuzzi/cap1.xml` | n9 (`c1_10171`), n14 (`c1_10264`), n42 (`c1_10978`), n183 (`c1_15504`) |
| `Lazzarini/cap1.xml` | n16 (`c1_10229`), n111 (`c1_12748`), n129 (`c1_13221`) |
| `Nicoletti/cap1.xml` | n8 (`c1_10229`), n60 (`c1_12878`), n97 (`c1_14812`) |
| `Pistelli/cap1.xml` | n2 (`c1_10260`), n16 (`c1_12186`), n22 (`c1_12561`) |
| `Sbrilli/cap1.xml` | n31 (`c1_11360`), n71 (`c1_13221`), n81 (`c1_13653`), n89 (`c1_14065`) |
| `Spinazzola/cap1.xml` | n2 (`c1_10113`), n5 (`c1_10262`), n15 (`c1_11266`), n40 (`c1_13420`), n49 (`c1_15199`) |
| `Trombatore/cap1.xml` | n10 (`c1_10241`), n11 (`c1_10262`), n66 (`c1_12181`), n75 (`c1_12640`), n91 (`c1_13411`) |
| `Verdino/cap1.xml` | n44 (`c1_12962`), n71 (`c1_15310`) |

One-liner (per-chapter + aggregates):

```
grep -rl 'targetEnd="quarantana/intro.xml#c1_' commenti/xml/in_lavorazione --include='*.xml' \
  | xargs sed -i 's|targetEnd="quarantana/intro.xml#c1_|targetEnd="quarantana/cap1.xml#c1_|g'
```

### 2b. Reverse case: `RigutiniMestica/intro.xml` n9

`targetEnd="quarantana/cap1.xml#intro_10943"` → `targetEnd="quarantana/intro.xml#intro_10943"`
(id exists in `intro.xml`; the file part is wrong).

### 2c. Typo: `Russo/cap9.xml` n69

`targetEnd="quarantana/cap9.xml#c9_16816git"` → `#c9_16816` (a stray `git` was pasted into
the id; `c9_16816` exists).

### 2d. Out-of-range `targetEnd` — correct end id resolved from the lemma

These four ids exceed the chapter's id range (leftovers from an older tokenization). The
intended end word was located in the current text:

| File / note | Broken targetEnd | Replace with | End word (lemma: "…") |
|---|---|---|---|
| `Bricchi/cap2.xml` n2 | `c2_16093` | `c2_10689` | `giovinotto.` ("Lorenzo... risulti del giovinotto") |
| `Bricchi/cap16.xml` n12 | `c16_15454` | `c16_14978` | `salva.»` ("Ne volete una prova... a man salva") |
| `Bricchi/cap18.xml` n3 | `c18_15514` | `c18_10479` | `birbanti.` ("Quello stesso giorno... che ai birbanti") |
| `Poggi_Salani/intro.xml` n19 | `intro_16054` | `intro_10296` | `Heroi,` ("altra causale... resistere a tanti Heroi") |

---

## 3. Needs expert / editorial decision

### 3a. `targetEnd = …_None` — the end of the lemma was never resolved (21 notes)

The encoding pipeline emitted a literal `None`. The end word must be located in the
Quarantana text from the lemma. List (file, note id, lemma):

| File / note | Lemma |
|---|---|
| `Bonora/cap1.xml` n5 | poi si rompe... dell'acque |
| `Bonora/cap1.xml` n24 | 116-117. le piu... dell'ordine |
| `Bonora/cap1.xml` n69 | 403-405. cosa non difficile... dell'altro |
| `Bonora/intro.xml` n2 | gl'illustri Campioni... Allori |
| `Bricchi/cap32.xml` n1 | Divenendo... durberie |
| `Bricchi/cap32.xml` n107 | Unguenta... arbitrarmur |
| `Bricchi/cap35.xml` n6 | Tu qui... l'insegnera |
| `Bricchi/cap36.xml` n2 | Siamo un pensiero... s'alzo |
| `Guerri/cap1.xml` n22 | Che i due... leggio |
| `Guerri/cap1.xml` n24 | Zitto, zitto... inchino |
| `Guerri/cap1.xml` n73 | Oh! siam qui... ascolta |
| `Guerri/intro.xml` n34 | Ma, rifiutando... davanzo |
| `Luperini-Brogi/intro.xml` n4 | Palme... Allori |
| `Marchese/intro.xml` n2 | Ma gl'illustri Campioni... Allori |
| `Nardi/intro.xml` n22 | Traggedie... Scene... intermezzi |
| `Russo/cap13.xml` n49 | Per sottrarre alla vista... imprecazioni |
| `Russo/cap14.xml` n62 | un'attenzione istintiva... dimodochè |
| `Russo/cap16.xml` n38 | «Volete passare dal ponte... nonica?» |
| `Sbrilli/cap1.xml` n134 | 517. calar le... brache |
| `Verdino/intro.xml` n15 | 15. questi... amparo |
| `Viti-Sapegno2005/intro.xml` n1 | 2-3. gl'anni... cadaveri |

(Fallback if the end cannot be located: drop the `targetEnd` attribute — the note then
anchors to its start word only, which the viewers handle.)

### 3b. `target = …_None` or `…_10000` — notes on headings / the whole chapter (8 notes)

These notes comment on the chapter heading, the Gonin headpiece, or the chapter as a whole;
they were given a non-existent "before the first word" anchor. A convention is needed —
the pragmatic fix is to anchor to the first word (`c1_10001` / `intro_10001`); anchoring to
the chapter's `<figure>` id is the alternative.

| File / note | Broken target | Lemma |
|---|---|---|
| `Badini_Confalonieri/intro.xml` image1 | `intro_10000` | [intestazione] |
| `Bricchi/intro.xml` n1 | `intro_10000` | Introduzione |
| `DeCristofaro/cap1.xml` n1 | `c1_10000` | Intestazione L. Riccardi |
| `DeCristofaro/intro.xml` n1 | `intro_10000` | Intestazione F. Gonin |
| `Viti_Sapegno/intro.xml` n1 | `intro_10000` | INTRODUZIONE |
| `Guerri/intro.xml` n1 | `intro_None` | Introduzione |
| `Petronio/intro.xml` n1 | `intro_None` | Introduzione |
| `TittaRosa/cap1.xml` n1 | `c1_None` | [24 ma 1821] |

### 3c. Nigro image notes — `target="quarantana"` (6 notes, duplicated in 2 files)

`Nigro/cap1.xml` and `Nigro/intro.xml` both contain the same six notes on Gonin's
illustrations (`Nigro_intro-image1`, `Nigro_cap1-image2` … `image6`, referencing edition
pages "pp. 5-8" … "p. 24"). `target="quarantana"` is a placeholder, not a reference.
These need proper anchors — the Quarantana `<figure>` elements carry ids (e.g.
`cap1_16097`, `c1_16098`) that could serve — plus a decision about the duplication
(the same notes should probably live in only one of the two files).

---

## 4. Checklist for the new expert-corrected files

1. Run `node scripts/validate_alignment_ids.js` with the new files in place.
2. Apply the migration map (section 1) for any reference to a renamed/retired id.
3. Re-check the notes listed in section 3 — if the experts fixed them, verify the new
   anchors resolve; if not, the entries above still apply.
4. Never renumber existing Quarantana ids to fit a comment file — fix the reference.
   Splits keep the original id on the first fragment and add `_1`, `_2`…; merged ids are
   retired and never reused.
5. Keep per-chapter files and the `<Author>.xml` aggregate in sync.
