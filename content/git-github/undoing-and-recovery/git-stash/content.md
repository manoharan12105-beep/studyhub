# git stash: Shelving Work in Progress

**Module:** Undoing Changes and Recovering Work · **Interview priority:** Core

## Learning Objectives

- Save uncommitted work with `git stash push`, list it, inspect it and bring it back.
- Explain `stash apply` versus `stash pop`, and include untracked files when needed.
- Handle a conflict when applying a stash, and turn a stash into a branch.

## What Is It?

`git stash` saves your uncommitted changes (staged and unstaged edits to tracked files, and optionally untracked files) onto a **stack of stashes**, then returns your working directory to a clean state matching `HEAD`. Later you re-apply the saved changes on the same or a different branch.

## Why It Matters

Interruptions are constant: an urgent bug on `main` while you're mid-feature, a `git pull` that refuses because of local edits, a switch that would overwrite files. Stash lets you set work aside in seconds without making a half-finished commit.

## How It Works

```text
working dir + index (uncommitted) ──git stash push──► stash@{0}  (a special commit)
clean working dir ◄──────────────────────────────────┘
          … do other work …
stash@{0} ──git stash pop──► working dir (stash removed from the list if no conflict)
```

Each stash is stored as commits under `refs/stash`, so it survives switching branches — but it's local to your clone and not pushed.

## Saving

Priya has a staged change to `GradeCalculator.java` and an untracked `NOTES.md`:

```bash
git status -s
git stash push -m "validate averages above 100"
git status -s
```

**Output:**

```text
M  src/main/java/com/example/gradebook/GradeCalculator.java
?? NOTES.md
Saved working directory and index state On main: validate averages above 100
?? NOTES.md
```

The tracked change is shelved; the **untracked** `NOTES.md` stayed. Include untracked files with `-u` (`--include-untracked`):

```bash
git stash push -u -m "notes file"
git stash list
```

**Output:**

```text
Saved working directory and index state On main: notes file
stash@{0}: On main: notes file
stash@{1}: On main: validate averages above 100
```

The newest stash is `stash@{0}`; older ones shift up.

## Inspecting

```bash
git stash show stash@{1}
```

**Output:**

```text
 src/main/java/com/example/gradebook/GradeCalculator.java | 1 +
 1 file changed, 1 insertion(+)
```

`git stash show -p stash@{1}` prints the full diff.

## apply vs pop

| Command | Re-applies changes | Removes the stash from the list |
|---------|--------------------|---------------------------------|
| `git stash apply [stash@{n}]` | Yes | No |
| `git stash pop [stash@{n}]` | Yes | Yes — **only if it applied without conflicts** |

```bash
git stash apply stash@{1}
```

**Output (shortened):**

```text
On branch main
Changes not staged for commit:
	modified:   src/main/java/com/example/gradebook/GradeCalculator.java
```

`git stash list` still shows both stashes. With `pop`, the last line confirms the removal:

**Output (last line of `git stash pop stash@{1}`):**

```text
Dropped stash@{1} (47be3fab1e7881030f892e168a114791e141ada9)
```

> [!NOTE]
> The change was **staged** when stashed but comes back **unstaged**. Use `git stash apply --index` (or `pop --index`) to restore the staged state too.

Use `apply` when you might need the same stash again (for example on two branches), `pop` for the usual "put it back" case.

## Conflicts When Applying

Priya stashed "try 80 for B", then committed 77 for B on `main`, then popped:

**Output:**

```text
Auto-merging src/main/java/com/example/gradebook/GradeCalculator.java
CONFLICT (content): Merge conflict in src/main/java/com/example/gradebook/GradeCalculator.java
On branch main
Unmerged paths:
  (use "git restore --staged <file>..." to unstage)
  (use "git add <file>..." to mark resolution)
	both modified:   src/main/java/com/example/gradebook/GradeCalculator.java

no changes added to commit (use "git add" and/or "git commit -a")
The stash entry is kept in case you need it again.
```

The markers use stash-specific labels:

```text
<<<<<<< Updated upstream
        if (average >= 77) return 'B';
=======
        if (average >= 80) return 'B';
>>>>>>> Stashed changes
```

Resolve the file, then `git restore --staged <file>` (you want it as an uncommitted change, not staged) or `git add` it, and finally `git stash drop` once you're sure — the stash was kept because of the conflict.

## Stash to Branch

If the stash conflicts badly, or turns out to be real work, create a branch from the commit where it was made and apply it there:

```bash
git stash branch experiment/b-80
```

**Output (shortened):**

```text
Switched to a new branch 'experiment/b-80'
…
	modified:   src/main/java/com/example/gradebook/GradeCalculator.java
…
Dropped refs/stash@{0} (ee3ba7a7db385fd92704030e907ed5f08c345bd7)
```

Because the branch starts at the stash's original base, it applies without conflicts.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git stash push [-m msg] [-u] [-- paths]` | Save changes (`git stash` alone = push) | Changes local state |
| `git stash list` / `show [-p]` | Inspect | Safe anywhere |
| `git stash apply [--index] [stash@{n}]` | Re-apply, keep the stash | Changes local state |
| `git stash pop [--index] [stash@{n}]` | Re-apply, then drop if clean | Changes local state |
| `git stash branch <name> [stash@{n}]` | Branch from the stash's base and apply | Changes local state |
| `git stash drop [stash@{n}]` / `git stash clear` | Delete one / all stashes | **Practice repository first** |

> [!CAUTION]
> `git stash drop` and `git stash clear` delete stashes without confirmation. `drop` prints the stash's commit id (`Dropped stash@{0} (ee3ba7a…)`), and `git stash apply <that-id>` still works while the commit exists. After `clear`, a stash can sometimes be found with `git fsck --unreachable | grep commit` (stash commits are titled "WIP on …" or "On <branch>: …"), but don't rely on it.

## Step-by-Step Example — Urgent Fix Mid-Feature

1. On `feature/class-report` with uncommitted work: `git stash push -u -m "class report WIP"`.
2. `git switch main && git switch -c fix/urgent-npe`, fix, commit, push.
3. `git switch feature/class-report && git stash pop`.
4. `git status` — work restored; `git stash list` — empty again.

## Common Mistakes

- **Forgetting `-u`** — untracked files stay behind (and may block a switch or travel with you).
- **Letting stashes pile up** with no messages. Use `-m`; prefer a WIP commit on a branch for anything long-lived.
- **Expecting `pop` to drop the stash after a conflict** — it keeps it; drop it yourself when done.
- **Assuming stashes are backed up** — they're local to your clone.

## Interview Angle

"What is `git stash` and when do you use it?" — temporarily shelve uncommitted changes to switch context. "`stash apply` vs `stash pop`?" — pop also drops the stash (only when there's no conflict). Mention `-u`, `--index` and `stash branch` for depth.

## Recap

- `git stash push -m "…"` shelves tracked changes; `-u` includes untracked files.
- `apply` keeps the stash; `pop` drops it if it applied cleanly.
- Conflicts on pop keep the stash; resolve, then drop.
- `git stash branch` applies a stash on its original base; stashes are local.

## Related Topics

- [git switch and git checkout](../../branching-and-merging/git-switch-and-checkout/content.md)
- [Safe Recovery Workflows](../safe-recovery-workflows/content.md)
- [Lab 08 — Stash Work and Switch Branches](../../labs/git-lab-08-stash-and-switch/content.md)
