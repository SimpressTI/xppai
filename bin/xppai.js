#!/usr/bin/env node
'use strict';
require('../src/cli')
  .run(process.argv)
  .catch((err) => {
    process.stderr.write(`error: ${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  });
