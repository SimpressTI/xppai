'use strict';

const load = require('./load');
const cacheCopy = require('./cache-copy');
const cacheUse = require('./cache-use');
const cacheShow = require('./cache-show');
const exportModified = require('./export-modified');

module.exports = function xpo(flags, args) {
  const sub = args[0];
  const rest = args.slice(1);

  if (sub === 'load') return load(flags, rest);
  if (sub === 'cache-copy') return cacheCopy(flags, rest);
  if (sub === 'cache-use') return cacheUse(flags, rest);
  if (sub === 'cache-show') return cacheShow(flags, rest);
  if (sub === 'export-modified') return exportModified(flags, rest);

  process.stderr.write(
    'error: unknown xpo subcommand\n' +
    'usage:\n' +
    '  xppai xpo load <file> [--cache-dir <dir>]\n' +
    '  xppai xpo cache-copy <dest> [--yes] [--cache-dir <dir>]\n' +
    '  xppai xpo cache-use <dir>\n' +
    '  xppai xpo cache-show [--cache-dir <dir>]\n' +
    '  xppai xpo export-modified --out <dir> [--file <xpo-file>] [--cache-dir <dir>]\n'
  );
  process.exit(1);
};
