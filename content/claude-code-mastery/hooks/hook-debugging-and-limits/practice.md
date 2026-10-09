# Hook Debugging, Failure Handling and Limits — Practice

### P1. Is it registered?

**Difficulty:** Easy · **Type:** Command · **Concepts:** /hooks

What is the first command you run when a hook seems not to fire?

<details>
<summary>Answer</summary>

`/hooks` — it lists configured hooks grouped by event with their source. If the hook isn't there, the problem is configuration (file, JSON, location), not the script.

</details>

### P2. The moved script

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** non-blocking errors

After a refactor, the transcript shows `PreToolUse hook error … Failed with non-blocking status code: /bin/sh: …/protect-files.sh: No such file or directory`. Are edits still protected?

<details>
<summary>Answer</summary>

No. A hook that cannot start produces a non-blocking error and the action proceeds — the guard is silently disabled. Fix the path in settings; consider a CI check that runs every hook with recorded input so a broken path fails the build.

</details>

### P3. Timeout behaviour

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** timeouts

A PreToolUse guard calls a remote policy API that hangs; the hook hits its timeout. Is the tool call blocked?

<details>
<summary>Answer</summary>

No. Claude Code cancels a timed-out `command`, `http` or `mcp_tool` hook and discards its output; on PreToolUse the call continues through the normal permission flow. Keep guards fast and local, set a short `timeout`, and decide explicitly what to do when the dependency is unavailable (fail closed by exiting 2 yourself before the timeout).

</details>

### P4. Fail open or closed?

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** failure policy

Decide fail-open or fail-closed for: (a) a formatter hook when the formatter isn't installed; (b) a guard blocking edits to `infra/prod/**` when `jq` is missing; (c) a desktop notification hook when the notification command fails.

<details>
<summary>Answer</summary>

(a) Fail open — log and exit 0; don't block editing because formatting is unavailable.
(b) Fail closed — exit 2 with a clear message; a protection that silently disappears is dangerous.
(c) Fail open — a missing notification must not affect work.

</details>

### P5. Read the debug log

**Difficulty:** Medium · **Type:** Command · **Concepts:** debug logging

Start Claude Code so that the hook debug output goes to `/tmp/claude.log`, and follow it in another terminal.

<details>
<summary>Answer</summary>

```bash
claude --debug-file /tmp/claude.log
# in another terminal
tail -f /tmp/claude.log
```

Mid-session, `/debug` turns logging on and shows the log path.

</details>

### P6. Two rewriters

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** updatedInput

Two PreToolUse hooks both return `updatedInput` for Bash: one adds `-q` to Maven commands, the other wraps commands in `timeout 600`. Results are inconsistent. Why, and what's the fix?

<details>
<summary>Answer</summary>

Hooks run in parallel and, when several return `updatedInput`, the last one to finish wins — non-deterministic. Merge the rewrites into one hook (or keep only one hook that rewrites input) so the result is predictable.

</details>

### P7. Where hooks don't reach

**Difficulty:** Hard · **Type:** Security · **Concepts:** limits

List four situations in which your project's PreToolUse guard does not run or does not help, and the layer that covers each.

<details>
<summary>Answer</summary>

1. The developer pushes or edits outside Claude Code → server-side branch protection, CI, code review.
2. A session started with `--bare` or `disableAllHooks` → managed settings (`allowManagedHooksOnly`, managed hooks), CI.
3. Files changed through Bash rather than Edit/Write → a Bash guard, the sandbox, or a Stop hook that checks `git status`.
4. The command is spelled differently from the guard's patterns → deny rules, the sandbox, least-privilege credentials.

</details>
