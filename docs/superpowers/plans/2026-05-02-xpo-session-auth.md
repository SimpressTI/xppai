# XPO Session Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `xppai xpo snapshot` the session-scoped authorization step for an XPO cache so later `xppai` invocations in the same Codex session can reuse that approval without re-prompting for the same cache.

**Architecture:** Add a tiny session authorization store keyed by cache fingerprint and cache directory. `snapshot` records the approval marker after it loads the active cache, and follow-up cache commands check the same marker before prompting again. `cache-copy` remains interactive only when the destination is non-empty; source-cache authorization should be reused when the fingerprint matches.

**Tech Stack:** Node.js, CommonJS modules, existing xpo CLI helpers, `node:test`, markdown docs.

---

### Task 1: Add session authorization storage and record it from snapshot

**Files:**
- Create: `src/commands/xpo/session-auth.js`
- Create: `src/commands/xpo/snapshot.js`
- Modify: `src/commands/xpo/index.js`
- Modify: `src/commands/xpo/query-store.js`
- Test: `test/xpo/session-auth.test.js`
- Test: `test/xpo/snapshot.test.js`

- [ ] **Step 1: Write the failing tests**

```js
test('snapshot writes a session auth record for the loaded cache fingerprint', () => {
  const tempRoot = mkdtemp('xppai-session-auth-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const xpoFile = path.join(tempRoot, 'sample.xpo');
  fs.writeFileSync(xpoFile, xpoLoadSampleFragment(), 'utf8');

  runCli(['xpo', 'load', xpoFile, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  runCli(['xpo', 'snapshot', '--cache-dir', cacheDir, '--json'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  const index = JSON.parse(fs.readFileSync(path.join(cacheDir, 'index.json'), 'utf8'));
  const authPath = path.join(tempLocal, 'xppai', 'cache', 'xpo-session-auth.json');
  const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));

  assert.equal(auth.cacheFingerprint, index.files[0].fileHash);
  assert.equal(auth.cacheDir, path.resolve(cacheDir));
  assert.ok(auth.approvedAt, 'approvedAt must be recorded');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test test/xpo/session-auth.test.js test/xpo/snapshot.test.js
```

Expected: fail because the session auth store does not exist yet and snapshot does not record approval.

- [ ] **Step 3: Implement the minimal session store**

```js
'use strict';

const fs = require('fs');
const path = require('path');
const { localAppDataDir } = require('../../config/user-config');

function authPath() {
  return path.join(localAppDataDir(), 'xppai', 'cache', 'xpo-session-auth.json');
}

function readAuth() {
  const file = authPath();
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeAuth(payload) {
  const file = authPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

module.exports = { readAuth, writeAuth };
```

Snapshot should call `writeAuth()` after it successfully resolves the cache fingerprint from `index.files[0].fileHash`.

- [ ] **Step 4: Run the targeted test again and then the full test suite**

Run:

```bash
node --test test/xpo/session-auth.test.js test/xpo/snapshot.test.js
npm test
```

Expected: session-auth tests pass after the helper and snapshot hook are implemented; the full suite remains green.

- [ ] **Step 5: Commit the session store and snapshot hook**

Run:

```bash
git add src/commands/xpo/session-auth.js src/commands/xpo/snapshot.js src/commands/xpo/index.js src/commands/xpo/query-store.js test/xpo/session-auth.test.js test/xpo/snapshot.test.js
git commit -m "feat(xpo): persist snapshot session auth"
```

### Task 2: Reuse session authorization in cache commands and keep destination prompts

**Files:**
- Modify: `src/commands/xpo/read.js`
- Modify: `src/commands/xpo/grep.js`
- Modify: `src/commands/xpo/cache-copy.js`
- Modify: `src/commands/xpo/snapshot.js`
- Test: `test/xpo/cache-copy.test.js`
- Test: `test/xpo/query.test.js`

- [ ] **Step 1: Write the failing behavior tests**

```js
test('cache-copy still prompts only for a non-empty destination', async () => {
  const tempRoot = mkdtemp('xppai-session-auth-');
  const tempLocal = path.join(tempRoot, 'local');
  const cacheDir = path.join(tempRoot, 'cache');
  const source = path.join(tempRoot, 'sample.xpo');
  const dest = path.join(tempRoot, 'dest');
  fs.writeFileSync(source, classesVersion1(), 'utf8');

  runCli(['xpo', 'load', source, '--cache-dir', cacheDir], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });
  runCli(['xpo', 'snapshot', '--cache-dir', cacheDir, '--json'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, 'keep.txt'), 'keep', 'utf8');

  const out = runCli(['xpo', 'cache-copy', dest, '--cache-dir', cacheDir, '--yes'], {
    env: { ...process.env, LOCALAPPDATA: tempLocal },
  });

  assert.match(out, /copied xpo cache from/);
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run:

```bash
node --test test/xpo/cache-copy.test.js test/xpo/query.test.js
```

Expected: the tests fail until `read`, `grep`, and `cache-copy` consult session auth before prompting.

- [ ] **Step 3: Implement fingerprint checks and destination-only prompting**

Implement the same-session check in the command layer:

- `read` and `grep` should resolve the active cache fingerprint from `index.json`, read the session auth record, and continue without reauthorization when `auth.cacheFingerprint` matches the active cache fingerprint.
- `cache-copy` should do the same source-cache check before it evaluates the destination directory, then keep the current non-empty destination confirmation flow unchanged.
- `snapshot` should refresh the session auth record each time a cache is explicitly loaded or reloaded so later invocations reuse the latest fingerprint.

- [ ] **Step 4: Re-run the targeted tests and full suite**

Run:

```bash
node --test test/xpo/cache-copy.test.js test/xpo/query.test.js
npm test
```

Expected: all tests pass, and `cache-copy` only asks about non-empty destinations.

- [ ] **Step 5: Commit the command reuse work**

Run:

```bash
git add src/commands/xpo/read.js src/commands/xpo/grep.js src/commands/xpo/cache-copy.js src/commands/xpo/snapshot.js test/xpo/cache-copy.test.js test/xpo/query.test.js
git commit -m "feat(xpo): reuse session auth across commands"
```

### Task 3: Update docs and skill guidance for session-scoped approval reuse

**Files:**
- Modify: `docs/cli.md`
- Modify: `docs/xpo-cache.md`
- Modify: `docs/skills.md`
- Modify: `assets/skills/xppai-init/SKILL.md`
- Modify: `assets/skills/xppai-papai/SKILL.md`
- Modify: `assets/skills/xppai-babysit/SKILL.md`
- Modify: `assets/skills/xppai-help/SKILL.md`
- Modify: `src/targets/copilot.js`
- Create: `test/docs/session-auth-docs.test.js`

- [ ] **Step 1: Write the failing documentation assertions**

```js
test('docs and skill guidance mention session-scoped snapshot auth reuse', () => {
  const skills = readFileSync(path.join(ROOT, 'docs', 'skills.md'), 'utf8');
  const cli = readFileSync(path.join(ROOT, 'docs', 'cli.md'), 'utf8');
  const papai = readFileSync(path.join(ROOT, 'assets', 'skills', 'xppai-papai', 'SKILL.md'), 'utf8');

  assert.match(skills, /snapshot --json/);
  assert.match(skills, /same Codex session/);
  assert.match(cli, /xppai xpo snapshot/);
  assert.match(papai, /snapshot --json/);
});
```

- [ ] **Step 2: Run the docs test to verify it fails**

Run:

```bash
node --test test/docs/session-auth-docs.test.js
```

Expected: fail until docs and exports mention snapshot-backed session auth reuse.

- [ ] **Step 3: Update the wording**

```md
- `xppai xpo snapshot` approves the active cache fingerprint for the current Codex session.
- Later `xppai` invocations in the same session reuse that approval for the same cache fingerprint.
- `cache-copy` still prompts only when the destination directory is non-empty.
```

- [ ] **Step 4: Re-run docs/skill tests**

Run:

```bash
node --test test/docs/session-auth-docs.test.js test/skills/xpo-intake-contract.test.js test/targets/copilot-export.test.js
```

Expected: pass after the session-scoped wording is in place.

- [ ] **Step 5: Commit the docs update**

Run:

```bash
git add docs/cli.md docs/xpo-cache.md docs/skills.md assets/skills/xppai-init/SKILL.md assets/skills/xppai-papai/SKILL.md assets/skills/xppai-babysit/SKILL.md assets/skills/xppai-help/SKILL.md src/targets/copilot.js
git commit -m "docs: describe xpo session auth reuse"
```

### Task 4: Final verification and version bump

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Run the full test suite**

Run:

```bash
npm test
```

Expected: all tests pass with session-scoped auth reuse and destination-only prompts.

- [ ] **Step 2: Bump the patch version**

Run:

```bash
npm version patch --no-git-tag-version
```

Expected: `package.json` and `package-lock.json` update to the next patch version.

- [ ] **Step 3: Commit the release bump**

Run:

```bash
git add package.json package-lock.json
git commit -m "chore: bump version after xpo session auth update"
```
