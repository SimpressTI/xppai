# XPO Cache Workflow

Papai and related XppAI skills now prefer direct local-file XPO intake for analysis. This document covers an optional CLI cache workflow for repeatable command-line queries and revision comparisons.

Cache commands are not required for `xppai-papai` or `xppai-babysit` analysis when you already have a local `.xpo` path or pasted XPO text.

Default cache path:

`%LOCALAPPDATA%\xppai\cache\xpo\`

## Typical Flow

1. Load the initial XPO revision into the CLI cache.
2. Run `xppai xpo snapshot --json` once to capture cache inventory and authorize cache-session queries.
3. Run `xppai xpo list`, `xppai xpo read`, `xppai xpo grep`, or `xppai xpo export-modified` for cache-based query workflows.
4. Load a new revision of the same source file only when you want to refresh active cache context.
5. Export only changed/new objects when needed.

Snapshot approval persists for the same Codex session while the cache fingerprint remains unchanged. This applies to cache-query commands only.

Example:

```bash
xppai xpo load "./samples/Class_PurchCalcTax_Invoice.xpo"
xppai xpo snapshot --json
xppai xpo read --type Class --name PurchCalcTax_Invoice
xppai xpo load "./samples/Class_PurchCalcTax_Invoice.xpo" # warns if replacing active cache entry for same source
xppai xpo export-modified --out "./out/xpo_out" --file "./samples/Class_PurchCalcTax_Invoice.xpo"
```

## Pasted XPO Intake

For pasted XPO text:

```bash
Get-Clipboard | xppai xpo load-stdin --name "from-chat.xpo"
```

`load-stdin` rejects incomplete/partial pasted XPO and does not write cache in that case.

## Cache Directory Controls

- Set active directory: `xppai xpo cache-use <directory>`
- Inspect resolved directory: `xppai xpo cache-show`
- Copy cache to another location: `xppai xpo cache-copy <destination>`
