# AGENTS.md — AX 2009 / X++ Project Rules

## Project context

This repository is for **Microsoft Dynamics AX 2009** and **X++** work only.

All analysis, code review, debugging, explanation, and implementation planning must stay grounded in:

- AX 2009
- legacy X++
- MorphX / AOT object model
- real production ERP customization patterns

Do **not** assume D365, modern X++, extensions, cloud-only architecture, or newer framework behavior.

---

## Scope and operating mode

These instructions are the **always-on rules** for this repository.

Apply them to:

- code analysis
- bug investigation
- performance review
- change planning
- code generation
- refactoring suggestions
- review comments
- explanations for technical and non-technical audiences

Prefer **evidence from code and traces** over assumptions.

When something is uncertain, state it clearly.

---

## Non-negotiable rules

- Stay in **AX 2009** only.
- Do **not** use D365 concepts, syntax, or extension patterns.
- Keep **variable declarations at the top of the method**.
- Preserve existing behavior unless the request explicitly changes it.
- Prefer the **smallest safe change**.
- Avoid rewriting large areas unless truly necessary.
- Avoid changing unrelated code.
- Never present guesses as facts.
- Prefer native AX behavior when possible.
- Do **not** recommend changes to localization/fiscal logic unless explicitly requested.
- Never recommend changes to localization blocks such as:
  - `<GBR>`
  - `<GIN>`
  - `<GJP>`
  - `<GSA>`
  - `<GTH>`

---

## AX 2009 architectural grounding

Assume the following model unless the code proves otherwise:

- **Table**
  - data structure
  - validation
  - business logic near data
  - methods such as `find`, `exist`, `insert`, `update`, `delete`, `validateWrite`, `modifiedField`, `initValue`

- **Class**
  - reusable logic
  - services
  - helpers
  - RunBase jobs
  - posting helpers

- **Form**
  - UI layer only
  - datasource behavior
  - control behavior
  - display/edit methods
  - enable/disable and visual interaction logic

- **Query**
  - reusable query definitions

- **Enum / EDT / Map / View**
  - standard AX metadata building blocks

Remember:

- AX 2009 code lives in the **AOT**
- `.xpo` files are **export snapshots**
- layering matters: `SYS → GLS → ISP → ISV → VAR → CUS → USR`
- higher layers override lower layers per method

---

## X++ language and coding rules

### Basic rules

- Variable declarations must stay at the **top** of the method.
- Follow classic AX 2009 method structure.
- Preserve existing formatting and indentation style where possible.
- Do not introduce modern syntax that does not belong to AX 2009.

### Correct placement of logic

Prefer this placement model:

| Logic type | Preferred location |
|---|---|
| Field defaulting | `table.initValue()` / `table.modifiedField()` |
| Validation | `table.validateWrite()` / `table.validateField()` |
| Calculations | table methods or separate classes |
| UI state | form methods / datasource `active()` / init |
| Complex process | class / RunBase / service-style class |
| Posting behavior | framework-specific hooks, not random UI methods |

### Do not do this unless explicitly justified

- Put core business logic in form control `modified()`
- Put table/business logic inside UI-only code
- Make table methods depend on `element` or form state
- Introduce wide-scope refactors for a local issue

---

## Form lifecycle awareness

Always reason with the AX form lifecycle in mind:

- `form.init()`
- `form.run()`
- `datasource.active()`
- `control.modified()`
- `datasource.write()`

Respect the meaning of:

- `refresh()` = repaint UI, no database reread
- `reread()` = reread current record from DB
- `research()` = rerun query
- `executeQuery()` = query execution hook

Do not suggest `refresh()`, `reread()`, or `research()` interchangeably.

Always explain **why** one is correct for the scenario.

---

## Data access rules

### General principles

- Use `firstOnly` when only one record is expected.
- Use `forupdate` only when an update/delete is actually intended.
- Be explicit about join type and expected cardinality.
- Watch for loop-invariant queries.
- Prefer reducing repeated reads over adding complexity.

### High-cost patterns to flag

Always flag these as potential performance issues:

- `find()` inside `while select`
- repeated `find()` on the same key in the same method
- `select` inside loops with invariant filters
- `display` methods doing DB reads
- `select *` on large tables without care
- unnecessary `index hint` omission where the chosen plan is clearly bad
- repeated `new ClassName()` inside loops

### Aggregates

Remember AX 2009 aggregate behavior, for example:

- `select count(RecId)` stores the result in the buffer field used by AX aggregate behavior

### Important practical reminder

- `TextIo` has **no** `.eof()`
- for file reading, use `read()` + `IO_Status::Ok`

---

## Transaction rules

Always reason carefully about `ttsBegin` / `ttsCommit` / `ttsAbort`.

### Core rules

- Wide transaction scopes are risky.
- Nested `ttsBegin` blocks do not commit until the outermost `ttsCommit`.
- `ttsAbort` rolls back the full transaction scope.
- Do not leave transactions open.
- Be cautious with helper methods called inside `tts` blocks.

### Risk patterns to call out

- `ttsBegin` too far away from `ttsCommit`
- hidden update logic inside called methods
- `ttsAbort` in helpers that surprise callers
- locks held longer than necessary
- `select forupdate` without actual modification
- error/throw behavior inside transaction scope without proper rollback reasoning

---

## Client/server execution awareness

AX 2009 is sensitive to **where** code runs.

Always consider:

- `RunOn = Server`
- `RunOn = Client`
- `RunOn = Called from`

Flag hidden cost when logic crosses boundaries repeatedly.

### Common hidden problem

A method called inside a loop that forces repeated client/server transitions can become a major bottleneck even when the code looks small.

Whenever relevant, explain whether the issue is primarily:

- UI/client-side
- AOS/server-side
- database/read-pattern related
- transaction/locking related

---

## Performance investigation rules

When analyzing slowness, freezes, or heavy posting, always look for:

- `select` inside loops
- repeated `find()` calls
- heavy display methods
- `active()` doing too much work
- repeated totals or tax recalculation
- object construction inside loops
- unnecessary `refresh()` / `reread()` / `research()`
- large-grid UI redraw issues
- wide transaction scope
- repeated client/server crossings

### Hot path principle

A low-cost method called thousands of times can be more important than one expensive call.

Call count matters.

### Symptom vs root cause

Do not stop at the leaf method.

Always try to identify:

1. the dominant path
2. the loop driving it
3. the first avoidable or excessive call
4. whether the work is really needed per record

---

## Totals, taxes, pricing, and posting rules

Treat these areas as **high risk**.

### Important grounding

- `PurchTotals` / `SalesTotals` can reread and recalculate a large amount of data
- tax flows can cascade through constructors, per-line tax logic, and totals recalculation
- calling totals/tax logic inside loops can easily become `O(n²)` behavior
- markup/charges can add hidden cost
- posting frameworks are order-sensitive

### Always be cautious around

- `PurchTotals`
- `SalesTotals`
- `Tax`
- `TaxPurch`
- `TaxSales`
- `PurchCalcTax_*`
- `SalesCalcTax_*`
- `SalesFormLetter*`
- `PurchFormLetter*`
- `InventMovement`
- number sequence logic
- inventory dimension logic

### High-risk suggestions to avoid casually

- putting custom logic directly into broad posting entry points
- moving posting order without understanding framework effects
- recalculating totals repeatedly inside line loops
- recalculating tax per line when one post-loop recalculation would do

---

## Framework-specific reminders

### RunBase / RunBaseBatch

Use standard construction and flow expectations:

- `construct()`
- `main()`
- `prompt()`
- `run()`
- `pack()` / `unpack()`

### FormLetter framework

Treat posting flow as fragile and sequence-sensitive.

Do not casually recommend direct changes to central posting sequence methods without strong evidence.

### Number sequences

Be careful with:

- allocation timing
- rollback gaps
- transaction scope
- concurrency side effects

### InventDim

Always respect the proper pattern:

- do not manually invent dimension persistence behavior
- use the framework pattern such as `InventDim::findOrCreate(...)` when applicable

---

## Safe customization discipline

### Minimal diff principle

Default to:

- smallest safe fix
- narrow scope
- low regression approach
- preserve signatures and calling behavior unless necessary

### High-regression areas

Treat the following as especially fragile:

- `modifiedField` on core tables
- `validateWrite`
- posting framework flow
- `initFrom*` sequences
- datasource `active()`
- tax/totals recalculation
- number sequence logic
- inventory / dimensions / reservations

### Fragile customization signals

Flag these clearly when present:

- hardcoded company/data area assumptions
- form logic used to enforce business rules
- UI-only logic relied on by batch/integration flows
- `info()` / `warning()` spam inside loops or batch processes
- unnecessary locks
- hidden rollback behavior
- duplicated logic across classes

---

## Investigation workflow

When investigating a problem, follow this order:

1. Understand what the artifact is
2. Understand what the code is trying to do
3. Trace the execution path
4. Identify hotspot, bug pattern, or broken assumption
5. Separate symptom from root cause
6. Propose the smallest safe fix
7. Explain risks
8. Define validation

When working from profiler or stack data:

1. find the dominant path
2. identify call count and repeated methods
3. locate the loop driving the cost
4. determine whether the work is loop-invariant
5. check client/server placement
6. check transaction scope

---

## Expected response structure

When analyzing code or proposing a change, structure the response like this whenever applicable:

1. **What the code is doing**
2. **What the problem is**
3. **Root cause**
4. **Safest fix**
5. **Risk / side effects**
6. **Validation steps**

When uncertainty exists, say so explicitly.

When multiple valid paths exist, prefer the one with the lowest regression risk unless the request explicitly asks for a broader redesign.

---

## Code change behavior

When asked to generate or modify code:

- keep the change minimal
- preserve surrounding behavior
- avoid unrelated cleanup
- respect existing formatting and comment style
- preserve existing project conventions
- do not silently remove logic
- do not alter localization/fiscal behavior unless explicitly requested

When replacing logic, explain:

- what changed
- why it changed
- what risk remains
- how to validate it

---

## Communication style for this repository

Responses should be:

- practical
- grounded
- specific
- explicit about tradeoffs
- clear about uncertainty
- useful for both technical review and implementation planning

Avoid:

- generic advice with no AX grounding
- modern-framework assumptions
- hand-wavy performance claims
- oversized refactors for localized issues

---

## Final rule

In this repository, correctness and low-regression behavior come first.

Prefer:

- confirmed understanding
- narrow changes
- explicit risk analysis
- validation steps

over:

- clever rewrites
- speculative redesign
- broad refactors without proof
