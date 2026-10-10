# Safe Recovery Workflows and Destructive Commands — Interview Questions

## Beginner

### Q1. Which Git commands can permanently lose work?

**Style:** What

<details>
<summary>Answer</summary>

Commands that overwrite or delete things Git never stored: `git reset --hard`, `git restore <file>` / `git checkout -- <file>`, forced switches, `git stash drop/clear` (uncommitted changes) and `git clean -f` (untracked files). `git push --force` can remove others' commits from a shared branch. Committed work itself is usually recoverable via the reflog.

</details>

## Intermediate

### Q2. What do you do before running a risky Git command?

**Style:** How

<details>
<summary>Answer</summary>

Inspect with read-only commands (`git status`, `git log --oneline --graph --all`, `git stash list`, `git remote -v`), then make a cheap backup — `git branch backup/x` for commits, `git stash push -u` for uncommitted work — then use the least destructive command and verify the result.

</details>

### Q3. How do you safely remove untracked build files?

**Style:** How

<details>
<summary>Answer</summary>

Prefer the build tool (`mvn clean`). With Git, preview with `git clean -n` (add `-d` for directories, `-X` for only ignored files), then delete with `-f`, ideally limited to a path (`git clean -f -- target/`). Avoid `-fdx` because it also deletes ignored local files like `.env`.

</details>

## Advanced

### Q4. A teammate wants to delete `.git` and re-clone because "Git is broken". What do you advise?

**Style:** Scenario

<details>
<summary>Answer</summary>

Don't — a re-clone loses unpushed commits, stashes, local branches and the reflog. Diagnose first: `git status`, `git log --oneline --graph --all -15`, `git reflog -10`, `git remote -v`. Most "broken" states are an in-progress merge/rebase (`--abort`), detached HEAD, or divergence from the remote. If a fresh clone is really needed, clone next to the old one and copy over what's unique.

</details>
