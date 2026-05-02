# XppAI Papai Canonical Agent Design

## Chosen Approach

Use the hybrid approach: add a canonical `AGENT.md` for `xppai-papai`, keep the existing `assets/skills/xppai-papai/SKILL.md` as the backward-compatible Codex entry point, and teach adapters later to export the canonical agent into target-specific formats.

This is the simplest viable path because:

- Codex works immediately: the existing skill remains usable.
- Current behavior does not break: the `xppai-papai` trigger, XPO intake rules, skill selection, and senior synthesis stay intact.
- Claude Code and GitHub Copilot can be supported later: `AGENT.md` becomes the canonical source that adapters can transform.
- Implementation risk stays low: the first version is a Markdown contract plus tests, not a new runtime engine.

The alternatives are weaker for this repo:

- Minimal skill-only loop is easiest, but keeps Papai trapped as a Codex skill and makes later Claude/Copilot export messy.
- A full canonical agent framework is cleaner in theory, but too much architecture for one agent and likely to duplicate the existing skill system.

## Architecture

`xppai-papai` becomes a canonical AX 2009 agent definition stored separately from legacy skill instructions.

The first working version has:

- `assets/agents/xppai-papai/AGENT.md` as the canonical agent contract.
- `assets/skills/xppai-papai/SKILL.md` as the legacy Codex skill entry point.
- `SKILL.md` must stay thin to avoid drift. It only references `assets/agents/xppai-papai/AGENT.md` as canonical, includes a short loop summary, and keeps the existing XPO intake behavior.
- Existing specialist skills unchanged:
  - `xppai-init`
  - `xppai-explain`
  - `xppai-stack`
  - `xppai-risk`
  - `xppai-codefix`
  - `xppai-posting`
  - `xppai-architect`
  - `xppai-help`
  - `xppai-exportxpo`

Papai does not replace specialist skills. It controls when and why to use them.

## Agent Loop

The canonical loop is controlled and bounded:

1. Define goal.
   Identify the user's requested outcome and classify whether the request is explain, diagnose, assess risk, propose fix, analyze posting, analyze stack/performance, or mixed.

2. Inspect evidence.
   Read only the provided artifact or approved XPO cache context. Run XPO intake once when applicable. Label evidence as Confirmed, Likely, Hypothesis, or Unknown.

3. Choose next action.
   Select one action based on the current evidence gap. Do not apply all skills by default.

4. Use skill/tool.
   Invoke a specialist skill or XPO cache operation. Pass `XPO intake already completed for this request` when applicable.

5. Validate.
   Check whether the action answered the goal or exposed a new required step. Confirm AX 2009 constraints were preserved.

6. Stop or continue.
   Stop when the user's goal is answered with enough evidence. Continue only when another action materially improves the answer.

Loop safety rule:

- Do not exceed 3 investigation cycles unless the user explicitly requests deeper analysis.
- One investigation cycle is: inspect evidence -> choose next action -> use skill/tool -> validate.

## Actions vs Skill Selection

Current Papai selects skills. The canonical agent selects actions.

Actions are broader and more explicit:

- `load_xpo_once`
- `snapshot_xpo_cache`
- `read_selected_xpo_object`
- `explain_artifact`
- `analyze_stack_or_trace`
- `assess_change_risk`
- `analyze_posting_flow`
- `review_architecture`
- `propose_codefix`
- `synthesize_answer`
- `stop_with_missing_context`
- `show_skill_help`
- `prepare_xpo_export`

A skill selection is one possible implementation of an action. For example:

- `explain_artifact` maps to `xppai-explain`.
- `assess_change_risk` maps to `xppai-risk`.
- `propose_codefix` maps to `xppai-codefix`.
- `show_skill_help` maps to `xppai-help`.
- `prepare_xpo_export` maps to `xppai-exportxpo`.

This keeps the agent portable across Codex, Claude Code, and GitHub Copilot.

## File Structure

First working version:

```text
assets/
  agents/
    xppai-papai/
      AGENT.md
  skills/
    xppai-papai/
      SKILL.md
```

Later adapter work:

```text
src/
  agents.js
  targets/
    codex.js
    claude.js
    copilot.js
    generic.js

test/
  agents/
    agents.test.js
  targets/
    agent-export.test.js
```

Do not add `adapters/claude/...` as a new top-level tree. This repo already uses `src/targets/`, so agent export should fit that pattern.

## Agent Definition

### Mission

`xppai-papai` is the senior AX 2009 orchestration agent. It analyzes X++ artifacts, XPO exports, stack traces, profiler traces, posting flows, and change-risk questions by choosing the smallest useful sequence of XppAI actions and synthesizing the result into a practical engineering answer.

### Operating Loop

```text
define goal
inspect evidence
choose next action
use skill/tool
validate result
stop or continue
```

### Available Actions

- `load_xpo_once`: load a new XPO path or pasted XPO text once.
- `snapshot_xpo_cache`: inspect active cache inventory once when no new XPO is provided.
- `read_selected_xpo_object`: read only selected relevant objects.
- `explain_artifact`: use `xppai-explain`.
- `analyze_stack_or_trace`: use `xppai-stack`.
- `assess_change_risk`: use `xppai-risk`.
- `analyze_posting_flow`: use `xppai-posting`.
- `review_architecture`: use `xppai-architect`.
- `propose_codefix`: use `xppai-codefix`.
- `synthesize_answer`: produce senior assessment.
- `stop_with_missing_context`: stop when more action would be speculative.
- `show_skill_help`: use `xppai-help` when the user asks what XppAI can do or which skill to use.
- `prepare_xpo_export`: use `xppai-exportxpo` when the user asks to export analyzed objects after assessment.

### Validation Rules

- AX 2009 only.
- Do not modify localization blocks.
- Preserve top-of-method variable declaration expectations.
- Before codefix output, require tag fields, object location, layer, and signature-change flag.
- Label evidence as Confirmed, Likely, Hypothesis, or Unknown.
- Do not run XPO intake more than once per request.
- Do not apply skills that add no value.
- Treat `AGENT.md` as canonical and keep `SKILL.md` as a thin compatibility wrapper.
- Do not copy full Mission, Available Actions, Validation Rules, or Stop Conditions into `SKILL.md`.
- Do not exceed 3 investigation cycles unless explicitly requested.

### Stop Conditions

Stop when:

- The user's stated goal is answered.
- A senior assessment can be made from confirmed or clearly labeled inferred evidence.
- The next possible action would only add noise.
- Required context is missing and further analysis would be speculative.
- A codefix cannot be safely proposed without required metadata.
- 3 investigation cycles are completed and the user did not request deeper analysis.

## Adapter Contracts

### Codex

Output:

```text
~/.codex/skills/xppai-papai/SKILL.md
```

First version:

- Keep exporting skills exactly as today.
- Legacy `SKILL.md` includes the canonical loop text or references the canonical agent internally.
- No new Codex-specific agent format is required.

Limitations:

- Codex still sees Papai as a skill, not a separate agent object.
- Agent behavior depends on instruction quality, not runtime enforcement.

### Claude Code

Future output:

```text
~/.claude/skills/xppai-papai/SKILL.md
```

Optional later output if Claude subagent format is introduced:

```text
~/.claude/agents/xppai-papai.md
```

Transformation:

- Convert `AGENT.md` mission, loop, actions, validation, and stop conditions into Claude subagent instructions.
- Keep specialist skills available as referenced tools/instructions.

Limitations:

- Do not implement subagent export in the first version unless the target format is confirmed.
- Do not invent a Claude subagent schema.

### GitHub Copilot

Future output:

```text
.github/copilot-instructions.md
.github/instructions/xppai-papai.instructions.md
```

Transformation:

- Flatten canonical agent loop into repository instructions.
- Convert actions into "when working on AX 2009 artifacts..." guidance.
- Preserve XPO intake and evidence-labeling rules.

Limitations:

- Copilot cannot enforce an agent loop.
- Copilot output is prompt guidance, not tool orchestration.
- Keep instructions concise to avoid context bloat.

## Migration Strategy

Phase 1 introduces the canonical source without a behavior break:

- Add `assets/agents/xppai-papai/AGENT.md`.
- Update legacy `SKILL.md` with a canonical reference and short loop summary only.
- Keep existing XPO intake behavior in `SKILL.md`.
- Add tests proving the canonical agent file exists and contains required sections.

Phase 1.1 standardizes XPO analysis command usage to reduce repeated approval prompts:

- Add `xppai xpo analyze-load` as an alias to current `xppai xpo load`.
- Add `xppai xpo analyze-snapshot` as an alias to current `xppai xpo snapshot --json`.
- Add `xppai xpo analyze-list` as an alias to current `xppai xpo list`.
- Add `xppai xpo analyze-read` as an alias to current `xppai xpo read`.
- Add `xppai xpo analyze-grep` as an alias to current `xppai xpo grep`.
- Update Papai instructions to use only the `analyze-*` family in normal intake/discovery/read flows.
- Keep existing `xppai xpo` commands valid for backward compatibility.

## Risks

- Overengineering: building a full agent runtime before one agent needs it.
  Mitigation: first version is a Markdown contract plus tests.

- Duplicated logic: `AGENT.md` and `SKILL.md` drift.
  Mitigation: keep `SKILL.md` as a legacy wrapper or copy only a short canonical loop section.

- Context bloat: Copilot and skill exports become too long.
  Mitigation: put detailed loop in `AGENT.md`; keep target instructions concise.

- Inconsistent behavior: Codex, Claude Code, and GitHub Copilot interpret instructions differently.
  Mitigation: define common mission, actions, validation rules, and stop conditions in one canonical file.

- Premature generalization: the agent becomes a generic ERP analyzer.
  Mitigation: every section says AX 2009 and X++ explicitly.

## Implementation Tasks

First working version only:

- [ ] Create `assets/agents/xppai-papai/AGENT.md`.
- [ ] Add `# XppAI Papai Canonical Agent` heading to `AGENT.md`.
- [ ] Add `## Mission` section to `AGENT.md`.
- [ ] Add `## Operating Loop` section to `AGENT.md`.
- [ ] Add the six loop steps under `## Operating Loop`.
- [ ] Add the rule `Do not exceed 3 investigation cycles unless explicitly requested` under `## Operating Loop`.
- [ ] Add `## Available Actions` section to `AGENT.md`.
- [ ] Add analysis actions to `## Available Actions`: `load_xpo_once`, `snapshot_xpo_cache`, `read_selected_xpo_object`, `explain_artifact`, `analyze_stack_or_trace`, `assess_change_risk`, `analyze_posting_flow`, `review_architecture`, `propose_codefix`, `synthesize_answer`, `stop_with_missing_context`.
- [ ] Add support actions to `## Available Actions`: `show_skill_help` and `prepare_xpo_export`.
- [ ] Add `## Validation Rules` section to `AGENT.md`.
- [ ] Add AX 2009, localization, evidence labeling, and codefix metadata rules to `## Validation Rules`.
- [ ] Add the canonical-source and anti-duplication rules for `SKILL.md` to `## Validation Rules`.
- [ ] Add `## Stop Conditions` section to `AGENT.md`.
- [ ] Add the 3-cycle stop condition to `## Stop Conditions`.
- [ ] Edit `assets/skills/xppai-papai/SKILL.md` overview to state it is the legacy Codex entry point.
- [ ] Add one sentence in `SKILL.md` that references `assets/agents/xppai-papai/AGENT.md` as canonical.
- [ ] Add a short six-step loop summary in `SKILL.md`.
- [ ] Add the 3-cycle limit sentence to the short loop summary in `SKILL.md`.
- [ ] Confirm `SKILL.md` keeps existing XPO intake behavior unchanged.
- [ ] Create `test/agents/papai-agent.test.js`.
- [ ] Add a test that `assets/agents/xppai-papai/AGENT.md` exists.
- [ ] Add a test that `AGENT.md` contains `Mission`, `Operating Loop`, `Available Actions`, `Validation Rules`, and `Stop Conditions`.
- [ ] Add a test that `AGENT.md` mentions `AX 2009`.
- [ ] Add a test that `AGENT.md` mentions `xppai-init`, `xppai-explain`, `xppai-stack`, `xppai-risk`, `xppai-codefix`, `xppai-posting`, `xppai-architect`, `xppai-help`, and `xppai-exportxpo`.
- [ ] Add a test that `AGENT.md` contains `Do not exceed 3 investigation cycles unless explicitly requested`.
- [ ] Add a test that legacy `assets/skills/xppai-papai/SKILL.md` still contains the existing frontmatter name `xppai-papai`.
- [ ] Add a test that `SKILL.md` references `assets/agents/xppai-papai/AGENT.md`.
- [ ] Add a test that `SKILL.md` contains the 3-cycle limit sentence.
- [ ] Add a test that `SKILL.md` does not include a `## Available Actions` section.
- [ ] Add CLI route for `xppai xpo analyze-load` in `src/cli.js` mapping to the current `load` handler.
- [ ] Add CLI route for `xppai xpo analyze-snapshot` in `src/cli.js` mapping to `snapshot` with JSON output.
- [ ] Add CLI route for `xppai xpo analyze-list` in `src/cli.js` mapping to the current `list` handler.
- [ ] Add CLI route for `xppai xpo analyze-read` in `src/cli.js` mapping to the current `read` handler.
- [ ] Add CLI route for `xppai xpo analyze-grep` in `src/cli.js` mapping to the current `grep` handler.
- [ ] Add tests in `test/xpo/*` proving each `analyze-*` alias executes and preserves the existing output shape.
- [ ] Update `assets/skills/xppai-papai/SKILL.md` intake/discovery/read instructions to require the `analyze-*` command family.
- [ ] Add a short documentation note in `README.md` (or existing XPO docs section) describing the standard `analyze-*` family for stable approvals.
- [ ] Run `npm test`.

Removed from the first version:

- No new `src/agents.js`.
- No new CLI command.
- No adapter export changes.
- No Claude subagent file generation.
- No Copilot transformation changes.
- No generalized agent framework.
