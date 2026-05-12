'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runCli } = require('../helpers/cli');

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

test('cli: xppai list exits 0 and prints all skill names', () => {
  const out = runCli(['list']);
  const lines = out.trim().split('\n').sort();
  assert.deepEqual(lines, EXPECTED_SKILLS);
});
