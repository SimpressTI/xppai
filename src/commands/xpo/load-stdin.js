'use strict';

const fs = require('fs');
const nodePath = require('path');
const { resolveCacheDir, ensureCacheStructure } = require('../../cache/paths');
const load = require('./load');

function sanitizeBasename(input) {
  const trimmed = String(input || '').trim();
  const safe = trimmed.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  return safe || 'pasted.xpo';
}

module.exports = function loadStdin(flags, _args) {
  const raw = fs.readFileSync(0, 'utf8');
  if (!raw.trim()) {
    process.stderr.write('error: xppai xpo load-stdin requires XPO text on stdin\n');
    process.exit(1);
  }
  const objects = load.parseObjects(raw.split(/\r?\n/));
  if (!load.isLikelyCompleteXpo(raw, objects)) {
    process.stderr.write(
      'error: pasted XPO appears incomplete; cache was not written\n' +
      'hint: include a full object export ending with an END* marker (for example ENDCLASS/ENDTABLE/ENDFORM)\n'
    );
    process.exit(1);
  }

  const cacheDir = resolveCacheDir(flags);
  ensureCacheStructure(cacheDir);

  const name = sanitizeBasename(flags['--name'] || 'pasted.xpo');
  const sourceDir = nodePath.join(cacheDir, 'sources');
  const sourcePath = nodePath.join(sourceDir, name.toLowerCase().endsWith('.xpo') ? name : `${name}.xpo`);
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.writeFileSync(sourcePath, raw, 'utf8');

  return load.loadFromRaw(flags, raw, sourcePath);
};
