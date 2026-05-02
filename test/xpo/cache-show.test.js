'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { runCli } = require('../helpers/cli');
const { mkdtemp } = require('../helpers/tmp');

test('xpo cache-show prints resolved dir and source', () => {
  const tempRoot = mkdtemp('xppai-show-');
  const dir = path.join(tempRoot, 'my-cache');
  const out = runCli(['xpo', 'cache-show', '--cache-dir', dir]);
  assert.ok(out.includes(`xpo cache dir: ${path.resolve(dir)}`));
  assert.match(out, /source: flag/);
});
