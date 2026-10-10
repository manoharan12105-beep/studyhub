# Diagnosing Repository State Before Changing It — Interview Questions

## Beginner

### Q1. What do you run first when Git behaves unexpectedly?

**Style:** How

<details>
<summary>Answer</summary>

`git status` — it shows the branch (or detached HEAD), any operation in progress with its continue/abort commands, staged/unstaged/untracked files and ahead/behind. Then `git log --oneline --graph`, `git branch -vv`, `git remote -v`, `git stash list` and `git reflog` as needed — all read-only.

</details>

## Intermediate

### Q2. How can you tell that a rebase or merge is in progress?

**Style:** How

<details>
<summary>Answer</summary>

`git status` says so ("You have unmerged paths… use git merge --abort", "interactive rebase in progress") and lists the exit commands. Under the hood, `.git/MERGE_HEAD`, `.git/rebase-merge/`, `CHERRY_PICK_HEAD`, `REVERT_HEAD` or `BISECT_LOG` exist.

</details>

### Q3. Why fetch before diagnosing a push problem?

**Style:** Why

<details>
<summary>Answer</summary>

Ahead/behind information compares with your local `origin/*` refs, which are only as current as your last fetch. `git fetch` updates them without touching your branches or files, so you diagnose the real current divergence.

</details>

## Advanced

### Q4. A colleague wants to fix a "broken" repository by deleting it and re-cloning. What would you check first and why?

**Style:** Scenario

<details>
<summary>Answer</summary>

Check `git status` for an in-progress operation (often the whole problem), `git branch -vv` for unpushed commits, `git stash list` for shelved work, `git reflog` for recent history, and untracked files that exist only there. A re-clone discards unpushed commits, stashes, local branches, the reflog and untracked files; diagnosis usually reveals a one-command fix like `--abort`.

</details>
