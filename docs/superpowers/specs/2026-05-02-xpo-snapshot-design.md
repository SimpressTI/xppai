# XppAI XPO Snapshot Design

Date: 2026-05-02
Owner: xppai
Status: Draft for review

## 1. Problem Statement

Current XPO inquiry flows can still trigger multiple approval prompts because skills may call separate read/search commands per object type during discovery. This is especially noisy when the runtime asks permission for repeated `xppai xpo grep` or similar calls for `CLASS #`, `TABLE #`, `FORM #`, and `PROJECT #`.

The goal is to collapse discovery into a single command that returns enough structured cache context for skills to reason about the loaded XPO without repeated prompts.

## 2. Goals

- Reduce approval prompts for XPO discovery to a single command per request.
- Give skills a single structured snapshot of the active XPO cache context.
- Preserve `xpo read` for targeted full-object retrieval only when needed.
- Keep cache-first behavior intact for requests that do not provide new XPO input.
- Avoid `xppai xpo --help` as a runtime discovery path.

## 3. Non-Goals

- Replacing `xpo read` or `xpo grep`.
- Changing XPO parsing or cache layout.
- Adding fuzzy semantic code search.

## 4. Proposed Command

Add:

`xppai xpo snapshot [--file <path>] [--type <T>] [--limit <n>] [--json] [--cache-dir <dir>]`

The command returns a single machine-friendly payload that skills can use as their primary discovery input.

## 5. Snapshot Payload

The snapshot output should include:

- `cacheDir`
- selected source file metadata
- latest entry metadata per selected file
- `byType` counts
- object inventory with:
  - `type`
  - `name`
  - `filePath`
  - `sourceRef`
  - `contentHash`
  - short preview snippet

The preview should be bounded so the command remains safe to use on large caches.

## 6. Behavior Contract

1. If a new XPO file or pasted XPO text is provided, the skill loads it once with the existing intake command.
2. If no new XPO input is provided, the skill uses cache-first discovery.
3. The skill runs `xppai xpo snapshot --json` once per request.
4. The skill chooses relevant objects from the snapshot inventory.
5. The skill runs `xppai xpo read` only for objects that need full code content.
6. The skill does not loop over object types with separate `grep` calls for discovery.

## 7. Data Flow

1. Skill starts with request context.
2. Skill checks whether new XPO input exists.
3. If yes, load once using `xpo load` or `load-stdin`.
4. Run one `snapshot --json` call against the active cache.
5. Parse snapshot inventory and type summary.
6. Read selected objects with `xpo read` only when necessary.
7. Complete analysis using cached code context.

## 8. Error Handling

- No cache index: fail with actionable message to load XPO first.
- Empty cache: return a clear empty-context message.
- Invalid `--file` or `--type`: return deterministic CLI usage errors.
- Large inventory: apply `--limit` defaults so the snapshot stays bounded.
- Ambiguous follow-up reads: require `--file` when multiple source files contain the same object identity.

## 9. Skill Updates

Update all relevant XppAI analysis skills and guidance documents so they:

- prefer `xpo snapshot` for discovery
- use `xpo read` only for targeted full-content retrieval
- do not emit multiple type-specific discovery calls
- do not use `xpo --help` to discover runtime capabilities

Relevant skills include:

- `xppai-papai`
- `xppai-babysit`
- `xppai-explain`
- `xppai-risk`
- `xppai-posting`
- `xppai-stack`
- `xppai-codefix`

## 10. Implementation Outline

1. Add snapshot command implementation beside the existing xpo query commands.
2. Reuse the shared cache reader so snapshot and read stay consistent.
3. Update xpo usage text and CLI docs.
4. Update skills to use snapshot-first discovery.
5. Add tests for snapshot output and skill guidance.

## 11. Testing Strategy

- Snapshot returns one JSON payload for a loaded cache.
- Snapshot respects `--file`, `--type`, and `--limit`.
- Snapshot fails cleanly when no cache exists.
- Skills reference snapshot-first discovery rather than multi-grep loops.
- Existing read/query behavior remains unchanged.

## 12. Acceptance Criteria

- Discovery can be done with one `xppai xpo snapshot` call per request.
- Skills no longer need repeated approval prompts just to inspect object types.
- Full code retrieval still uses `xpo read`.
- The cache-first workflow remains intact.

