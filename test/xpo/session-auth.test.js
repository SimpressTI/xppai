'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { runCli } = require('../helpers/cli');
const { mkdtemp } = require('../helpers/tmp');
const { xpoLoadSampleFragment, classesVersion1, classesVersion2 } = require('../fixtures/xpo');

function sha256(input) {
  return createHash('sha256').update(String(input || '')).digest('hex');
}

test('xpo snapshot writes a reusable session auth record for the cache fingerprint', () => {
  const tempRoot = mkdtemp('xppai-session-auth-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const xpoFile = path.join(tempRoot, 'sample.xpo');
  const authPath = path.join(tempLocal, 'xppai', 'cache', 'xpo-session-auth.json');

  fs.writeFileSync(xpoFile, xpoLoadSampleFragment(), 'utf8');

  runCli(['xpo', 'load', xpoFile, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  runCli(['xpo', 'snapshot', '--cache-dir', cacheDir, '--json'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  const indexRaw = fs.readFileSync(path.join(cacheDir, 'index.json'), 'utf8');
  const index = JSON.parse(indexRaw);
  const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));

  assert.equal(auth.cacheDir, path.resolve(cacheDir));
  assert.equal(auth.cacheFingerprint, sha256(indexRaw));
  assert.ok(auth.approvedAt, 'snapshot should store approval time');
  assert.equal(index.files.length, 1);
});

test('xpo read requires a prior snapshot authorization for the same cache fingerprint', () => {
  const tempRoot = mkdtemp('xppai-session-auth-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const fileA = path.join(tempRoot, 'a.xpo');
  const fileB = path.join(tempRoot, 'b.xpo');

  fs.writeFileSync(fileA, classesVersion1(), 'utf8');
  fs.writeFileSync(fileB, classesVersion2(), 'utf8');

  runCli(['xpo', 'load', fileA, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  runCli(['xpo', 'snapshot', '--cache-dir', cacheDir, '--json'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  const ok = runCli(['xpo', 'read', '--type', 'Class', '--name', 'A', '--file', fileA, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  assert.match(ok, /object: Class #A/);

  runCli(['xpo', 'load', fileB, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  assert.throws(() => {
    runCli(['xpo', 'read', '--type', 'Class', '--name', 'A', '--file', fileA, '--cache-dir', cacheDir], {
      env: { ...process.env, LOCALAPPDATA: tempLocal },
    });
  }, /approved XPO cache session does not match the active cache/);
});

