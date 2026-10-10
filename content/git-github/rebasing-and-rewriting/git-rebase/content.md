# git rebase and Rebase vs Merge

**Module:** Rebasing and History Rewriting · **Interview priority:** Core

## Learning Objectives

- Explain what rebasing does to commits and why their hashes change.
- Rebase a feature branch onto `main`, resolve conflicts, and continue, skip or abort.
- Choose between rebase and merge for a given situation.

## What Is It?

`git rebase <base>` takes the commits on your current branch that aren't in `<base>`, and **replays them one by one on top of `<base>`**, creating **new commits** with the same changes and messages but new parents — and therefore new hashes. Your branch is then moved to the last new commit.

The result looks as if you had started your work from the latest `<base>` all along.

## Why It Matters

Rebasing produces a **linear history** that's easy to read and bisect, and it lets you present a feature branch as a clean series of commits on top of current `main`. But because it **creates new commits and abandons the old ones**, rebasing commits that other people already have causes duplicated commits and confusing conflicts. Knowing exactly when it's safe is one of the most-asked Git interview topics.

> [!CAUTION]
> **Rebase rewrites history.** The original commits are replaced by copies with new ids. Never rebase commits that others have based work on (for example a pushed shared branch) unless the whole team agrees — see [Rewriting History Safely](../rewriting-history-safely/content.md). The old commits remain reachable through `ORIG_HEAD` and the [reflog](../../undoing-and-recovery/git-reflog/content.md) if you need to undo.

## How It Works

**Before** — `main` moved on after `feature/class-report` branched:

**Output (`git log --oneline --graph --decorate --all`):**

```text
* b11380e (main) Raise the B threshold to 78
* 8906da9 Fix README typo
| * 9b62035 (HEAD -> feature/class-report) Count students in ClassReport
| * b49f095 Add ClassReport skeleton
|/  
* c378147 Create gradebook project
```

```bash
git switch feature/class-report
git rebase main
```

**Output (final line):**

```text
Successfully rebased and updated refs/heads/feature/class-report.
```

**After:**

```text
* de019ef (HEAD -> feature/class-report) Count students in ClassReport
* 70e2e21 Add ClassReport skeleton
* b11380e (main) Raise the B threshold to 78
* 8906da9 Fix README typo
* c378147 Create gradebook project
```

Step by step, Git:

1. Found the commits on `feature/class-report` not on `main`: `b49f095`, `9b62035`.
2. Moved to `main`'s tip (`b11380e`).
3. Re-applied each commit's change, creating `70e2e21` and `de019ef` (same messages and authors, new parents, new ids).
4. Moved `feature/class-report` to `de019ef`.

The old `b49f095` and `9b62035` still exist — `git log -1 ORIG_HEAD` shows `9b62035` — but no branch points to them. Merging `feature/class-report` into `main` is now a fast-forward.

## Resolving Rebase Conflicts

Each replayed commit can conflict. On `feature/strict-b` (B threshold 80), rebasing onto `main` (B threshold 78):

**Output:**

```text
Auto-merging src/main/java/com/example/gradebook/GradeCalculator.java
CONFLICT (content): Merge conflict in src/main/java/com/example/gradebook/GradeCalculator.java
error: could not apply d7d1b8b... Raise the B threshold to 80
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
hint: Disable this message with "git config set advice.mergeConflict false"
Could not apply d7d1b8b... # Raise the B threshold to 80
```

```bash
git status
```

**Output (first lines):**

```text
interactive rebase in progress; onto b11380e
Last command done (1 command done):
   pick d7d1b8b # Raise the B threshold to 80
Next command to do (1 remaining command):
   pick eb026a7 # Mention strict B in README
  (use "git rebase --edit-todo" to view and edit)
You are currently rebasing branch 'feature/strict-b' on 'b11380e'.
```

The file shows:

```text
<<<<<<< HEAD
        if (average >= 78) return 'B';
=======
        if (average >= 80) return 'B';
>>>>>>> d7d1b8b (Raise the B threshold to 80)
```

> [!WARNING]
> **"Ours" and "theirs" are swapped in a rebase.** `HEAD` (the "ours" side) is the new base — `main`'s 78 — plus any commits already replayed; "theirs" is **your** commit being replayed (80). `git checkout --theirs <file>` keeps *your* branch's version.

Then:

| Command | Effect |
|---------|--------|
| edit, `git add <file>`, `git rebase --continue` | Commit the resolved replay and move to the next commit |
| `git rebase --skip` | Drop this commit entirely (its change is lost from the branch) |
| `git rebase --abort` | Stop and return the branch exactly to where it was before the rebase |

After resolving the first commit, the second one (a README line added at the same place `main` had changed) conflicted too — rebases can stop **once per commit**. After resolving both:

**Output:**

```text
Successfully rebased and updated refs/heads/feature/strict-b.
```

```text
* 6a8cc09 (HEAD -> feature/strict-b) Mention strict B in README
* 7e4e48f Raise the B threshold to 80
* b11380e (main) Raise the B threshold to 78
```

During the rebase, `HEAD` is detached (`[detached HEAD 7e4e48f] …` appears when each replayed commit is created); the branch is updated only at the end.

## Rebase vs Merge

| | `git merge main` (on the feature) | `git rebase main` (on the feature) |
|-|-----------------------------------|-------------------------------------|
| What happens | Adds a merge commit joining both histories | Replays your commits on top of `main` |
| Existing commits | Unchanged | Replaced by new commits |
| History shape | Shows the real parallel development | Linear, as if done sequentially |
| Conflicts | Resolved once, for all commits together | Resolved per replayed commit |
| Safe for shared/pushed branches | Yes | No (unless coordinated) |
| Undo | `git reset` to before the merge, or revert | `git reset --hard ORIG_HEAD` / reflog |
| Bisect friendliness | Merge commits complicate it slightly | Linear history is easy to bisect |

**Prefer rebase** when: the branch is yours alone and not yet pushed (or nobody else uses it), you want to update it with `main` before opening or updating a pull request, or you're tidying commits.

**Prefer merge** when: the branch is shared, the commits are already on `main` or another public branch, you want history to show when work was integrated, or the rebase would mean resolving the same conflict in many commits.

Neither is universally better; many teams rebase private feature branches and merge (or squash-merge) them into `main` through pull requests.

## Commands

### git rebase

**Syntax:** `git rebase <base>`, `git rebase --onto <newbase> <oldbase> [<branch>]`, `git rebase --continue | --skip | --abort` · **Safety:** **Practice repository first** — rewrites the current branch's commits.

| Option | Effect |
|--------|--------|
| `-i` | Interactive — edit the list of commits first ([Interactive Rebase](../interactive-rebase/content.md)) |
| `--onto <newbase> <oldbase>` | Move only the commits after `<oldbase>` onto `<newbase>` |
| `--autostash` | Stash uncommitted changes before, re-apply after |
| `--update-refs` | Also move other branches that point into the rebased commits (stacked branches) |

`git pull --rebase` = fetch + rebase onto the upstream — see [git fetch and git pull](../../remote-repositories/git-fetch-and-pull/content.md).

## Step-by-Step Example

1. `git status` — clean tree (or use `--autostash`).
2. `git branch backup/class-report` — a safety pointer (optional but cheap).
3. `git rebase main`.
4. On conflict: resolve, `git add`, `git rebase --continue`; or `git rebase --abort`.
5. Build and test — each replayed commit is a new, untested combination.
6. If the branch was pushed before and only you use it: `git push --force-with-lease`.

## Common Mistakes

- **Rebasing a shared branch** (or `main`) and force-pushing — teammates' histories diverge.
- **Using `--theirs` expecting `main`'s version** during a rebase.
- **`git rebase --skip` to "get past" a conflict** — it drops your commit.
- **Forgetting to test** after the rebase.
- **Running `git pull` after rebasing a pushed branch.** Your branch and its remote copy now diverge: `git pull` either stops with "You have divergent branches" or, if you configured it to merge, merges the old commits back in next to their rebased copies. If the branch is yours alone, publish the rebase with `git push --force-with-lease` instead.

## Interview Angle

"Merge vs rebase?" is near-certain. Answer: both integrate changes; merge preserves history and adds a merge commit; rebase rewrites your commits on top of the base for a linear history. Golden rule: don't rebase commits others have. Bonus points: conflicts per commit, ours/theirs swap, `ORIG_HEAD`/reflog to undo.

## Recap

- Rebase replays your commits onto a new base, creating new commits with new ids.
- Conflicts are resolved per commit: `add` + `--continue`, `--skip`, or `--abort`.
- In a rebase, "theirs" is your commit and "ours" is the new base.
- Rebase private branches for linear history; merge shared ones.

## Related Topics

- [Interactive Rebase](../interactive-rebase/content.md)
- [Rewriting History Safely](../rewriting-history-safely/content.md)
- [Working with Feature Branches](../../branching-and-merging/working-with-feature-branches/content.md)
- [Lab 05 — Rebase a Feature Branch Safely](../../labs/git-lab-05-rebase-feature-branch/content.md)
