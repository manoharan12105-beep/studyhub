# Thirty-Minute Git Revision

The concepts interviewers probe most, in the order they build on each other. Each block ends with the one sentence to remember.

## 1. Version Control, Git and GitHub (3 min)

- A **version control system** records versions with author, time, message and parent — answering what changed, who, when and why.
- **Centralized** (SVN): history on one server. **Distributed** (Git): every clone has the full history; commit locally, share with push/fetch.
- **Git** is the tool; **GitHub** hosts Git repositories and adds pull requests, reviews, issues, permissions, releases and Actions. GitLab/Bitbucket are GitHub alternatives.

**Remember:** a commit is local until it's pushed.

## 2. The Three Areas (3 min)

```text
working directory ──git add──► index (staging area) ──git commit──► repository
        ▲ git restore <file>          ▲ git restore --staged <file>
```

| `git status -s` | Meaning |
|-----------------|---------|
| `??` | untracked |
| ` M` | modified, not staged |
| `M ` | staged |
| `MM` | staged, then modified again — only the staged version is committed |

**Remember:** `git commit` records the index, not your latest edits.

## 3. Commits, the Graph and HEAD (4 min)

- A **commit** = tree (snapshot) + parent(s) + author + committer + message; its **hash** covers all of it, so changing any commit changes every descendant's id.
- History is a **DAG**: merges have two parents, the root has none.
- A **branch** is a movable pointer (a ref holding a commit id). **HEAD** points to the current branch; a commit id in HEAD = **detached HEAD**.
- `HEAD~2` = grandparent (first parents); `HEAD^2` = second parent of a merge.

**Remember:** branches are pointers, not copies — that's why they're cheap.

## 4. Merging and Conflicts (4 min)

- **Fast-forward**: the current branch hasn't diverged → pointer moves, no commit.
- **Three-way merge**: both sides changed → Git compares each side with the **merge base** and creates a two-parent merge commit.
- **Conflict**: both changed the same lines → markers `<<<<<<<` / `=======` / `>>>>>>>` (`|||||||` base with zdiff3); edit, `git add`, `git commit`; or `git merge --abort`.
- A clean merge can still break the build — Git merges text, not meaning.

**Remember:** resolve by understanding both intents, then build and test.

## 5. Rebase and Rewriting History (4 min)

- **Rebase** replays your commits on a new base as **new commits** (new ids); linear history.
- Conflicts are per commit; **ours/theirs are swapped** (ours = new base).
- **Golden rule:** never rewrite commits others have. Publish your own rewritten branch with `--force-with-lease`, never `--force`.
- Interactive rebase: `pick`, `reword`, `edit`, `squash`, `fixup`, `drop`, `exec`; `--fixup` + `--autosquash`.

**Remember:** rewrite private history; add commits to shared history.

## 6. Undoing and Recovering (5 min)

| Need | Command |
|------|---------|
| Discard unstaged edits (irreversible) | `git restore <file>` |
| Unstage | `git restore --staged <file>` |
| Old version of one file | `git restore --source=<commit> <file>` |
| Undo local commits | `git reset --soft/--mixed/--hard <commit>` |
| Undo a pushed commit | `git revert <commit>` (`-m 1` for merges) |
| Copy one commit elsewhere | `git cherry-pick -x <commit>` |
| Shelve work | `git stash push -u -m "…"`, then `pop`/`apply` |
| Find lost commits | `git reflog`, then `branch` or `reset --hard` to the hash |

The reflog recovers **commits** (for weeks); nothing recovers uncommitted edits destroyed by `reset --hard`/`restore` or files deleted by `git clean`.

**Remember:** inspect, back up, then use the least destructive command.

## 7. Remotes (3 min)

- `origin` is just the default remote name; `origin/main` is your **snapshot** of the remote branch at the last fetch.
- `fetch` updates `origin/*` only; `pull` = fetch + merge/rebase/fast-forward.
- `push` succeeds only as a fast-forward; rejection → fetch, integrate, test, push.
- `--force-with-lease` refuses if the remote moved since your last fetch (a background fetch weakens it).

**Remember:** fetch, look, integrate, push.

## 8. GitHub Collaboration (2 min)

- Pull requests: small, described (what/why/how/testing), linked (`Fixes #12`), reviewed, green CI.
- Merge methods: merge commit (full history), squash (one commit), rebase (linear, new ids).
- Branch protection: required PRs, approvals, status checks, no force pushes — server-side enforcement; hooks are only local feedback.
- Forks: `origin` = your fork, `upstream` = original; sync with `fetch upstream` + `merge --ff-only`.

**Remember:** the server enforces; local tools advise.

## 9. Security (2 min)

- Account passwords don't work for Git over HTTPS on GitHub — use tokens (fine-grained, least privilege, expiring), Git Credential Manager or SSH keys.
- A secret in any commit is leaked: **rotate first**, then remove it from code; history rewriting (`git filter-repo`) is optional and never enough on its own.

**Remember:** deleting a file doesn't remove it from history.

## 10. Internals in One Breath

Blobs (contents) → trees (names + modes) → commits (tree + parents + metadata) → refs (branches, tags, HEAD) point at them. Content-addressed, deduplicated, delta-compressed in packfiles; `git add` writes blobs and the index, `git commit` writes trees and a commit and moves the branch.
