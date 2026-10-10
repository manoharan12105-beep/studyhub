# Safe Recovery Workflows and Destructive Commands — Practice

### P1. Recoverable or not?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** risk classes

Which of these losses **cannot** be recovered with the reflog?

- A) A commit removed from the branch by `git reset --hard HEAD~1`
- B) A branch deleted with `git branch -D`
- C) Unstaged edits overwritten by `git restore App.java`
- D) The pre-rebase version of a branch

<details>
<summary>Answer</summary>

**Answer:** C) Unstaged edits overwritten by `git restore App.java`

They were never stored by Git. A, B and D were commits.

</details>

### P2. Dry run

**Difficulty:** Easy · **Type:** Command · **Concepts:** git clean

Show which untracked files and directories `git clean` would delete, without deleting anything.

<details>
<summary>Answer</summary>

`git clean -nd`

</details>

### P3. Least destructive

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** choosing an undo

For each goal, pick the least destructive command: (a) unstage `pom.xml`; (b) undo a pushed commit on `main`; (c) undo your last local commit but keep its changes; (d) publish your rebased PR branch.

<details>
<summary>Answer</summary>

(a) `git restore --staged pom.xml` (b) `git revert <hash>` (c) `git reset --soft HEAD~1` (d) `git push --force-with-lease`.

</details>

### P4. Read the dry run

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** -x

`git clean -ndx` lists `Would remove .env` among others. What does that tell you, and what should you run instead to delete only the `tmp/` folder?

<details>
<summary>Answer</summary>

`-x` includes ignored files, so your local `.env` (secrets, local config) would be deleted with no undo. Run `git clean -f -- tmp/` (after `git clean -n -- tmp/`).

</details>

### P5. Messy state routine

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** inspect, back up, act, verify

You're on `main` (should be on `feature/report`) with staged and unstaged edits and a new untracked file. Write the sequence of commands that moves all of it to `feature/report` safely.

<details>
<summary>Answer</summary>

```bash
git status                                  # inspect
git stash push -u -m "report work started on main"
git switch feature/report
git stash pop --index                       # restore, including staged state
git status                                  # verify
```

(If `feature/report` doesn't exist yet, `git switch -c feature/report` keeps the uncommitted changes without needing a stash at all.)

</details>
