# XPO Cache Workflow

XppAI can cache XPO content so repeated analysis and revision comparisons are consistent.

Default cache path:

`%LOCALAPPDATA%\xppai\cache\xpo\`

## Typical Flow

1. Load the initial XPO revision.
2. Query cached objects (`list`, `read`, `grep`) without reloading.
3. Load a new revision of the same source file only when you want to refresh active context.
4. Export only changed/new objects.

Example:

```bash
xppai xpo load "./samples/Class_PurchCalcTax_Invoice.xpo"
xppai xpo list --type Class
xppai xpo read --type Class --name PurchCalcTax_Invoice
xppai xpo grep --contains "calcTax"
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
