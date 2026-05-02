'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runCli } = require('../helpers/cli');
const { mkdtemp } = require('../helpers/tmp');
const { xpoLoadSampleFragment } = require('../fixtures/xpo');

test('xpo cache-copy reuses snapshot auth and still confirms non-empty destinations', () => {
  const tempRoot = mkdtemp('xppai-cache-copy-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const source = path.join(tempRoot, 'sample.xpo');
  const dest = path.join(tempRoot, 'dest');
  fs.writeFileSync(source, xpoLoadSampleFragment(), 'utf8');

  runCli(['xpo', 'load', source, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  runCli(['xpo', 'snapshot', '--cache-dir', cacheDir, '--json'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, 'keep.txt'), 'keep', 'utf8');

  const out = runCli(['xpo', 'cache-copy', dest, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
    input: 'y\n',
  });

  assert.match(out, /copied xpo cache from/);
  assert.ok(fs.existsSync(path.join(dest, 'index.json')));
});
