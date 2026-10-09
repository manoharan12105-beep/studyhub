# Claude Code and Git: Branches, Changes and Permissions — Interview Questions

## Beginner

### Q1. What does Claude Code know about your Git repository?

**Style:** What

<details>
<summary>Answer</summary>

A snapshot taken when the conversation starts — current branch, main branch, `git status` output, recent commits — plus built-in instructions for commits and PRs. Anything more current comes from Git commands it runs. `includeGitInstructions: false` removes both built-in parts.

</details>

### Q2. Why review `git diff` before committing AI changes?

**Style:** Why

<details>
<summary>Answer</summary>

The diff is the ground truth of what changed. It reveals scope creep, weakened tests, debug code, generated files and secrets that a summary or commit message won't mention.

</details>

## Intermediate

### Q3. How would you configure Git permissions for a team project?

**Style:** How

<details>
<summary>Answer</summary>

Read-only Git already runs without prompts. Add `ask` for `git commit *` and `git push *`, `deny` for force pushes and destructive resets, avoid broad allows like `Bash(git *)`, and rely on server-side branch protection and required reviews because command-text rules don't cover every spelling.

</details>

## Advanced

### Q4. Why are deny rules on `git push` not a security boundary?

**Style:** Security

<details>
<summary>Answer</summary>

Bash rules match the command text after splitting compound commands and stripping wrappers. Other spellings — `git -C . push`, `git 'push'`, a script that pushes — don't match. The permissions documentation says such rules cover the usual invocation, not the program. Real enforcement is on the server (branch protection, required reviews), with sandboxing or hooks as extra layers.

</details>

### Q5. Describe a Git workflow that keeps AI-assisted changes reviewable.

**Style:** Design

<details>
<summary>Answer</summary>

One branch per task from a clean tree; small steps with the diff reviewed after each; tests run with output shown; selective staging and `git diff --cached`; human-written or human-approved commit messages that state verification; push and PR only after review; CI and required approvals on the server. Checkpoints help undo within a session, Git is the durable record.

</details>
