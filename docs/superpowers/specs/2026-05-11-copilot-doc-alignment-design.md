# Copilot Documentation Alignment Design (Docs-Only)

Date: 2026-05-11  
Scope: user-facing docs only (`README.md`, `docs/targets.md`, `docs/cli.md`)  
Out of scope: implementation changes, historical planning/spec archives under `docs/superpowers/**`

## Problem

User-facing documentation described Copilot install output that is not currently delivered. Specifically, docs listed `.github/prompts/*.prompt.md` files and slash-command usage guidance, while the Copilot adapter currently exports only repository instruction files.

## Goal

Align user-facing documentation with delivered behavior so users understand exactly what `xppai install --target copilot` writes today, and do not infer that Copilot installs skill directories or separate agent artifacts.

## Current Delivered Behavior (Confirmed)

Source of truth:

- `src/targets/copilot.js`
- `test/targets/copilot-export.test.js`
- `test/cli/install.test.js`

Confirmed output for Copilot install/export:

- `.github/copilot-instructions.md`
- `.github/instructions/xppai-*.instructions.md`

Confirmed non-output:

- no `.github/prompts/` directory
- no prompt command files
- no skill-directory installation for Copilot
- no separate agent-object installation for Copilot

## Constraints

- Docs-only change; no behavior changes to target adapters.
- Keep historical docs (`docs/superpowers/**`) intact as archived design/plan records.
- Preserve existing install-target model where Copilot remains installable but repository-scoped.

## Approaches Considered

1. Minimal patch: update only `docs/targets.md`.
- Pros: smallest diff.
- Cons: ambiguity remains in README/CLI phrasing.

2. Consistency patch (selected): update `README.md`, `docs/targets.md`, and `docs/cli.md`.
- Pros: all top user entry points align with actual behavior.
- Cons: slightly larger docs diff.

3. Full docs sweep including historical spec/plan files.
- Pros: no stale references anywhere.
- Cons: rewrites archival material and exceeds requested scope.

## Selected Design

Apply a consistency patch across user-facing docs:

- Clarify that Copilot target installs repository instruction files under `.github`.
- Remove prompt-file and slash-command claims from target docs.
- Explicitly state Copilot install does not install skill directories or agent objects.
- Keep Copilot listed as an installable target.

## File-Level Design

### `README.md`

- In Supported Targets section, add a direct clarifier for Copilot behavior:
  - install writes repository instruction files under `.github`
  - not skill directories
  - not separate agent objects

### `docs/targets.md`

- Keep Copilot in native/installable targets (repository instruction install type).
- Replace Copilot output list to include only currently delivered files.
- Remove `.github/prompts/*.prompt.md` lines.
- Remove slash-command usage statement tied to prompt files.
- Add explicit statement that Copilot install does not install skills, agents, or prompt command files.

### `docs/cli.md`

- Preserve `copilot` and `all` semantics.
- Extend `all` description with explicit Copilot constraint: instruction files only, not skills/agents.

## Validation Plan

Run focused tests verifying adapter/CLI behavior:

- `node --test test/targets/copilot-export.test.js test/cli/install.test.js`

Expected:

- both tests pass
- test assertions still confirm no prompts directory and instruction-only layout

## Risks and Mitigations

Risk: Users may still associate Copilot with skills/agents because the repository overall is skill-centric.
Mitigation: Add explicit negative wording ("not skill directories or agent objects") in README/CLI/targets docs.

Risk: Historical docs may still reference prompt-file plans.
Mitigation: Keep out-of-scope archives unchanged; user-facing docs become canonical current behavior.

## Testing Evidence

Executed:

- `node --test test/targets/copilot-export.test.js test/cli/install.test.js`

Result:

- Pass: 2
- Fail: 0

## Result

Documentation now matches delivered Copilot behavior for current release semantics, without changing runtime behavior.
