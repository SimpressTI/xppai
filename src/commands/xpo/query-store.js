'use strict';

const fs = require('fs');
const nodePath = require('path');
const crypto = require('crypto');
const { resolveCacheDir } = require('../../cache/paths');

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function sha256(input) {
  return crypto.createHash('sha256').update(String(input || '')).digest('hex');
}

function sortByLoadedAtAsc(entries) {
  return [...entries].sort((a, b) => String(a.loadedAt || '').localeCompare(String(b.loadedAt || '')));
}

function loadIndexOrExit(flags) {
  const cacheDir = resolveCacheDir(flags);
  const indexPath = nodePath.join(cacheDir, 'index.json');
  if (!fs.existsSync(indexPath)) {
    process.stderr.write(
      `error: cache index not found: ${indexPath}\n` +
      'hint: load an XPO first with `xppai xpo load <file>` or `xppai xpo load-stdin`\n'
    );
    process.exit(1);
  }

  const indexRaw = fs.readFileSync(indexPath, 'utf8');
  const index = readJson(indexPath);
  const files = Array.isArray(index.files) ? index.files : [];
  if (!files.length) {
    process.stderr.write(
      'error: cache index has no loaded XPO entries\n' +
      'hint: load an XPO first with `xppai xpo load <file>` or `xppai xpo load-stdin`\n'
    );
    process.exit(1);
  }

  return { cacheDir, files, index, indexPath, fingerprint: sha256(indexRaw) };
}

function latestEntriesByFile(files) {
  const latest = new Map();
  for (const entry of sortByLoadedAtAsc(files)) {
    const key = nodePath.resolve(String(entry.filePath || ''));
    latest.set(key, entry);
  }
  return [...latest.values()];
}

function pickEntries(files, fileFilter) {
  const latest = latestEntriesByFile(files);
  if (!fileFilter) return latest;

  const absFile = nodePath.resolve(String(fileFilter));
  const matches = latest.filter((e) => nodePath.resolve(String(e.filePath || '')) === absFile);
  if (!matches.length) {
    process.stderr.write(`error: no cached entries found for file: ${absFile}\n`);
    process.exit(1);
  }
  return matches;
}

function readExtractObjects(entry) {
  if (!entry.extractPath || !fs.existsSync(entry.extractPath)) {
    return [];
  }
  const extract = readJson(entry.extractPath);
  return Array.isArray(extract.objects) ? extract.objects : [];
}

function normalizeType(input) {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  const t = raw.toLowerCase();
  const map = {
    class: 'Class',
    table: 'Table',
    form: 'Form',
    query: 'Query',
    enum: 'Enum',
    map: 'Map',
    edtext: 'ExtendedDataType',
    extendeddatatype: 'ExtendedDataType',
    datatype: 'DataType',
    view: 'View',
    job: 'Job',
    project: 'Project',
  };
  return map[t] || (raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase());
}

function collectObjects(files) {
  const rows = [];
  for (const entry of files) {
    for (const obj of readExtractObjects(entry)) {
      rows.push({
        filePath: entry.filePath,
        loadedAt: entry.loadedAt,
        type: obj.type,
        name: obj.name,
        sourceRef: obj.sourceRef,
        content: obj.content,
        contentHash: obj.contentHash,
      });
    }
  }
  return rows;
}

module.exports = {
  collectObjects,
  loadIndexOrExit,
  normalizeType,
  pickEntries,
  sha256,
};
