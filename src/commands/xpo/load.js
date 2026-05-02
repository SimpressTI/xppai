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

function isLikelyCompleteXpo(raw, objects) {
  if (!objects.length) return false;
  const expectedClosers = {
    Class: 'ENDCLASS',
    Table: 'ENDTABLE',
    Form: 'ENDFORM',
    Query: 'ENDQUERY',
    Map: 'ENDMAP',
    View: 'ENDVIEW',
    Enum: 'ENDENUM',
    Job: 'ENDJOB',
    Project: 'ENDPROJECT',
  };

  for (const obj of objects) {
    const closer = expectedClosers[obj.type];
    if (!closer) continue;
    const lines = String(obj.content || '').split(/\r?\n/).map((l) => l.trim().toUpperCase());
    if (!lines.includes(closer)) return false;
  }

  return true;
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
  const existingForPath = payload.files.filter(
    (f) => nodePath.resolve(f.filePath) === nodePath.resolve(entry.filePath)
  );
  payload.files = payload.files.filter(
    (f) => !(f.fileHash === entry.fileHash && nodePath.resolve(f.filePath) === nodePath.resolve(entry.filePath))
  );
  payload.files.push(entry);
  fs.writeFileSync(indexPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  return existingForPath.some((f) => f.fileHash !== entry.fileHash);
}

function clearCacheDir(cacheDir) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
}

function loadFromRaw(flags, raw, sourcePath, opts = {}) {
  const cacheDir = resolveCacheDir(flags);
  if (!opts.preserveCache) {
    clearCacheDir(cacheDir);
  }
  ensureCacheStructure(cacheDir);

  const absSource = nodePath.resolve(sourcePath);
  const lines = raw.split(/\r?\n/);
  const fileHash = sha256(raw);
  const objects = parseObjects(lines);

  const extract = {
    filePath: absSource,
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

  const replaced = updateTopIndex(cacheDir, {
    filePath: absSource,
    fileHash,
    loadedAt: extract.loadedAt,
    objectCount: extract.objectCount,
    byType,
    extractPath,
  });

  if (replaced) {
    process.stdout.write(`warning: overwriting active cache entry for source: ${absSource}\n`);
  }
  process.stdout.write(
    `loaded XPO: ${absSource}\n` +
    `cache dir: ${cacheDir}\n` +
    `objects: ${extract.objectCount}\n`
  );
}

function loadFromFile(flags, fileArg) {
  if (!fileArg) {
    process.stderr.write('error: xppai xpo load requires <file>\n');
    process.exit(1);
  }

  const absFile = nodePath.resolve(fileArg);
  if (!fs.existsSync(absFile) || !fs.statSync(absFile).isFile()) {
    process.stderr.write(`error: file not found: ${absFile}\n`);
    process.exit(1);
  }

  const raw = fs.readFileSync(absFile, 'utf8');
  return loadFromRaw(flags, raw, absFile);
}

module.exports = function load(flags, args) {
  return loadFromFile(flags, args[0]);
};

module.exports.loadFromRaw = loadFromRaw;
module.exports.loadFromFile = loadFromFile;
module.exports.parseObjects = parseObjects;
module.exports.isLikelyCompleteXpo = isLikelyCompleteXpo;
module.exports.clearCacheDir = clearCacheDir;
