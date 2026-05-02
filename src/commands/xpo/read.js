'use strict';

const { collectObjects, loadIndexOrExit, normalizeType, pickEntries } = require('./query-store');
const { requireSessionAuthOrExit } = require('./session-auth');

module.exports = function read(flags, _args) {
  const type = normalizeType(flags['--type']);
  const name = flags['--name'] ? String(flags['--name']) : '';

  if (!type || !name) {
    process.stderr.write('error: xppai xpo read requires --type <T> and --name <N>\n');
    process.exit(1);
  }

  const { cacheDir, files, fingerprint } = loadIndexOrExit(flags);
  requireSessionAuthOrExit({ cacheDir, fingerprint });
  const entries = pickEntries(files, flags['--file']);
  const matches = collectObjects(entries).filter((o) => o.type === type && o.name === name);

  if (!matches.length) {
    process.stderr.write(
      `error: object not found: ${type} #${name}\n` +
      'hint: run `xppai xpo list` or `xppai xpo grep --contains <text>` to discover available objects\n'
    );
    process.exit(1);
  }

  if (matches.length > 1 && !flags['--file']) {
    process.stderr.write(
      `error: ambiguous object match for ${type} #${name}; specify --file <path>\n` +
      `matches: ${matches.map((m) => m.filePath).join(', ')}\n`
    );
    process.exit(1);
  }

  const obj = matches[0];
  if (flags['--json']) {
    process.stdout.write(
      JSON.stringify(
        {
          filePath: obj.filePath,
          loadedAt: obj.loadedAt,
          type: obj.type,
          name: obj.name,
          sourceRef: obj.sourceRef,
          contentHash: obj.contentHash,
          content: obj.content,
        },
        null,
        2
      ) + '\n'
    );
    return;
  }

  process.stdout.write(
    `file: ${obj.filePath}\n` +
    `object: ${obj.type} #${obj.name}\n` +
    `start line: ${obj.sourceRef && obj.sourceRef.startLine ? obj.sourceRef.startLine : ''}\n` +
    `end line: ${obj.sourceRef && obj.sourceRef.endLine ? obj.sourceRef.endLine : ''}\n` +
    `content hash: ${obj.contentHash}\n` +
    '---\n' +
    `${obj.content || ''}\n`
  );
};
