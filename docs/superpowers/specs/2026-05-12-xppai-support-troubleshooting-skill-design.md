# XppAI Support Troubleshooting Skill Design

## Goal

Add a Papai-routed specialist skill that improves XppAI's ability to investigate AX 2009 support issues that begin as business symptoms rather than pasted code artifacts.

The new skill should help users troubleshoot problems such as "I can't post a sales order because AX says there are not enough items in stock." It should reason from the standard AX 2009 process first, produce a cause tree, ask focused support questions, and only escalate into customization/XPO analysis when the evidence points there.

## Non-Goals

- Do not replace `xppai-papai` as the main entry point.
- Do not make support triage a codefix generator.
- Do not assume customer customization is the root cause before checking standard AX behavior.
- Do not introduce D365 or modern AX concepts.
- Do not require web search for normal operation.

## Architecture

Add a new specialist skill:

- `assets/skills/xppai-support/SKILL.md`
- Skill name: `xppai-support`
- Purpose: symptom-first AX 2009 support troubleshooting through a cause tree.

`xppai-papai` remains the recommended user entry point. Papai should gain a new action:

- `triage_support_issue` -> `xppai-support`

Papai selects this action when the prompt is a business support symptom, operational error, or troubleshooting question rather than a direct X++ artifact. Examples:

- "I can't post a sales order; AX says not enough items in stock."
- "Users cannot invoice this purchase order."
- "AX says a financial dimension is missing during posting."
- "How should I investigate this posting error?"

The support skill depends on `xppai-init` for AX 2009 scope and guardrails. If the investigation becomes code-oriented, Papai can continue with existing specialist skills such as `xppai-posting`, `xppai-explain`, `xppai-risk`, or `xppai-codefix`.

## Skill Behavior

`xppai-support` should start from standard AX 2009 behavior and build a cause tree. It should not jump directly to custom code unless the prompt explicitly mentions customization or the support evidence makes customization likely.

The skill should:

1. Restate the support symptom in AX 2009 terms.
2. Identify the likely process area, such as sales posting, inventory availability, reservation, dimensions, tax, posting setup, number sequence, or permissions.
3. Produce a cause tree with standard AX 2009 causes first.
4. For each cause branch, explain what the cause means, what evidence would confirm it, how to check it in AX, and the next question to ask.
5. Ask whether the affected process has related customization, integration, modified validation, posting hooks, or custom reservation logic.
6. If customization exists or is likely, request the relevant XPO and hand the investigation back to Papai for artifact analysis.

For the "not enough items in stock" sales order example, the standard branches should include possibilities such as available physical inventory, inventory dimensions, reservation status, picking or packing state, negative inventory settings, site or warehouse mismatch, and `InventTrans` state. The customization branch should ask whether posting, reservation, or inventory validation has been customized.

## Output Contract

The skill should use a stable format:

```markdown
## Support Symptom
<short restatement>

## Likely AX 2009 Area
<functional area and why>

## Cause Tree
### 1. <Standard AX cause>
- Evidence: Confirmed/Likely/Hypothesis/Unknown
- Why it fits:
- How to check in AX:
- Next question:

### 2. <Standard AX cause>
...

## Customization Check
<ask whether the affected flow has custom code, integration, modified validation, posting hooks, or custom reservation logic>

## Suggested Next Step
<one concrete next action, or request XPO if customization is relevant>
```

Evidence labels must align with the rest of XppAI:

- Confirmed
- Likely
- Hypothesis
- Unknown

The skill should avoid declaring a root cause from a symptom-only prompt. Its primary job is to narrow the investigation and ask the next useful support question.

## Customization Escalation

Customization should be treated as a branch, not the default assumption.

When customization is confirmed or likely, the skill should ask for the relevant XPO. The request should be specific enough to help the user export the right objects. Examples:

- Modified posting classes or methods.
- Customized table methods such as `SalesLine.modifiedField`, `SalesLine.validateWrite`, or inventory validation methods.
- Customized forms or datasource methods involved in the failing workflow.
- Integration/import classes that create or update the affected transaction.

After XPO is provided, Papai should use existing XPO intake behavior and route to the appropriate artifact-oriented skills.

## Web Search Policy

The skill may use web search only as background support when standard AX 2009 process details are missing or uncertain. Web search is not the primary evidence source for customer-specific issues.

When web search contributes to the answer, the output should separate:

- customer/local evidence from the prompt or XPO
- general AX 2009 process knowledge
- open questions that still need confirmation

## Documentation Changes

Update the public skill guide to mention `xppai-support` as a Papai-routed specialist for symptom-first support troubleshooting.

Update `xppai-help` so users know that support issues should still start with `xppai-papai`, which can route to support triage.

Update the Papai canonical agent documentation to include the new action and action-to-skill mapping.

## Testing

Update existing asset tests so the new skill is included in the expected skill list.

Add or update tests that verify:

- `assets.list()` includes `xppai-support` in sorted order.
- The skill file has valid frontmatter.
- Papai documentation includes the `triage_support_issue` action and maps it to `xppai-support`.

The implementation should continue to pass the existing smoke and asset test suites.

## Acceptance Criteria

- A new `xppai-support` skill exists under `assets/skills/`.
- Papai documents `triage_support_issue` as an available action.
- The support skill output contract is cause-tree based.
- The skill defaults to standard AX 2009 causes before customization.
- The skill asks whether customization exists and requests XPO only when that branch is relevant.
- Skill guide, help text, and asset tests are updated.
- Tests pass.
