# Diagnosing Repository State Before Changing It

**Module:** Git Troubleshooting Playbook · **Interview priority:** Core

## Learning Objectives

- Collect a complete picture of a repository with read-only commands before fixing anything.
- Recognise in-progress operations (merge, rebase, cherry-pick, revert, bisect) and how to leave each.
- Read the snapshot to decide which troubleshooting scenario you're in.

## What Is It?

Most Git "disasters" are made worse by the first command typed in panic — `reset --hard`, `push --force`, deleting `.git`. **Diagnosis first** means running only commands that can't change anything until you know: which branch you're on, what is uncommitted, what is in progress, how you relate to the remote, and where `HEAD` has been.

## Why It Matters

Every scenario in this playbook — rejected push, conflict, detached HEAD, lost commit — starts with the same questions. The answers usually point straight to the right, least destructive fix ([Safe Recovery Workflows](../../undoing-and-recovery/safe-recovery-workflows/content.md)).

## How It Works

### The diagnostic snapshot (all read-only)

```bash
git status
git branch -vv
git remote -v
git stash list
git log --oneline --graph --decorate --branches --remotes -10
git reflog -10
```

| Command | Answers |
|---------|---------|
| `git status` | Current branch (or detached), operation in progress, staged/unstaged/untracked files, ahead/behind |
| `git branch -vv` | Every local branch, its tip and its upstream with ahead/behind/gone |
| `git remote -v` | Where `origin` (and others) actually point — wrong URL? HTTPS or SSH? |
| `git stash list` | Shelved work you might forget |
| `git log --graph … --branches --remotes` | Shape of history, where branches diverge |
| `git reflog` | What happened recently, and where commits went |

`git fetch` is also safe — it only updates `origin/*` — and makes the ahead/behind numbers current.

### A real snapshot

Priya's repository in the middle of a messy afternoon:

**Output (`git status`):**

```text
On branch main
Your branch is ahead of 'origin/main' by 1 commit.
  (use "git push" to publish your local commits)

You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   src/main/java/com/example/gradebook/GradeCalculator.java

no changes added to commit (use "git add" and/or "git commit -a")
```

**Output (`git branch -vv`):**

```text
  feature/csv-export 059caac [origin/feature/csv-export] Add CSV export notes
  fix/b-80           1840491 Use 80 for B
* main               1e1e146 [origin/main: ahead 1] Use 76 for B
```

**Output (`git stash list`):**

```text
stash@{0}: On main: notes draft
```

**Output (`git log --oneline --graph --decorate --branches --remotes -6`):**

```text
* 1e1e146 (HEAD -> main) Use 76 for B
| * 1840491 (fix/b-80) Use 80 for B
|/  
| * 059caac (origin/feature/csv-export, feature/csv-export) Add CSV export notes
|/  
* 3a070e0 (origin/main, origin/HEAD) Raise the B threshold to 78
*   10b9974 Merge branch 'feature/class-report'
```

**Output (`git reflog -4`):**

```text
1e1e146 HEAD@{0}: commit: Use 76 for B
3a070e0 HEAD@{1}: checkout: moving from fix/b-80 to main
1840491 HEAD@{2}: commit: Use 80 for B
3a070e0 HEAD@{3}: checkout: moving from main to fix/b-80
```

**Reading it:** a merge of `fix/b-80` into `main` is in progress with one conflict; `main` has one unpushed commit; there's a stashed notes draft; `feature/csv-export` is in sync with its remote. Decision: resolve or `git merge --abort` — and remember the stash later. Nothing here calls for `reset --hard`.

> [!TIP]
> Use `--branches --remotes` rather than `--all` for the graph: `--all` also draws the stash's internal commits ("index on main", "untracked files on main"), which clutters the picture and confuses people.

### Recognising in-progress operations

`git status` names them; these files in `.git` confirm it:

| Marker in `.git/` | Operation | Leave with |
|-------------------|-----------|------------|
| `MERGE_HEAD` | Merge | `git merge --continue` / `--abort` |
| `rebase-merge/` or `rebase-apply/` | Rebase (or `git am`) | `git rebase --continue` / `--skip` / `--abort` |
| `CHERRY_PICK_HEAD` | Cherry-pick | `git cherry-pick --continue` / `--abort` |
| `REVERT_HEAD` | Revert | `git revert --continue` / `--abort` |
| `BISECT_LOG` | Bisect | `git bisect reset` |

## From Symptoms to Scenarios

| Symptom | Go to |
|---------|-------|
| Commit landed on the wrong branch, wrong author, file staged/committed by mistake, deleted branch, detached HEAD | [Troubleshooting Commits and Branches](../troubleshooting-commits-and-branches/content.md) |
| Push rejected, branch missing, wrong upstream, authentication, large file, diverged, force-pushed | [Troubleshooting Remotes and Pushes](../troubleshooting-remotes-and-push/content.md) |
| Conflicts, files mysteriously ignored, whole-file line-ending diffs | [Troubleshooting Conflicts, Ignored Files and Line Endings](../troubleshooting-conflicts-and-files/content.md) |

## Commands

All diagnostic commands above are **safe anywhere**. The only state-changing step in diagnosis is `git fetch`, which updates remote-tracking refs only.

## Step-by-Step Example

A teammate says "Git is broken, I'm deleting the folder". Instead:

1. `git status` → "interactive rebase in progress".
2. `git reflog -5` → the rebase started two minutes ago.
3. `git rebase --abort` → back where they were.
4. `git log --oneline -3` → all commits present. Nothing was broken; a rebase was waiting.

## Common Mistakes

- **Fixing before looking.**
- **Trusting stale ahead/behind** — `git fetch` first.
- **Ignoring the hints `git status` prints** — they usually name the exact command.
- **Forgetting stashes** — `git stash list` is part of every diagnosis.

## Interview Angle

"Something's wrong with your repository — what do you do first?" — inspect with read-only commands: status, branch -vv, remote -v, stash list, log --graph, reflog; identify in-progress operations; then choose the least destructive fix. This answer alone signals maturity.

## Recap

- Diagnose with read-only commands before any fix.
- `status`, `branch -vv`, `remote -v`, `stash list`, `log --graph`, `reflog`, plus `fetch` for fresh numbers.
- In-progress operations have markers and `--continue`/`--abort` exits.
- Map the symptom to a scenario, then use the least destructive fix.

## Related Topics

- [Safe Recovery Workflows](../../undoing-and-recovery/safe-recovery-workflows/content.md)
- [git reflog](../../undoing-and-recovery/git-reflog/content.md)
- [Lab 12 — Diagnose a Broken Java Repository](../../labs/git-lab-12-diagnose-broken-repository/content.md)
