'use strict';

const assets = require('../assets');
const { loadTarget } = require('../targets');

module.exports = function exportCmd(flags, _args) {
  const target = flags['--target'];
  const outDir = flags['--out'];

  if (!target) {
    process.stderr.write('error: --target is required\n');
    process.exit(1);
  }
  if (!outDir) {
    process.stderr.write('error: --out is required\n');
    process.exit(1);
  }

  const adapter = loadTarget(target);
  const mode = flags['--mode'] || 'copy';
  adapter.export(assets.path(), outDir, { mode });
  process.stdout.write(`exported to ${outDir}\n`);
};
