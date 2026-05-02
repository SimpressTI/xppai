'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const ADAPTER_NAMES = ['claude', 'codex', 'copilot', 'generic'];
const INSTALLABLE = new Set(['claude', 'codex']);

for (const name of ADAPTER_NAMES) {
  test(`adapter ${name}: exports required methods`, () => {
    const adapter = require(`../../src/targets/${name}`);
    assert.equal(typeof adapter.id, 'string', 'id must be a string');
    assert.ok(adapter.id.length > 0, 'id must be non-empty');
    assert.equal(typeof adapter.resolveInstallDir, 'function', 'resolveInstallDir must be a function');
    assert.equal(typeof adapter.listOwnedEntries, 'function', 'listOwnedEntries must be a function');
    assert.equal(typeof adapter.export, 'function', 'export must be a function');
  });

  test(`adapter ${name}: resolveInstallDir returns ${INSTALLABLE.has(name) ? 'a string' : 'null'}`, () => {
    const adapter = require(`../../src/targets/${name}`);
    const result = adapter.resolveInstallDir({});
    if (INSTALLABLE.has(name)) {
      assert.equal(typeof result, 'string', `${name}.resolveInstallDir() must return a string`);
      assert.ok(result.length > 0, `${name}.resolveInstallDir() must return a non-empty string`);
    } else {
      assert.equal(result, null, `${name}.resolveInstallDir() must return null`);
    }
  });
}
