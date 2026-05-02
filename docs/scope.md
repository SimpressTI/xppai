# Scope and Constraints

XppAI is intentionally narrow.

## Scope

- Microsoft Dynamics AX 2009
- X++
- performance analysis
- bug analysis
- posting flow analysis
- change-risk assessment
- production-oriented safe fixes

## Constraints

- AX 2009 and X++ only
- no D365 / Finance & Operations scope
- localization blocks such as `<GBR>`, `<GIN>`, `<GJP>`, `<GSA>`, and `<GTH>` should not be modified unless explicitly requested
- recommendations should prioritize minimal behavior-preserving changes over broad rewrites
