# Copilot CLI Skills Target Design

Date: 2026-05-11
Scope: redefine the `copilot` target as a GitHub Copilot CLI skills installer
Out of scope: prompt files, custom-instructions export, agent-object export, implementation work

## Problem

The current `copilot` target installs `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md`.
That produces Copilot custom instructions, not Copilot CLI skills.

The user requirement is different: `xppai install --target copilot` should install XppAI so Copilot CLI can discover and load it as skills.

## Goal

Make the `copilot` target install real Copilot CLI project skills under `.github/skills`, so XppAI becomes discoverable through Copilot CLI skill mechanisms such as automatic skill selection, `/skills list`, and explicit slash invocation.

## Current State

Current `copilot` target behavior:

- install path resolves to `<cwd>/.github`
- writes `copilot-instructions.md`
- writes `.github/instructions/xppai-*.instructions.md`

Current test expectations reflect that instruction-file behavior.

## Selected Approach

Redefine the existing `copilot` target as a skills-only project target.

The target will:

- resolve install path to `<cwd>/.github/skills`
- export one directory per bundled XppAI skill
- write canonical `SKILL.md` files without converting them into custom instruction files
- remove only XppAI-owned skill directories inside `.github/skills`

The target will not:

- write `.github/copilot-instructions.md`
- write `.github/instructions/*.instructions.md`
- write `.github/prompts/*.prompt.md`
- export `assets/agents/*`

## Alternatives Considered

### 1. Hybrid target

Keep custom instructions and add `.github/skills`.

Rejected because it conflicts with the stated requirement. Copilot would still load custom instructions, so the target would continue to behave as a mixed model instead of a skills-first install.

### 2. Skills-only target

Install only `.github/skills/<skill>/SKILL.md`.

Selected because it matches GitHub Copilot CLI's documented project-skill model and gives the cleanest mental model for users.

### 3. Split targets

Keep `copilot` for instructions and add a separate `copilot-cli` target for skills.

Rejected because it preserves the wrong default interpretation for `copilot`, increases target-surface complexity, and does not match the user's desired install command.

## Architecture

The `copilot` target should stop transforming skill content and instead behave like a repository-local skill exporter.

Key design points:

- Reuse the existing adapter contract.
- Reuse the existing generic skill-directory export pattern.
- Keep Copilot-specific logic focused on destination path and owned-entry cleanup.

Target adapter behavior:

- `resolveInstallDir(opts)` returns `opts['--out']` or `<cwd>/.github/skills`
- `listOwnedEntries(skillsDir)` returns bundled XppAI skill directory names
- `export(skillsDir, outDir, opts)` copies or symlinks skill directories directly

This keeps the `copilot` adapter small and consistent with the repository's current target model.

## Data Flow

1. User runs `xppai install --target copilot`.
2. CLI resolves the Copilot adapter.
3. Adapter resolves output directory to `<repo>/.github/skills`.
4. Adapter removes only XppAI-owned directories in that target directory.
5. Adapter exports each skill directory from `assets/skills/<name>` to `.github/skills/<name>`.
6. Copilot CLI can discover those skills through its project-skills mechanism.

## Compatibility and Migration

This is a breaking change for users who currently depend on the `copilot` target to install custom instructions.

Migration effect:

- after reinstall, `copilot` no longer creates instruction files
- after reinstall, XppAI is available as Copilot CLI skills instead

Mitigations:

- update user-facing docs to define the new target behavior clearly
- keep the target name unchanged so the intended command stays simple
- preserve repository-local installation semantics

## Important Non-Goals

This change does not attempt to:

- remove or suppress repository root `AGENTS.md`
- prevent Copilot CLI from loading unrelated custom instructions already present in the repository
- create Copilot prompt files
- create Copilot custom agents
- export `assets/agents/` into a Copilot-specific agent format

Those concerns are separate from XppAI skill installation and should be handled by future, explicitly scoped work if needed.

## Testing Strategy

Update tests so they verify skill installation instead of instruction generation.

Required test changes:

- `test/targets/copilot-export.test.js`
  - assert exported skill directories exist
  - assert `SKILL.md` files are preserved
  - assert instruction-file outputs are absent
- `test/cli/install.test.js`
  - assert `install --target copilot --out <dir>` creates skill directories
  - assert instruction-file outputs are absent
- `test/targets/contract.test.js`
  - assert default install path is `<cwd>/.github/skills`

Recommended validation:

- run the focused target and CLI tests
- run smoke tests to catch collateral regressions

## Documentation Changes

Update user-facing docs to match the new Copilot semantics:

- `README.md`
- `docs/targets.md`
- `docs/cli.md`

Required messaging:

- Copilot target installs project skills under `.github/skills`
- Copilot target is for Copilot CLI skill discovery, not custom instructions
- verification can be done with Copilot CLI using `/skills list`

## Success Criteria

The change is successful when:

- `xppai install --target copilot` writes skills under `.github/skills`
- Copilot target tests reflect skill-directory behavior
- docs describe `copilot` as a skills target
- no custom-instruction files are emitted by the Copilot target

