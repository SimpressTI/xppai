'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runCli } = require('../helpers/cli');
const { mkdtemp } = require('../helpers/tmp');

test('cli: install copilot writes repository instruction files to --out', () => {
  const tempDir = mkdtemp('xppai-install-copilot-');

  try {
    const output = runCli(['install', '--target', 'copilot', '--out', tempDir]);
    assert.match(output, /installed copilot to /);
    assert.ok(fs.existsSync(path.join(tempDir, 'copilot-instructions.md')));
    assert.ok(fs.existsSync(path.join(tempDir, 'instructions', 'xppai-papai.instructions.md')));
    assert.ok(!fs.existsSync(path.join(tempDir, 'prompts')), 'prompts directory must not be exported');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
