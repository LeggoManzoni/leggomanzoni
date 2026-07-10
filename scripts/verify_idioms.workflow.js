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
    n_found: { type: 'integer' },
  },
  required: ['shard', 'n_in', 'n_out', 'n_found'],
}

function prompt(index) {
  const nn = pad(index)
  const shardPath = `${BASE}/data/verify/shards/shard_${nn}.jsonl`
  const verdictPath = `${BASE}/data/verify/verdicts/verdict_${nn}.jsonl`
  return `You are verifying an Italian–English parallel idiom corpus for a linguistics project.

Read the JSONL file at ${shardPath}. Each line is one record:
  { "row_id", "idiom_it", "it_segment", "en_segment" }
The Italian idiom under study is marked in the it_segment with ⟦ ⟧ brackets.

For each record, decide whether en_segment contains a RENDERING of the marked idiom.
A rendering is ANY of:
  - an equivalent English idiom,
  - a literal translation,
  - a paraphrase that conveys the idiom's meaning.
Only genuine absence (the idiom's meaning is simply not in the English) is found:false.

Write your answer to ${verdictPath} as JSONL — one line per input record, SAME ORDER,
every row_id present exactly once. Each line:
  { "row_id": <copied from input>,
    "found": <true|false>,
    "en_span": <if found: the exact English words that render the idiom, COPIED VERBATIM
                as a literal substring of en_segment — do not normalize quotes, dashes,
                capitalization, or spacing; if not found: "">,
    "confidence": <"high"|"medium"|"low">,
    "reason": <if not found: a one-clause explanation, e.g. "clause omitted entirely";
               if found: ""> }

Critical rules:
  - en_span MUST be a character-for-character substring of en_segment. It is checked
    programmatically; a paraphrased or reformatted span will be rejected.
  - Do not skip, merge, reorder, or invent records. One output line per input line.
  - Write ONLY the JSONL file. Do not print the verdicts back to me.

After writing the file, return ONLY this JSON object (not the verdicts):
  { "shard": ${index}, "n_in": <input line count>, "n_out": <output line count>,
    "n_found": <count of found:true> }`
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
log(`shards done: ${ok.length}/${shardIndices.length}; total records: ${ok.reduce((a, s) => a + s.n_out, 0)}`)
return ok
