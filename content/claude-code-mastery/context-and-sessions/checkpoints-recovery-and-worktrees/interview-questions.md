# Checkpoints, Recovery and Parallel Work with Worktrees — Interview Questions

## Beginner

### Q1. What is a checkpoint in Claude Code?

**Style:** What

<details>
<summary>Answer</summary>

A snapshot of files Claude edits, taken at each prompt that starts a turn. `/rewind` (or `Esc` twice) lets you restore code, conversation or both to an earlier prompt, or summarize part of the conversation. Checkpoints are saved with the session, so they survive a resume.

</details>

### Q2. Can checkpoints replace Git?

**Style:** Misconception

<details>
<summary>Answer</summary>

No. They only cover edits made with Claude's file tools in the current session, for a limited retention period. They miss Bash-made changes, most subagent edits, external edits and all remote effects, and they are not shared. Git provides permanent, shared history.

</details>

## Intermediate

### Q3. Walk through recovering from a bad multi-file change.

**Style:** How

<details>
<summary>Answer</summary>

Stop Claude with `Esc`. Inspect with `git status` and `git diff`. Save everything with `git stash push -u` (or commit to a rescue branch). Use `/rewind` for file-tool edits and Git for shell or subagent changes. Run the tests to confirm the known-good state. Then re-prompt with a clearer plan, ideally in plan mode.

</details>

### Q4. What are git worktrees and why use them with Claude Code?

**Style:** Why

<details>
<summary>Answer</summary>

A worktree is an extra working directory of the same repository on its own branch. Two sessions in one directory would overwrite each other's edits; `claude --worktree name` gives each session its own checkout under `.claude/worktrees/<name>/`. Subagents can also run with `isolation: worktree`.

</details>

## Advanced

### Q5. Which changes can no local undo reverse, and how do you guard against them?

**Style:** Security

<details>
<summary>Answer</summary>

Remote effects: database migrations on shared environments, deployments, pushed commits, published packages, sent messages, leaked secrets. They must be prevented: ask or deny rules for those commands, hooks, human approval gates in CI, and least-privilege credentials. A leaked secret needs revocation and rotation, not just history rewriting.

</details>

### Q6. Claude Code's checkpoints and your IDE's local history both exist. What is your recovery hierarchy?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Fastest and narrowest first: `/rewind` for Claude's recent file-tool edits; IDE local history for individual files changed outside Claude; Git (stash, restore, revert) for everything tracked and for anything shared. Before discarding, always save the current state, because you may need part of the "bad" attempt.

</details>
