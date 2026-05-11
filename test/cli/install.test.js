'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runCli } = require('../helpers/cli');
const { mkdtemp } = require('../helpers/tmp');

test('cli: install copilot writes Copilot CLI skill directories to --out', () => {
  const tempDir = mkdtemp('xppai-install-copilot-');

  try {
    const output = runCli(['install', '--target', 'copilot', '--out', tempDir]);
    assert.match(output, /installed copilot to /);
    assert.ok(fs.existsSync(path.join(tempDir, 'xppai-papai', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(tempDir, 'xppai-init', 'SKILL.md')));
    assert.ok(!fs.existsSync(path.join(tempDir, 'copilot-instructions.md')));
    assert.ok(!fs.existsSync(path.join(tempDir, 'instructions')));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
