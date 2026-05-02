# XPO Analyze-First Enforcement Design

Date: 2026-05-02
Topic: Enforce analyze-first command path for XPO analysis skills
Status: Approved design (brainstorming)

## 1. Scope and Intent

In scope:
- `xppai-papai`
- `xppai-babysit`
- `xppai-explain`
- `xppai-stack`
- `xppai-risk`
- `xppai-codefix`

Rule:
- After successful XPO intake, XPO-analysis flow must use `xppai xpo analyze-*` first.
- Direct PowerShell/XPO cache commands (`snapshot`, `read`, `grep`, raw file scans) are fallback only.

Out of scope:
- Non-XPO-analysis skills
- CLI runtime/parser changes
- Non-workflow knowledge-domain changes

## 2. Enforcement Model

Each in-scope skill receives a mandatory `Execution Decision Gate` section.

Gate sequence:
1. Check whether XPO intake is completed for this request.
2. Confirm task is XPO-analysis.
3. If yes, run `analyze-*` first.
4. If `analyze-*` fails OR misses required evidence, fallback is permitted.

Fallback rule:
- Allowed only for:
  - command/runtime failure, or
  - insufficient evidence for user-requested detail.
- Fallback must include explicit reason text.

Required response markers:
- `Path used: analyze-first` OR `Path used: fallback`
- If fallback: `Fallback reason: <failure|missing detail> - <concrete detail>`

## 3. Command Ownership and Responsibility

Skills define policy.

The active orchestrator/agent (for example Papai) executes commands and is responsible for enforcing the gate.

Implication:
- No skill may claim compliance unless the executing agent followed the gate.
- Compliance markers must appear in output for auditability.

## 4. Skill-by-Skill Change Map

### xppai-papai
- Preserve intake-once pre-step.
- Replace generic discovery-first language with analyze-first triage requirement.
- Require fallback justification when using direct inspection.

### xppai-babysit
- Before static skill routing, run analyze-first gate.
- Pass gate state and chosen path to downstream skill application.

### xppai-explain
- Object/method discovery from analyze output first.
- Allow direct reads only with fallback reason.

### xppai-stack
- Use analyze-first for hotspot/trace-oriented extraction.
- Use fallback only for missing trace evidence.

### xppai-risk
- Use analyze-first for dependency/caller/change-surface discovery.
- Use fallback only when required impact detail is absent.

### xppai-codefix
- Require analyze-first evidence baseline before fix proposals.
- Preserve Confirmed/Likely/Unknown labeling discipline.

## 5. Data Flow and Error Handling

1. Intake check
2. Analyze-first execution
3. Sufficiency check
4. Optional justified fallback
5. Output with compliance markers

Error handling:
- On analyze command failure: record concise failure and continue through fallback path.
- On insufficient detail: state missing evidence explicitly before fallback.
- Never repeat intake for same request.

## 6. Acceptance Criteria

- Hard-rule gate text appears in all six in-scope skills.
- Papai guidance explicitly states it executes commands and enforces the gate.
- Output contract includes path marker and conditional fallback reason.
- No wording permits direct command path as equal alternative to analyze-first.

## 7. Risks and Mitigations

Risk: Overly rigid flow may block deep inspection in edge cases.
Mitigation: Allow fallback for insufficient detail, not only failures.

Risk: Policy drift across skills.
Mitigation: Keep gate wording structurally identical across all in-scope skill files.

## 8. Implementation Handoff

Next step after spec approval: invoke `superpowers:writing-plans` to create implementation plan and then apply skill-file edits.
