# XppAI

LLM-runtime-agnostic X++ and Microsoft Dynamics AX 2009 skill suite, packaged as an installable CLI.

XppAI bundles a curated set of AX 2009 / X++ skills and lets you:

- list bundled skills
- locate the installed skill bundle
- export skills for a target runtime
- install skills into supported runtimes
- load and cache XPO files

## Requirements

- Node.js 18 or newer

## Install

### Global install from npm

```bash
npm install -g xppai
```

### Local install from source

```bash
npm install -g .
```

## CLI

### List bundled skills

```bash
xppai list
```

Example output:

```
xppai-architect
xppai-babysit
xppai-codefix
xppai-explain
xppai-help
xppai-init
xppai-papai
xppai-posting
xppai-risk
xppai-stack
```

### Show installed asset path

```bash
xppai path
```

### Export skills for a target

```bash
xppai export --target <target> --out <directory>
```

Example:

```bash
xppai export --target generic --out ./out/skills
```

### Install into a supported target runtime

```bash
xppai install --target <target>
```

Optional symlink mode:

```bash
xppai install --target <target> --mode symlink
```

### Load an XPO file into cache

```bash
xppai xpo load <file> [--cache-dir <directory>]
```

Default cache location is user-local:

`%LOCALAPPDATA%\xppai\cache\xpo\`

### Set active XPO cache directory

```bash
xppai xpo cache-use <directory>
```

### Copy XPO cache to another directory

```bash
xppai xpo cache-copy <destination> [--yes] [--cache-dir <directory>]
```

If destination has existing content, xppai warns that all content will be erased and replaced, and asks for confirmation unless `--yes` is provided.

### Show active/resolved XPO cache directory

```bash
xppai xpo cache-show [--cache-dir <directory>]
```

### Export one XPO per modified object from cache

```bash
xppai xpo export-modified --out <directory> [--file <source-xpo-file>] [--cache-dir <directory>]
```

Behavior:
- Always generates one `.xpo` file per object.
- Compares latest cached version against previous cached version of the same source XPO file.
- Exports only changed/new objects.

Example (single class object source file):

```bash
xppai xpo load "C:\Users\Roberta\Desktop\Class_PurchCalcTax_Invoice.xpo"
# ...load updated revision of the same file again...
xppai xpo export-modified --out "C:\Users\Roberta\Desktop\xpo_out" --file "C:\Users\Roberta\Desktop\Class_PurchCalcTax_Invoice.xpo"
```

Output files are always per object, for example:

`Class_PurchCalcTax_Invoice.xpo`

## Supported targets

### Native targets

These consume the packaged skill directories directly:

- claude
- codex

### Export-only targets

These are adapted during export and do not currently define a default install location:

- copilot
- generic

## Canonical asset format

The canonical packaged source is:

```
assets/skills/**/SKILL.md
```

XppAI keeps SKILL.md as the source of truth and uses target adapters to export or install the bundle for different runtimes.

## Included skills

| Skill           | Purpose                                                   |
|-----------------|-----------------------------------------------------------|
| xppai-init      | Shared AX 2009 foundation and guardrails                  |
| xppai-explain   | Explain unfamiliar methods, classes, forms, and tables    |
| xppai-stack     | Analyze profiler traces and stack traces                  |
| xppai-codefix   | Propose minimal, safe, production-ready fixes             |
| xppai-architect | Review code for architectural weaknesses and design gaps  |
| xppai-posting   | Analyze FormLetter posting flows and transaction behavior |
| xppai-risk      | Assess change risk before modifying code                  |
| xppai-babysit   | Structured multi-skill static analysis                    |
| xppai-papai     | Dynamic senior-style orchestration and synthesis          |
| xppai-help      | General helper and entry guidance                         |

## Project scope

XppAI is focused on:

- Microsoft Dynamics AX 2009
- X++
- performance analysis
- bug analysis
- posting flow analysis
- change-risk assessment
- safe production-oriented fixes

## Constraints

- AX 2009 and X++ only
- no D365 / Finance & Operations scope
- localization blocks such as `<GBR>`, `<GIN>`, `<GJP>`, `<GSA>`, and `<GTH>` should not be modified unless explicitly requested
- skills are intended to preserve existing logic and favor minimal, safe changes

## Development

Run tests:

```bash
npm test
```

Pack locally:

```bash
npm pack
```

## Repository

GitHub: [betaxD/xppai](https://github.com/betaxD/xppai)
