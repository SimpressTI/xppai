'use strict';

const fs = require('fs');
const nodePath = require('path');
const { readConfig, writeConfig, configPath } = require('../../config/user-config');

module.exports = function cacheUse(_flags, args) {
  const dirArg = args[0];
  if (!dirArg) {
    process.stderr.write('error: xppai xpo cache-use requires <dir>\n');
    process.exit(1);
  }

  const absDir = nodePath.resolve(dirArg);
  fs.mkdirSync(absDir, { recursive: true });

  const config = readConfig();
  config.xpoCacheDir = absDir;
  writeConfig(config);

  process.stdout.write(
    `active xpo cache dir set to: ${absDir}\n` +
    `config file: ${configPath()}\n`
  );
};
