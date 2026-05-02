'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runCli } = require('../helpers/cli');
const { mkdtemp } = require('../helpers/tmp');
const { xpoLoadSampleFragment } = require('../fixtures/xpo');

test('xpo analyze-* aliases execute with persistent cache between reads', () => {
  const tempRoot = mkdtemp('xppai-xpo-analyze-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const xpoFile = path.join(tempRoot, 'sample.xpo');
  fs.writeFileSync(xpoFile, xpoLoadSampleFragment(), 'utf8');

  const loadOut = runCli(['xpo', 'analyze-load', xpoFile, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(loadOut, /loaded XPO:/);
  assert.match(loadOut, /objects:\s+\d+/);

  const snapshotOut = runCli(['xpo', 'analyze-snapshot', '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.doesNotMatch(snapshotOut, /^snapshot:/m);
  const snapshotJson = JSON.parse(snapshotOut);
  assert.equal(typeof snapshotJson.cacheDir, 'string');
  assert.equal(Array.isArray(snapshotJson.objects), true);

  const listOut = runCli(['xpo', 'analyze-list', '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(listOut, /objects:\s+\d+/);
  assert.match(listOut, /Class #MyClass/);

  const readOut = runCli(['xpo', 'analyze-read', '--type', 'Class', '--name', 'MyClass', '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(readOut, /object: Class #MyClass/);

  const grepOut = runCli(['xpo', 'analyze-grep', '--contains', 'CustAccount', '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(grepOut, /Table #CustTable/);
});
