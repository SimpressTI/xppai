'use strict';

const nodePath = require('path');
const generic = require('./generic');

module.exports = {
  id: 'copilot',

  resolveInstallDir(opts = {}) {
    return opts['--out'] || nodePath.join(process.cwd(), '.github', 'skills');
  },

  listOwnedEntries(skillsDir) {
    return generic.listOwnedEntries(skillsDir);
  },

  export(skillsDir, outDir, opts = {}) {
    return generic.export(skillsDir, outDir, opts);
  },
};
