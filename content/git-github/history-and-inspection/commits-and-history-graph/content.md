# Commits, Hashes and the History Graph

**Module:** Commit History and Inspection · **Interview priority:** Core

## Learning Objectives

- Describe what a commit object contains and how its hash is produced.
- Explain parent commits, merge commits with two parents, and the root commit.
- Read history as a **directed acyclic graph (DAG)** with `git log --graph`.

## What Is It?

A **commit** is a small record containing:

- a **tree** — the snapshot of every tracked file at that moment;
- zero or more **parents** — the commit(s) it was built on;
- the **author** and **committer**, each with a timestamp;
- the **message**.

Its **hash** (commit id, SHA) is a cryptographic hash of exactly those contents — 40 hexadecimal characters with SHA-1, which is still the default format. Usually you see the first 7: `3a070e0`.

## Why It Matters

The hash makes history **tamper-evident**: change anything in a commit (one character of the message, a parent) and its id changes — and so do the ids of every commit after it, because each contains its parent's id. That is why rewriting history (rebase, amend) produces "new" commits and why pushing rewritten history causes conflicts with teammates.

## How It Works

The gradebook history after Arjun's `feature/class-report` branch was merged:

```bash
git log --oneline --graph --decorate --all
```

**Output:**

```text
* 3a070e0 (HEAD -> main) Raise the B threshold to 78
*   10b9974 Merge branch 'feature/class-report'
|\  
| * 8b503ca (feature/class-report) Show each student's average in ClassReport
| * 3e2381d Add ClassReport with one line per student
* | d0e8c67 Round averages to two decimals
|/  
* 4b17431 Document the grading scale in README
* 7c8bad0 Add Student record
* 8ba66e3 Add D grade for averages from 50 to 59
* 8ddf4ed Create gradebook project
```

Each `*` is a commit; lines connect it to its parents. Newest is at the top.

```text
8ddf4ed ◄─ 8ba66e3 ◄─ 7c8bad0 ◄─ 4b17431 ◄─ d0e8c67 ◄──────── 10b9974 ◄─ 3a070e0   ← main, HEAD
 (root)                               ▲                          │
                                      └── 3e2381d ◄─ 8b503ca ◄───┘ (second parent)
                                                        ▲
                                                feature/class-report
```

- Arrows point **from child to parent**: a commit knows its parents, never its children.
- **Directed** — edges have a direction (child → parent). **Acyclic** — you can never follow parents back to where you started, because a commit's id depends on its parents, which must exist first.
- `8ddf4ed` is the **root commit** (no parent). A repository usually has one.
- `10b9974` is a **merge commit** with **two parents**: `d0e8c67` (first parent — the branch you were on) and `8b503ca` (second parent — the branch merged in).

## Inside a Commit

`git cat-file -p` prints the raw object:

```bash
git cat-file -p 10b9974
```

**Output:**

```text
tree 37a749c2b19dcbab4558bf780c5b89c32537d3bf
parent d0e8c67a8106c826a100d7eb4a216d8e7c55eb03
parent 8b503ca3a25db20f9a2d8c72a66897a365ce9ed9
author Priya Sharma <priya@example.com> 1791269100 +0530
committer Priya Sharma <priya@example.com> 1791269100 +0530

Merge branch 'feature/class-report'
```

The timestamp is in seconds since 1970 plus the time-zone offset. Nothing else is stored — in particular, **no branch name**. Branches are separate labels pointing at commits ([Branches](../../branching-and-merging/branches-fundamentals/content.md)).

## Hashes in Practice

- Any **unique prefix** works as a reference: `git show 10b9974`. Git complains if a prefix is ambiguous; 7–12 characters are normally enough.
- Hashes are the same on every clone, so `3a070e0` identifies the same commit for Priya, Arjun and GitHub.
- Two commits with identical files still have different ids if their parent, time, author or message differs.

> [!NOTE]
> Git uses SHA-1 by default and hardens it against known collision attacks. Repositories can also be created with SHA-256 (`git init --object-format=sha256`), but hosting support is still limited, so SHA-1 repositories remain the norm. Details in [The Git Object Model](../../git-internals/git-object-model/content.md).

## Commands

### git log --graph

**Syntax:** `git log --oneline --graph --decorate --all` · **Purpose:** draw the DAG with branch labels. **Safety:** safe anywhere.

### git cat-file -p

**Syntax:** `git cat-file -p <commit>` · **Purpose:** print a commit's raw contents. **Safety:** safe anywhere.

## Step-by-Step Example

In the gradebook history above:

1. Find the root commit: the bottom line, `8ddf4ed` (`git rev-list --max-parents=0 HEAD` prints it).
2. Find the merge commit: the `*` with two lines below it, `10b9974` (`git log --merges` lists merges).
3. Name both parents of the merge with `git cat-file -p 10b9974`.
4. Explain why `feature/class-report` still points at `8b503ca` after the merge: merging moves the branch you are **on** (`main`), not the merged branch.

## Common Mistakes

- **Thinking a commit stores a diff.** It stores a full snapshot (tree); diffs are computed when you ask.
- **Thinking commits belong to branches.** A commit is reachable from zero or more branches; branches are just pointers.
- **Reading the graph upside down.** Newest is at the top in `git log`.

## Interview Angle

"What is a commit in Git?" — snapshot (tree) + parents + author/committer + message, identified by a hash of that content. "Why is Git history a DAG?" — commits point to parents (directed), merges create multiple parents, and hashing makes cycles impossible (acyclic).

## Recap

- A commit = tree + parents + author + committer + message; its hash is computed from all of it.
- History is a DAG of child → parent links; merges have two parents; the root has none.
- Changing any commit changes its id and every descendant's id.
- Branch names are not stored in commits.

## Related Topics

- [git log](../git-log/content.md)
- [HEAD and Relative References](../head-and-relative-references/content.md)
- [The Git Object Model](../../git-internals/git-object-model/content.md)
