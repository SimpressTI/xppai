'use strict';

const COMMANDS = {
  list:    require('./commands/list'),
  path:    require('./commands/path'),
  export:  require('./commands/export'),
  install: require('./commands/install'),
  xpo:     require('./commands/xpo'),
};

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
    }
    i++;
  }
  return { command: positionals[0] || null, positionals, flags };
}

async function run(argv) {
  const { command, positionals, flags } = parseArgs(argv.slice(2));
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
