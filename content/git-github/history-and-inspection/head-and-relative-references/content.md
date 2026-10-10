# HEAD and Relative Commit References

**Module:** Commit History and Inspection · **Interview priority:** Core

## Learning Objectives

- Explain what `HEAD` is and how it normally points to a branch.
- Use `~` and `^` to name ancestors, including the second parent of a merge.
- Resolve any reference to a hash with `git rev-parse`.

## What Is It?

**`HEAD`** is Git's name for "the commit you currently have checked out". Normally it doesn't point at a commit directly — it points at the **current branch**, and the branch points at a commit:

```text
HEAD ──► refs/heads/main ──► 3a070e0
```

**Relative references** name commits by walking back from any starting point:

- **`X~n`** — go back *n* generations following **first parents**. `HEAD~1` is the parent, `HEAD~3` the great-grandparent.
- **`X^n`** — the *n*-th **parent** of X. `HEAD^` (= `HEAD^1`) is the first parent; `HEAD^2` is the second parent, which only merge commits have.

## Why It Matters

You constantly need to name commits without copying hashes: "undo the last commit" (`HEAD~1`), "what did the previous commit change" (`git show HEAD~1`), "compare with three commits ago" (`git diff HEAD~3`). Interviewers like `~` vs `^` because it tests whether you understand parents and merges.

## How It Works

On disk, `HEAD` is a small file:

```bash
cat .git/HEAD
cat .git/refs/heads/main
```

**Output:**

```text
ref: refs/heads/main
3a070e0d3d0abb543338e9b1bffc80830d43dd57
```

When you commit, Git writes the new commit's id into `refs/heads/main`; `HEAD` keeps pointing at `main`, so it follows along. When `HEAD` contains a hash instead of `ref: …`, you are in **detached HEAD** state — see [Detached HEAD](../../rebasing-and-rewriting/detached-head/content.md).

## Walking the gradebook History

```text
                 3e2381d ◄── 8b503ca            (feature branch: second parent of the merge)
                /                    \
... 4b17431 ◄── d0e8c67 ◄──────────── 10b9974 ◄── 3a070e0  ← main ← HEAD
```

```bash
for r in HEAD HEAD~1 HEAD~1^1 HEAD~1^2 HEAD~2 HEAD^^ HEAD~1^2~1 HEAD~4; do
  printf '%-12s ' "$r"; git log -1 --format='%h %s' "$r"
done
```

**Output:**

```text
HEAD         3a070e0 Raise the B threshold to 78
HEAD~1       10b9974 Merge branch 'feature/class-report'
HEAD~1^1     d0e8c67 Round averages to two decimals
HEAD~1^2     8b503ca Show each student's average in ClassReport
HEAD~2       d0e8c67 Round averages to two decimals
HEAD^^       d0e8c67 Round averages to two decimals
HEAD~1^2~1   3e2381d Add ClassReport with one line per student
HEAD~4       7c8bad0 Add Student record
```

- `HEAD~2` and `HEAD^^` are the same: two first-parent steps.
- From the merge `10b9974`, `^1` stays on `main` (`d0e8c67`) and `^2` jumps to the feature branch (`8b503ca`).
- `HEAD~1^2~1` = merge → its second parent → one step back on the feature branch.

## Other Ways to Name Commits

| Reference | Means |
|-----------|-------|
| `main`, `feature/x` | The commit a branch points to |
| `origin/main` | Where `main` was on the remote at your last fetch |
| `v1.0.0` | A tag |
| `@` | Shorthand for `HEAD` |
| `main@{1}` | Where `main` pointed one move ago (from the [reflog](../../undoing-and-recovery/git-reflog/content.md)) |
| `main@{yesterday}` | Where `main` pointed yesterday on **this** clone |
| `@{u}` / `@{upstream}` | The current branch's upstream (e.g. `origin/main`) |
| `HEAD:README.md` | The README file in HEAD's snapshot |

## git rev-parse

`git rev-parse` turns any reference into a full hash — handy in scripts and when you want to be sure what a name means:

```bash
git rev-parse HEAD
git rev-parse --short HEAD~1
git rev-parse --abbrev-ref HEAD
```

**Output:**

```text
3a070e0d3d0abb543338e9b1bffc80830d43dd57
10b9974
main
```

## Commands

### git rev-parse

**Syntax:** `git rev-parse [--short] [--abbrev-ref] <rev>` · **Safety:** safe anywhere.

### Using references with other commands

`git show HEAD~2`, `git diff HEAD~3 HEAD`, `git log HEAD~5..HEAD`, `git reset --soft HEAD~1` — every command that takes a commit accepts these forms.

## Step-by-Step Example

1. `git log --oneline --graph -6` — look at the shape of recent history.
2. `git show HEAD~1 --stat` — what the previous commit changed.
3. On a merge commit `M`: `git log --oneline M^1..M^2` — the commits the merge brought in from the feature branch.
4. `git diff HEAD~3 HEAD --stat` — the combined change of the last three steps.

## Common Mistakes

- **`HEAD^2` when you meant "two commits back".** `^2` is the *second parent*; on a normal commit it doesn't exist. Use `HEAD~2`.
- **Assuming `HEAD~1` after a merge reaches the feature branch.** `~` always follows first parents.
- **`main@{yesterday}` on a fresh clone.** Reflog-based references only know this clone's local history.
- **Quoting in PowerShell or zsh:** `^` and `@{…}` may need quotes (`'HEAD@{1}'`) because the shell treats them specially.

## Interview Angle

"What is HEAD?" — a reference to the current commit, normally via the current branch. "Difference between `HEAD~2` and `HEAD^2`?" — two generations back along first parents versus the second parent of a merge.

## Recap

- `HEAD` → current branch → commit; a hash in `HEAD` means detached.
- `~n` walks back *n* first-parent generations; `^n` picks the *n*-th parent.
- `@`, `@{u}`, `branch@{n}` and `rev:path` are other handy forms.
- `git rev-parse` resolves any of them to a hash.

## Related Topics

- [Commits, Hashes and the History Graph](../commits-and-history-graph/content.md)
- [References and HEAD Internals](../../git-internals/refs-and-head-internals/content.md)
- [git reset](../../undoing-and-recovery/git-reset/content.md)
