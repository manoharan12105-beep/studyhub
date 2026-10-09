# Guardrail, Automation and Session Hooks — Practice

### P1. New vs existing migration

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** PreToolUse guard

With `protect-files.sh` installed, Claude writes a **new** file `V2__add_paid_at.sql`, then tries to edit `V1__create_orders.sql`. What happens to each?

<details>
<summary>Answer</summary>

The new V2 file passes the guard (exit 0) — it goes through the normal permission flow (and the ask rule on migration edits). The V1 edit is blocked with exit 2 and the message that existing migrations must never change; Claude reads the reason and can adjust.

</details>

### P2. Fail closed

**Difficulty:** Easy · **Type:** Security · **Concepts:** fail-closed guards

Why does each guard script begin with `command -v jq >/dev/null || { …; exit 2; }`?

<details>
<summary>Answer</summary>

Without it, a missing `jq` makes the extraction fail, the variable is empty and the script exits 0 — the guard silently allows everything (this happened in testing). A guard that can't run should block, so the failure is visible.

</details>

### P3. What the guard misses

**Difficulty:** Medium · **Type:** Security · **Concepts:** text matching

`block-dangerous-bash.sh` denies `git push --force`. Give commands with the same effect that it does not catch, and the controls that cover them.

<details>
<summary>Answer</summary>

All three were tested against the script and none was caught: `git -C . push --force`, `git push origin +main` (a `+` refspec forces the update) and `bash push.sh` (a script containing the force push). (`git push --force-with-lease` *is* caught because the text contains `--force`.)

Coverage: server-side branch protection that rejects force pushes to protected branches, deny rules for the common spellings, and reviewing any script Claude creates before it runs.

</details>

### P4. Register the hooks

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** settings

Write the `PostToolUse` entry that runs `check-java-file.sh` after edits and writes.

<details>
<summary>Answer</summary>

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-java-file.sh" }
        ]
      }
    ]
  }
}
```

</details>

### P5. Feedback, not prevention

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** PostToolUse

A teammate wants `check-java-file.sh` to *prevent* tabs from ever being written. Can a PostToolUse hook do that? What could?

<details>
<summary>Answer</summary>

No — PostToolUse runs after the edit; it can only report (exit 2 shows stderr to Claude). Prevention would need a PreToolUse hook that inspects `tool_input.new_string` / `content` for tabs and blocks — at the cost of more complex parsing. Usually feedback after the fact is enough: Claude fixes the file in its next step.

</details>

### P6. Compaction-proof context

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** SessionStart matcher

Your SessionStart reminder appears at startup but not after `/compact`. Fix the configuration.

<details>
<summary>Answer</summary>

Include `compact` in the matcher: `"matcher": "startup|resume|compact"` (or leave the matcher empty to run for every source, including `clear` and `fork`). SessionStart hooks matching `compact` run after compaction and their output is added to the compacted context.

</details>

### P7. Personal or project?

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** hook location

Where should each hook live: (a) the Windows message-box notification; (b) the migration guard; (c) a hook that logs your Bash commands to `~/claude-commands.log`?

<details>
<summary>Answer</summary>

(a) `~/.claude/settings.json` — personal desktop preference.
(b) `.claude/settings.json` in the repository — a team rule.
(c) `~/.claude/settings.json` (or `.claude/settings.local.json`) — personal logging that writes to your home directory.

</details>

### P8. The runaway Stop hook

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** Stop hooks

A Stop hook runs `./mvnw -q test` and exits 2 when tests fail, so Claude keeps working. Sometimes the session ends with a warning that the Stop hook blocked too many consecutive times. Why, and how do you improve the hook?

<details>
<summary>Answer</summary>

When tests cannot be fixed (or Claude makes no tool calls between stops), the hook blocks every stop; Claude Code overrides it after eight consecutive blocks. Improve it by reading `stop_hook_active` from the input and allowing the stop when a continuation is already in progress, limiting the check to relevant changes, and reporting the failing tests clearly so a human can step in.

</details>
