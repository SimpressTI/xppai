'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runCli } = require('../helpers/cli');
const { mkdtemp } = require('../helpers/tmp');
const { xpoLoadSampleComplete } = require('../fixtures/xpo');

test('xpo load-stdin parses objects and persists synthetic source file in cache', () => {
  const tempRoot = mkdtemp('xppai-xpo-stdin-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');

  const out = runCli(['xpo', 'load-stdin', '--name', 'from-chat.xpo', '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
    input: xpoLoadSampleComplete(),
  });
  assert.match(out, /objects: 3/);

  const indexPath = path.join(cacheDir, 'index.json');
  assert.ok(fs.existsSync(indexPath), 'cache index should exist');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  assert.equal(index.files.length, 1);

  const sourcePath = index.files[0].filePath;
  assert.ok(sourcePath.endsWith(path.join('sources', 'from-chat.xpo')));
  assert.ok(fs.existsSync(sourcePath), 'synthetic source xpo should exist in cache');
});

test('xpo load-stdin rejects incomplete pasted content and does not write cache', () => {
  const tempRoot = mkdtemp('xppai-xpo-stdin-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const partial = [
    'CLASS #MyClass',
    'SOURCE #classDeclaration',
    'class MyClass',
    '{',
    '}',
    'ENDSOURCE',
  ].join('\n');

  assert.throws(() => {
    runCli(['xpo', 'load-stdin', '--name', 'partial.xpo', '--cache-dir', cacheDir], {
      env: { ...process.env, LOCALAPPDATA: tempLocal },
      input: partial,
    });
  }, /pasted XPO appears incomplete/);

  const indexPath = path.join(cacheDir, 'index.json');
  assert.equal(fs.existsSync(indexPath), false, 'cache index should not exist for incomplete input');
});
