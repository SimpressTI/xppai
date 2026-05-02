# XppAI XPO Cache-First Query Design

Date: 2026-05-02
Owner: xppAI
Status: Draft for review

## 1. Problem Statement

Today, `xppai xpo load` correctly ingests and caches XPO object data (including code content), but there is no first-class read/query CLI surface for agents to consume cached objects deterministically. As a result, skills may attempt runtime command discovery patterns (for example, `--help`) instead of using a stable contract to access cached code.

This causes avoidable command churn, inconsistent behavior across skills, and unnecessary reloads.

## 2. Goals

- Make cached XPO data directly queryable through explicit CLI commands.
- Enforce cache-first behavior across all relevant skills.
- Reload only when a new XPO is explicitly provided by the user.
- On reload of an already-cached source, warn and overwrite active cache entry metadata for that source.
- Remove `--help` probing as a runtime discovery fallback for XPO code inquiry.

## 3. Non-Goals

- Redesigning XPO parsing logic.
- Replacing existing `xpo load`/`load-stdin` ingestion semantics.
- Building fuzzy semantic code search beyond simple contains-based filters.

## 4. Current-State Findings

- `src/commands/xpo/load.js` already persists per-object `content` (code/text block), `contentHash`, and `sourceRef` into `extracts/<fileHash>.json`.
- `index.json` records file-level metadata and points to `extractPath`.
- Existing `xpo cache-show` only reports cache path/source and does not expose object inventory or code retrieval.

## 5. Proposed CLI Additions

Add new subcommands under `xppai xpo`:

1. `xppai xpo list [--type <T>] [--file <path>] [--json]`
- Lists cached files and/or object inventory.
- Default text output is human-readable and stable.
- `--json` emits machine-consumable payload for skills.

2. `xppai xpo read --type <T> --name <N> [--file <path>] [--json]`
- Returns a single cached object with code content.
- Includes `type`, `name`, `filePath`, `sourceRef`, `content`, `contentHash`.

3. `xppai xpo grep --contains <text> [--type <T>] [--file <path>] [--limit <n>] [--json]`
- Performs case-insensitive substring filter over cached object content.
- Returns matching object metadata and excerpts (or full object metadata without full content in text mode).

Also update usage text in `src/commands/xpo/index.js` and docs.

## 6. Cache-First Skill Contract

Applies to all skills that need AX/X++ code inquiry (including standalone invocation), including but not limited to:
- `xppai-papai`
- `xppai-babysit`
- `xppai-explain`
- `xppai-risk`
- `xppai-posting`
- `xppai-stack`
- `xppai-codefix`

Contract:

1. If a new XPO file path is explicitly provided:
- Run `xppai xpo load "<file>"`.
- If same source path is already present in index, emit warning that cache entry is being overwritten.
- Continue with query flow.

2. If pasted XPO text is explicitly provided:
- Run `xppai xpo load-stdin --name "pasted.xpo"` (or provided name).
- Continue with query flow.

3. If no new XPO input is provided:
- Use cache-first flow without reloading.

4. Query sequence:
- `xppai xpo list` to inventory/select targets.
- `xppai xpo grep` when narrowing by content.
- `xppai xpo read` to fetch full code blocks.

5. Prohibited fallback:
- Do not use `xppai xpo --help` as runtime discovery for this workflow.

## 7. Data Flow

1. User asks for code analysis/fix/risk/etc.
2. Skill determines whether new XPO input exists.
3. New input path/text:
- Load once into cache (with overwrite warning when replacing same source).
4. No new input:
- Reuse existing cache.
5. Skill enumerates objects via `list`.
6. Skill narrows via `grep` when needed.
7. Skill reads exact objects via `read` and performs task.

## 8. Error Handling

- No cache found:
- Return actionable error: cache is empty; run `xppai xpo load <file>` or `load-stdin`.

- `read` object not found:
- Return deterministic not-found with hint to run `list`/`grep` or specify `--file`.

- Ambiguous matches (same type/name across files without `--file`):
- Return conflict and require `--file`.

- Invalid flags:
- Consistent CLI error + usage snippet.

- Reload overwrite behavior:
- Print warning when a new load replaces active entry for same source path.

## 9. Implementation Plan (High-Level)

1. Add shared cache reader/query utility module.
2. Implement `list`, `read`, `grep` xpo subcommands.
3. Extend xpo dispatcher and usage text.
4. Update docs (`docs/cli.md`, `docs/xpo-cache.md`) for new command contract.
5. Update affected skill instruction files to cache-first/query flow and remove help probing.
6. Add/adjust tests for command behavior and skill guidance regressions.

## 10. Testing Strategy

- Unit/CLI tests:
- `xpo list` basic inventory and filters.
- `xpo read` success + not-found + ambiguity.
- `xpo grep` contains filter + limits.
- empty cache behavior.
- overwrite warning on reload of same source path.

- Regression tests:
- load once then multiple reads without reload.
- skills reference new command flow and do not instruct help probing.

## 11. Scope Check

This scope is focused enough for a single implementation plan and cycle:
- Incremental CLI extension.
- Focused skill-doc updates.
- Tests/docs parity.

No unrelated refactors are included.

## 12. Open Decisions Resolved

- Behavior preference: cache-first.
- Reload trigger: only when new XPO input is explicitly provided.
- Reload policy: warn and overwrite current cache entry for that source.

## 13. Acceptance Criteria

- New `xppai xpo list/read/grep` commands are available and tested.
- Skills that inquire code use cache-first query flow.
- Skills do not rely on `xppai xpo --help` for runtime discovery.
- Reload of existing source path emits warning and updates cache entry.
- Documentation matches implemented behavior.
