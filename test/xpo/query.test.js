'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runCli } = require('../helpers/cli');
const { mkdtemp } = require('../helpers/tmp');
const { xpoLoadSampleFragment, classesVersion1, classesVersion2 } = require('../fixtures/xpo');

test('xpo read keeps cache available for additional queries', () => {
  const tempRoot = mkdtemp('xppai-xpo-query-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const xpoFile = path.join(tempRoot, 'sample.xpo');
  fs.writeFileSync(xpoFile, xpoLoadSampleFragment(), 'utf8');

  runCli(['xpo', 'load', xpoFile, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  runCli(['xpo', 'snapshot', '--cache-dir', cacheDir, '--json'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  const listOut = runCli(['xpo', 'list', '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(listOut, /objects: 3/);
  assert.match(listOut, /Class: 1/);

  const grepOut = runCli(['xpo', 'grep', '--contains', 'CustAccount', '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(grepOut, /Table #CustTable/);

  const readOut = runCli(['xpo', 'read', '--type', 'class', '--name', 'MyClass', '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(readOut, /object: Class #MyClass/);
  assert.match(readOut, /METHODS/);

  const grepOutAfterRead = runCli(['xpo', 'grep', '--contains', 'CustAccount', '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(grepOutAfterRead, /Table #CustTable/);
});

test('xpo load keeps only one active cached file (latest load wins)', () => {
  const tempRoot = mkdtemp('xppai-xpo-query-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const fileA = path.join(tempRoot, 'a.xpo');
  const fileB = path.join(tempRoot, 'b.xpo');
  fs.writeFileSync(fileA, classesVersion1(), 'utf8');
  fs.writeFileSync(fileB, classesVersion2(), 'utf8');

  runCli(['xpo', 'load', fileA, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  runCli(['xpo', 'load', fileB, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  runCli(['xpo', 'snapshot', '--cache-dir', cacheDir, '--json'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  const listOut = runCli(['xpo', 'list', '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(listOut, new RegExp(fileB.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(listOut, new RegExp(fileA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('xpo load replaces previous cache contents for same source path', () => {
  const tempRoot = mkdtemp('xppai-xpo-query-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const fileA = path.join(tempRoot, 'same.xpo');
  fs.writeFileSync(fileA, classesVersion1(), 'utf8');

  runCli(['xpo', 'load', fileA, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  fs.writeFileSync(fileA, classesVersion2(), 'utf8');

  const out = runCli(['xpo', 'load', fileA, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(out, /loaded XPO:/);

  runCli(['xpo', 'snapshot', '--cache-dir', cacheDir, '--json'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  const readOut = runCli(['xpo', 'read', '--type', 'Class', '--name', 'A', '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(readOut, /info\("v2"\)/);
});
