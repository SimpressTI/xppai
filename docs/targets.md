# Targets and Installation

XppAI supports multiple runtime targets.

## Native Targets

These use packaged skill directories directly and support `install`:

- `claude`
- `codex`

## Export-only Targets

These are adapted during export and currently do not expose a default install directory:

- `copilot`
- `generic`

## Installation Examples

Install to a native target:

```bash
xppai install --target claude
```

Symlink mode for development:

```bash
xppai install --target codex --mode symlink
```

Export for manual use:

```bash
xppai export --target generic --out ./out/skills
```
