# Git & GitHub Mastery Assessment — Practice

## Part A: Commands

### P1. Stage part of a file

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** add -p

Which command lets you stage only selected hunks of `App.java`?

- A) `git add -u App.java`
- B) `git add -p App.java`
- C) `git commit -a App.java`
- D) `git stash -p App.java`

<details>
<summary>Answer</summary>

**Answer:** B) `git add -p App.java`

</details>

### P2. Predict the status

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** status codes

You edit `README.md`, run `git add README.md`, then edit it again. What does `git status -s` show for it?

<details>
<summary>Answer</summary>

`MM README.md` — a staged version and a newer unstaged version.

</details>

### P3. Unstage

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** restore --staged

Which command unstages `pom.xml` and keeps your edits?

- A) `git restore pom.xml`
- B) `git reset --hard pom.xml`
- C) `git restore --staged pom.xml`
- D) `git rm pom.xml`

<details>
<summary>Answer</summary>

**Answer:** C) `git restore --staged pom.xml`

</details>

### P4. Fetch, then what?

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** fetch

After `git fetch`, `git status` says your branch "is behind 'origin/main' by 2 commits, and can be fast-forwarded". Which of your local things changed because of the fetch?

<details>
<summary>Answer</summary>

Only `origin/main` (and downloaded objects). Your `main`, index and files are unchanged until you merge, rebase or pull.

</details>

### P5. Undo a pushed commit

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** revert

Commit `a1b2c3d` on shared `main` must be undone. Which command?

- A) `git reset --hard a1b2c3d~1`
- B) `git revert a1b2c3d`
- C) `git commit --amend`
- D) `git rebase -i a1b2c3d~1`

<details>
<summary>Answer</summary>

**Answer:** B) `git revert a1b2c3d`

</details>

### P6. Show a file from the past

**Difficulty:** Easy · **Type:** Command · **Concepts:** show commit:path

Print `README.md` as it was in tag `v1.0.0`.

<details>
<summary>Answer</summary>

`git show v1.0.0:README.md`

</details>

### P7. Find when a call appeared

**Difficulty:** Medium · **Type:** Command · **Concepts:** pickaxe

Find the commit, on any branch, that first introduced `Math.round` into the code.

<details>
<summary>Answer</summary>

`git log --all --oneline -S "Math.round"` — the oldest listed commit introduced it.

</details>

### P8. Squash local commits

**Difficulty:** Medium · **Type:** Command · **Concepts:** reset --soft

Combine your last three unpushed commits into one commit "Add ClassReport".

<details>
<summary>Answer</summary>

```bash
git reset --soft HEAD~3
git commit -m "Add ClassReport"
```

(or `git rebase -i HEAD~3` with `fixup`/`squash`).

</details>

### P9. Publish a rebased branch

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** force-with-lease

You rebased your own pushed PR branch. Which push is appropriate?

- A) `git push`
- B) `git push --force`
- C) `git push --force-with-lease`
- D) `git pull` then `git push`

<details>
<summary>Answer</summary>

**Answer:** C) `git push --force-with-lease`

</details>

### P10. Separate folder for a hotfix

**Difficulty:** Medium · **Type:** Command · **Concepts:** worktree

Create `../hotfix` on a new branch `hotfix/1.0.1` from tag `v1.0.0` without touching your current working directory.

<details>
<summary>Answer</summary>

`git worktree add -b hotfix/1.0.1 ../hotfix v1.0.0`

</details>

## Part B: Concepts

### P11. What is a branch?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** refs

A Git branch is:

- A) A copy of the project folder
- B) A movable pointer to a commit
- C) A list of changed files
- D) A server-side permission

<details>
<summary>Answer</summary>

**Answer:** B) A movable pointer to a commit

</details>

### P12. Hash cascade

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** commit ids

Why does rewording a commit from last week change the ids of all later commits?

<details>
<summary>Answer</summary>

Each commit's id is a hash of its content including the parent's id. The reworded commit gets a new id, so its child's parent line changes, giving it a new id, and so on to the tip.

</details>

### P13. Names and contents

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** object model

Which object stores a file's name?

- A) blob
- B) tree
- C) commit
- D) the index only

<details>
<summary>Answer</summary>

**Answer:** B) tree

</details>

### P14. Merge base

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** three-way merge

What is the merge base, and why does a three-way merge need it?

<details>
<summary>Answer</summary>

The best common ancestor of the two branches. Comparing each side with it tells Git which side changed a line; without it, Git couldn't tell an addition on one side from a deletion on the other.

</details>

### P15. Fast-forward

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** merge types

`main` hasn't changed since `feature` branched. What does `git merge feature` on `main` do?

<details>
<summary>Answer</summary>

A fast-forward: `main` moves to `feature`'s tip; no merge commit.

</details>

### P16. Ours and theirs

**Difficulty:** Hard · **Type:** MCQ · **Concepts:** rebase conflicts

During `git rebase main` on your feature branch, `git checkout --theirs File.java` keeps:

- A) `main`'s version
- B) Your feature commit's version
- C) The merge base's version
- D) Nothing; it aborts the rebase

<details>
<summary>Answer</summary>

**Answer:** B) Your feature commit's version

In a rebase, "ours" is the new base and "theirs" is the commit being replayed.

</details>

### P17. Snapshots

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** storage

Git stores every commit as a full snapshot. Give two reasons repositories stay small.

<details>
<summary>Answer</summary>

Unchanged files and directories reuse the same blob and tree objects (content addressing), and objects are compressed — packfiles additionally store similar objects as small deltas.

</details>

### P18. Reflog scope

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** reflog

Which statement about the reflog is true?

- A) It is pushed with your branches
- B) It records where HEAD and branches pointed, in this clone only
- C) It stores uncommitted changes
- D) It never expires

<details>
<summary>Answer</summary>

**Answer:** B) It records where HEAD and branches pointed, in this clone only

</details>

## Part C: Troubleshooting

### P19. First move

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** diagnosis

Git "looks broken" after lunch. Name three read-only commands you run before anything else.

<details>
<summary>Answer</summary>

Any three of: `git status`, `git log --oneline --graph --decorate --branches --remotes`, `git branch -vv`, `git stash list`, `git reflog`, `git remote -v`.

</details>

### P20. Lost commits

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** reflog recovery

After `git reset --hard HEAD~2` (clean tree), recover the two commits.

<details>
<summary>Answer</summary>

`git reflog` to confirm, then `git reset --hard HEAD@{1}` (or `ORIG_HEAD`).

</details>

### P21. Wrong branch

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** moving commits

One unpushed commit on `main` belongs on new branch `fix/x`. Fix it.

<details>
<summary>Answer</summary>

```bash
git branch fix/x
git reset --hard HEAD~1
git switch fix/x
```

</details>

### P22. Rejected push

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** fetch first

`! [rejected] main -> main (fetch first)`. What's the safe sequence?

<details>
<summary>Answer</summary>

`git fetch`, inspect (`git log main..origin/main`), `git pull --rebase` (or merge), resolve and test, `git push`.

</details>

### P23. Secret pushed

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** incident response

A database password was pushed to a public repository. What is the first action, and why isn't deleting the file enough?

<details>
<summary>Answer</summary>

Rotate (change) the password immediately. Deleting the file only changes the latest snapshot; every earlier commit, clone and fork still contains it, and scanners may already have copied it.

</details>

### P24. Ignored file

**Difficulty:** Easy · **Type:** Command · **Concepts:** check-ignore

Show which rule ignores `src/main/resources/app.log.template`.

<details>
<summary>Answer</summary>

`git check-ignore -v src/main/resources/app.log.template`

</details>

### P25. Whole-file diff

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** line endings

`git diff --stat` shows every line of `App.java` changed, but `git diff -w` shows nothing. Diagnose and fix permanently.

<details>
<summary>Answer</summary>

Line endings (or whitespace) changed. Confirm with `git ls-files --eol`; add a `.gitattributes` such as `* text=auto eol=lf`, run `git add --renormalize .`, commit.

</details>

### P26. Force-push accident

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** remote-tracking reflog

A teammate force-pushed `main`. Your clone fetched before that. How do you find the lost tip?

<details>
<summary>Answer</summary>

`git reflog show origin/main` — or `git log -1 origin/main@{1}` — gives the commit `origin/main` pointed to before the forced update. Push it back with a lease, then enable branch protection.

</details>

## Part D: Team Workflows

### P27. Protect main

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** branch protection

What reliably stops broken code being pushed straight to `main`?

- A) A local `pre-push` hook
- B) A note in the README
- C) Branch protection requiring PRs and a passing CI check
- D) Using `--force-with-lease`

<details>
<summary>Answer</summary>

**Answer:** C) Branch protection requiring PRs and a passing CI check

</details>

### P28. Merge method

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** squash merge

A small PR has commits "wip", "fix", "review fixes". Which GitHub merge method suits a clean `main`, and what side effect should you know?

<details>
<summary>Answer</summary>

Squash and merge — one well-described commit on `main`. Side effect: Git won't consider the branch merged (`git branch -d` refuses); delete it with `-D` after confirming the PR merged.

</details>

### P29. Fork sync

**Difficulty:** Medium · **Type:** Command · **Concepts:** upstream

Bring your fork's `main` up to date with `upstream/main` and push it to your fork.

<details>
<summary>Answer</summary>

```bash
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main
```

</details>

### P30. Release

**Difficulty:** Medium · **Type:** Command · **Concepts:** annotated tags

Create and publish an annotated tag `v2.1.0` on the current commit.

<details>
<summary>Answer</summary>

```bash
git tag -a v2.1.0 -m "Release 2.1.0"
git push origin v2.1.0
```

</details>

### P31. Version number

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** semantic versioning

From `2.1.0`, you remove a public method. Next version?

- A) `2.1.1`
- B) `2.2.0`
- C) `3.0.0`
- D) `2.1.0-rc.1`

<details>
<summary>Answer</summary>

**Answer:** C) `3.0.0`

</details>

### P32. Workflow choice

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** workflows

A 6-person team deploys a Spring Boot service several times a day. Gitflow or trunk-based development? Justify briefly.

<details>
<summary>Answer</summary>

Trunk-based (or GitHub flow): short-lived branches merged into an always-releasable `main` daily, with CI, branch protection and feature flags. Gitflow's `develop`/`release` branches add delay and late integration that don't fit continuous deployment — though they suit scheduled, versioned releases.

</details>
