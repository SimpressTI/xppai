'use strict';

const assets = require('../assets');
const { loadTarget } = require('../targets');

module.exports = function install(flags, _args) {
  const target = flags['--target'];

  if (!target) {
    process.stderr.write('error: --target is required\n');
    process.exit(1);
  }

  const adapter = loadTarget(target);
  const installDir = adapter.resolveInstallDir(flags);

  if (!installDir) {
    process.stderr.write(
      `error: target "${target}" does not define a default install location\n` +
      `use "xppai export --target ${target} --out <dir>" instead\n`
    );
    process.exit(1);
  }

  const mode = flags['--mode'] || 'copy';
  adapter.export(assets.path(), installDir, { mode });
  process.stdout.write(`installed to ${installDir}\n`);
};
