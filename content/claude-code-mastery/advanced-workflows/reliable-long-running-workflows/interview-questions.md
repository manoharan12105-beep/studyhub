# Long-Running Tasks, Failure Recovery and Workflow Quality — Interview Questions

## Beginner

### Q1. How do you keep a long AI-assisted task on track?

**Style:** How

<details>
<summary>Answer</summary>

Plan first and save the plan as a checklist file, work in small verified steps, commit after each one, and keep decisions in files rather than relying on the conversation. Compact with focus or clear and resume from the plan when context gets heavy.

</details>

## Intermediate

### Q2. What's the difference between Claude Code checkpoints and Git commits for recovery?

**Style:** Comparison

<details>
<summary>Answer</summary>

Checkpoints are automatic, session-local snapshots of edits made through Claude's file tools, restorable with `/rewind`; they don't cover Bash side effects, remote actions or some subagent edits and expire with session cleanup. Commits are durable, shareable, cover everything tracked, and support diff, revert and bisect.

</details>

### Q3. What do you do when an agent keeps making the same mistake?

**Style:** Scenario

<details>
<summary>Answer</summary>

Stop after a second failed correction, rewind or clear, and restart with a better prompt that includes the constraint or evidence it missed. Polluted context makes further corrections less effective.

</details>

## Advanced

### Q4. How would you measure whether a new AI workflow improved your team?

**Style:** Design

<details>
<summary>Answer</summary>

Pick outcome metrics — escaped defects, reverts and rework, review effort, validated finding rate, cost, lead time — establish a baseline on comparable work, change one thing at a time, and compare. Speed without quality evidence isn't improvement.

</details>

### Q5. Design recovery for an unattended overnight refactor.

**Style:** Design

<details>
<summary>Answer</summary>

Run it in a worktree or container on its own branch, with tight permissions, turn/budget limits and no deploy or push to protected branches. Require a plan file and a commit per verified step, a Stop hook or `/goal` that runs the build, and a morning review of the diff and test evidence. Recovery is reverting commits or discarding the branch — the main branch is never touched unattended.

</details>
