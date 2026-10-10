# Command Comparison Tables

Every classic "X vs Y" question, answered by what each command changes.

## fetch vs pull

| | `git fetch` | `git pull` |
|-|-------------|------------|
| Updates `origin/*` | Yes | Yes |
| Moves your branch | No | Yes (ff, merge or rebase) |
| Changes files | No | Yes |
| Can conflict | No | Yes |
| Use | Inspect before integrating | Integrate now |

## merge vs rebase

| | `git merge` | `git rebase` |
|-|-------------|--------------|
| Result | Merge commit (or fast-forward) | Commits replayed on the new base |
| Existing commits | Unchanged | New ids |
| History | True parallel shape | Linear |
| Shared branches | Safe | Avoid |
| Conflicts | Once | Per commit |

## reset vs revert

| | `git reset` | `git revert` |
|-|-------------|--------------|
| Mechanism | Moves the branch back | New inverse commit |
| History | Rewritten | Preserved |
| After pushing | Avoid | Correct choice |
| Middle-of-history commit | Drops everything after it | Undoes just that commit |

## reset modes

| Mode | Branch | Index | Working files |
|------|--------|-------|---------------|
| `--soft` | moved | kept | kept |
| `--mixed` (default) | moved | reset | kept |
| `--hard` | moved | reset | **reset — edits lost** |
| `--keep` | moved | reset | updated, but refuses to overwrite local changes |

## restore vs reset

| | `git restore` | `git reset` |
|-|---------------|-------------|
| Moves a branch | Never | `reset <commit>` does |
| Unstage | `restore --staged <file>` | `reset <file>` |
| Discard edits | `restore <file>` | `reset --hard` (everything) |
| Scope | Named paths | Whole branch (or a path for unstaging) |

## checkout vs switch

| | `git checkout` | `git switch` / `git restore` |
|-|----------------|------------------------------|
| Switch branch | `checkout main` | `switch main` |
| Create and switch | `checkout -b x` | `switch -c x` |
| Overwrite a file | `checkout -- file` (silent) | `restore file` |
| Detach accidentally | Possible | `switch` requires `--detach` |

## stash apply vs stash pop

| | `apply` | `pop` |
|-|---------|-------|
| Re-applies changes | Yes | Yes |
| Removes the stash | No | Yes — only if no conflict |
| Use | Same changes on several branches; unsure | Normal "put it back" |

## clone vs fork

| | Clone | Fork |
|-|-------|------|
| Copy lives | Your machine | Your GitHub account |
| Made by | Git | GitHub |
| Needs write access to push | Yes | No |

## tag vs GitHub Release

| | Tag | Release |
|-|-----|---------|
| Stored in | Git (`refs/tags`) | GitHub |
| Has | Pointer (+ message if annotated) | Tag + notes + assets + flags |
| Cloned | Yes | No |

## lightweight vs annotated tag

| | Lightweight | Annotated |
|-|-------------|-----------|
| Object | None — just a ref | Tag object (tagger, date, message) |
| `git cat-file -t` | `commit` | `tag` |
| `git describe` default | Ignored | Used |
| For releases | No | Yes |

## --force vs --force-with-lease

| | `--force` | `--force-with-lease` |
|-|-----------|----------------------|
| Check before replacing | None | Remote still where `origin/<branch>` says |
| Teammate pushed meanwhile | Their work silently removed | Rejected: `stale info` |
| Stronger form | — | `--force-with-lease=<ref>:<sha>`, `--force-if-includes` |

## fast-forward vs three-way merge

| | Fast-forward | Three-way |
|-|--------------|-----------|
| When | Current branch hasn't diverged | Both sides have new commits |
| New commit | No | Merge commit, two parents |
| Force/forbid | `--no-ff` / `--ff-only` | — |

## log -S vs log -G vs log --grep

| | Searches | Finds |
|-|----------|-------|
| `-S <string>` | Diffs | Commits changing the **count** of the string |
| `-G <regex>` | Diffs | Commits adding/removing **lines** matching |
| `--grep <pattern>` | Messages | Commits whose message matches |

## GitHub merge methods

| | Merge commit | Squash | Rebase |
|-|--------------|--------|--------|
| On `main` | All commits + merge | One new commit | All commits, re-created |
| Linear | No | Yes | Yes |
| Branch seen as merged by Git | Yes | No | No |
| Revert a feature | `revert -m 1` | `revert <commit>` | Revert each |

## Gitflow vs trunk-based development

| | Gitflow | Trunk-based |
|-|---------|-------------|
| Long-lived branches | `main`, `develop` | `main` only |
| Integration | Per feature/release | Daily |
| Fits | Scheduled, versioned releases | Continuous delivery |
| Unfinished work | Feature branches | Feature flags |
