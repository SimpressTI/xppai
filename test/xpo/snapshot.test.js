'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runCli } = require('../helpers/cli');
const { mkdtemp } = require('../helpers/tmp');
const { xpoLoadSampleFragment, classesVersion1 } = require('../fixtures/xpo');

test('xpo snapshot returns a bounded JSON inventory for the active cache', () => {
  const tempRoot = mkdtemp('xppai-xpo-snapshot-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const xpoFile = path.join(tempRoot, 'sample.xpo');

  fs.writeFileSync(xpoFile, xpoLoadSampleFragment(), 'utf8');

  runCli(['xpo', 'load', xpoFile, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  const out = runCli(['xpo', 'snapshot', '--cache-dir', cacheDir, '--json'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  const payload = JSON.parse(out);
  assert.equal(payload.cacheDir, path.resolve(cacheDir));
  assert.equal(payload.files.length, 1);
  assert.equal(payload.objectCount, 3);
  assert.deepEqual(payload.byType, { Class: 1, Form: 1, Table: 1 });
  assert.equal(payload.objects[0].preview.length > 0, true);
  assert.match(payload.objects[0].preview, /Class #MyClass/);
});

test('xpo snapshot respects file and type filters', () => {
  const tempRoot = mkdtemp('xppai-xpo-snapshot-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const xpoFile = path.join(tempRoot, 'classes.xpo');

  fs.writeFileSync(xpoFile, classesVersion1(), 'utf8');

  runCli(['xpo', 'load', xpoFile, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  const out = runCli(['xpo', 'snapshot', '--cache-dir', cacheDir, '--type', 'Class', '--limit', '1', '--json'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  const payload = JSON.parse(out);
  assert.equal(payload.objectCount, 1);
  assert.deepEqual(payload.byType, { Class: 1 });
  assert.equal(payload.objects.length, 1);
  assert.equal(payload.objects[0].type, 'Class');
});

