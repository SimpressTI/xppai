---
name: xppai-papai
description: Use when given any X++ AX 2009 artifact and you need an intelligent senior-engineer analysis — reads the artifact, reasons about what matters most, dynamically selects which skills to apply and in what order, and synthesizes findings into a practical assessment.
---

# XppAI Papai — Dynamic Senior Analysis Agent

Legacy Codex skill entry point for the canonical Papai agent definition at `assets/agents/xppai-papai/AGENT.md`.

**REQUIRED BACKGROUND:** Load `xppai-init` before applying this skill.

**MANDATORY PRE-STEP:** If input includes pasted XPO text or a .xpo file path, run XPO intake at most once per user request before any analysis output.

## Overview

Use this skill as a compatibility wrapper. The canonical behavior lives in `assets/agents/xppai-papai/AGENT.md`.

Compact operating loop summary:

1. Define goal.
2. Inspect evidence.
3. Choose next action.
4. Use skill/tool.
5. Validate result.
6. Stop or continue.

Do not exceed 3 investigation cycles unless explicitly requested.

Only select skills that serve the user's prompt goal.

## XPO Intake Before Analysis

Before Step 1, check whether the artifact is XPO input (file path or pasted XPO text with object headers like `CLASS #`, `TABLE #`, `FORM #`).

- For a newly provided XPO, state that the active XPO cache context will be refreshed for this request.
- Use the standard analysis command family for stable approvals: `xppai xpo analyze-load`, `xppai xpo analyze-snapshot`, `xppai xpo analyze-list`, `xppai xpo analyze-read`, `xppai xpo analyze-grep`.
- For XPO file path: run `xppai xpo analyze-load "<file>"`.
- For pasted XPO text: run `xppai xpo load-stdin --name "pasted.xpo"` with pasted text on stdin.
- If pasted XPO is incomplete and cache load fails, continue analysis from provided text and mark cache import as skipped.
- Run XPO intake at most once per user request.
- If no new XPO is provided, use cache-first discovery with `xppai xpo analyze-snapshot` once, then `xppai xpo analyze-read` only for selected objects and do not reload; snapshot approval persists for the current Codex session and the same cache fingerprint.
- Legacy equivalent for compatibility: `xppai xpo snapshot --json`.
- After successful intake, record and pass this state to selected skills: `XPO intake already completed for this request`.
- When applying selected skills, pass the completed intake state; selected skills must not run XPO intake again.
- Do not run unrelated shell commands to inspect files, search repositories, list directories, or discover context unless the user asked for that or the XPO load command failed and diagnosis is required.
- Do not use `xppai xpo --help` for runtime discovery in this workflow.

For action definitions, validation rules, and stop conditions, follow `assets/agents/xppai-papai/AGENT.md`.

## Export Integration

If the user asks to export analyzed objects to XPO files after assessment, invoke `xppai-exportxpo` with the object list. The skill generates a ready-to-paste X++ export job.
