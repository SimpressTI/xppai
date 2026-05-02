'use strict';

const COMMANDS = {
  list:    require('./commands/list'),
  path:    require('./commands/path'),
  export:  require('./commands/export'),
  install: require('./commands/install'),
  xpo:     require('./commands/xpo'),
};

function printHelp() {
  const valid = Object.keys(COMMANDS).join(', ');
  process.stdout.write(
    'xppai - LLM-runtime-agnostic X++ AX 2009 skill suite\n' +
    'usage: xppai <command> [options]\n' +
    '       xppai --help\n' +
    '       xppai --version\n' +
    `commands: ${valid}\n`
  );
}

function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (!arg.startsWith('-')) {
      positionals.push(arg);
    } else if (arg.startsWith('--')) {
      const next = argv[i + 1];
      flags[arg] = (next !== undefined && !next.startsWith('--')) ? next : true;
      if (next !== undefined && !next.startsWith('--')) i++;
    } else if (arg === '-h') {
      flags['--help'] = true;
    } else if (arg === '-v') {
      flags['--version'] = true;
    }
    i++;
  }
  return { command: positionals[0] || null, positionals, flags };
}

async function run(argv) {
  const { command, positionals, flags } = parseArgs(argv.slice(2));
  if (flags['--version']) {
    process.stdout.write(`${require('../package.json').version}\n`);
    return;
  }
  if (flags['--help']) {
    printHelp();
    return;
  }
  if (!command) {
    printHelp();
    process.exit(1);
  }
  const handler = COMMANDS[command];
  if (!handler) {
    const valid = Object.keys(COMMANDS).join(', ');
    process.stderr.write(
      `error: unknown command "${command}"\n` +
      `valid commands: ${valid}\n` +
      `usage: xppai <command> [options]\n`
    );
    process.exit(1);
  }
  await handler(flags, positionals.slice(1));
}

module.exports = { run };
