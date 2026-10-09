# Checkpoints, Recovery and Parallel Work with Worktrees — Practice

### P1. Open the rewind menu

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** /rewind

Which action opens the rewind menu?

- A) `Ctrl+Z`
- B) `/rewind`, or `Esc` twice when the prompt input is empty
- C) `git rewind`
- D) `/undo-all`

<details>
<summary>Answer</summary>

**Answer:** B) `/rewind`, or `Esc` twice when the prompt input is empty

If the input contains text, double `Esc` clears it instead. (`/checkpoint` and `/undo` are aliases of `/rewind`.)

</details>

### P2. What does rewind restore?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** checkpoint limits

Claude ran `rm src/main/java/com/example/orderdesk/order/OrderSearchDao.java` with Bash. Can `/rewind` → Restore code bring it back?

- A) Yes, always
- B) No, checkpoints only track changes made with Claude's file editing tools
- C) Only in auto mode
- D) Only if the file is under 1 MB

<details>
<summary>Answer</summary>

**Answer:** B) No, checkpoints only track changes made with Claude's file editing tools

Restore it with Git: `git restore src/main/java/com/example/orderdesk/order/OrderSearchDao.java` (it is tracked).

</details>

### P3. Keep the conversation, undo the code

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** rewind options

Claude's explanation of a bug was excellent but its fix was wrong. You want to keep the discussion and remove the edits. Which rewind option?

<details>
<summary>Answer</summary>

**Restore code** at the prompt before the edits — files revert, the conversation (including the good explanation) stays. *Restore conversation* would do the opposite; *Restore code and conversation* would lose the explanation.

</details>

### P4. Order the recovery

**Difficulty:** Medium · **Type:** Workflow design · **Concepts:** safe recovery

Order these steps after an unwanted multi-file change: run tests · `git stash push -u -m attempt` · press `Esc` · `git status` and `git diff --stat` · re-prompt with a better plan.

<details>
<summary>Answer</summary>

1. `Esc` (stop) → 2. `git status`, `git diff --stat` (look) → 3. `git stash push -u -m attempt` (save, which also returns to a clean tree) → 4. run tests (verify the known-good state) → 5. re-prompt with a better plan (learn).

</details>

### P5. The dangerous shortcut

**Difficulty:** Medium · **Type:** Security · **Concepts:** destructive git

A teammate says: "If Claude messes up, just run `git reset --hard && git clean -fd`." What can go wrong?

<details>
<summary>Answer</summary>

Both commands permanently discard uncommitted work — including your own unrelated edits and untracked files such as a new test you have not added yet. Look at `git status` first and stash (`git stash push -u`) anything you might need. Auto mode blocks these commands by default for exactly this reason.

</details>

### P6. Subagent edits

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** checkpoint limits

A background subagent refactored three files and you want them back. `/rewind` → Restore code does not revert them. Why, and what do you do?

<details>
<summary>Answer</summary>

Edits made by subagents (other than a foreground forked skill) are not captured in your session's checkpoints. Use Git: `git diff` to review, then `git restore <files>` or stash them.

</details>

### P7. Parallel sessions

**Difficulty:** Medium · **Type:** Command · **Concepts:** worktrees

Start two isolated Claude Code sessions on orderdesk: one for `bug-101`, one for `feat-7`.

<details>
<summary>Answer</summary>

In two terminals:

```bash
claude --worktree bug-101
claude --worktree feat-7
```

Each gets `.claude/worktrees/<name>/` on branch `worktree-<name>`. Build or install dependencies in each, because a worktree is a fresh checkout.

</details>

### P8. Pushed mistake

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** remote effects

A commit Claude prepared, which you pushed to the shared `main`, broke pricing. Teammates have already pulled. How do you undo it?

<details>
<summary>Answer</summary>

Create a revert commit — `git revert <sha>` — run the tests, and push it. Do not rewrite shared history with a force push; teammates' clones would diverge. Checkpoints and rewind cannot help: the change is remote. If the commit contained a secret, also revoke and rotate the secret.

</details>
