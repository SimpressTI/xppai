'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const BIN = path.join(__dirname, '..', '..', 'bin', 'xppai.js');

function runCli(args, options = {}) {
  return execFileSync(process.execPath, [BIN, ...args], { encoding: 'utf8', ...options });
}

module.exports = { runCli };
