'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function mkdtemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

module.exports = { mkdtemp };
