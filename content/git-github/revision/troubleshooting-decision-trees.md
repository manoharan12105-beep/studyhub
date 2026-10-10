# Troubleshooting Decision Trees

Every tree starts with **inspection** (read-only) and moves to the **least destructive** fix. Run these first, always:

```bash
git status
git branch -vv
git log --oneline --graph --decorate --branches --remotes -10
git stash list
git reflog -10
git remote -v
```

## Push Rejected

```text
! [rejected] … (fetch first | non-fast-forward)
│
├─ git fetch ; git log --oneline <branch>..origin/<branch>
│
├─ Remote has someone else's commits?
│     └─ git pull --rebase  (or --no-rebase) → resolve → build/test → git push
│
└─ You rewrote your own branch (amend/rebase) and nobody else uses it?
      └─ git push --force-with-lease          (never --force; never on main)
```

## Merge or Rebase Conflict

```text
CONFLICT (content) …
│
├─ git status                      which files? merge or rebase in progress?
├─ git log --merge --oneline       (merge) / git show <commit being applied> (rebase)
├─ git config merge.conflictStyle zdiff3   see the base
│
├─ Understand both intents → edit → git diff --check → build/test
│     ├─ merge:  git add <files> ; git commit
│     └─ rebase: git add <files> ; git rebase --continue   (ours = base, theirs = your commit)
│
└─ Not ready?  git merge --abort  |  git rebase --abort
```

## Commits Disappeared

```text
git log no longer shows my commits
│
├─ git reflog            find the entry before "reset:", "rebase (start)" or "checkout"
│
├─ Branch should point there again?   git status (clean?) → git reset --hard <hash>
├─ Just want them safe?               git branch rescue/<name> <hash>
├─ Branch was deleted?                git branch <name> <hash>   (hash from "Deleted branch … (was …)")
└─ Not in the reflog?                 git fsck --unreachable --no-reflogs | grep commit
```

Uncommitted edits lost to `reset --hard`, `restore` or `checkout -- <file>` can't be recovered by Git — check an IDE's local history.

## Committed on the Wrong Branch

```text
Pushed?
├─ No ─► target branch exists?
│         ├─ No:  git branch <new> ; git reset --hard HEAD~1 ; git switch <new>
│         └─ Yes: git switch <target> ; git cherry-pick <hash> ; back on the wrong branch: git reset --hard HEAD~1
└─ Yes ─► git revert <hash> on the wrong branch ; git cherry-pick <hash> onto the right one
```

## Detached HEAD

```text
git status: "HEAD detached at …"
├─ In a rebase or bisect?      finish it (--continue / bisect reset) or --abort — nothing is broken
├─ Made commits you want?      git switch -c <name>        (already left: git branch <name> <hash from reflog>)
└─ Just looking?               git switch -
```

## Something Committed That Shouldn't Be

```text
What is it?
├─ A secret ──► ROTATE IT FIRST → check logs → remove from code (env var) → ignore → (optional) git filter-repo
└─ A file (target/, logs, notes)
      ├─ Not pushed: git rm --cached <file> ; add to .gitignore ; git commit --amend
      └─ Pushed:     git rm --cached <file> ; add to .gitignore ; git commit ; git push
```

## Authentication Fails

```text
git remote -v
├─ https://… ─► "password authentication was removed"?  use a token / browser sign-in
│               "Authentication failed"?                  clear the cached credential, sign in again
│               "Repository not found"?                   token lacks repo access or SSO authorisation; wrong account cached
└─ git@…     ─► ssh -T git@github.com
                "Permission denied (publickey)"?          ssh-add ; add the .pub key on GitHub ; check the account
```

## Branch or Upstream Problems

```text
"invalid reference: feature/x"     → git fetch ; git switch feature/x
branch -vv shows [origin/main] on a feature branch
                                   → git push -u origin feature/x   (or git branch --set-upstream-to=origin/feature/x)
"[origin/…: gone]"                 → remote branch deleted; merged? git branch -d ; else push it again
diverged [ahead N, behind M]       → git log --left-right --oneline <branch>...origin/<branch> → rebase or merge
```

## Files and Diffs Look Wrong

```text
Whole file "changed"     → git diff -w empty? → line endings → git ls-files --eol → .gitattributes + git add --renormalize .
File not showing up      → git check-ignore -v <path> → narrow the pattern / negate (not inside an ignored directory)
GitHub rejects big file  → remove it from the unpushed commits (amend / rebase -i / filter-repo) → .gitignore or Git LFS
```

## Someone Force-Pushed main

```text
git reflog show origin/main          (on a clone that fetched before the force push)
git log -1 origin/main@{1}           the lost tip
git push --force-with-lease=main:<bad-tip> origin origin/main@{1}:main
then: tell the team, re-apply any wanted commit, enable branch protection
```
