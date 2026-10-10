# Twenty-Minute Command Drills

Say or type the command before opening the answer. Aim for about 30 seconds each.

## Round 1: Everyday (5 min)

**1.** Stage only part of `GradeCalculator.java`.

<details>
<summary>Answer</summary>

`git add -p src/main/java/com/example/gradebook/GradeCalculator.java`

</details>

**2.** See exactly what your next commit will contain.

<details>
<summary>Answer</summary>

`git diff --staged`

</details>

**3.** Unstage `pom.xml` but keep the edit.

<details>
<summary>Answer</summary>

`git restore --staged pom.xml`

</details>

**4.** Fix the message of your last, unpushed commit.

<details>
<summary>Answer</summary>

`git commit --amend -m "New message"`

</details>

**5.** Stop tracking `.env` without deleting it.

<details>
<summary>Answer</summary>

`git rm --cached .env`, add `.env` to `.gitignore`, commit (and rotate anything secret it contained).

</details>

**6.** Show one line per commit for every branch as a graph.

<details>
<summary>Answer</summary>

`git log --oneline --graph --decorate --all`

</details>

## Round 2: Branching and Integration (5 min)

**7.** Create `fix/rounding` from `main` and switch to it, from anywhere.

<details>
<summary>Answer</summary>

`git switch -c fix/rounding main`

</details>

**8.** Merge `feature/x` only if it can be fast-forwarded.

<details>
<summary>Answer</summary>

`git merge --ff-only feature/x`

</details>

**9.** You're mid-merge with conflicts and want out.

<details>
<summary>Answer</summary>

`git merge --abort`

</details>

**10.** Replay your feature branch on the latest `main`.

<details>
<summary>Answer</summary>

`git switch feature/x && git rebase main` (resolve, `git add`, `git rebase --continue`).

</details>

**11.** Squash your last three unpushed commits into one.

<details>
<summary>Answer</summary>

`git reset --soft HEAD~3 && git commit -m "…"` (or `git rebase -i HEAD~3` with `fixup`).

</details>

**12.** Copy commit `a9f609c` to `release/1.0` and record its origin.

<details>
<summary>Answer</summary>

`git switch release/1.0 && git cherry-pick -x a9f609c`

</details>

## Round 3: Remotes (4 min)

**13.** List the commits on `origin/main` that you don't have yet — without changing your branch.

<details>
<summary>Answer</summary>

`git fetch && git log --oneline main..origin/main`

</details>

**14.** First push of `feature/report`, setting the upstream.

<details>
<summary>Answer</summary>

`git push -u origin feature/report`

</details>

**15.** Publish your rebased PR branch safely.

<details>
<summary>Answer</summary>

`git push --force-with-lease`

</details>

**16.** Delete the merged branch on the remote, then clean up a teammate's stale refs.

<details>
<summary>Answer</summary>

`git push origin --delete feature/report`; teammate: `git fetch --prune`.

</details>

## Round 4: Recovery Scenarios (6 min)

**17.** You ran `git reset --hard HEAD~2` by mistake (clean tree).

<details>
<summary>Answer</summary>

`git reflog` → `git reset --hard HEAD@{1}` (or `ORIG_HEAD`).

</details>

**18.** You deleted `spike/csv` with `-D`; Git printed `(was a8cdcbf)`.

<details>
<summary>Answer</summary>

`git branch spike/csv a8cdcbf`

</details>

**19.** Undo commit `3a070e0`, which is already on the shared `main`.

<details>
<summary>Answer</summary>

`git revert 3a070e0` and push.

</details>

**20.** You committed on `main`; it belongs on a new branch `fix/x` (unpushed).

<details>
<summary>Answer</summary>

`git branch fix/x && git reset --hard HEAD~1 && git switch fix/x`

</details>

**21.** Urgent fix needed; you have uncommitted work including a new file.

<details>
<summary>Answer</summary>

`git stash push -u -m "WIP"`, fix on a branch, come back, `git stash pop` (or use `git worktree add`).

</details>

**22.** Find the commit that made `letterGrade(75)` return C, given a check script.

<details>
<summary>Answer</summary>

`git bisect start HEAD <good-tag>` → `git bisect run sh check.sh` → `git bisect reset`.

</details>

**23.** You made two commits in detached HEAD and haven't left yet.

<details>
<summary>Answer</summary>

`git switch -c experiment/<name>`

</details>

**24.** A file you need isn't showing in `git status`.

<details>
<summary>Answer</summary>

`git check-ignore -v <path>`

</details>
