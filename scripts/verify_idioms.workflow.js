export const meta = {
  name: 'verify-idioms',
  description: 'Verify each English segment renders its aligned Italian idiom; one Sonnet subagent per shard writes its own verdict file',
  phases: [{ title: 'Verify', detail: 'one subagent per 60-record shard' }],
}

// args is an array of shard indices to run, e.g. [0, 1] for the pilot or 0..44 for the full run.
const shardIndices = args

const BASE = '/mnt/ssd990/projects/leggomanzoni'
const pad = (n) => String(n).padStart(2, '0')

const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    shard: { type: 'integer' },
    n_in: { type: 'integer' },
    n_out: { type: 'integer' },
    n_yes: { type: 'integer' },
    n_partial: { type: 'integer' },
    n_no: { type: 'integer' },
  },
  required: ['shard', 'n_in', 'n_out', 'n_yes', 'n_partial', 'n_no'],
}

function prompt(index) {
  const nn = pad(index)
  const shardPath = `${BASE}/data/verify/shards/shard_${nn}.jsonl`
  const verdictPath = `${BASE}/data/verify/verdicts/verdict_${nn}.jsonl`
  return `You are checking the alignment of an Italian–English parallel corpus for a
linguistics project. This is a data-quality pass: we want to confirm that each
English passage really is the translation of the Italian passage it was aligned to.

Read the JSONL file at ${shardPath}. Each line is one record:
  { "row_id", "idiom_it", "it_segment", "en_segment" }
it_segment is a passage from Manzoni's "I promessi sposi" (an idiom under separate
study is marked in it with ⟦ ⟧ brackets — that marking is just context here).
en_segment is the passage from a published English translation (1845, 1972, or 2022)
that was aligned to it.

For each record, judge ONE thing: is en_segment a translation of it_segment?
  - "yes"     — en_segment renders substantially all of it_segment; they are the
                same passage in two languages (normal translation latitude is fine:
                reordering, idiomatic paraphrase, minor compression/expansion).
  - "partial" — clearly related and overlapping, but the English translates only
                part of the Italian, or carries substantial material the Italian
                does not (or vice versa) beyond normal latitude.
  - "no"      — en_segment is not a translation of it_segment at all; they are
                different passages. This means the alignment is probably wrong.

Judge the PASSAGES, not the idiom. A faithful translation that happens to drop the
marked idiom is still "yes" at the segment level.

Write your answer to ${verdictPath} as JSONL — one line per input record, SAME ORDER,
every row_id present exactly once. Each line:
  { "row_id": <copied from input>,
    "aligned": <"yes"|"partial"|"no">,
    "confidence": <"high"|"medium"|"low">,
    "note": <for "partial"/"no": a one-clause explanation, e.g. "English continues
             past the Italian" or "unrelated passage"; for "yes": ""> }

Rules:
  - Do not skip, merge, reorder, or invent records. One output line per input line.
  - Write ONLY the JSONL file. Do not print the verdicts back to me.

After writing the file, return ONLY this JSON object (not the verdicts):
  { "shard": ${index}, "n_in": <input line count>, "n_out": <output line count>,
    "n_yes": <count aligned="yes">, "n_partial": <count "partial">, "n_no": <count "no"> }`
}

const summaries = await parallel(
  shardIndices.map((index) => () =>
    agent(prompt(index), {
      label: `verify:shard_${pad(index)}`,
      phase: 'Verify',
      model: 'sonnet',
      agentType: 'general-purpose',
      schema: RESULT_SCHEMA,
    })
  )
)

const ok = summaries.filter(Boolean)
const sum = (k) => ok.reduce((a, s) => a + s[k], 0)
log(`shards done: ${ok.length}/${shardIndices.length}; records: ${sum('n_out')}; ` +
    `aligned yes=${sum('n_yes')} partial=${sum('n_partial')} no=${sum('n_no')}`)
return ok
