'use strict';

const assets = require('../assets');

module.exports = function pathCmd(_flags, _args) {
  process.stdout.write(assets.path() + '\n');
};
