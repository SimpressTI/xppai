# XppAI XPO Session Authorization Design

Date: 2026-05-02
Owner: xppai
Status: Draft for review

## 1. Problem Statement

The current XPO workflow still risks repeated authorization prompts across separate `xppai` invocations in the same Codex session. The user wants one discovery/authorization step for a loaded cache, then reuse of that approval for later cache operations so they do not need to re-authorize the same source repeatedly.

`xppai xpo cache-copy` must remain safe when the destination is non-empty, but it should not re-ask for source-cache authorization if that cache was already approved earlier in the session.

## 2. Goals

- Make `xppai xpo snapshot` the primary cache authorization step.
- Persist approval across separate `xppai` invocations during the same Codex session.
- Reuse authorization for the same cache fingerprint instead of prompting again.
- Keep `cache-copy` interactive only when the destination is non-empty.
- Avoid making `cache-copy` re-ask for source-cache approval once snapshot already covered it.

## 3. Non-Goals

- Changing XPO parsing or cache extraction format.
- Removing destination confirmation for non-empty `cache-copy` targets.
- Replacing the existing snapshot/read/query command set.
- Implementing machine-wide or permanent authorization across sessions.

## 4. Proposed Session Model

Add a small session authorization state keyed by the active cache fingerprint.

The state should track:

- approved cache fingerprint
- approved cache directory
- approval timestamp or session marker

The state is considered valid only for the current Codex session. It should not be treated as a permanent machine-wide grant.

## 5. Behavior Contract

1. `xppai xpo snapshot` loads the active cache, returns the inventory, and records session authorization for the cache fingerprint it inspected.
2. Later `xppai xpo read`, `xppai xpo grep`, and `xppai xpo cache-copy` reuse that authorization for the same cache fingerprint within the same session.
3. If the cache changes, the fingerprint changes and the next command must re-authorize the new cache.
4. `xppai xpo cache-copy` may still prompt when the destination directory is non-empty.
5. That destination prompt is separate from cache-source authorization and should not invalidate the session approval for the same source cache.

## 6. Data Flow

1. User runs `xppai xpo snapshot` against a cache.
2. Snapshot validates and records the cache fingerprint in session state.
3. Follow-up XPO commands check session state before asking again.
4. If the cache fingerprint matches the recorded session approval, the command proceeds without reauthorization.
5. If the cache fingerprint differs, the command treats it as a new cache context and asks again.

## 7. Error Handling

- Missing session state: behave as unapproved and require the normal authorization flow.
- Cache fingerprint mismatch: treat as a new cache and reauthorize.
- Non-empty `cache-copy` destination: continue prompting for destination confirmation.
- Empty or missing cache index: fail with the existing actionable load-first error.

## 8. Testing Strategy

- Snapshot records a reusable cache approval marker.
- A later command against the same cache fingerprint does not re-prompt for source authorization.
- A changed cache fingerprint invalidates the prior approval.
- `cache-copy` still prompts only for non-empty destinations.
- Existing snapshot/read/query behavior remains unchanged.

## 9. Implementation Outline

1. Add session authorization storage keyed by cache fingerprint.
2. Teach snapshot to record the active cache approval marker.
3. Teach follow-up xpo commands to reuse the marker when the fingerprint matches.
4. Keep destination confirmation behavior in `cache-copy`.
5. Add tests for session reuse and fingerprint invalidation.
6. Update docs to describe the session-scoped authorization model.

## 10. Acceptance Criteria

- One snapshot approval can cover later XPO cache commands in the same session.
- Repeated approval prompts for the same cache are eliminated.
- `cache-copy` still protects non-empty destinations.
- A changed cache requires a fresh approval.

