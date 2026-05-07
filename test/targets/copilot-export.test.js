'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { mkdtemp } = require('../helpers/tmp');

test('copilot adapter exports repository custom instructions layout', () => {
  const adapter = require('../../src/targets/copilot');
  const assets = require('../../src/assets');
  const tempDir = mkdtemp('xppai-copilot-');

  try {
    adapter.export(assets.path(), tempDir);

    const repoInstructions = path.join(tempDir, 'copilot-instructions.md');
    assert.ok(fs.existsSync(repoInstructions), 'copilot-instructions.md must be exported');

    const repoContent = fs.readFileSync(repoInstructions, 'utf8');
    assert.match(repoContent, /XppAI/);
    assert.match(repoContent, /AX 2009/);
    assert.match(repoContent, /xppai-papai/);
    assert.match(repoContent, /open and analyze the local `.xpo` file directly/);

    const instructionsDir = path.join(tempDir, 'instructions');
    assert.ok(fs.statSync(instructionsDir).isDirectory(), 'instructions directory must be exported');

    const promptsDir = path.join(tempDir, 'prompts');
    assert.ok(fs.statSync(promptsDir).isDirectory(), 'prompts directory must be exported');

    const xppaiPrompt = path.join(promptsDir, 'xppai.prompt.md');
    const babysitPrompt = path.join(promptsDir, 'babysit.prompt.md');
    assert.ok(fs.existsSync(xppaiPrompt), 'xppai.prompt.md must be exported');
    assert.ok(fs.existsSync(babysitPrompt), 'babysit.prompt.md must be exported');

    const xppaiContent = fs.readFileSync(xppaiPrompt, 'utf8');
    assert.match(xppaiContent, /description:\s*['\"]XppAI dynamic AX 2009 orchestrator['\"]/);
    assert.match(xppaiContent, /xppai-papai/);
    assert.match(xppaiContent, /Confirmed \/ Likely \/ Unknown/);

    const babysitContent = fs.readFileSync(babysitPrompt, 'utf8');
    assert.match(babysitContent, /description:\s*['\"]XppAI fixed-sequence AX 2009 analysis['\"]/);
    assert.match(babysitContent, /xppai-babysit/);

    const owned = adapter.listOwnedEntries(assets.path());
    const actual = [
      'copilot-instructions.md',
      ...fs.readdirSync(instructionsDir).map(name => path.join('instructions', name)),
      ...fs.readdirSync(promptsDir).map(name => path.join('prompts', name)),
    ].sort();
    assert.deepEqual(actual, owned.sort(), 'exported Copilot files must match owned entries');

    const papaiFile = path.join(instructionsDir, 'xppai-papai.instructions.md');
    const papaiContent = fs.readFileSync(papaiFile, 'utf8');
    assert.match(papaiContent, /^---\r?\napplyTo: "\*\*"\r?\n---/);
    assert.doesNotMatch(papaiContent, /^name:/m);
    assert.match(papaiContent, /Dynamic Senior Analysis Agent/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
