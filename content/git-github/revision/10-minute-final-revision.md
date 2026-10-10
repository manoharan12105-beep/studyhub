# Ten-Minute Final Revision

The night before the interview: distinctions, traps and the answers you must be able to say in one breath.

## Ten Distinctions

1. **Git vs GitHub** — tool vs hosting/collaboration platform.
2. **Working directory / index / repository** — edit / prepare / record.
3. **fetch vs pull** — update `origin/*` only vs fetch + integrate.
4. **merge vs rebase** — merge commit, history kept vs replayed commits, new ids, private branches only.
5. **reset vs revert** — move the branch back (rewrite) vs add an undoing commit (safe when shared).
6. **restore vs reset** — files and index, never a branch vs moves the branch.
7. **switch vs checkout** — branches only vs branches *and* file overwriting.
8. **stash apply vs pop** — keep vs drop (pop keeps it after a conflict).
9. **clone vs fork** — local copy (Git) vs copy under your account (GitHub).
10. **--force vs --force-with-lease** — unconditional vs only if the remote didn't move.

## Ten Traps

1. `git commit` records the **index**, not your latest edits (`MM`).
2. `.gitignore` doesn't affect **already tracked** files — `git rm --cached`.
3. Deleting a committed secret **doesn't** remove it from history — rotate it.
4. `git log --since="2026-10-04"` uses the **current time of day** — add `00:00`.
5. `git diff main feature` is tip-to-tip; reviews need `main...feature`.
6. In a rebase, **ours and theirs are swapped**.
7. `git pull` after rebasing a pushed branch merges the old commits back.
8. A clean merge can still **break the build**.
9. `git restore <file>` and `reset --hard` destroy **uncommitted** work the reflog can't recover.
10. Local hooks are skippable (`--no-verify`); only **server-side rules** enforce.

## Ten One-Breath Answers

| Question | Answer |
|----------|--------|
| What is a branch? | A movable pointer to a commit. |
| What is HEAD? | A pointer to the current branch (or a commit, when detached). |
| What is a commit? | Snapshot + parents + author/committer + message, identified by a hash. |
| What's in `.git`? | Objects, refs, HEAD, index, config, hooks. |
| Fast-forward? | Pointer moves because the branch hasn't diverged; no merge commit. |
| Recover a hard reset? | `git reflog`, then reset to the previous entry. |
| Undo a pushed commit? | `git revert <hash>`. |
| Push rejected? | Fetch, integrate, test, push — never force a shared branch. |
| Find a bad commit among hundreds? | `git bisect` (`run` with a test script). |
| Secret pushed? | Rotate first, then clean up code; rewrite history only if required. |

## Model in Five Lines

```text
blob = file contents         tree = names + modes → blobs/trees
commit = tree + parents + who/when/why → hash
branch/tag/HEAD = refs (names) → commits
git add = blob + index        git commit = trees + commit + move branch
fetch/push = exchange objects + move refs (fast-forward only unless forced)
```

## Before You Walk In

- Can you draw a fast-forward, a three-way merge and a rebase on paper?
- Can you explain soft/mixed/hard reset with the three areas?
- Can you describe your team's workflow (branches, PRs, protection, merge method) and its trade-offs?
- Can you tell a recovery story: diagnose → least destructive fix → prevent?
