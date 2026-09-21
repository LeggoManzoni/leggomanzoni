export const meta = {
  name: 'extract-ru-idiom-spans',
  description: 'Extract the minimal Russian idiom span for each aligned idiom row, verbatim from ru_segment',
  phases: [{ title: 'Extract', detail: 'one Sonnet subagent per ~50-row chunk' }],
}

// args: { chunkPaths: [...], resultsDir: "..." }. May arrive as a JSON string.
const cfg = typeof args === 'string' ? JSON.parse(args) : args
const chunkPaths = cfg.chunkPaths
const resultsDir = cfg.resultsDir

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['chunk_file', 'count', 'result_file'],
  properties: {
    chunk_file: { type: 'string' },
    result_file: { type: 'string' },
    count: { type: 'integer' },
    n_omitted: { type: 'integer' },
  },
}

function promptFor(path) {
  const resultFile = resultsDir + '/' + path.split('/').pop().replace('.json', '.result.json')
  return `You are extracting the RUSSIAN translation of an Italian idiom for a bilingual
philology corpus (Manzoni, "I promessi sposi").

Read the JSON file at this exact path: ${path}
It is an array of records, each:
  { "rid": "<id>", "it_span": "<italian idiom>",
    "it_segment": "<italian sentence, idiom marked between ⟦ ⟧>",
    "ru_segment": "<full Russian translation of that sentence>" }

For EACH record, determine ru_span = the MINIMAL contiguous Russian phrase inside
ru_segment that renders the Italian idiom it_span.

STRICT RULES:
1. ru_span MUST be copied VERBATIM as a contiguous substring of ru_segment — exact
   characters, exact casing, exact punctuation, exact dashes and quotes as they
   appear. Do NOT paraphrase, re-spell, re-inflect, or normalise anything. If your
   answer is not an exact substring of ru_segment, it is wrong — recheck.
2. RUSSIAN ORTHOGRAPHY — CRITICAL: never "correct", modernise or normalise ё↔е.
   The two editions follow OPPOSITE conventions and both are correct for their
   edition: the 1936 text writes "еще", "шел"; the 1999 text writes "ещё", "шёл".
   Copy whichever spelling stands in THIS record's ru_segment, character for
   character. Substituting ё for е (or е for ё) silently corrupts the corpus.
   The same applies to и/й, е/э and any other letter: change nothing.
3. Keep it MINIMAL: just the idiomatic equivalent, not the whole clause. Include
   only the words that carry the idiom; drop leading subject pronouns and
   surrounding punctuation unless they are part of the fixed phrase.
   E.g. it_span "me ne lavo le mani" in "…— и я просто умываю руки." ->
   ru_span = "умываю руки" (not "и я просто умываю руки", not "руки.").
4. PRESERVE POLARITY: if the marked it_span is NEGATED (non/né/mai/nessuno …), the
   ru_span MUST keep the Russian negation (не / ни / нет / без / никогда …). Never
   drop a negation — doing so inverts the meaning. Likewise keep any other
   meaning-flipping word that carries the idiom's sense.
5. If the translator DROPPED the idiom entirely, or rendered it with a loose
   non-idiomatic paraphrase that has no identifiable contiguous equivalent phrase,
   set ru_span exactly to "[omitted]".
6. Do not add explanations. One ru_span per record.

Write the results as a JSON array to this exact path (create/overwrite it):
${resultFile}
Each element: { "rid": <the same id, copied exactly>, "ru_span": "<verbatim minimal phrase OR [omitted]>" }
The array MUST contain exactly one element per input record, in the same order, with
matching rid values. Write the file as UTF-8 with the Russian characters literal
(not \\u-escaped).

After writing the file, return the summary object.`
}

const summaries = await parallel(
  chunkPaths.map((p) => () =>
    agent(promptFor(p), {
      label: 'extract-ru:' + p.split('/').pop(),
      phase: 'Extract',
      model: 'sonnet',
      schema: SCHEMA,
    })
  )
)

const ok = summaries.filter(Boolean)
const totalCount = ok.reduce((a, s) => a + (s.count || 0), 0)
const totalOmitted = ok.reduce((a, s) => a + (s.n_omitted || 0), 0)
log(`chunks done: ${ok.length}/${chunkPaths.length}, rows: ${totalCount}, omitted: ${totalOmitted}`)

return { chunks_ok: ok.length, chunks_total: chunkPaths.length, rows: totalCount, omitted: totalOmitted }
