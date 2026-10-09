# Long-Running Tasks, Failure Recovery and Workflow Quality — Practice

### P1. Durable state

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** state outside the chat

Where should the plan for a two-day task live?

- A) Only in the conversation
- B) In a plan file on the branch, with progress tracked as a checklist
- C) In Claude's auto memory
- D) In the PR title

<details>
<summary>Answer</summary>

**Answer:** B) In a plan file on the branch, with progress tracked as a checklist

It survives `/clear`, compaction and new sessions, and reviewers can see it.

</details>

### P2. Pick the recovery

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** recovery tools

Match: (a) Claude's last two edits went the wrong way; (b) a Bash command dropped your local test table; (c) the build broke somewhere in 15 commits.

<details>
<summary>Answer</summary>

(a) `/rewind` to the checkpoint before them. (b) Recreate it yourself (rerun migrations or setup) — checkpoints don't track Bash side effects. (c) `git bisect run` with the failing test.

</details>

### P3. Before a destructive command

**Difficulty:** Medium · **Type:** Security · **Concepts:** destructive Git

Claude suggests `git reset --hard origin/main` to "start clean". What do you check and do first?

<details>
<summary>Answer</summary>

Run `git status` and `git log origin/main..HEAD` to see uncommitted changes and unpushed commits; stash or branch anything you might need (`git stash push -m …`, `git branch backup/feat-7`). Only then reset — or prefer a new branch from `origin/main`, which discards nothing.

</details>

### P4. Two failed corrections

**Difficulty:** Medium · **Type:** Workflow design · **Concepts:** context pollution

You've corrected Claude twice on the same mistake and it's still wrong. What now?

<details>
<summary>Answer</summary>

Stop correcting. `/clear` (or `/rewind` to before the wrong approach) and write a better initial prompt that includes what you learned — constraints, the failing test, the file to change. The failed attempts in context keep pulling it back.

</details>

### P5. Define done

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** /goal

Write a `/goal` condition for FEAT-7 that a check can verify.

<details>
<summary>Answer</summary>

```text
/goal ./mvnw -B verify passes, OrderControllerTest has a test for each FEAT-7 acceptance criterion, and every item in docs/plans/feat-7.md is checked
```

Conditions should be checkable facts, not "the feature is good".

</details>

### P6. Measure the change

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** workflow metrics

After adding reviewer subagents, PRs merge 20 % faster. Is the workflow better? What else do you check?

<details>
<summary>Answer</summary>

Not necessarily — faster could mean less careful review. Check escaped defects and reverts, rework in follow-up PRs, validated vs rejected AI findings, reviewer time, and token/CI cost, compared with a baseline of similar PRs. Keep the change if quality held or improved.

</details>

### P7. Resume plan

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** resuming work

Your laptop restarted mid-task. The session is gone from memory, but the branch exists. How do you resume reliably?

<details>
<summary>Answer</summary>

`git status` and `git log --oneline main..HEAD` for what's done; read the plan file for the next unchecked item; run the full build to see the current state; optionally `claude --resume` to reopen the conversation. Then continue from the plan — the files and commits are the source of truth, not the old chat.

</details>
