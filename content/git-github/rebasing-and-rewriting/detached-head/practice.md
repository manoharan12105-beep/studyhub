# Detached HEAD — Practice

### P1. Which command detaches?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** causes

Which command leaves you in detached HEAD?

- A) `git switch main`
- B) `git switch -c fix/x`
- C) `git checkout v1.0.0` (a tag)
- D) `git branch feature/x`

<details>
<summary>Answer</summary>

**Answer:** C) `git checkout v1.0.0` (a tag)

A tag isn't a branch, so HEAD points directly at the tagged commit.

</details>

### P2. Read the HEAD file

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** .git/HEAD

`.git/HEAD` contains `4b17431839600a5d1f32a771d395b173cd9377eb`. What state are you in, and what does `git branch` mark as current?

<details>
<summary>Answer</summary>

Detached HEAD; `git branch` shows `* (HEAD detached at 4b17431)`.

</details>

### P3. Rescue

**Difficulty:** Medium · **Type:** Command · **Concepts:** rescue commits

While detached you made two commits, then switched to `main`. Git printed `git branch <new-branch-name> 9c1e2f0`. Save the work on a branch called `spike/report-layout`.

<details>
<summary>Answer</summary>

`git branch spike/report-layout 9c1e2f0` — then `git switch spike/report-layout` to continue.

</details>

### P4. Rebase stop

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** expected detached states

During a rebase, `git status` says "interactive rebase in progress" and `git branch` shows `(no branch, rebasing feature/x)`. A teammate suggests `git switch -c rescue` to "fix" it. What should you do instead?

<details>
<summary>Answer</summary>

Nothing is broken: rebases work on a detached HEAD and update the branch at the end. Resolve the conflict and `git rebase --continue`, or `git rebase --abort` to go back.

</details>
