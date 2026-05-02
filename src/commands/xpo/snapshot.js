'use strict';

const { collectObjects, loadIndexOrExit, normalizeType, pickEntries } = require('./query-store');
const { writeSessionAuth } = require('./session-auth');

function preview(content, limit) {
  const text = String(content || '').replace(/\r?\n/g, '\\n');
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

module.exports = function snapshot(flags, _args) {
  const { cacheDir, files, fingerprint } = loadIndexOrExit(flags);
  const entries = pickEntries(files, flags['--file']);
  const typeFilter = normalizeType(flags['--type']);
  const limit = Number.isFinite(Number(flags['--limit'])) ? Math.max(1, Number(flags['--limit'])) : 200;

  let objects = collectObjects(entries);
  if (typeFilter) {
    objects = objects.filter((o) => o.type === typeFilter);
  }
  objects = objects.slice(0, limit);

  const byType = {};
  for (const obj of objects) {
    byType[obj.type] = (byType[obj.type] || 0) + 1;
  }

  const payload = {
    cacheDir,
    cacheFingerprint: fingerprint,
    files: entries.map((entry) => ({
      filePath: entry.filePath,
      fileHash: entry.fileHash,
      loadedAt: entry.loadedAt,
      objectCount: entry.objectCount,
      byType: entry.byType || {},
      extractPath: entry.extractPath,
    })),
    objectCount: objects.length,
    byType,
    objects: objects.map((obj) => ({
      type: obj.type,
      name: obj.name,
      filePath: obj.filePath,
      sourceRef: obj.sourceRef,
      contentHash: obj.contentHash,
      preview: preview(obj.content, 240),
    })),
  };

  if (flags['--json']) {
    writeSessionAuth({
      cacheDir,
      cacheFingerprint: fingerprint,
      approvedAt: new Date().toISOString(),
    });
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
    return;
  }

  writeSessionAuth({
    cacheDir,
    cacheFingerprint: fingerprint,
    approvedAt: new Date().toISOString(),
  });
  process.stdout.write(
    `cache dir: ${payload.cacheDir}\n` +
    `files: ${payload.files.length}\n` +
    `objects: ${payload.objectCount}\n` +
    `types: ${Object.keys(payload.byType).sort().join(', ')}\n`
  );
};
