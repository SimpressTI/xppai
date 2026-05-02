'use strict';

const fs = require('fs');
const nodePath = require('path');
const { readConfig, localAppDataDir } = require('../config/user-config');

function defaultCacheDir() {
  return nodePath.join(localAppDataDir(), 'xppai', 'cache', 'xpo');
}

function resolveCacheDir(options) {
  if (options && options['--cache-dir']) return nodePath.resolve(String(options['--cache-dir']));

  const config = readConfig();
  if (config && config.xpoCacheDir) return nodePath.resolve(String(config.xpoCacheDir));

  if (process.env.XPPAI_CACHE_DIR) return nodePath.resolve(process.env.XPPAI_CACHE_DIR);

  return defaultCacheDir();
}

function resolveCacheDirWithSource(options) {
  if (options && options['--cache-dir']) {
    return { dir: nodePath.resolve(String(options['--cache-dir'])), source: 'flag' };
  }

  const config = readConfig();
  if (config && config.xpoCacheDir) {
    return { dir: nodePath.resolve(String(config.xpoCacheDir)), source: 'user-config' };
  }

  if (process.env.XPPAI_CACHE_DIR) {
    return { dir: nodePath.resolve(process.env.XPPAI_CACHE_DIR), source: 'env' };
  }

  return { dir: defaultCacheDir(), source: 'default' };
}

function ensureCacheStructure(cacheDir) {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.mkdirSync(nodePath.join(cacheDir, 'extracts'), { recursive: true });
  fs.mkdirSync(nodePath.join(cacheDir, 'reports'), { recursive: true });
}

module.exports = { defaultCacheDir, resolveCacheDir, resolveCacheDirWithSource, ensureCacheStructure };
