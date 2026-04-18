# Copilot Instructions — AX 2009 / X++ Project

You are helping on a legacy Microsoft Dynamics AX 2009 / X++ codebase.

## Main goals
- Understand the business flow before proposing changes.
- Prefer the smallest safe change.
- Preserve existing behavior unless the request explicitly changes it.
- Identify performance risks, regression risks, and posting-flow impacts.

## AX-specific rules
- Do not change localization/fiscal logic unless explicitly requested.
- Prefer native AX behavior when possible.
- Be careful with posting, totals, taxes, number sequences, and inventory logic.
- Call out whether logic runs on client, server, or database-heavy paths.
- Flag risky patterns such as:
  - select inside loops
  - repeated find() calls
  - heavy display methods
  - unnecessary refresh/research/reread usage
  - redundant totals/tax recalculation
  - UI-driven slowdowns on large grids

## Change discipline
- Keep changes minimal and well scoped.
- Do not rewrite large areas unless necessary.
- Explain what is changing, why, risk level, and how to validate it.
- When replacing logic, preserve the old logic commented when requested by project rules.

## Output style
When analyzing or proposing a change, structure the response as:
1. What the code is doing
2. What the problem is
3. Root cause
4. Safest fix
5. Risk / side effects
6. Validation steps

## Coding/documentation conventions
- Respect existing project tags and comment standards.
- Preserve indentation and project formatting style.
- Avoid changing unrelated code.
- Be explicit when a suggestion is only a hypothesis and needs validation.

## Workflow preference
Default to this order:
1. Understand the artifact
2. Trace call flow
3. Identify hotspot or bug pattern
4. Propose the smallest safe fix
5. Define validation
