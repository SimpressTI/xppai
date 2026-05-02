'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { runCli } = require('../helpers/cli');

test('cli: xppai path exits 0 and prints an existing path', () => {
  const out = runCli(['path']);
  const p = out.trim();
  assert.ok(p.length > 0, 'path is empty');
  assert.ok(fs.existsSync(p), `path does not exist: ${p}`);
});
