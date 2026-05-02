# XPO Cache Workflow

Papai and related XppAI skills now prefer direct local-file XPO intake for analysis. This document covers the optional CLI cache workflow for repeatable command-line queries and revision comparisons.

Default cache path:

`%LOCALAPPDATA%\xppai\cache\xpo\`

## Typical Flow

1. Load the initial XPO revision.
2. Run `xppai xpo snapshot --json` to authorize the active cache fingerprint for the current Codex session and discover cached objects once.
3. Run `xppai xpo list`, `xppai xpo read`, `xppai xpo grep`, or `xppai xpo export-modified` only after that snapshot approval is in place.
4. Load a new revision of the same source file only when you want to refresh active context.
5. Export only changed/new objects.

Snapshot approval persists for the same Codex session while the cache fingerprint remains unchanged.

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
