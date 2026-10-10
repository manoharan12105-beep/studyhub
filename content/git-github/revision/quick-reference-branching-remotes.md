# Quick Reference: Branching, Remotes and GitHub

Safety: ✅ safe anywhere · 🔵 changes local state · ⚠️ practice repository first · 🌐 changes the remote.

## Branches

| Command | What it does | |
|---------|--------------|-|
| `git branch` / `-v` / `-vv` / `-a` | List (with tips, upstreams, remote branches) | ✅ |
| `git switch -c <new> [<start>]` | Create and switch | 🔵 |
| `git switch <branch>` / `git switch -` | Switch / previous branch | 🔵 |
| `git switch --detach <commit>` | Inspect an old commit | 🔵 |
| `git branch -m <new>` | Rename the current branch | 🔵 |
| `git branch -d <branch>` | Delete if merged | 🔵 |
| `git branch -D <branch>` | Force delete (unmerged commits stranded) | ⚠️ |
| `git branch --merged` / `--no-merged` | Which branches are integrated | ✅ |

## Merging and Rebasing

| Command | What it does | |
|---------|--------------|-|
| `git merge <branch>` | Integrate into the current branch | 🔵 |
| `git merge --no-ff` / `--ff-only` | Always / never a merge commit | 🔵 |
| `git merge --abort` | Cancel a conflicted merge | 🔵 |
| `git merge-base A B` | Common ancestor | ✅ |
| `git rebase <base>` | Replay commits on a new base | ⚠️ |
| `git rebase -i <base>` | Reorder, squash, reword, drop | ⚠️ |
| `git rebase --continue` / `--skip` / `--abort` | During a rebase | 🔵 |
| `git commit --fixup=<commit>` + `rebase -i --autosquash` | Tidy automatically | 🔵 / ⚠️ |
| `git cherry-pick -x <commit>` | Copy one commit here | 🔵 |
| `git config --global merge.conflictStyle zdiff3` | Show the base in conflicts | 🔵 |

## Remotes

| Command | What it does | |
|---------|--------------|-|
| `git remote -v` | Remotes and URLs | ✅ |
| `git remote add <name> <url>` | Add (e.g. `upstream`) | 🔵 |
| `git remote set-url origin <url>` | Switch HTTPS ↔ SSH | 🔵 |
| `git fetch [--prune]` | Update `origin/*` | ✅ |
| `git pull --rebase` / `--ff-only` | Fetch + integrate | 🔵 |
| `git push -u origin <branch>` | First push, set upstream | 🌐 |
| `git push` | Fast-forward the remote branch | 🌐 |
| `git push --force-with-lease` | Replace your own rewritten branch | 🌐 |
| `git push origin --delete <branch>` | Delete a remote branch | 🌐 |
| `git push origin <tag>` / `--follow-tags` | Push tags | 🌐 |
| `git ls-remote origin` | What the server has now | ✅ |
| `git rev-list --left-right --count A...B` | Behind / ahead counts | ✅ |

## Tags and Releases

| Command | What it does | |
|---------|--------------|-|
| `git tag -a v1.0.0 -m "…"` | Annotated release tag | 🔵 |
| `git tag -l --sort=v:refname` | Version order (`versionsort.suffix=-rc` for candidates) | ✅ |
| `git describe` | `v1.0.0-3-g2adc903` | ✅ |
| `git tag -d v1.0.1` + `git push origin --delete v1.0.1` | Delete (only if unpublished) | 🔵 / 🌐 |
| `git log --oneline --no-merges v1.0.0..v1.1.0` | Release-notes material | ✅ |

## Forks and Pull Requests

| Step | Command |
|------|---------|
| Add the original project | `git remote add upstream <url>` |
| Sync your fork | `git fetch upstream && git switch main && git merge --ff-only upstream/main && git push origin main` |
| Branch for a contribution | `git switch -c fix/x upstream/main` then `git push -u origin fix/x` |
| See what the PR contains | `git log --oneline main..HEAD`, `git diff main...HEAD` |
| Check out a PR | `git fetch origin pull/<n>/head:pr-<n>` or `gh pr checkout <n>` |
| Open a PR | GitHub "Compare & pull request" or `gh pr create` |

## Authentication

| Situation | Use |
|-----------|-----|
| HTTPS | Fine-grained token or Git Credential Manager browser sign-in; never put credentials in URLs |
| SSH | `ssh-keygen -t ed25519 -C "<email>"`, `ssh-add`, add the `.pub` key on GitHub, `ssh -T git@github.com` |
| Credential helper | `git config --global credential.helper manager` (Windows default); avoid `store` |
