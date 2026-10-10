# Quick Reference: Recovery, Investigation and Advanced Tools

Safety: ✅ safe anywhere · 🔵 changes local state · ⚠️ practice repository first.

## Undo Cheat Table

| I want to… | Command | |
|-----------|---------|-|
| Discard unstaged edits to a file | `git restore <file>` — gone for good | ⚠️ |
| Unstage a file | `git restore --staged <file>` | 🔵 |
| Restore a file from a commit | `git restore --source=<commit> <file>` | 🔵 |
| Redo the last commit (unpushed) | `git reset --soft HEAD~1` / `git commit --amend` | 🔵 |
| Split the last commit | `git reset HEAD~1`, stage in pieces | 🔵 |
| Throw away local commits | `git reset --hard <commit>` (check `git status` first) | ⚠️ |
| Undo a pushed commit | `git revert <commit>` | 🔵 |
| Undo a pushed merge | `git revert -m 1 <merge>` | 🔵 |
| Re-apply a reverted merge | `git revert <revert-commit>` | 🔵 |
| Undo a rebase/reset just done | `git reset --hard ORIG_HEAD` | ⚠️ |
| Shelve work | `git stash push -u -m "…"` | 🔵 |
| Restore shelved work | `git stash pop` (`--index` keeps staging) | 🔵 |
| Delete untracked files | `git clean -n` then `git clean -f [-d]` | ⚠️ |

## Recovery Toolkit

| Command | Finds / does | |
|---------|--------------|-|
| `git reflog` | Where HEAD has been (local, expires) | ✅ |
| `git reflog show origin/main` | Remote-tracking history (force-push recovery) | ✅ |
| `git branch <name> <hash>` | Rescue commits onto a branch | 🔵 |
| `git fsck --unreachable --no-reflogs` | Unreachable commits | ✅ |
| `git fsck --lost-found` | Dangling blobs (staged but never committed) | ✅ |
| `git stash apply <id>` | Re-apply a dropped stash by the printed id | 🔵 |

## Investigation

| Command | Use | |
|---------|-----|-|
| `git bisect start <bad> <good>` + `git bisect run <script>` | Find the first bad commit (exit 0 good, 1 bad, 125 skip) | 🔵 |
| `git bisect reset` | End bisecting | 🔵 |
| `git merge-base --is-ancestor X Y` | Is X in Y? (exit code) | ✅ |
| `git branch --contains X` / `git tag --contains X` | Which branches/releases include X | ✅ |
| `git log -L 21,21:<file>` | History of a line range | ✅ |
| `git range-diff old~2..old new~2..new` | Compare a series before/after rebase | ✅ |
| `git archive --format=zip --prefix=app/ -o app.zip <tag>` | Clean snapshot | ✅ |

## Internals

| Command | Shows |
|---------|-------|
| `git cat-file -t / -s / -p <object>` | Type, size, contents |
| `git ls-tree -r <commit>` | Every path and blob in a snapshot |
| `git ls-files --stage` | Index entries (mode, blob, stage) |
| `git hash-object <file>` | A file's blob id |
| `git show-ref`, `git symbolic-ref HEAD` | Refs; where HEAD points |
| `git count-objects -v`, `git verify-pack -v` | Loose vs packed objects, deltas |

## Hooks

| Hook | Runs | Typical check |
|------|------|---------------|
| `pre-commit` | Before the message | Debug code, secrets in staged lines (`git diff --cached -U0`) |
| `commit-msg` | After the message (`$1` = message file) | Subject length, format |
| `pre-push` | Before sending (refs on stdin) | Tests, protected branches |
| Share | `git config core.hooksPath .githooks` (each clone) | Skippable with `--no-verify` — enforce in CI |

## Specialised Workflows

| Tool | Commands |
|------|----------|
| Worktrees | `git worktree add [-b new] <path> <commit>`, `list`, `remove`, `prune` |
| Submodules | `git clone --recurse-submodules`, `git submodule update --init --recursive`, `update --remote` (then commit the pointer) |
| Sparse checkout | `git sparse-checkout set --cone <dirs>`, `disable` |
| Partial clone | `git clone --filter=blob:none <url>` |
| Git LFS | `git lfs install`, `git lfs track "*.png"` (commit `.gitattributes` first) |

## Never Without Thinking

`reset --hard` · `clean -fdx` · `push --force` · `branch -D` · `checkout -- <file>` / `restore <file>` · `stash drop` / `clear` · `gc --prune=now` · rewriting shared history · moving published tags.
