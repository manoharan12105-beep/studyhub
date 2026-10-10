# Troubleshooting Commits and Branches

**Module:** Git Troubleshooting Playbook · **Interview priority:** Core

## Learning Objectives

- Fix commits made on the wrong branch, with the wrong author, or containing the wrong files.
- Recover a deleted branch and work done in detached HEAD.
- Choose fixes that are safe for whether the commits were pushed.

## How to Use This Topic

Each scenario follows the same structure: **Symptoms → Possible Causes → Diagnostic Workflow → Fix → Prevention → Interview Explanation**. Always run the diagnosis from [Diagnosing Repository State](../diagnosing-repository-state/content.md) first, and ask the deciding question: **has this been pushed to a shared branch?** If yes, prefer fixes that add commits (revert) over fixes that rewrite.

## Scenario 1: Committed to the Wrong Branch

### Symptoms

`git log` shows your new commit on `main`, but it belongs on a feature branch.

**Output (`git log --oneline --graph --decorate --all`):**

```text
* dbd0ba4 (HEAD -> main) Round averages to two decimals
* c378147 Create gradebook project
```

### Possible Causes

Forgot `git switch -c` before committing; an IDE was on a different branch than you thought.

### Diagnostic Workflow

1. `git status` — clean? (Any uncommitted work must be stashed before a `--hard` reset.)
2. `git log --oneline -3` — which commits are misplaced?
3. `git branch -vv` — were they pushed (`ahead N` vs in sync)?

### Fix

**Not pushed, target branch doesn't exist yet:**

```bash
git branch fix/rounding        # new branch keeps the commit
git reset --hard HEAD~1        # main goes back one commit
git switch fix/rounding
```

**Output (`git log --oneline --graph --decorate --all` afterwards):**

```text
* dbd0ba4 (HEAD -> fix/rounding) Round averages to two decimals
* c378147 (main) Create gradebook project
```

**Not pushed, target branch already exists:** `git switch fix/rounding && git cherry-pick <hash>`, then on `main`: `git reset --hard HEAD~1`.

**Already pushed to `main`:** don't reset. `git revert <hash>` on `main`, and cherry-pick the commit onto the right branch.

### Prevention

Show the branch in your shell prompt or IDE status bar; start every task with `git switch -c <branch>`; protect `main` so a direct push is rejected.

### Interview Explanation

"If it isn't pushed, I create a branch at the commit and reset `main` back — the commit is preserved on the new branch. If it's pushed, I revert on `main` and cherry-pick to the right branch, so shared history isn't rewritten."

## Scenario 2: Accidentally Staged a File

### Symptoms

`git status` lists `notes.txt` (or `.env`) under "Changes to be committed".

### Possible Causes

`git add .` or `git add -A` picked up everything.

### Diagnostic Workflow

`git status -s` (`A ` or `M ` in the left column) and `git diff --staged --stat`.

### Fix

```bash
git restore --staged notes.txt       # keep the file, unstage it
echo "notes.txt" >> .gitignore      # if it should never be committed
```

### Prevention

Review `git status` before committing; keep `.gitignore` current; use `git add -p` or explicit paths.

### Interview Explanation

"`git restore --staged <file>` (older: `git reset <file>`) removes it from the index without touching my working copy."

## Scenario 3: Accidentally Committed a File

### Symptoms

The last commit includes `target/` output, a log file or a secret.

### Possible Causes

No `.gitignore` rule; `git commit -a` or `git add .` without review.

### Diagnostic Workflow

`git show --stat HEAD` — which files? `git branch -vv` — pushed?

### Fix

**Not pushed:**

```bash
git rm --cached logs/app.log                 # untrack, keep on disk
echo "*.log" >> .gitignore && git add .gitignore
git commit --amend --no-edit                 # rewrite the last commit without it
```

**Pushed:** commit the removal as a new commit (`git rm --cached …`, update `.gitignore`, commit, push). **If it was a secret:** rotate it first — see [Secrets in Git History](../../authentication-and-security/secrets-in-git-history/content.md).

### Prevention

A good `.gitignore` from day one; review `git diff --staged`; a `pre-commit` hook for secrets ([Writing Git Hooks](../../git-hooks/writing-git-hooks/content.md)).

### Interview Explanation

"Untrack with `git rm --cached` and ignore it. Before pushing I amend; after pushing I make a new commit — and if it's a credential I rotate it, because history keeps it."

## Scenario 4: Accidentally Deleted a Branch

### Symptoms

`git branch -D feature/csv-export` ran; the work isn't on any other branch.

### Possible Causes

Habitual `-D`; cleaning up "merged" branches that weren't merged.

### Diagnostic Workflow

The deletion printed `Deleted branch feature/csv-export (was a8cdcbf).` If that's gone, `git reflog` shows the branch's last commit; `git fsck --unreachable --no-reflogs` as a last resort.

### Fix

```bash
git branch feature/csv-export a8cdcbf
```

If it had been pushed, `git switch feature/csv-export` after `git fetch` restores it from `origin/feature/csv-export`.

### Prevention

Use `-d` (it refuses unmerged branches); check `git log main..<branch>` before forcing; push work-in-progress branches.

### Interview Explanation

"Branches are pointers; deleting one doesn't delete commits. I recreate the branch at the hash from the deletion message or the reflog."

## Scenario 5: Work Made in Detached HEAD

### Symptoms

`git status` says `HEAD detached at 4b17431`, you've made commits, or Git warned "you are leaving 1 commit behind".

### Possible Causes

`git checkout <hash|tag|origin/branch>`, then committing.

### Diagnostic Workflow

`git status`; `git log --oneline -3`; if already switched away, `git reflog` shows the commits made while detached.

### Fix

Still detached: `git switch -c experiment/short-readme`. Already left: `git branch experiment/short-readme <hash>`. Details and captured output: [Detached HEAD](../../rebasing-and-rewriting/detached-head/content.md).

### Prevention

Use `git switch` (it refuses to detach without `--detach`); create a branch before experimenting.

### Interview Explanation

"Detached means HEAD points at a commit, not a branch. I give the work a branch — `switch -c` while there, or `branch <name> <hash>` from the reflog afterwards."

## Scenario 6: Wrong Commit Author

### Symptoms

`git log` shows `Priya Sharma <priya@laptop.local>`; GitHub doesn't link the commits to the account.

**Output (`git log -1 --format='%an <%ae>'`):**

```text
Priya Sharma <priya@laptop.local>
```

### Possible Causes

`user.email` unset (Git guessed from the host name) or a wrong local override.

### Diagnostic Workflow

`git config --show-origin user.email` — which file sets it? `git log --format='%h %an <%ae>' -10` — how many commits are affected? Pushed?

### Fix

Correct the configuration, then fix unpushed commits:

```bash
git config --global user.email "priya@example.com"     # or remove the wrong local value
git commit --amend --reset-author --no-edit             # last commit
git log -1 --format='%an <%ae>'
```

**Output:**

```text
Priya Sharma <priya@example.com>
```

Several unpushed commits: `git rebase -r <base> --exec "git commit --amend --reset-author --no-edit"`. **Already pushed:** rewriting is usually not worth it; add the email to your GitHub account instead, or map identities for `git log`/`shortlog` with a `.mailmap` file.

### Prevention

Set identity before the first commit; use `git config --show-origin` when in doubt ([Git Configuration](../../configuration-and-repositories/git-configuration/content.md)).

### Interview Explanation

"I fix the configuration, then `commit --amend --reset-author` for the last unpushed commit or `rebase --exec` for several. For pushed history I prefer a `.mailmap` or adding the email to the account over rewriting shared commits."

## Key Takeaways

- Diagnose first; decide by "pushed or not".
- Unpushed: branch/reset, amend, rebase. Pushed: revert, new commits, mailmap.
- Deleted branches and detached work are recoverable from the deletion message or reflog.
- Staged by mistake → `restore --staged`; committed by mistake → `rm --cached` (+ rotate secrets).

## Related Topics

- [Diagnosing Repository State](../diagnosing-repository-state/content.md)
- [git reset](../../undoing-and-recovery/git-reset/content.md)
- [git reflog](../../undoing-and-recovery/git-reflog/content.md)
