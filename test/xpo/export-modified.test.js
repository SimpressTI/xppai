'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runCli } = require('../helpers/cli');
const { mkdtemp } = require('../helpers/tmp');
const { classesVersion1, classesVersion2 } = require('../fixtures/xpo');

test('xpo export-modified writes one xpo per changed object', () => {
  const tempRoot = mkdtemp('xppai-expmod-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const outDir = path.join(tempRoot, 'out');
  const xpoFile = path.join(tempRoot, 'objects.xpo');

  fs.writeFileSync(xpoFile, classesVersion1(), 'utf8');
  runCli(['xpo', 'load', xpoFile, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  runCli(['xpo', 'snapshot', '--cache-dir', cacheDir, '--json'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  fs.writeFileSync(xpoFile, classesVersion2(), 'utf8');
  runCli(['xpo', 'load', xpoFile, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  runCli(['xpo', 'snapshot', '--cache-dir', cacheDir, '--json'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  const out = runCli([
    'xpo',
    'export-modified',
    '--out',
    outDir,
    '--file',
    xpoFile,
    '--cache-dir',
    cacheDir,
  ], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(out, /modified objects: 1/);

  const files = fs.readdirSync(outDir).sort();
  assert.deepEqual(files, ['Class_A.xpo']);
  const content = fs.readFileSync(path.join(outDir, 'Class_A.xpo'), 'utf8');
  assert.match(content, /info\("v2"\)/);
});
