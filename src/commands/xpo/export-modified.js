'use strict';

const fs = require('fs');
const nodePath = require('path');
const { resolveCacheDir } = require('../../cache/paths');
const { loadIndexOrExit } = require('./query-store');
const { requireSessionAuthOrExit } = require('./session-auth');

function sanitize(name) {
  return String(name).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}

function objectKey(obj) {
  return `${obj.type}:${obj.name}`;
}

function pickTargetEntries(indexFiles, filePathFilter) {
  const sorted = [...indexFiles].sort((a, b) => String(a.loadedAt).localeCompare(String(b.loadedAt)));
  const targetPath = filePathFilter
    ? nodePath.resolve(filePathFilter)
    : (sorted.length ? sorted[sorted.length - 1].filePath : null);

  const forPath = sorted.filter((f) => nodePath.resolve(f.filePath) === nodePath.resolve(targetPath || ''));
  const latest = forPath.length ? forPath[forPath.length - 1] : null;
  const previous = forPath.length > 1 ? forPath[forPath.length - 2] : null;
  return { latest, previous, targetPath };
}

module.exports = function exportModified(flags, _args) {
  const outDir = flags['--out'];
  if (!outDir) {
    process.stderr.write('error: xppai xpo export-modified requires --out <dir>\n');
    process.exit(1);
  }

  const cacheDir = resolveCacheDir(flags);
  const { files, fingerprint } = loadIndexOrExit(flags);
  requireSessionAuthOrExit({ cacheDir, fingerprint });

  const requestedFile = flags['--file'] ? nodePath.resolve(String(flags['--file'])) : null;
  const { latest, previous, targetPath } = pickTargetEntries(files, requestedFile);
  if (!latest) {
    process.stderr.write(
      requestedFile
        ? `error: no cached entries found for file: ${requestedFile}\n`
        : 'error: no cached entries found\n'
    );
    process.exit(1);
  }

  const latestExtract = JSON.parse(fs.readFileSync(latest.extractPath, 'utf8'));
  const previousExtract = previous ? JSON.parse(fs.readFileSync(previous.extractPath, 'utf8')) : null;

  const prevHashes = new Map();
  if (previousExtract && Array.isArray(previousExtract.objects)) {
    for (const obj of previousExtract.objects) {
      prevHashes.set(objectKey(obj), obj.contentHash);
    }
  }

  const modified = [];
  for (const obj of latestExtract.objects || []) {
    const key = objectKey(obj);
    const oldHash = prevHashes.get(key);
    if (!oldHash || oldHash !== obj.contentHash) {
      modified.push(obj);
    }
  }

  const absOut = nodePath.resolve(String(outDir));
  fs.mkdirSync(absOut, { recursive: true });

  let written = 0;
  for (const obj of modified) {
    const filename = `${sanitize(obj.type)}_${sanitize(obj.name)}.xpo`;
    const outPath = nodePath.join(absOut, filename);
    fs.writeFileSync(outPath, (obj.content || '') + '\n', 'utf8');
    written++;
  }

  process.stdout.write(
    `source file: ${targetPath}\n` +
    `baseline: ${previous ? previous.fileHash : 'none'}\n` +
    `modified objects: ${modified.length}\n` +
    `exported files: ${written}\n` +
    `output dir: ${absOut}\n`
  );
};
