# Coordinating a Team: Shared Files, Accidental Pushes and Safe Reviews

**Module:** Team Collaboration Workflows · **Interview priority:** Frequently asked

## Learning Objectives

- Reduce conflicts on shared files and coordinate concurrent changes.
- Handle an accidentally pushed change without breaking teammates' clones.
- Review or test a teammate's branch without disturbing your own work.

## What Is It?

Beyond the workflow itself, teams need everyday habits so that five people can change one codebase at once: small focused commits, early communication about risky changes, the right way to undo a public mistake, and safe ways to look at each other's work.

## Why It Matters

Most team Git pain is avoidable: two people reformatting the same file, a teammate's branch silently rebased, a secret or broken build pushed to `main` and then "fixed" with a force push. These habits are what interviewers mean by "collaborating effectively with Git".

## How It Works

### Shared files and conflict hot-spots

In a Java project some files are touched by almost every change: `pom.xml`, a central `Application` or configuration class, a constants file, `README.md`. Practices:

- **Keep changes to shared files minimal and separate** — a dependency bump in its own small PR, merged quickly.
- **Never mix reformatting with logic.** Agree on a formatter (and run it in CI) so formatting changes happen once, not in everyone's PR.
- **Append in sorted or grouped order** (dependencies, properties) rather than "always at the end", where everyone collides.
- **Split god classes** that everyone must edit; conflicts are a design signal.

### Avoiding large, unrelated commits

A commit that renames a package, updates JUnit and fixes a bug conflicts with everyone and can't be reverted partially. Use `git add -p` and separate PRs ([Commit Messages and Atomic Commits](../../basic-workflow/commit-messages-and-atomic-commits/content.md)).

### Coordinating concurrent changes

| Situation | Coordination |
|-----------|--------------|
| A large refactor (moving packages, renaming a core class) | Announce it; merge pending PRs first or schedule it; land it quickly; others update right after |
| Two people need the same new API | One lands a minimal version first (even behind a flag); the other builds on it |
| A feature depends on an unmerged branch | Base your branch on theirs and retarget your PR after theirs merges (or wait) |
| Database migrations (Flyway/Liquibase) | Agree on version numbering; conflicts in migration numbers are silent and painful |

### Accidentally pushed a change to a shared branch

```text
                 Was it pushed to a shared branch (main, develop, release/*)?
                       │ yes                                   │ no (your own branch)
                       ▼                                       ▼
          Contains a secret?                         Fix locally (amend/reset/rebase),
        yes │              │ no                      git push --force-with-lease
            ▼              ▼
  rotate the secret    git revert <commit>   (new commit; normal push; everyone pulls)
  first, then revert   — never reset + force-push a shared branch
  (+ history rewrite
   only if required)
```

`git revert` keeps everyone's clone consistent. A force push on `main` breaks every teammate's next pull and can erase their work — and branch protection should forbid it anyway. Secrets: see [Secrets in Git History](../../authentication-and-security/secrets-in-git-history/content.md).

### Reviewing or testing a teammate's branch safely

You're mid-change on `feature/report` and Arjun asks you to try his branch. Options that don't disturb your work:

```bash
git fetch origin

# 1. Look without checking out
git log --oneline main..origin/fix/rounding
git diff main...origin/fix/rounding

# 2. A second working directory for his branch (your files stay untouched)
git worktree add ../gradebook-review origin/fix/rounding
cd ../gradebook-review && mvn -B verify
cd - && git worktree remove ../gradebook-review
```

`git worktree` gives you a separate folder on another commit sharing the same repository — no stashing, no rebuilding your branch afterwards ([Git Worktrees](../../specialized-workflows/git-worktrees/content.md)). The worktree above starts in detached HEAD at Arjun's commit, so nothing you try there can accidentally land on his branch. **Don't** commit fixes onto a teammate's branch without asking — suggest them in the review, or open a PR into their branch.

## Working on a Team Java Project: Ground Rules

1. `main` is protected; everything arrives by PR with green CI.
2. One issue → one branch → one PR; branches live days, not weeks.
3. Start each day: `git switch main && git pull`, then update your branch.
4. Commit tests with the code they test; `mvn -B verify` before pushing.
5. Never commit `target/`, IDE files or secrets; `.gitignore` is reviewed like code.
6. Never rewrite shared history; revert instead.
7. Talk before touching shared hot-spots or doing big refactors.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git diff main...origin/<branch>` | Read a teammate's change | Safe anywhere |
| `git worktree add <dir> <ref>` | Test another branch in a separate folder | Changes local state (new folder) |
| `git revert <commit>` | Undo a pushed change publicly | Changes local state; safe to push |
| `git add -p` | Keep commits focused | Changes local state |

## Step-by-Step Example

Arjun pushed a commit to `main` that breaks `ClassReport` (the protection rule was missing):

1. Priya runs `git fetch && git log --oneline -5 origin/main` and identifies `7e1a9c2`.
2. She tells the team in chat, then `git switch main && git pull` and `git revert 7e1a9c2` with a message explaining why.
3. `mvn -B verify` passes; she opens a PR (or pushes, per team rules) — everyone pulls normally.
4. Arjun fixes the change on a branch and opens a proper PR; the team adds the missing protection rule.

## Common Mistakes

- **Force-pushing `main` to "undo" a bad push.**
- **Rebasing a branch a teammate is also using** without telling them.
- **Drive-by reformatting** in an unrelated PR.
- **Testing a teammate's branch by stashing and switching repeatedly** — use a worktree.
- **Silent large refactors** that invalidate everyone's open PRs.

## Interview Angle

Scenario questions: "You pushed a broken commit to `main` — what now?" (revert, communicate, add protection), "How do you avoid merge conflicts in a team?" (small short-lived branches, separate formatting, coordinate refactors, frequent updates), "How do you test a colleague's branch?" (fetch + worktree or diff without checking out).

## Recap

- Keep shared-file changes small, separate and quick to merge; automate formatting.
- Announce and sequence large refactors.
- Undo public mistakes with `git revert`; rotate leaked secrets first.
- Review and test others' branches with `fetch`, three-dot diffs and `git worktree`.

## Related Topics

- [Collaboration Workflows](../git-collaboration-workflows/content.md)
- [git revert](../../undoing-and-recovery/git-revert/content.md)
- [Git Worktrees](../../specialized-workflows/git-worktrees/content.md)
