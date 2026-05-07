# Copilot Slash Commands Design: `/xppai` and `/babysit`

Date: 2026-05-07  
Repo: xppAI  
Scope: Copilot target export/install behavior only

## Goal

Enable GitHub Copilot slash-style prompt commands for XppAI in repository context, with only two exposed commands:

- `/xppai` mapped to `xppai-papai` (dynamic orchestrator)
- `/babysit` mapped to `xppai-babysit` (fixed-sequence orchestrator)

Both commands must be able to invoke specialist XppAI skill logic through their orchestrator behavior.

## Current State

Today, the `copilot` target generates only custom-instruction files:

- `.github/copilot-instructions.md`
- `.github/instructions/xppai-*.instructions.md`

This provides passive guidance but does not create slash commands in Copilot Chat.

## Selected Approach

Use a hybrid Copilot export:

1. Keep existing custom-instruction generation unchanged.
2. Add prompt-file generation in `.github/prompts`:
   - `xppai.prompt.md`
   - `babysit.prompt.md`

This preserves backward-compatible passive behavior and adds explicit command entrypoints.

## Why This Approach

- Matches Copilot command model: slash commands come from prompt files.
- Minimizes migration risk: existing instruction behavior remains available.
- Keeps command surface minimal and intentional: only two entrypoints.
- Aligns with XppAI architecture: orchestrators are the intended front doors.

## Architecture Changes

File to modify:

- `src/targets/copilot.js`

Planned component additions:

- `buildPromptXppai()` helper returning content for `.github/prompts/xppai.prompt.md`
- `buildPromptBabysit()` helper returning content for `.github/prompts/babysit.prompt.md`

Planned adapter updates:

- `listOwnedEntries(skillsDir)` includes:
  - `prompts/xppai.prompt.md`
  - `prompts/babysit.prompt.md`
- `export(skillsDir, outDir, opts)` writes both prompt files after owned-file cleanup.
- Existing `copilot-instructions.md` and per-skill `.instructions.md` generation remains intact.

## Prompt File Design

### `xppai.prompt.md` (`/xppai`)

Intent:

- Route user request through `xppai-papai` behavior.
- Require AX 2009 context and `xppai-init` guardrails.
- Dynamically select and apply specialist skill logic based on artifact type and analysis need.

Expected specialist orchestration set:

- `xppai-explain`
- `xppai-stack`
- `xppai-codefix`
- `xppai-architect`
- `xppai-posting`
- `xppai-risk`
- `xppai-exportxpo`
- `xppai-help`

Non-negotiable instruction constraints in prompt content:

- Preserve localization blocks (`<GBR>`, `<GIN>`, `<GJP>`, `<GSA>`, `<GTH>`).
- AX 2009 only.
- Variable declarations at top of method.
- Evidence labels: Confirmed / Likely / Unknown.

### `babysit.prompt.md` (`/babysit`)

Intent:

- Route user request through `xppai-babysit` behavior.
- Use artifact-type-driven fixed analysis sequence.
- Invoke specialist logic in deterministic order based on artifact class.

Must preserve same guardrails and evidence labeling requirements.

## Data Flow

1. User runs `xppai install --target copilot`.
2. CLI resolves target adapter (`copilot`).
3. Adapter removes only owned entries from target output directory.
4. Adapter writes:
   - repository custom instructions
   - path-specific instruction files
   - two prompt files (`xppai.prompt.md`, `babysit.prompt.md`)
5. Copilot IDE chat loads prompt files, enabling `/xppai` and `/babysit`.
6. Command execution uses prompt content to drive orchestrator behavior and specialist dispatch.

## Error Handling and Compatibility

- If prompt-file feature is unavailable/disabled in a given Copilot environment:
  - slash commands are unavailable
  - fallback repository instructions still apply
- Re-running install remains safe:
  - only adapter-owned entries are removed/replaced
  - unrelated `.github` files are preserved
- Future prompt schema updates are localized to prompt helper functions.

## Testing Plan

Implementation verification should include:

1. Unit/smoke behavior for Copilot target export:
   - generated files include prompt files and instruction files
   - owned-file cleanup includes new prompt paths only
2. Manual repository check after install:
   - `.github/prompts/xppai.prompt.md` exists
   - `.github/prompts/babysit.prompt.md` exists
3. IDE validation (VS Code and Visual Studio where available):
   - `/xppai` appears and runs
   - `/babysit` appears and runs
   - fallback instruction behavior remains present in references

## Scope Boundaries

In scope:

- Copilot target file generation changes in this repo.
- Command aliases limited to two prompt names.

Out of scope:

- Adding prompt commands for every specialist skill.
- Changes to codex/claude/generic target behavior.
- Runtime-side Copilot configuration outside repository files.

## Risks

- Copilot prompt files are preview and may evolve.
- Slash-command visibility can vary by IDE version/settings.

Mitigation:

- Keep passive instruction files as a durable fallback.
- Keep prompt generation code isolated and easy to adjust.

## Acceptance Criteria

- Running `xppai install --target copilot` generates both prompt files under `.github/prompts`.
- Only `/xppai` and `/babysit` are added as command entrypoints.
- Prompt content explicitly maps to `xppai-papai` and `xppai-babysit` orchestration.
- Existing Copilot instruction-file generation continues to work unchanged.
- Unrelated files in `.github` remain untouched during export/install.
