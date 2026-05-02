'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runCli } = require('../helpers/cli');
const pkg = require('../../package.json');

test('cli: xppai --version prints package version', () => {
  const out = runCli(['--version']);
  assert.equal(out.trim(), pkg.version);
});

test('cli: xppai -v prints package version', () => {
  const out = runCli(['-v']);
  assert.equal(out.trim(), pkg.version);
});
