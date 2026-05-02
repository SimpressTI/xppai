'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runCli } = require('../helpers/cli');
const { mkdtemp } = require('../helpers/tmp');
const { xpoLoadSampleFragment } = require('../fixtures/xpo');

test('xpo load parses object types and writes extract json', () => {
  const tempRoot = mkdtemp('xppai-xpo-');
  const tempLocal = path.join(tempRoot, 'local');
  const xpoFile = path.join(tempRoot, 'sample.xpo');
  const cacheDir = path.join(tempRoot, 'cache');

  fs.writeFileSync(xpoFile, xpoLoadSampleFragment(), 'utf8');

  const out = runCli(['xpo', 'load', xpoFile, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(out, /objects: 3/);

  const indexPath = path.join(cacheDir, 'index.json');
  assert.ok(fs.existsSync(indexPath), 'cache index should exist');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  assert.equal(index.files.length, 1);

  const extractPath = index.files[0].extractPath;
  assert.ok(fs.existsSync(extractPath), 'extract file should exist');
  const extract = JSON.parse(fs.readFileSync(extractPath, 'utf8'));
  const types = extract.objects.map((o) => o.type);
  assert.deepEqual(types, ['Class', 'Table', 'Form']);
  assert.match(extract.objects[0].content, /Class #MyClass/);
  assert.ok(extract.objects[0].contentHash);
});
