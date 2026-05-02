'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runCli } = require('../helpers/cli');
const { mkdtemp } = require('../helpers/tmp');

test('xpo cache-use persists dir in user config', () => {
  const tempLocal = mkdtemp('xppai-local-');
  const cacheDir = path.join(tempLocal, 'chosen-cache');

  runCli(['xpo', 'cache-use', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  const configPath = path.join(tempLocal, 'xppai', 'config.json');
  assert.ok(fs.existsSync(configPath), 'config file must exist');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.equal(config.xpoCacheDir, path.resolve(cacheDir));
});
