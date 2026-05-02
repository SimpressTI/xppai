'use strict';

const assets = require('../assets');

module.exports = function list(_flags, _args) {
  process.stdout.write(assets.list().join('\n') + '\n');
};
