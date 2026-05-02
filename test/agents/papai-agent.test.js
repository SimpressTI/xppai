'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const nodePath = require('path');

const ROOT = nodePath.join(__dirname, '..', '..');
const AGENT_PATH = nodePath.join(ROOT, 'assets', 'agents', 'xppai-papai', 'AGENT.md');
const SKILL_PATH = nodePath.join(ROOT, 'assets', 'skills', 'xppai-papai', 'SKILL.md');

test('canonical AGENT.md exists', () => {
  assert.equal(fs.existsSync(AGENT_PATH), true, 'assets/agents/xppai-papai/AGENT.md must exist');
});

test('AGENT.md contains required sections', () => {
  const content = fs.readFileSync(AGENT_PATH, 'utf8');
  assert.match(content, /## Mission/);
  assert.match(content, /## Operating Loop/);
  assert.match(content, /## Available Actions/);
  assert.match(content, /## Validation Rules/);
  assert.match(content, /## Stop Conditions/);
});

test('AGENT.md includes AX 2009 scope and loop safety rule', () => {
  const content = fs.readFileSync(AGENT_PATH, 'utf8');
  assert.match(content, /AX 2009/);
  assert.match(content, /Do not exceed 3 investigation cycles unless explicitly requested/);
});

test('AGENT.md enforces analyze-first and constrained fallback policy', () => {
  const content = fs.readFileSync(AGENT_PATH, 'utf8');
  assert.match(content, /analyze-\*/i);
  assert.match(content, /fallback/i);
  assert.match(content, /insufficient detail/i);
  assert.match(content, /Path used:\s*analyze-first/i);
  assert.match(content, /Fallback reason:\s*<failure\|missing detail>/i);
});

test('AGENT.md references required skills', () => {
  const content = fs.readFileSync(AGENT_PATH, 'utf8');
  const requiredSkills = [
    'xppai-init',
    'xppai-explain',
    'xppai-stack',
    'xppai-risk',
    'xppai-codefix',
    'xppai-posting',
    'xppai-architect',
    'xppai-exportxpo',
  ];

  for (const skill of requiredSkills) {
    assert.match(content, new RegExp(skill), `AGENT.md must mention ${skill}`);
  }
});

test('legacy SKILL.md keeps frontmatter name', () => {
  const content = fs.readFileSync(SKILL_PATH, 'utf8');
  assert.match(content, /name:\s*xppai-papai/);
});

test('legacy SKILL.md references canonical AGENT.md and cycle limit', () => {
  const content = fs.readFileSync(SKILL_PATH, 'utf8');
  assert.match(content, /assets\/agents\/xppai-papai\/AGENT\.md/);
  assert.match(content, /Do not exceed 3 investigation cycles unless explicitly requested/);
});

test('legacy SKILL.md references analyze command family and avoids legacy snapshot path', () => {
  const content = fs.readFileSync(SKILL_PATH, 'utf8');
  assert.match(content, /analyze-load/i);
  assert.doesNotMatch(content, /xppai xpo snapshot --json/i);
});

test('legacy SKILL.md does not include Available Actions section', () => {
  const content = fs.readFileSync(SKILL_PATH, 'utf8');
  assert.doesNotMatch(content, /## Available Actions/);
});
