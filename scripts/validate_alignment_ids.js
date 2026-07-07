#!/usr/bin/env node
/**
 * Validates alignment references against the Quarantana text.
 *
 * Every comment and translation TEI file anchors to the Quarantana through
 * target/targetEnd attributes of the form "quarantana/cap1.xml#c1_10001".
 * This script checks that every referenced xml:id actually exists, so that
 * corrections to the Quarantana encoding (token splits/merges) can be made
 * safely: run it after any edit to quarantana/*.xml.
 *
 * Usage: node scripts/validate_alignment_ids.js [--verbose]
 *   --verbose  list every broken reference (default: first 10 per file)
 *
 * Exit code 0 = all references resolve, 1 = broken/malformed references.
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
 * Collects all xml:id values from each XML file in the quarantana directory.
 * @returns {Object<string, Set<string>>} - Map of filename to its set of ids.
 */
function collectQuarantanaIds() {
  const idSets = {};
  for (const name of fs.readdirSync(QUARANTANA_DIR)) {
    if (!name.endsWith('.xml')) continue;
    const xml = fs.readFileSync(path.join(QUARANTANA_DIR, name), 'utf8');
    const ids = new Set();
    for (const m of xml.matchAll(/xml:id="([^"]+)"/g)) {
      ids.add(m[1]);
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
    for (const file of walkXmlFiles(dir)) {
      totalFiles++;
      const { checked, issues } = checkFile(file, idSets);
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
