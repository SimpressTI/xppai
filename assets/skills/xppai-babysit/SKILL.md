---
name: xppai-babysit
description: Use when given any X++ AX 2009 artifact — stack trace, method, class, form XPO, posting code, or table — and you need a full structured multi-skill analysis applied automatically based on artifact type.
---

# XppAI Babysit — Static Multi-Skill Orchestrator

**REQUIRED BACKGROUND:** Load `xppai-init` before applying this skill.

**MANDATORY PRE-STEP:** If input includes pasted XPO text or a .xpo file path, run XPO intake at most once per user request before classification or analysis output.

## Overview

Paste any AX 2009 artifact. This skill detects what it is, applies the correct skill sequence, and produces clearly labeled sections — one per skill applied. No decisions required from the user.

## XPO Intake Before Classification

If input is an XPO file path or pasted XPO text (object headers such as `CLASS #`, `TABLE #`, `FORM #`), load it first:

- File path: `xppai xpo analyze-load "<file>"`
- Pasted text: `xppai xpo load-stdin --name "pasted.xpo"` with text on stdin
- If pasted XPO is incomplete and load fails, continue classification/analysis from text and state cache import was skipped
- Run XPO intake at most once per user request.
- If no new XPO is provided, use cache-first discovery with `xppai xpo analyze-snapshot` once, then `xppai xpo analyze-read` only for selected objects and do not reload; snapshot approval persists for the current Codex session and the same cache fingerprint.
- After successful intake, pass this state to selected skills: `XPO intake already completed for this request`.
- Selected skills must not run XPO intake again.
- Do not use `xppai xpo --help` for runtime discovery in this workflow.

## Execution Decision Gate

1. Confirm intake state is known (or run intake once).
2. If this request is XPO-analysis, run `xppai xpo analyze-*` first.
3. Fallback to direct cache/file inspection is allowed only if:
   - analyze command failed, or
   - analyze output is insufficient for required evidence detail.
4. Record compliance markers in output:
   - `Path used: analyze-first` or `Path used: fallback`
   - if fallback used: `Fallback reason: <failure|missing detail> - <concrete detail>`

## Step 1 — Classify the Artifact

Read the artifact and identify its type. Use the first match:

| Artifact type | Signals |
|--------------|---------|
| **Stack trace / profiler** | Call stack lines, method depth, call counts, duration columns |
| **Posting code** | References to `FormLetter`, `ParmTable`, `ParmLine`, `calcTax`, `InventMovement`, `LedgerVoucher`, posting-specific classes |
| **Form XPO** | `FORM #`, `DATASOURCE`, `SOURCE #init`, `SOURCE #active`, form method structure |
| **Class** | `CLASS #`, `extends`, `new()`, `run()`, `construct()`, `main()` |
| **Method / function** | Single method body, no class wrapper visible |
| **Table code** | `TABLE #`, `modifiedField`, `validateWrite`, `initValue`, `find`, `exist` |

If the artifact matches multiple types (e.g., a posting class), use the posting sequence.

## Step 2 — Apply the Skill Sequence

| Artifact type | Skill sequence (in order) |
|--------------|--------------------------|
| Stack trace / profiler | `xppai-stack` → `xppai-codefix` |
| Posting code | `xppai-explain` → `xppai-posting` → `xppai-risk` → `xppai-codefix` |
| Form XPO | `xppai-explain` → `xppai-architect` → `xppai-risk` |
| Class | `xppai-explain` → `xppai-architect` → `xppai-risk` → `xppai-codefix` |
| Method / function | `xppai-explain` → `xppai-risk` → `xppai-codefix` |
| Table code | `xppai-explain` → `xppai-risk` |

## Step 3 — Produce Labeled Output

For each skill applied, output a clearly labeled section using the skill's own output format.

```
## [ARTIFACT TYPE DETECTED: <type>]
## [SKILLS APPLIED: skill1 → skill2 → ...]

---
## xppai-explain
<full explain output>

---
## xppai-risk
<full risk output>

---
## xppai-codefix
<full codefix output>
```

Do not blend outputs. Each section is self-contained and follows its skill's format exactly.

## Export Integration

After analyzing an artifact, if the user asks to export related objects to XPO files, invoke `xppai-exportxpo` with the object list. This generates a ready-to-paste X++ export job.

## Rules

- Always state the detected artifact type before starting
- Always state the skill sequence being applied
- Apply each skill fully — do not summarize or truncate
- If the artifact is ambiguous, state which type was chosen and why
- If context is clearly insufficient for a skill (e.g., no fix is possible without more code), state that explicitly in that section rather than skipping it silently
