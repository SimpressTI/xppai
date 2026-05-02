'use strict';

const nodePath = require('path');
const fs = require('fs');
const fsHelpers = require('../fs');

function stripFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trimStart();
}

function skillDirs(skillsDir) {
  return fs.readdirSync(skillsDir)
    .filter(name => fs.statSync(nodePath.join(skillsDir, name)).isDirectory())
    .sort();
}

function readDescription(content) {
  const match = content.match(/^---\r?\n[\s\S]*?\ndescription:\s*(.+?)\r?\n[\s\S]*?\r?\n---/);
  return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
}

function buildRepoInstructions(skillsDir) {
  const lines = [
    '# XppAI Copilot Instructions',
    '',
    'Use XppAI guidance when working with X++ or Microsoft Dynamics AX 2009 code, XPO exports, posting flows, profiler traces, stack traces, or AX change-risk analysis.',
    '',
    'Prefer the dynamic entry skill `xppai-papai` for mixed or ambiguous artifacts. Use `xppai-babysit` when a predictable fixed workflow is better. Use specialist instructions from `.github/instructions/xppai-*.instructions.md` when the task matches their scope.',
    '',
    'When input includes a new XPO file path, run `xppai xpo load "<file>"` before analysis when the CLI is available. If no new XPO is provided, use cache-first discovery with `xppai xpo snapshot --json` once, then `xppai xpo read` only for selected objects instead of reloading or looping over type-specific grep calls; snapshot approval persists for the current Codex session and the same cache fingerprint. For pasted XPO text, run `xppai xpo load-stdin --name "pasted.xpo"` and pass text on stdin. If cache loading is not possible, continue from provided text and state cache import was skipped. Do not use `xppai xpo --help` for runtime discovery in this workflow.',
    '',
    'Available XppAI instruction files:',
    '',
  ];

  for (const name of skillDirs(skillsDir)) {
    const skillFile = nodePath.join(skillsDir, name, 'SKILL.md');
    const content = fs.readFileSync(skillFile, 'utf8');
    const description = readDescription(content);
    lines.push(`- \`${name}\`: ${description || 'XppAI instruction set.'}`);
  }

  lines.push('');
  return lines.join('\n');
}

module.exports = {
  id: 'copilot',

  resolveInstallDir(opts = {}) {
    return opts['--out'] || nodePath.join(process.cwd(), '.github');
  },

  listOwnedEntries(skillsDir) {
    return [
      'copilot-instructions.md',
      ...skillDirs(skillsDir).map(name => nodePath.join('instructions', `${name}.instructions.md`)),
    ].sort();
  },

  export(skillsDir, outDir, _opts = {}) {
    const owned = this.listOwnedEntries(skillsDir);
    fsHelpers.ensureDir(outDir);
    fsHelpers.removeOwned(outDir, owned);

    fs.writeFileSync(
      nodePath.join(outDir, 'copilot-instructions.md'),
      buildRepoInstructions(skillsDir)
    );

    const instructionsDir = nodePath.join(outDir, 'instructions');
    fsHelpers.ensureDir(instructionsDir);

    for (const name of skillDirs(skillsDir)) {
      const skillFile = nodePath.join(skillsDir, name, 'SKILL.md');
      const content = fs.readFileSync(skillFile, 'utf8');
      const copilotContent = [
        '---',
        'applyTo: "**"',
        '---',
        '',
        stripFrontmatter(content),
      ].join('\n');
      fs.writeFileSync(nodePath.join(instructionsDir, `${name}.instructions.md`), copilotContent);
    }
  },
};
