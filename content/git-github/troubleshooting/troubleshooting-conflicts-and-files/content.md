# Troubleshooting Conflicts, Ignored Files and Line Endings

**Module:** Git Troubleshooting Playbook · **Interview priority:** Frequently asked

> [!NOTE]
> All four scenarios were reproduced in the practice lab (Git 2.52 on Windows, so line endings were tested with real CRLF files).

## Learning Objectives

- Work through merge and rebase conflicts methodically, including backing out.
- Find out why a file is unexpectedly ignored.
- Diagnose and permanently fix whole-file diffs caused by line endings.

## How to Use This Topic

Same structure as the other playbook topics: Symptoms → Possible Causes → Diagnostic Workflow → Fix → Prevention → Interview Explanation. For the mechanics of conflicts see [Merge Conflicts](../../branching-and-merging/merge-conflicts/content.md) and [git rebase](../../rebasing-and-rewriting/git-rebase/content.md); this page is the quick decision guide.

## Scenario 1: Merge Conflict

### Symptoms

`CONFLICT (content): Merge conflict in …`; `git status` lists "Unmerged paths" and `both modified`.

### Possible Causes

Both branches changed the same lines since the merge base; or one modified a file the other deleted.

### Diagnostic Workflow

1. `git status` — which files, which kind (`both modified`, `deleted by them`…).
2. `git log --merge --oneline` — the commits on each side touching those files.
3. `git diff` — the conflict hunks; enable `merge.conflictStyle zdiff3` to see the base.

### Fix

Edit each file to the correct combined result, remove markers, `git diff --check` (reports leftover markers), build and test, `git add`, `git commit`. Not ready? `git merge --abort`.

### Prevention

Small, short-lived branches; update from `main` often; separate formatting changes.

### Interview Explanation

"I identify both sides' intent (log --merge, the base via zdiff3), combine them, check for markers, test, then add and commit — or abort and talk to the other author."

## Scenario 2: Rebase Conflict

### Symptoms

`error: could not apply d7d1b8b... Raise the B threshold to 80`; `git status` shows "interactive rebase in progress".

### Possible Causes

A commit being replayed touches lines that changed on the new base. Several commits may each conflict.

### Diagnostic Workflow

`git status` shows which commit is being applied and what's next; `git show <that-commit>` shows what it intended.

### Fix

Resolve, `git add`, `git rebase --continue` — repeat per commit. Remember **"ours" = the new base, "theirs" = your commit** during a rebase. To back out completely: `git rebase --abort`. If the same conflict repeats in many commits, abort and merge instead, or squash first.

### Prevention

Rebase often (small distance); `git config rerere.enabled true` lets Git reuse recorded resolutions.

### Interview Explanation

"Rebase conflicts are per commit; I resolve with the swapped ours/theirs in mind, continue, and abort if it becomes repetitive — merging is a legitimate alternative."

## Scenario 3: A File Is Unexpectedly Ignored

### Symptoms

A new file doesn't appear in `git status`, and `git add` says "The following paths are ignored by one of your .gitignore files".

### Possible Causes

A broad pattern (`*.log*`, `build/`), a global excludes file, `.git/info/exclude`, or an ignored parent directory.

### Diagnostic Workflow

```bash
git check-ignore -v src/main/resources/app.log.template
```

**Expected result:** the file, line number and pattern that matched — e.g. `.gitignore:2:*.log*`. A global rule shows the global file's path. (Captured examples: [.gitignore and Tracking Files](../../configuration-and-repositories/gitignore-and-tracking/content.md).)

### Fix

Narrow the pattern, or add a negation (`!app.log.template`) — remembering that a file inside an **ignored directory** can't be re-included; ignore the directory's contents (`dir/*`) instead. To add once despite the rule: `git add -f <file>` (it's then tracked, and the rule no longer applies to it).

### Prevention

Specific patterns; project rules in `.gitignore`, personal rules in the global excludes file.

### Interview Explanation

"`git check-ignore -v` tells me exactly which file and line ignore it; then I narrow the pattern or add a negation."

## Scenario 4: Line-Ending Changes Make Whole Files "Modified"

### Symptoms

A one-line edit shows every line changed; `git diff --stat` reports all lines modified; a teammate on another OS sees files modified right after cloning.

**Output (`git diff --stat` after an editor saved `App.java` with CRLF):**

```text
 src/main/java/com/example/gradebook/App.java | 18 +++++++++---------
 1 file changed, 9 insertions(+), 9 deletions(-)
```

### Possible Causes

Different `core.autocrlf` settings across machines, editors converting line endings, and no `.gitattributes` defining the policy.

### Diagnostic Workflow

```bash
git diff -w --stat          # nothing → the change is whitespace only
git ls-files --eol
```

**Output (`git ls-files --eol`, first lines):**

```text
i/lf    w/lf    attr/                 	README.md
i/lf    w/lf    attr/                 	pom.xml
i/lf    w/crlf  attr/                 	src/main/java/com/example/gradebook/App.java
```

`i/` is the line ending in the index (repository), `w/` in your working file: `App.java` is LF in the repository but CRLF on disk, and there's no attribute policy.

### Fix

Declare the policy in a committed `.gitattributes`:

```text
* text=auto eol=lf
*.cmd text eol=crlf
*.png binary
```

```bash
git add .gitattributes
git add --renormalize .
git status -s
git ls-files --eol
```

**Output:**

```text
A  .gitattributes
i/lf    w/lf    attr/text=auto eol=lf 	.gitattributes
i/lf    w/lf    attr/text=auto eol=lf 	README.md
i/lf    w/lf    attr/text=auto eol=lf 	pom.xml
i/lf    w/crlf  attr/text=auto eol=lf 	src/main/java/com/example/gradebook/App.java
```

`App.java` no longer shows as modified: the CRLF file normalises to the same LF content in the index. Commit `.gitattributes` (plus any files `--renormalize` changed). The working copy is rewritten with LF the next time the file is checked out.

### Prevention

A `.gitattributes` in every repository from day one; editor setting "line endings: LF" for Java projects; on Windows, the attributes file makes `core.autocrlf` differences harmless.

### Interview Explanation

"Whole-file diffs with nothing in `diff -w` are line endings. `git ls-files --eol` shows index vs working-tree endings; a committed `.gitattributes` with `text=auto` (and explicit `eol` rules) plus `git add --renormalize .` fixes it for everyone."

## Key Takeaways

- Conflicts: understand both sides, resolve, check markers, test; `--abort` is always available.
- Rebase conflicts repeat per commit and swap ours/theirs.
- `git check-ignore -v` explains any ignored file.
- Line endings: confirm with `diff -w` and `ls-files --eol`; fix with `.gitattributes` and `--renormalize`.

## Related Topics

- [Merge Conflicts](../../branching-and-merging/merge-conflicts/content.md)
- [.gitignore and Tracking Files](../../configuration-and-repositories/gitignore-and-tracking/content.md)
- [git diff](../../basic-workflow/git-diff/content.md)
