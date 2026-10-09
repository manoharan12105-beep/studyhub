# Saving, Resuming and Organizing Sessions — Interview Questions

## Beginner

### Q1. How are Claude Code sessions saved?

**Style:** What

<details>
<summary>Answer</summary>

Continuously, as local JSONL transcripts under `~/.claude/projects/<project>/`, one per session, kept 30 days by default (`cleanupPeriodDays`). They hold messages, tool calls and results and power resume, branch and rewind.

</details>

### Q2. How do you resume a session?

**Style:** How

<details>
<summary>Answer</summary>

`claude -c` for the most recent in this directory, `claude -r` for the picker, `claude -r <name-or-id>` directly, or `/resume` inside a session. Name sessions with `-n` or `/rename` to make this easy.

</details>

## Intermediate

### Q3. What does resuming restore, and what doesn't it?

**Style:** What

<details>
<summary>Answer</summary>

It restores the conversation history, the model, a session agent, usually the permission mode (not bypass), and unexpired scheduled tasks. It doesn't restore launch flags such as `--add-dir`, `--mcp-config` or `--settings`, directories added with `/add-dir`, or background Bash commands. And it never restores files — only the conversation.

</details>

### Q4. When would you branch a session?

**Style:** Scenario

<details>
<summary>Answer</summary>

To try an alternative approach while keeping the current conversation intact — for example validating at the controller versus fixing in the calculator. `/branch name` copies the history into a new session ID; the original remains resumable. It is also the safe way to continue the same conversation in a second terminal.

</details>

## Advanced

### Q5. Compare session history, Git history and checkpoints.

**Style:** Comparison

<details>
<summary>Answer</summary>

Session history is the local conversation transcript (30-day default, not shared). Checkpoints are snapshots of files Claude edited with its file tools, for rewinding within a session. Git history is committed snapshots of the repository, permanent and shared. Only Git is version control; sessions and checkpoints are conveniences for the conversation and for quick undo.

</details>

### Q6. A script needs the result of a Claude Code run. Why not read the JSONL transcript?

**Style:** Why

<details>
<summary>Answer</summary>

The JSONL format is internal and can change on any release, so a parser can break silently. Use `claude -p --output-format json` (result, session ID, usage, cost), `stream-json` for events, `claude -p --resume <id>` for follow-ups, `/export` for human-readable text, or the Agent SDK.

</details>
