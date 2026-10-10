# git reset: Soft, Mixed and Hard — Practice

### P1. Where do the changes go?

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** reset modes

The last commit changed `App.java`. Your tree is clean. What does `git status -s` show after (a) `git reset --soft HEAD~1`, (b) `git reset HEAD~1`, (c) `git reset --hard HEAD~1`?

<details>
<summary>Answer</summary>

(a) `M  …/App.java` (staged) (b) ` M …/App.java` (unstaged) (c) nothing — the change is gone from the working directory (the commit is still in the reflog).

</details>

### P2. Default mode

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** default

`git reset HEAD~1` with no mode option uses:

- A) `--soft`
- B) `--mixed`
- C) `--hard`
- D) `--keep`

<details>
<summary>Answer</summary>

**Answer:** B) `--mixed`

</details>

### P3. Squash three commits

**Difficulty:** Medium · **Type:** Command · **Concepts:** soft reset

Combine your last three (unpushed) commits into one commit named "Add class report" without using interactive rebase.

<details>
<summary>Answer</summary>

```bash
git reset --soft HEAD~3
git commit -m "Add class report"
```

</details>

### P4. Undo the reset

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** reflog, ORIG_HEAD

You ran `git reset --hard HEAD~2` on a clean tree and immediately regret it. Restore the branch.

<details>
<summary>Answer</summary>

`git reset --hard ORIG_HEAD` (or find the previous tip in `git reflog` — the entry before `reset: moving to HEAD~2` — and `git reset --hard <hash>`).

</details>

### P5. What can't come back

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** limits of recovery

Before `git reset --hard HEAD~1`, you had an unstaged edit to `README.md` and an untracked `notes.txt`. After recovering the commit from the reflog, what is the state of each?

<details>
<summary>Answer</summary>

The commit is back. The unstaged `README.md` edit is permanently lost (never stored in Git). `notes.txt` was never touched — reset ignores untracked files.

</details>
