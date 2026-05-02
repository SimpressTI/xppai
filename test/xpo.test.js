'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const BIN = path.join(__dirname, '..', 'bin', 'xppai.js');

test('xpo cache-use persists dir in user config', () => {
  const tempLocal = fs.mkdtempSync(path.join(os.tmpdir(), 'xppai-local-'));
  const cacheDir = path.join(tempLocal, 'chosen-cache');

  execFileSync(process.execPath, [BIN, 'xpo', 'cache-use', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
    encoding: 'utf8',
  });

  const configPath = path.join(tempLocal, 'xppai', 'config.json');
  assert.ok(fs.existsSync(configPath), 'config file must exist');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.equal(config.xpoCacheDir, path.resolve(cacheDir));
});

test('xpo load parses object types and writes extract json', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xppai-xpo-'));
  const tempLocal = path.join(tempRoot, 'local');
  const xpoFile = path.join(tempRoot, 'sample.xpo');
  const cacheDir = path.join(tempRoot, 'cache');

  const sample = [
    'Class #MyClass',
    'METHODS',
    '  public void run()',
    '  {',
    '  }',
    'Table #CustTable',
    'FIELDS',
    '  CustAccount',
    'Form #SalesTable',
    'DESIGN',
  ].join('\n');
  fs.writeFileSync(xpoFile, sample, 'utf8');

  const out = execFileSync(
    process.execPath,
    [BIN, 'xpo', 'load', xpoFile, '--cache-dir', cacheDir],
    { env: { ...process.env, LOCALAPPDATA: tempLocal }, encoding: 'utf8' }
  );
  assert.match(out, /objects: 3/);

  const indexPath = path.join(cacheDir, 'index.json');
  assert.ok(fs.existsSync(indexPath), 'cache index should exist');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  assert.equal(index.files.length, 1);

  const extractPath = index.files[0].extractPath;
  assert.ok(fs.existsSync(extractPath), 'extract file should exist');
  const extract = JSON.parse(fs.readFileSync(extractPath, 'utf8'));
  const types = extract.objects.map((o) => o.type);
  assert.deepEqual(types, ['Class', 'Table', 'Form']);
});

test('xpo cache-show prints resolved dir and source', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xppai-show-'));
  const dir = path.join(tempRoot, 'my-cache');
  const out = execFileSync(process.execPath, [BIN, 'xpo', 'cache-show', '--cache-dir', dir], {
    encoding: 'utf8',
  });
  assert.ok(out.includes(`xpo cache dir: ${path.resolve(dir)}`));
  assert.match(out, /source: flag/);
});

test('xpo export-modified writes one xpo per changed object', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xppai-expmod-'));
  const cacheDir = path.join(tempRoot, 'cache');
  const outDir = path.join(tempRoot, 'out');
  const xpoFile = path.join(tempRoot, 'objects.xpo');

  const v1 = [
    'Class #A',
    'METHODS',
    '  public void run()',
    '  {',
    '    info("v1");',
    '  }',
    'Class #B',
    'METHODS',
    '  public void run()',
    '  {',
    '    info("stable");',
    '  }',
  ].join('\n');
  fs.writeFileSync(xpoFile, v1, 'utf8');
  execFileSync(process.execPath, [BIN, 'xpo', 'load', xpoFile, '--cache-dir', cacheDir], { encoding: 'utf8' });

  const v2 = [
    'Class #A',
    'METHODS',
    '  public void run()',
    '  {',
    '    info("v2");',
    '  }',
    'Class #B',
    'METHODS',
    '  public void run()',
    '  {',
    '    info("stable");',
    '  }',
  ].join('\n');
  fs.writeFileSync(xpoFile, v2, 'utf8');
  execFileSync(process.execPath, [BIN, 'xpo', 'load', xpoFile, '--cache-dir', cacheDir], { encoding: 'utf8' });

  const out = execFileSync(
    process.execPath,
    [BIN, 'xpo', 'export-modified', '--out', outDir, '--file', xpoFile, '--cache-dir', cacheDir],
    { encoding: 'utf8' }
  );
  assert.match(out, /modified objects: 1/);

  const files = fs.readdirSync(outDir).sort();
  assert.deepEqual(files, ['Class_A.xpo']);
  const content = fs.readFileSync(path.join(outDir, 'Class_A.xpo'), 'utf8');
  assert.match(content, /info\("v2"\)/);
});
