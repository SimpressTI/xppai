'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SKILLS = path.join(ROOT, 'assets', 'skills');

function readSkill(name) {
  return fs.readFileSync(path.join(SKILLS, name, 'SKILL.md'), 'utf8');
}

const SPECIALISTS = [
  'xppai-architect',
  'xppai-codefix',
  'xppai-explain',
  'xppai-posting',
  'xppai-risk',
  'xppai-stack',
];

test('xppai-init defines shared XPO intake state contract', () => {
  const content = readSkill('xppai-init');

  assert.match(content, /## XPO Intake State/);
  assert.match(content, /standalone/i);
  assert.match(content, /XPO intake already completed for this request/);
  assert.match(content, /do not run any XPO intake command again/i);
  assert.match(content, /Do not run unrelated shell commands/i);
  assert.match(content, /replacing the active XPO analysis context/i);
  assert.match(content, /xppai xpo snapshot --json/i);
  assert.match(content, /snapshot approval persists/i);
});

test('xppai-papai runs XPO intake once before orchestration', () => {
  const content = readSkill('xppai-papai');

  assert.match(content, /Run XPO intake at most once per user request/i);
  assert.match(content, /XPO intake already completed for this request/);
  assert.match(content, /pass .*completed intake state/i);
  assert.match(content, /must not run XPO intake again/i);
  assert.match(content, /Only select skills that serve the user's prompt goal/i);
  assert.match(content, /xppai xpo snapshot --json/i);
  assert.match(content, /snapshot approval persists/i);
  assert.doesNotMatch(content, /xppai xpo grep/i);
});

test('xppai-babysit runs XPO intake once before classification', () => {
  const content = readSkill('xppai-babysit');

  assert.match(content, /run XPO intake at most once per user request/i);
  assert.match(content, /XPO intake already completed for this request/);
  assert.match(content, /Selected skills must not run XPO intake again/i);
  assert.match(content, /xppai xpo snapshot --json/i);
  assert.match(content, /snapshot approval persists/i);
  assert.doesNotMatch(content, /xppai xpo grep/i);
});

for (const skill of SPECIALISTS) {
  test(`${skill} skips XPO intake when orchestrator already completed it`, () => {
    const content = readSkill(skill);

    assert.match(content, /Run the XPO Intake Gate only when/i);
    assert.match(content, /no orchestrator has already completed intake for this request/i);
    assert.doesNotMatch(content, /execute the xppai-init XPO Intake Gate immediately before any analysis output/i);
  });
}
