'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const nodePath = require('path');

const ROOT = nodePath.join(__dirname, '..', '..');
const SKILL_PATH = nodePath.join(ROOT, 'assets', 'skills', 'xppai-support', 'SKILL.md');

test('xppai-support skill exists', () => {
  assert.equal(fs.existsSync(SKILL_PATH), true, 'assets/skills/xppai-support/SKILL.md must exist');
});

test('xppai-support frontmatter and support sections are present', () => {
  const content = fs.readFileSync(SKILL_PATH, 'utf8');
  assert.match(content, /name:\s*xppai-support/);
  assert.match(content, /support issues/i);
  assert.match(content, /## Support Symptom/);
  assert.match(content, /## Cause Tree/);
  assert.match(content, /## Customization Check/);
  assert.match(content, /## Suggested Next Step/);
  assert.match(content, /Confirmed, Likely, Hypothesis, or Unknown/i);
});
