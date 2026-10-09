# Saving, Resuming and Organizing Sessions — Practice

### P1. Continue yesterday's work

**Difficulty:** Easy · **Type:** Command · **Concepts:** --continue

Which command reopens the most recent conversation in the current directory?

<details>
<summary>Answer</summary>

`claude --continue` (short: `claude -c`).

</details>

### P2. Name at startup

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** session names

Which command starts a session named `FEAT-7-implement`?

- A) `claude --resume FEAT-7-implement`
- B) `claude -n FEAT-7-implement`
- C) `claude --session FEAT-7-implement`
- D) `/name FEAT-7-implement`

<details>
<summary>Answer</summary>

**Answer:** B) `claude -n FEAT-7-implement`

`-n` / `--name` sets the display name at startup; `/rename` does it during a session. `--resume` resumes an existing session.

</details>

### P3. Missing from the picker

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** -p sessions

A nightly script runs `claude -p "summarize open TODOs"`. Next morning `claude --continue` opens a different conversation. Why, and how do you reach the script's session?

<details>
<summary>Answer</summary>

Sessions created with `claude -p` are excluded from the picker and from `claude --continue`. Resume it by ID: capture the session ID from `--output-format json` in the script, then `claude --resume <session-id>`.

</details>

### P4. Lost directory

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** what resume restores

Yesterday you started `claude --add-dir ../shared-lib`. Today, after `claude -r`, Claude says it cannot read `../shared-lib`. Explain.

<details>
<summary>Answer</summary>

Resuming restores the conversation, model and (usually) the permission mode, but not launch flags like `--add-dir`, `--mcp-config` or `--settings`. Run `claude -r <name> --add-dir ../shared-lib`.

</details>

### P5. Try another approach

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** /branch

You have a working fix in session `BUG-101`. You want to try a completely different fix without losing the first conversation. What do you do?

<details>
<summary>Answer</summary>

`/branch BUG-101-alternative` (or `claude --continue --fork-session` from the shell). The branch copies the history into a new session and switches to it; the original stays intact and resumable. Keep the two code attempts apart too — separate Git branches or a worktree.

</details>

### P6. Sessions are not backups

**Difficulty:** Medium · **Type:** Misconception · **Concepts:** session vs Git

"I don't need to commit; I can always resume the session." What is wrong?

<details>
<summary>Answer</summary>

A session restores the conversation, not your files. Files on disk are whatever they currently are; if you deleted, reset or overwrote them, the transcript will not bring them back (checkpoints cover only Claude's file-tool edits, for a limited time). Transcripts also expire after 30 days by default and are not shared with your team. Commit work on a branch.

</details>

### P7. Two terminals

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** concurrent resume

You run `claude -r api-work` in two terminals and type in both. What happens to the transcript, and what should you have done?

<details>
<summary>Answer</summary>

Messages from both terminals interleave into one transcript, which makes the history confusing for you and for Claude. Fork one of them (`--fork-session` or `/branch`) so each terminal has its own session.

</details>

### P8. Scripted summary

**Difficulty:** Hard · **Type:** Command · **Concepts:** export, scripting

Write a command that asks an existing session (ID in `$SID`) for a summary of what changed and prints only the text.

<details>
<summary>Answer</summary>

```bash
claude -p --resume "$SID" --output-format json "summarize what we changed" | jq -r '.result'
```

Use the structured output instead of parsing the internal JSONL transcript, whose format can change between versions.

</details>
