# Interactive Rebase: Reorder, Squash, Reword, Edit

**Module:** Rebasing and History Rewriting · **Interview priority:** Frequently asked

## Learning Objectives

- Open an interactive rebase and read its todo list.
- Squash, fixup, reword, reorder, edit and drop commits.
- Use `git commit --fixup` with `--autosquash` to tidy a branch automatically.

## What Is It?

`git rebase -i <base>` opens a **todo list** of the commits after `<base>` in your editor. You change the commands (and the order of lines), save, and Git replays the commits following your instructions. It's the standard way to turn a messy work-in-progress branch into a clean series of commits **before sharing it**.

## Why It Matters

Real work produces commits like "WIP", "fix name", "debug output". Reviewers and future readers need "Add ClassReport with a student count and its test". Interactive rebase lets you keep committing freely while you work, then present a clean history in the pull request.

> [!CAUTION]
> Interactive rebase **rewrites every commit from the first one you change onwards**. Use it on commits that only you have — normally your unpushed or personal feature branch. Make a backup branch first if you're unsure: `git branch backup/before-tidy`.

## How It Works

Priya's branch before tidying:

```text
e580a8e debug output
89fb326 add test
cc44ec4 fix name
c1de9fa WIP
80bdfea Add ClassReport
3e1ce0a Create gradebook project      ← main
```

```bash
git rebase -i main
```

Git opens this todo list (oldest first — the opposite of `git log`):

```text
pick 80bdfea # Add ClassReport
pick c1de9fa # WIP
pick cc44ec4 # fix name
pick 89fb326 # add test
pick e580a8e # debug output

# Rebase 3e1ce0a..e580a8e onto 3e1ce0a (5 commands)
#
# Commands:
# p, pick <commit> = use commit
# r, reword <commit> = use commit, but edit the commit message
# e, edit <commit> = use commit, but stop for amending
# s, squash <commit> = use commit, but meld into previous commit
# f, fixup [-C | -c] <commit> = like "squash" but keep only the previous
#                    commit's log message, unless -C is used, in which case
#                    keep only this commit's message; -c is same as -C but
#                    opens the editor
# x, exec <command> = run command (the rest of the line) using shell
# b, break = stop here (continue rebase later with 'git rebase --continue')
# d, drop <commit> = remove commit
# …
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
#
# However, if you remove everything, the rebase will be aborted.
```

(Some lines about `label`, `reset`, `merge` and `update-ref` were left out.) Saving the list unchanged replays nothing new — the branch stays as it is.

## The Commands

| Command | Effect | Use for |
|---------|--------|---------|
| `pick` | Keep the commit as is | Default |
| `reword` | Keep the change, edit the message | Fixing "add test" → a proper message |
| `edit` | Stop after applying it so you can amend (change files, split it) | Splitting a commit, fixing a file in an old commit |
| `squash` | Meld into the previous commit; edit the combined message | Combining two meaningful commits |
| `fixup` | Meld into the previous commit; discard this message | "WIP", "fix typo" commits |
| `drop` (or delete the line) | Remove the commit | Debug or accidental commits |
| `exec <cmd>` | Run a shell command at that point; stops if it fails | `exec mvn -q test` after each commit to prove each one builds |
| reorder lines | Apply commits in a different order | Grouping related changes (may cause conflicts) |

## Squashing the Example

Priya edits the list to:

```text
pick 80bdfea # Add ClassReport
fixup c1de9fa # WIP
fixup cc44ec4 # fix name
squash 89fb326 # add test
drop e580a8e # debug output
```

Because of `squash`, Git opens the editor with a combined message template:

```text
# This is a combination of 4 commits.
# This is the 1st commit message:

Add ClassReport

# The commit message #2 will be skipped:

# WIP

# The commit message #3 will be skipped:

# fix name

# This is the commit message #4:

add test
```

She replaces it with `Add ClassReport with a student count and its test`.

**Output:**

```text
[detached HEAD b14de07] Add ClassReport with a student count and its test
 Date: Thu Oct 1 11:08:40 2026 +0530
 3 files changed, 18 insertions(+)
 create mode 100644 src/main/java/com/example/gradebook/ClassReport.java
 create mode 100644 src/main/java/com/example/gradebook/Student.java
 create mode 100644 src/test/java/com/example/gradebook/ClassReportTest.java
Successfully rebased and updated refs/heads/feature/class-report.
```

```bash
git log --oneline
```

**Output:**

```text
b14de07 Add ClassReport with a student count and its test
3e1ce0a Create gradebook project
```

Five commits became one; `debug.txt` (from the dropped commit) is gone from the branch.

## Fixup Commits and --autosquash

When you notice a problem in an earlier commit while working, record the fix as a fixup commit that names its target:

```bash
git add src/main/java/com/example/gradebook/ClassReport.java
git commit --fixup=b14de07
```

**Output:**

```text
[feature/class-report 024865b] fixup! Add ClassReport with a student count and its test
 1 file changed, 1 insertion(+), 1 deletion(-)
```

Later, `git rebase -i --autosquash main` builds the todo list for you — the fixup is moved under its target and marked `fixup`:

```text
pick b14de07 # Add ClassReport with a student count and its test
fixup 024865b # fixup! Add ClassReport with a student count and its test
pick ea96d6a # Document ClassReport in README
```

**Output (`git log --oneline` after saving):**

```text
61acf21 Document ClassReport in README
254e66e Add ClassReport with a student count and its test
3e1ce0a Create gradebook project
```

Set `git config --global rebase.autoSquash true` to make `--autosquash` the default for interactive rebases.

## Editing an Old Commit

Mark it `edit`; when the rebase stops there:

```bash
# change files, then
git add <files>
git commit --amend          # rewrite this commit
git rebase --continue
```

To **split** a commit at an `edit` stop: `git reset HEAD~1` (unstages that commit's changes), then stage and commit the pieces separately, then `git rebase --continue`.

## Commands

### git rebase -i

**Syntax:** `git rebase -i [--autosquash] <base>` (often `git rebase -i HEAD~5` for the last five commits) · **Safety:** **Practice repository first** — rewrites the listed commits.

### git commit --fixup / --squash

**Syntax:** `git commit --fixup=<commit>` · **Safety:** changes local state (adds a commit).

## Step-by-Step Example

1. `git log --oneline main..` — the commits you'll rewrite. Are any already used by others? If yes, stop.
2. `git branch backup/tidy` — safety pointer.
3. `git rebase -i main` — fixup the noise, reword vague messages, drop debug commits.
4. Resolve conflicts if reordering caused any; `git rebase --continue`.
5. `mvn -B verify` — the result must still build (add `exec` lines to check every commit).
6. Compare: `git diff backup/tidy` should be **empty** if you only reorganised commits.
7. Delete the backup branch when satisfied.

## Common Mistakes

- **Deleting a line by accident** — that commit is dropped. Abort with `git rebase --abort` while the rebase is still in progress, or recover from the reflog afterwards.
- **Squashing into the wrong commit**: `squash`/`fixup` meld into the line **above**.
- **Reading the list in `git log` order.** The todo list is oldest first.
- **Tidying commits that are already on `main`.**

## Interview Angle

"How do you squash commits?" — `git rebase -i <base>`, mark later commits `squash` or `fixup`, edit the message; then force-push with lease if the branch was already pushed (and is yours). Alternatively, a squash merge on GitHub. Mention `--fixup` + `--autosquash` as the efficient habit.

## Recap

- `git rebase -i <base>` lists commits oldest first; edit commands and order, then save.
- `fixup`/`squash` combine, `reword` renames, `edit` stops for amending, `drop` removes, `exec` tests.
- `git commit --fixup=<hash>` + `--autosquash` automates tidying.
- Rewrite only your own, unshared commits; keep a backup branch and compare after.

## Related Topics

- [git rebase and Rebase vs Merge](../git-rebase/content.md)
- [Commit Messages and Atomic Commits](../../basic-workflow/commit-messages-and-atomic-commits/content.md)
- [Rewriting History Safely](../rewriting-history-safely/content.md)
