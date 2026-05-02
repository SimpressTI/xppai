'use strict';

const fs = require('fs');
const nodePath = require('path');
const crypto = require('crypto');
const { resolveCacheDir, ensureCacheStructure } = require('../../cache/paths');

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function normalizeType(raw) {
  const t = raw.toLowerCase();
  const map = {
    class: 'Class',
    table: 'Table',
    form: 'Form',
    query: 'Query',
    enum: 'Enum',
    map: 'Map',
    edtext: 'ExtendedDataType',
    datatype: 'DataType',
    view: 'View',
    job: 'Job',
    project: 'Project',
  };
  return map[t] || (raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase());
}

function parseObjects(lines) {
  const headerRe = /^\s*([A-Za-z][A-Za-z0-9]*)\s+#([^\s]+)\s*$/;
  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(headerRe);
    if (!m) continue;
    starts.push({
      line: i + 1,
      type: normalizeType(m[1]),
      name: m[2],
      header: lines[i],
    });
  }

  const objects = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const endLine = i + 1 < starts.length ? starts[i + 1].line - 1 : lines.length;
    const block = lines.slice(start.line - 1, endLine).join('\n');
    objects.push({
      type: start.type,
      name: start.name,
      sourceRef: {
        startLine: start.line,
        endLine,
      },
      content: block,
    });
  }
  return objects;
}

function updateTopIndex(cacheDir, entry) {
  const indexPath = nodePath.join(cacheDir, 'index.json');
  let payload = { files: [] };
  if (fs.existsSync(indexPath)) {
    try {
      payload = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      if (!Array.isArray(payload.files)) payload.files = [];
    } catch (_) {
      payload = { files: [] };
    }
  }
  payload.files = payload.files.filter(
    (f) => !(f.fileHash === entry.fileHash && nodePath.resolve(f.filePath) === nodePath.resolve(entry.filePath))
  );
  payload.files.push(entry);
  fs.writeFileSync(indexPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

module.exports = function load(flags, args) {
  const fileArg = args[0];
  if (!fileArg) {
    process.stderr.write('error: xppai xpo load requires <file>\n');
    process.exit(1);
  }

  const absFile = nodePath.resolve(fileArg);
  if (!fs.existsSync(absFile) || !fs.statSync(absFile).isFile()) {
    process.stderr.write(`error: file not found: ${absFile}\n`);
    process.exit(1);
  }

  const cacheDir = resolveCacheDir(flags);
  ensureCacheStructure(cacheDir);

  const raw = fs.readFileSync(absFile, 'utf8');
  const lines = raw.split(/\r?\n/);
  const fileHash = sha256(raw);
  const objects = parseObjects(lines);

  const extract = {
    filePath: absFile,
    fileHash,
    loadedAt: new Date().toISOString(),
    objectCount: objects.length,
    objects: objects.map((o) => ({
      type: o.type,
      name: o.name,
      sourceRef: o.sourceRef,
      content: o.content,
      contentHash: sha256(`${o.type}:${o.name}:${o.content}`),
    })),
  };

  const extractPath = nodePath.join(cacheDir, 'extracts', `${fileHash}.json`);
  fs.writeFileSync(extractPath, JSON.stringify(extract, null, 2) + '\n', 'utf8');

  const byType = {};
  for (const o of extract.objects) {
    if (!byType[o.type]) byType[o.type] = 0;
    byType[o.type]++;
  }

  updateTopIndex(cacheDir, {
    filePath: absFile,
    fileHash,
    loadedAt: extract.loadedAt,
    objectCount: extract.objectCount,
    byType,
    extractPath,
  });

  process.stdout.write(
    `loaded XPO: ${absFile}\n` +
    `cache dir: ${cacheDir}\n` +
    `objects: ${extract.objectCount}\n`
  );
};
