'use strict';

const fs = require('fs');
const nodePath = require('path');
const os = require('os');

function localAppDataDir() {
  if (process.env.LOCALAPPDATA) return process.env.LOCALAPPDATA;
  return nodePath.join(os.homedir(), 'AppData', 'Local');
}

function configPath() {
  return nodePath.join(localAppDataDir(), 'xppai', 'config.json');
}

function readConfig() {
  const p = configPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) {
    return {};
  }
}

function writeConfig(config) {
  const p = configPath();
  fs.mkdirSync(nodePath.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

module.exports = { configPath, readConfig, writeConfig, localAppDataDir };
