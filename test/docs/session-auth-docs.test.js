'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

test('docs mention snapshot-approved session auth reuse', () => {
  const skills = fs.readFileSync(path.join(ROOT, 'docs', 'skills.md'), 'utf8');
  const cli = fs.readFileSync(path.join(ROOT, 'docs', 'cli.md'), 'utf8');
  const xpoCache = fs.readFileSync(path.join(ROOT, 'docs', 'xpo-cache.md'), 'utf8');

  assert.match(skills, /authorize the active cache fingerprint for the current Codex session/i);
  assert.match(cli, /snapshot-approved cache session/i);
  assert.match(xpoCache, /same Codex session/i);
});
