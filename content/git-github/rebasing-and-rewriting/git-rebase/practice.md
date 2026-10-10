# git rebase and Rebase vs Merge — Practice

### P1. After the rebase

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** new commits

After `git rebase main` on a feature branch with three commits, what is true of those three commits?

- A) They keep their hashes and gain a new parent
- B) They are replaced by three new commits with new hashes
- C) They are merged into one commit
- D) They are moved to `main`

<details>
<summary>Answer</summary>

**Answer:** B) They are replaced by three new commits with new hashes

A commit's hash includes its parent, so a new parent means a new commit.

</details>

### P2. Draw the result

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** rebase shape

```text
* M2 (main)
* M1
| * F2 (HEAD -> feature)
| * F1
|/
* A
```

Draw the graph after `git rebase main`.

<details>
<summary>Answer</summary>

```text
* F2' (HEAD -> feature)
* F1'
* M2 (main)
* M1
* A
```

`F1'` and `F2'` are new commits; `F1`/`F2` still exist but are unreachable except via the reflog/`ORIG_HEAD`.

</details>

### P3. Keep my version

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** ours/theirs swap

During `git rebase main`, `GradeCalculator.java` conflicts. You want the version from **your feature commit**. Which option do you pass to `git checkout`, and why is it counter-intuitive?

<details>
<summary>Answer</summary>

`git checkout --theirs GradeCalculator.java`. In a rebase, HEAD is the new base (`main` plus already replayed commits) — "ours" — and the commit being replayed is "theirs".

</details>

### P4. Choose merge or rebase

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** golden rule

For each, choose merge or rebase: (a) updating your unpushed local feature branch with `main`; (b) updating `release/2.0`, which four developers push to; (c) cleaning up your own pull-request branch that nobody else has checked out.

<details>
<summary>Answer</summary>

(a) Rebase — private, linear result. (b) Merge — shared branch; never rewrite it. (c) Rebase (often interactive), then `git push --force-with-lease`.

</details>

### P5. Undo the rebase

**Difficulty:** Hard · **Type:** Command · **Concepts:** ORIG_HEAD

You just finished a rebase and realise you rebased onto the wrong branch. Your working tree is clean. Undo it with one command.

<details>
<summary>Answer</summary>

`git reset --hard ORIG_HEAD` — rebase records the pre-rebase tip in `ORIG_HEAD`. (If other commands have run since, find the tip in `git reflog` instead.)

</details>
