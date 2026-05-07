'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

test('docs keep XppAI analysis on direct XPO intake and treat cache commands as optional', () => {
  const skills = fs.readFileSync(path.join(ROOT, 'docs', 'skills.md'), 'utf8');
  const xpoCache = fs.readFileSync(path.join(ROOT, 'docs', 'xpo-cache.md'), 'utf8');

  assert.match(skills, /direct intake once before analysis/i);
  assert.match(skills, /read the `\.xpo` content directly/i);
  assert.match(xpoCache, /optional CLI cache workflow/i);
  assert.match(xpoCache, /not required for `xppai-papai` or `xppai-babysit` analysis/i);
});
