# What Is Version Control? — Interview Questions

## Beginner

### Q1. What is version control?

**Style:** What

<details>
<summary>Answer</summary>

A system that records changes to files over time. Each recorded version stores the content plus metadata — author, timestamp, message and parent version — so you can inspect history, compare versions, restore earlier states and combine work from several people.

</details>

### Q2. Why not just keep copies of the project folder?

**Style:** Comparison

<details>
<summary>Answer</summary>

Copies don't record **why** something changed or **exactly what** changed, they duplicate everything, and combining two people's copies is manual and silently loses changes. A VCS records line-level differences you can query, messages and authors, and merges work with conflict detection.

</details>

## Intermediate

### Q3. Is a Git repository a backup?

**Style:** Trap

<details>
<summary>Answer</summary>

Not on its own. The history lives in the `.git` directory on the same disk as your files, so losing the disk loses both. It becomes a backup only when the history is also pushed to another machine, such as a GitHub repository — and even then, uncommitted or unpushed work is not protected.

</details>

### Q4. How does version control help when a bug appears after a release?

**Style:** Scenario

<details>
<summary>Answer</summary>

The release points to a known version, so you compare it with the last good release and narrow the bug to specific commits. Each commit has an author and a message explaining its intent. You can then undo one change (in Git, `git revert`) without discarding unrelated work, and the fix itself is recorded for the next release.

</details>
