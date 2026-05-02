'use strict';

const { collectObjects, loadIndexOrExit, normalizeType, pickEntries } = require('./query-store');

function excerpt(content, needle, limit) {
  const text = String(content || '');
  const lc = text.toLowerCase();
  const idx = lc.indexOf(needle.toLowerCase());
  if (idx < 0) return text.slice(0, limit);
  const start = Math.max(0, idx - Math.floor(limit / 3));
  const end = Math.min(text.length, start + limit);
  return text.slice(start, end).replace(/\r?\n/g, '\\n');
}

module.exports = function grep(flags, _args) {
  const contains = flags['--contains'] ? String(flags['--contains']) : '';
  if (!contains) {
    process.stderr.write('error: xppai xpo grep requires --contains <text>\n');
    process.exit(1);
  }

  const type = normalizeType(flags['--type']);
  const limit = Number.isFinite(Number(flags['--limit'])) ? Math.max(1, Number(flags['--limit'])) : 50;
  const { cacheDir, files } = loadIndexOrExit(flags);
  const entries = pickEntries(files, flags['--file']);

  let matches = collectObjects(entries).filter((o) =>
    String(o.content || '').toLowerCase().includes(contains.toLowerCase())
  );
  if (type) matches = matches.filter((o) => o.type === type);
  matches = matches.slice(0, limit);

  if (flags['--json']) {
    process.stdout.write(
      JSON.stringify(
        {
          cacheDir,
          contains,
          count: matches.length,
          matches: matches.map((m) => ({
            filePath: m.filePath,
            loadedAt: m.loadedAt,
            type: m.type,
            name: m.name,
            sourceRef: m.sourceRef,
            contentHash: m.contentHash,
          })),
        },
        null,
        2
      ) + '\n'
    );
    return;
  }

  let out = '';
  out += `contains: ${contains}\n`;
  out += `matches: ${matches.length}\n`;
  for (const m of matches) {
    out += `- ${m.type} #${m.name} (${m.filePath})\n`;
    out += `  excerpt: ${excerpt(m.content, contains, 160)}\n`;
  }
  process.stdout.write(out);
};

