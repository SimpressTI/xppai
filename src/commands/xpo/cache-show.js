'use strict';

const { resolveCacheDirWithSource } = require('../../cache/paths');

module.exports = function cacheShow(flags, _args) {
  const resolved = resolveCacheDirWithSource(flags);
  process.stdout.write(
    `xpo cache dir: ${resolved.dir}\n` +
    `source: ${resolved.source}\n`
  );
};
