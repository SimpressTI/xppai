'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const EXPECTED_SKILLS = [
  'xppai-architect',
  'xppai-babysit',
  'xppai-codefix',
  'xppai-explain',
  'xppai-exportxpo',
  'xppai-help',
  'xppai-init',
  'xppai-papai',
  'xppai-posting',
  'xppai-risk',
  'xppai-stack',
  'xppai-support',
];

test('assets.list() returns all 12 skills in sorted order', () => {
  const assets = require('../../src/assets');
  assert.deepEqual(assets.list(), EXPECTED_SKILLS);
});

test('assets.path() returns a directory that exists on disk', () => {
  const assets = require('../../src/assets');
  const p = assets.path();
  assert.ok(typeof p === 'string' && p.length > 0);
  assert.ok(fs.existsSync(p), `assets.path() does not exist: ${p}`);
});
