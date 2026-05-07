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
    'When input includes a new XPO file path, open and analyze the local `.xpo` file directly. For pasted XPO text, analyze directly from pasted content. Do not depend on cache-first CLI discovery for Papai/Babysit orchestration. If local file access fails, request a corrected path or pasted content before analysis.',
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

function buildPromptXppai() {
  return [
    '---',
    "mode: 'agent'",
    "description: 'XppAI dynamic AX 2009 orchestrator'",
    '---',
    '',
    'Act as `xppai-papai` for Microsoft Dynamics AX 2009 and X++ analysis.',
    'Always apply `xppai-init` guardrails first.',
    'Select specialist logic dynamically from: xppai-explain, xppai-stack, xppai-codefix, xppai-architect, xppai-posting, xppai-risk, xppai-exportxpo, xppai-help.',
    'Label claims as Confirmed / Likely / Unknown.',
    'Never modify or suggest modifying localization blocks: <GBR>, <GIN>, <GJP>, <GSA>, <GTH>.',
    'AX 2009 only. Keep variable declarations at top of method when proposing X++ code.',
    '',
    'User request:',
    '${input:request:Describe the AX 2009/X++ artifact or question}',
  ].join('\n');
}

function buildPromptBabysit() {
  return [
    '---',
    "mode: 'agent'",
    "description: 'XppAI fixed-sequence AX 2009 analysis'",
    '---',
    '',
    'Act as `xppai-babysit` for Microsoft Dynamics AX 2009 and X++ analysis.',
    'Always apply `xppai-init` guardrails first.',
    'Run fixed-sequence specialist analysis based on artifact type.',
    'Label claims as Confirmed / Likely / Unknown.',
    'Never modify or suggest modifying localization blocks: <GBR>, <GIN>, <GJP>, <GSA>, <GTH>.',
    'AX 2009 only. Keep variable declarations at top of method when proposing X++ code.',
    '',
    'User request:',
    '${input:request:Describe the AX 2009/X++ artifact or question}',
  ].join('\n');
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
      nodePath.join('prompts', 'xppai.prompt.md'),
      nodePath.join('prompts', 'babysit.prompt.md'),
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

    const promptsDir = nodePath.join(outDir, 'prompts');
    fsHelpers.ensureDir(promptsDir);
    fs.writeFileSync(nodePath.join(promptsDir, 'xppai.prompt.md'), buildPromptXppai());
    fs.writeFileSync(nodePath.join(promptsDir, 'babysit.prompt.md'), buildPromptBabysit());
  },
};
