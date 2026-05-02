'use strict';

const fs = require('fs');
const nodePath = require('path');
const { localAppDataDir } = require('../../config/user-config');

function authPath() {
  return nodePath.join(localAppDataDir(), 'xppai', 'cache', 'xpo-session-auth.json');
}

function readSessionAuth() {
  const path = authPath();
  if (!fs.existsSync(path)) return null;
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (_) {
    return null;
  }
}

function writeSessionAuth(payload) {
  const path = authPath();
  fs.mkdirSync(nodePath.dirname(path), { recursive: true });
  fs.writeFileSync(path, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function requireSessionAuthOrExit(context) {
  const auth = readSessionAuth();
  if (!auth) {
    process.stderr.write(
      'error: no approved XPO cache session found\n' +
      'hint: run `xppai xpo snapshot --json` for the cache first\n'
    );
    process.exit(1);
  }

  if (context && auth.cacheDir && context.cacheDir && nodePath.resolve(auth.cacheDir) !== nodePath.resolve(context.cacheDir)) {
    process.stderr.write(
      'error: approved XPO cache session does not match the active cache directory\n' +
      'hint: run `xppai xpo snapshot --json` again for the current cache\n'
    );
    process.exit(1);
  }

  if (context && auth.cacheFingerprint !== context.fingerprint) {
    process.stderr.write(
      'error: approved XPO cache session does not match the active cache\n' +
      'hint: run `xppai xpo snapshot --json` again for the current cache\n'
    );
    process.exit(1);
  }

  return auth;
}

module.exports = {
  authPath,
  readSessionAuth,
  requireSessionAuthOrExit,
  writeSessionAuth,
};
