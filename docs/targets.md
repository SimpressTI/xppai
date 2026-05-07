# Targets and Installation

XppAI supports multiple runtime targets.

## Native Targets

These use packaged skill directories directly and support `install`:

- `claude`
- `codex`

These install repository instructions and support `install`:

- `copilot`

## Export-only Targets

These are adapted during export and currently do not expose a default install directory:

- `generic`

## Installation Examples

Install to a native target:

```bash
xppai install --target claude
```

Install to every supported runtime:

```bash
xppai install --target all
```

Symlink mode for development:

```bash
xppai install --target codex --mode symlink
```

Codex target installs to:

```text
~/.codex/skills
```

Claude target installs to:

```text
~/.claude/skills
```

Copilot target installs repository custom instructions to the current working directory:

```text
.github/copilot-instructions.md
.github/instructions/xppai-*.instructions.md
.github/prompts/xppai.prompt.md
.github/prompts/babysit.prompt.md
```

Run `xppai install --target copilot` from the repository where you want GitHub Copilot to use XppAI guidance.
In Copilot Chat (prompt files enabled), use `/xppai` for dynamic orchestration and `/babysit` for fixed-sequence analysis.

Export for manual use:

```bash
xppai export --target generic --out ./out/skills
```
