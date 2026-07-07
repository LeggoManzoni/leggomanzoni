#!/usr/bin/env node
/**
 * Validates alignment references against the Quarantana text.
 *
 * Every comment and translation TEI file anchors to the Quarantana through
 * target/targetEnd attributes of the form "quarantana/cap1.xml#c1_10001".
 * Two passes:
 *   1. Existence — every referenced xml:id must exist in the quarantana
 *      file it points at (comments and translations).
 *   2. Monotonicity — translation segment anchors must advance through the
 *      text: no inverted ranges (target after targetEnd) and no segment
 *      starting at or before the previous segment's end. This catches
 *      valid-but-wrong ids the existence check cannot see (e.g. a repeated
 *      dialogue line anchored to its first occurrence). Applied to
 *      translations only: comment lemmas legitimately nest and overlap.
 *
 * Run after any edit to quarantana/*.xml or to alignment files.
 *
 * Usage: node scripts/validate_alignment_ids.js [--verbose]
 *   --verbose  list every broken reference (default: first 10 per file)
 *
 * Exit code 0 = all checks pass, 1 = issues found.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const QUARANTANA_DIR = path.join(ROOT, 'quarantana');
const REF_DIRS = [
  path.join(ROOT, 'commenti', 'xml', 'in_lavorazione'),
  path.join(ROOT, 'translations'),
];
const VERBOSE = process.argv.includes('--verbose');
const MAX_SHOWN_PER_FILE = 10;

/**
 * Collects all xml:id values from each XML file in the quarantana directory,
 * with their document-order position (used by the monotonicity pass).
 * @returns {Object<string, Map<string, number>>} - Map of filename to a Map
 *   of id -> document-order index.
 */
function collectQuarantanaIds() {
  const idSets = {};
  for (const name of fs.readdirSync(QUARANTANA_DIR)) {
    if (!name.endsWith('.xml')) continue;
    const xml = fs.readFileSync(path.join(QUARANTANA_DIR, name), 'utf8');
    const ids = new Map();
    let pos = 0;
    for (const m of xml.matchAll(/xml:id="([^"]+)"/g)) {
      if (!ids.has(m[1])) ids.set(m[1], pos++);
    }
    idSets[name] = ids;
  }
  return idSets;
}

/**
 * Recursively yields all .xml file paths under a directory.
 * @param {string} dir - Directory to walk.
 */
function* walkXmlFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkXmlFiles(p);
    } else if (entry.name.endsWith('.xml')) {
      yield p;
    }
  }
}

/**
 * Checks all quarantana references in one file.
 * @param {string} file - Path of the referencing XML file.
 * @param {Object<string, Set<string>>} idSets - Ids per quarantana file.
 * @returns {{checked: number, issues: Array<{line: number, attr: string, value: string, reason: string}>}}
 */
function checkFile(file, idSets) {
  const xml = fs.readFileSync(file, 'utf8');
  const issues = [];
  let checked = 0;

  for (const m of xml.matchAll(/\b(target|targetEnd)="([^"]*)"/g)) {
    const [, attr, value] = m;
    // Only alignment references point into the quarantana; skip external
    // links (http...), internal anchors, etc.
    if (!value.includes('quarantana')) continue;
    checked++;

    const line = xml.slice(0, m.index).split('\n').length;
    const ref = value.replace(/^\.\//, '');
    const hashPos = ref.indexOf('#');
    if (!ref.startsWith('quarantana/') || hashPos < 0) {
      issues.push({ line, attr, value, reason: 'malformed reference' });
      continue;
    }
    const fileRef = ref.slice('quarantana/'.length, hashPos);
    const id = ref.slice(hashPos + 1);
    if (!idSets[fileRef]) {
      issues.push({ line, attr, value, reason: `unknown file "${fileRef}"` });
    } else if (!idSets[fileRef].has(id)) {
      issues.push({ line, attr, value, reason: `id "${id}" not found in ${fileRef}` });
    }
  }
  return { checked, issues };
}

/**
 * Checks that a translation file's segment anchors advance through the text:
 * ranges must not be inverted and each segment must start after the previous
 * one's end (per quarantana chapter). Only meaningful for translations —
 * comment lemmas legitimately nest and overlap.
 * @param {string} file - Path of the translation XML file.
 * @param {Object<string, Map<string, number>>} idSets - Ids per quarantana file.
 * @returns {Array<{line: number, attr: string, value: string, reason: string}>}
 */
function checkMonotonicity(file, idSets) {
  const xml = fs.readFileSync(file, 'utf8');
  const issues = [];
  const prevEnd = {};

  const anchorRe = /target="(?:\.\/)?quarantana\/([a-z0-9]+\.xml)#([^"]+)"(?:\s+targetEnd="(?:\.\/)?quarantana\/[a-z0-9]+\.xml#([^"]+)")?/g;
  for (const m of xml.matchAll(anchorRe)) {
    const [full, fileRef, t, eRaw] = m;
    const order = idSets[fileRef];
    if (!order) continue;
    const e = eRaw || t;
    // ids that don't exist are already reported by the existence pass
    if (!order.has(t) || !order.has(e)) continue;

    const line = xml.slice(0, m.index).split('\n').length;
    const ti = order.get(t);
    const ei = order.get(e);
    if (ti > ei) {
      issues.push({ line, attr: 'range', value: `${t}..${e}`, reason: 'inverted range (target after targetEnd)' });
      continue;
    }
    const p = prevEnd[fileRef];
    if (p !== undefined && ti <= p) {
      issues.push({ line, attr: 'range', value: `${t}..${e}`, reason: 'non-monotonic (starts at or before previous segment\'s end)' });
    }
    prevEnd[fileRef] = Math.max(p ?? -1, ei);
  }
  return issues;
}

function main() {
  const idSets = collectQuarantanaIds();
  let totalChecked = 0;
  let totalIssues = 0;
  let totalFiles = 0;
  let filesWithIssues = 0;

  for (const dir of REF_DIRS) {
    if (!fs.existsSync(dir)) {
      console.error(`WARNING: directory not found: ${dir}`);
      continue;
    }
    const isTranslationDir = dir.endsWith('translations');
    for (const file of walkXmlFiles(dir)) {
      totalFiles++;
      const { checked, issues } = checkFile(file, idSets);
      if (isTranslationDir) {
        issues.push(...checkMonotonicity(file, idSets));
      }
      totalChecked += checked;
      if (issues.length > 0) {
        filesWithIssues++;
        totalIssues += issues.length;
        console.log(`\n${path.relative(ROOT, file)} — ${issues.length} issue(s):`);
        const shown = VERBOSE ? issues : issues.slice(0, MAX_SHOWN_PER_FILE);
        for (const issue of shown) {
          console.log(`  line ${issue.line}: ${issue.attr}="${issue.value}" — ${issue.reason}`);
        }
        if (shown.length < issues.length) {
          console.log(`  ... and ${issues.length - shown.length} more (use --verbose)`);
        }
      }
    }
  }

  console.log(`\nChecked ${totalChecked} references in ${totalFiles} files.`);
  if (totalIssues > 0) {
    console.log(`FAILED: ${totalIssues} broken/malformed reference(s) in ${filesWithIssues} file(s).`);
    process.exit(1);
  }
  console.log('OK: all references resolve.');
}

main();
