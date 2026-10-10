# Troubleshooting Commits and Branches — Practice

### P1. Wrong branch, not pushed

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** branch + reset

Two unpushed commits on `main` belong on a new branch `feature/report`. Your working tree is clean. Write the fix.

<details>
<summary>Answer</summary>

```bash
git branch feature/report
git reset --hard HEAD~2
git switch feature/report
```

</details>

### P2. Wrong branch, already pushed

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** shared history

The misplaced commit `dbd0ba4` was pushed to `main` and teammates pulled. What's appropriate on `main`?

- A) `git reset --hard HEAD~1` and `git push --force`
- B) `git revert dbd0ba4` and push, then cherry-pick `dbd0ba4` onto the feature branch
- C) Delete `main` and recreate it
- D) `git commit --amend`

<details>
<summary>Answer</summary>

**Answer:** B) `git revert dbd0ba4` and push, then cherry-pick `dbd0ba4` onto the feature branch

</details>

### P3. Remove a file from the last commit

**Difficulty:** Medium · **Type:** Command · **Concepts:** amend

Your last, unpushed commit accidentally includes `notes.txt`. Remove it from the commit but keep the file on disk.

<details>
<summary>Answer</summary>

```bash
git rm --cached notes.txt
git commit --amend --no-edit
```

(Add `notes.txt` to `.gitignore` if it should never be committed.)

</details>

### P4. Who am I?

**Difficulty:** Easy · **Type:** Command · **Concepts:** diagnosing identity

Commits show the wrong email. Which command tells you where the current `user.email` value comes from?

<details>
<summary>Answer</summary>

`git config --show-origin user.email`

</details>

### P5. Lost branch, no message

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** reflog, fsck

A week ago someone deleted the unpushed branch `spike/charts`. The terminal output is gone. How do you look for its commits?

<details>
<summary>Answer</summary>

`git reflog` (search for `spike/charts` in checkout entries or the commit messages you remember), then `git branch spike/charts <hash>`. If the reflog doesn't have it, `git fsck --unreachable --no-reflogs | grep commit` and inspect candidates with `git show`. This works only on the clone where the work existed, and only until garbage collection prunes it.

</details>
