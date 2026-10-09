# Hook Configuration, Input and Output — Practice

### P1. Matcher case

**Difficulty:** Easy · **Type:** Debugging · **Concepts:** matchers

A `PostToolUse` hook with `"matcher": "edit"` never runs when Claude edits files. Why?

<details>
<summary>Answer</summary>

Matchers are case-sensitive and compare against the canonical tool name, `Edit`. Use `"Edit|Write"` to cover both editing tools.

</details>

### P2. Read the input

**Difficulty:** Easy · **Type:** Command · **Concepts:** hook input

Inside a `PreToolUse` hook for Bash, which `jq` expression extracts the command Claude wants to run?

<details>
<summary>Answer</summary>

```bash
input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
```

Read stdin once into a variable; `// empty` avoids the string `null` when the field is missing.

</details>

### P3. Ask instead of block

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** JSON output

Write the JSON a `PreToolUse` hook prints to force a permission prompt with the reason "Changing CI workflows requires review".

<details>
<summary>Answer</summary>

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "Changing CI workflows requires review"
  }
}
```

Exit 0. The fields must be nested inside `hookSpecificOutput`; at the top level they are silently ignored.

</details>

### P4. Exit code puzzle

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** exit codes and JSON

A PreToolUse hook prints `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}` and exits 2. What happens?

<details>
<summary>Answer</summary>

The tool call is **blocked**. Exit 2's block is the one outcome JSON can't override; Claude receives stderr (or the JSON reason) as feedback. Choose one approach per hook: exit 2 to block, or exit 0 with JSON.

</details>

### P5. Where does the stdout go?

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** SessionStart

A `SessionStart` hook prints three lines of plain text and exits 0. Where do they end up?

<details>
<summary>Answer</summary>

In Claude's context, as additional information at the start of the session (the same applies to `UserPromptSubmit`). For most other events, exit-0 stdout goes only to the debug log.

</details>

### P6. Filter with `if`

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** if field

You have a Bash `PreToolUse` hook that should only spawn for `git` commands. Write the handler.

<details>
<summary>Answer</summary>

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "if": "Bash(git *)",
      "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-git-policy.sh"
    }
  ]
}
```

`if` uses permission-rule syntax, works only on tool events, and is best-effort (when Claude Code can't tell what a command runs, the hook runs anyway).

</details>

### P7. Test before trusting

**Difficulty:** Medium · **Type:** Command · **Concepts:** testing hooks

Write a command that tests `.claude/hooks/block-dangerous-bash.sh` with a force-push and prints the exit code.

<details>
<summary>Answer</summary>

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"}}' | .claude/hooks/block-dangerous-bash.sh; echo "exit=$?"
```

That script answers with JSON (`permissionDecision: "deny"`) and exit 0 — check the JSON as well as the exit code.

</details>

### P8. Parallel hooks

**Difficulty:** Hard · **Type:** Output prediction · **Concepts:** combining results

Two PreToolUse hooks match a Bash call: one logs the command and exits 0; the other returns `permissionDecision: "ask"`. A third returns `"deny"`. What is the outcome, and does the log entry get written?

<details>
<summary>Answer</summary>

The call is **denied** — the most restrictive decision wins (`deny` > `defer` > `ask` > `allow`). The log entry is written: all matching hooks run to completion in parallel before results are combined, so one hook's deny doesn't stop the others' side effects.

</details>

### P9. Silent JSON failure

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** stdout pollution

Your hook's JSON deny works when you run it by hand but has no effect inside Claude Code on Windows. The debug log shows the output started with `Shell ready`. Explain and fix.

<details>
<summary>Answer</summary>

Shell-form hooks run through Git Bash on Windows, which can source your profile; an unconditional `echo "Shell ready"` in `~/.bashrc` was printed before the JSON, so the output no longer starts with `{` and is treated as plain text. Wrap profile output in an interactive check (`if [[ $- == *i* ]]; then … fi`) or use exec form (`args`) to avoid the shell.

</details>
