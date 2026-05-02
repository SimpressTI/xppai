'use strict';

const fs = require('fs');
const nodePath = require('path');
const readline = require('readline');
const { resolveCacheDir } = require('../../cache/paths');

function isNonEmptyDir(dir) {
  if (!fs.existsSync(dir)) return false;
  if (!fs.statSync(dir).isDirectory()) return false;
  return fs.readdirSync(dir).length > 0;
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = nodePath.join(src, entry.name);
    const destPath = nodePath.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function askConfirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(String(answer || '').trim().toLowerCase());
    });
  });
}

module.exports = async function cacheCopy(flags, args) {
  const destArg = args[0];
  if (!destArg) {
    process.stderr.write('error: xppai xpo cache-copy requires <dest>\n');
    process.exit(1);
  }

  const sourceDir = resolveCacheDir(flags);
  const destDir = nodePath.resolve(destArg);
  const skipPrompt = flags['--yes'] === true;

  if (!fs.existsSync(sourceDir)) {
    process.stderr.write(`error: source cache directory not found: ${sourceDir}\n`);
    process.exit(1);
  }
  if (!fs.statSync(sourceDir).isDirectory()) {
    process.stderr.write(`error: source cache path is not a directory: ${sourceDir}\n`);
    process.exit(1);
  }

  if (isNonEmptyDir(destDir)) {
    if (!skipPrompt) {
      const answer = await askConfirm(
        `destination "${destDir}" has files. All content will be erased and replaced. Continue? [y/N] `
      );
      if (answer !== 'y' && answer !== 'yes') {
        process.stdout.write('aborted: destination unchanged\n');
        return;
      }
    }
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  copyRecursive(sourceDir, destDir);
  process.stdout.write(`copied xpo cache from ${sourceDir} to ${destDir}\n`);
};
