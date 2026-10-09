# Lab 07: Recover from an Unwanted Change

**Lab:** 07 · **Module:** Context, Sessions and Checkpoints · **Difficulty:** Intermediate · **Verification:** Partially tested — all Git commands and their output were run in a local orderdesk repository; `/rewind` needs your model session and was not run.

## Objective

Undo an unwanted change two ways — with **checkpoints** (`/rewind`) for Claude's edits in the current session, and with **Git** for anything else — and learn which tool fits which situation, without using destructive commands blindly.

## Prerequisites

- *Lab Setup*; the lesson *Checkpoints, Recovery and Worktrees*.

## Scenario

You asked Claude to reword one error message. It also edited the README and created a scratch file. You want to keep some of it, discard the rest, and lose nothing by accident.

## Starting State

```bash
git switch main
git switch -c lab07-recovery
git status --short      # clean
```

## Instructions

### Step 1: Make a change you'll partly regret

```bash
claude
```

```text
Change the 404 message in OrderController from "not found" to "does not exist". Also add a
Changelog section to README.md mentioning it, and write your notes to notes.txt.
```

Approve the edits.

### Step 2: Rewind Claude's edits (checkpoint)

```text
/rewind
```

Pick the checkpoint **before** your prompt and choose to restore code (and conversation, if you like).

**Expected result:** `OrderController.java` and `README.md` return to their previous content. Check what remains:

```bash
git status --short
```

Don't assume — look at what `git status` shows. Changes made by a **Bash command** (for example `echo … > notes.txt`) are documented as not tracked by checkpoints, so they remain after a rewind; note what happened to `notes.txt` in your run.

### Step 3: Redo it, then recover with Git instead

Repeat Step 1 (or make the same edits by hand), then inspect:

```bash
git status --short
git diff --stat
```

**Output:**

```text
 M README.md
 M src/main/java/com/example/orderdesk/order/OrderController.java
?? notes.txt
```

```text
 README.md                                                      | 4 ++++
 src/main/java/com/example/orderdesk/order/OrderController.java | 2 +-
 2 files changed, 5 insertions(+), 1 deletion(-)
```

Discard only the README change:

```bash
git restore README.md
git status --short
```

**Output:**

```text
 M src/main/java/com/example/orderdesk/order/OrderController.java
?? notes.txt
```

### Step 4: Park a change with stash

```bash
git stash push -m "reworded 404 message"
git status --short
git stash list
```

**Output:**

```text
Saved working directory and index state On lab07-recovery: reworded 404 message
?? notes.txt
stash@{0}: On lab07-recovery: reworded 404 message
```

The controller change is saved, not lost. Untracked files aren't stashed by default.

### Step 5: Remove an untracked file safely

Always dry-run first:

```bash
git clean -n
```

**Output:**

```text
Would remove notes.txt
```

Then remove exactly that file:

```bash
git clean -f notes.txt
```

**Output:**

```text
Removing notes.txt
```

### Step 6: Bring the parked change back

```bash
git stash pop
git status --short
```

**Output** (last line):

```text
 M src/main/java/com/example/orderdesk/order/OrderController.java
```

Decide: keep it (commit after review) or `git restore` it.

## Verification

- ☐ You used `/rewind` once and saw what it restored.
- ☐ You discarded one file with `git restore` and kept another.
- ☐ You stashed and restored a change.
- ☐ You removed an untracked file only after a dry run.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `/rewind` didn't remove a file | Created by Bash, not Claude's edit tools | Remove it with Git (`git clean -n` first) |
| `git stash pop` conflicts | The file changed since stashing | Resolve the conflict; the stash is kept until resolved |
| Change gone after `git restore` | `restore` discards uncommitted changes permanently | Stash or commit first if unsure |

## Security Notes

- `git reset --hard`, `git clean -fd` and `git checkout -- .` destroy uncommitted work with no undo. This lab uses targeted commands with dry runs for that reason.
- Run cleanup commands only inside the practice repository, never in a directory you haven't inspected.

## Cleanup

```bash
git switch main
git branch -D lab07-recovery
git stash list        # should be empty
```

## Completion Checklist

- ☐ You can say when to use `/rewind` and when to use Git.
- ☐ You never ran a destructive command without checking `git status` first.

## Follow-up Challenges

- Use `/rewind` with "summarize from here" to shrink a long detour in the conversation while keeping the code.
- Create a worktree (`claude --worktree lab07-experiment`), make a risky change there, and delete it without touching your main checkout.
