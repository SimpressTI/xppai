'use strict';

const { collectObjects, loadIndexOrExit, normalizeType, pickEntries } = require('./query-store');
const { requireSessionAuthOrExit } = require('./session-auth');

function printText(cacheDir, entries, objects) {
  const byType = {};
  for (const obj of objects) byType[obj.type] = (byType[obj.type] || 0) + 1;
  const types = Object.keys(byType).sort((a, b) => a.localeCompare(b));

  let out = '';
  out += `cache dir: ${cacheDir}\n`;
  out += `files: ${entries.length}\n`;
  out += `objects: ${objects.length}\n`;
  out += 'types:\n';
  for (const t of types) out += `  ${t}: ${byType[t]}\n`;

  if (objects.length && objects.length <= 200) {
    out += 'object names:\n';
    for (const obj of [...objects].sort((a, b) => `${a.type}:${a.name}`.localeCompare(`${b.type}:${b.name}`))) {
      out += `  ${obj.type} #${obj.name} (${obj.filePath})\n`;
    }
  }

  process.stdout.write(out);
}

module.exports = function list(flags, _args) {
  const { cacheDir, files, fingerprint } = loadIndexOrExit(flags);
  requireSessionAuthOrExit({ cacheDir, fingerprint });
  const entries = pickEntries(files, flags['--file']);
  const typeFilter = normalizeType(flags['--type']);

  let objects = collectObjects(entries);
  if (typeFilter) {
    objects = objects.filter((o) => o.type === typeFilter);
  }

  if (flags['--json']) {
    process.stdout.write(
      JSON.stringify(
        {
          cacheDir,
          files: entries.map((e) => ({
            filePath: e.filePath,
            fileHash: e.fileHash,
            loadedAt: e.loadedAt,
            objectCount: e.objectCount,
            byType: e.byType || {},
            extractPath: e.extractPath,
          })),
          objects: objects.map((o) => ({
            filePath: o.filePath,
            loadedAt: o.loadedAt,
            type: o.type,
            name: o.name,
            sourceRef: o.sourceRef,
            contentHash: o.contentHash,
          })),
        },
        null,
        2
      ) + '\n'
    );
    return;
  }

  printText(cacheDir, entries, objects);
};
