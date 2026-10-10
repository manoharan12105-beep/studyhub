# git push and Upstream Tracking — Practice

### P1. No upstream

**Difficulty:** Easy · **Type:** Troubleshooting · **Concepts:** set-upstream

`git push` on a new branch says "The current branch fix/rounding has no upstream branch." Write the command that pushes it and sets the upstream.

<details>
<summary>Answer</summary>

`git push -u origin fix/rounding`

</details>

### P2. Read -vv

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** branch -vv

```text
* main 6fdbeb1 [origin/main: ahead 1, behind 1] Add release notes file
```

What does this mean, and will a plain `git push` succeed?

<details>
<summary>Answer</summary>

Local `main` has 1 commit not on `origin/main`, and `origin/main` has 1 commit not on local `main` — diverged. A plain push is rejected (non-fast-forward); integrate first (`git pull --rebase` or merge), then push.

</details>

### P3. Clean up after merge

**Difficulty:** Medium · **Type:** Command · **Concepts:** delete and prune

Your PR from `feature/class-report` was merged. Delete the remote branch, then (as a teammate) remove the stale remote-tracking branch.

<details>
<summary>Answer</summary>

```bash
git push origin --delete feature/class-report   # you
git fetch --prune                               # teammate
```

</details>

### P4. Release tag

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** pushing tags

You created annotated tag `v1.0.0` and ran `git push`. Teammates don't see the tag. Why?

- A) Annotated tags can't be pushed
- B) `git push` doesn't push tags by default
- C) Tags are pushed only by `git fetch`
- D) The tag must be on a branch named `release`

<details>
<summary>Answer</summary>

**Answer:** B) `git push` doesn't push tags by default

Run `git push origin v1.0.0` (or `--follow-tags`).

</details>

### P5. Wrong upstream

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** set-upstream-to

`git branch -vv` shows `* feature/report 1a2b3c4 [origin/main: ahead 3]`. What's wrong and how do you fix it?

<details>
<summary>Answer</summary>

`feature/report` tracks `origin/main`, so `git pull` would merge `main` and `git push` may try to update the wrong remote branch (or be refused with the default `push.default=simple` because the names differ). Push it to its own remote branch and set the upstream: `git push -u origin feature/report` (or, if that branch already exists, `git branch --set-upstream-to=origin/feature/report`).

</details>
