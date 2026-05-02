'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { mkdtemp } = require('../helpers/tmp');

test('generic adapter: exports correct entries and is idempotent', () => {
  const adapter = require('../../src/targets/generic');
  const assets = require('../../src/assets');
  const skillsDir = assets.path();
  const tempDir = mkdtemp('xppai-smoke-');

  try {
    adapter.export(skillsDir, tempDir, { mode: 'copy' });

    const owned = adapter.listOwnedEntries(skillsDir);
    const actual = fs.readdirSync(tempDir).sort();
    assert.deepEqual(actual, [...owned].sort(), 'exported entries must exactly match listOwnedEntries()');

    for (const name of owned) {
      const skillFile = path.join(tempDir, name, 'SKILL.md');
      assert.ok(fs.existsSync(skillFile), `SKILL.md missing for ${name}`);
      const content = fs.readFileSync(skillFile, 'utf8');
      assert.ok(content.length > 0, `SKILL.md is empty for ${name}`);
    }

    const contentBefore = {};
    for (const name of owned) {
      contentBefore[name] = fs.readFileSync(path.join(tempDir, name, 'SKILL.md'), 'utf8');
    }

    adapter.export(skillsDir, tempDir, { mode: 'copy' });

    const actual2 = fs.readdirSync(tempDir).sort();
    assert.deepEqual(actual2, [...owned].sort(), 'second export must produce same entries');

    for (const name of owned) {
      const contentAfter = fs.readFileSync(path.join(tempDir, name, 'SKILL.md'), 'utf8');
      assert.equal(contentAfter, contentBefore[name], `${name}/SKILL.md content changed on re-export`);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
