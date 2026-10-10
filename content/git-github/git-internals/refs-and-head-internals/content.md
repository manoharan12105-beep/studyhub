# References and HEAD Internals

**Module:** Git Internals · **Interview priority:** Frequently asked

> [!NOTE]
> **Advanced topic.** Builds on [The Git Object Model](../git-object-model/content.md) and [HEAD and Relative References](../../history-and-inspection/head-and-relative-references/content.md).

## Learning Objectives

- Explain what a ref is and where branches, tags and remote-tracking branches are stored.
- Describe HEAD as a symbolic ref and detached HEAD as a direct ref.
- Inspect refs with `git show-ref`, `git symbolic-ref` and `git rev-parse`, and understand packed refs.

## What Is It?

A **reference (ref)** is a human-readable name for an object id, stored **outside** the object database:

| Ref | Location | Points to |
|-----|----------|-----------|
| Branch | `refs/heads/<name>` | A commit; moves on commit |
| Tag | `refs/tags/<name>` | A commit (lightweight) or tag object (annotated); never moves |
| Remote-tracking branch | `refs/remotes/<remote>/<name>` | A commit; moves on fetch/push |
| Stash | `refs/stash` | The latest stash commit (older ones via its reflog) |
| `HEAD` | `.git/HEAD` | Normally another ref (**symbolic ref**) |

Other special refs: `ORIG_HEAD` (before a reset/rebase/merge), `FETCH_HEAD` (what the last fetch got), `MERGE_HEAD` (during a merge).

## Why It Matters

Because refs are just names for ids, creating a branch writes 41 bytes, deleting one deletes a name (not commits), and "lost" commits are merely unreferenced. This is the mechanism behind cheap branching, the reflog and garbage collection.

## How It Works

```text
.git/HEAD                       "ref: refs/heads/main"         (symbolic)
.git/refs/heads/main            3a070e0d3d0abb543338e9b1bffc80830d43dd57
.git/refs/heads/feature/class-report   8b503ca3a25db20f9a2d8c72a66897a365ce9ed9
```

```bash
cat .git/HEAD
git symbolic-ref HEAD
git show-ref
```

**Output:**

```text
ref: refs/heads/main
refs/heads/main
8b503ca3a25db20f9a2d8c72a66897a365ce9ed9 refs/heads/feature/class-report
3a070e0d3d0abb543338e9b1bffc80830d43dd57 refs/heads/main
```

The `/` in `feature/class-report` is a real directory: `.git/refs/heads/feature/class-report`. That's why a branch called `feature` and a branch called `feature/x` can't coexist.

### What a commit does to refs

1. Write blobs/trees/commit objects.
2. Read `HEAD` → `refs/heads/main`.
3. Write the new commit id into `refs/heads/main` (and append a reflog entry).

`HEAD` itself didn't change — it still says "main" — which is why it "follows" the branch. In **detached HEAD**, step 3 writes the id into `.git/HEAD` directly.

### Packed refs

Thousands of tiny files are slow, so Git periodically moves refs into one file, `.git/packed-refs` (`git gc` or `git pack-refs --all`):

**Output (`cat .git/packed-refs` after `git gc`):**

```text
# pack-refs with: peeled fully-peeled sorted 
8b503ca3a25db20f9a2d8c72a66897a365ce9ed9 refs/heads/feature/class-report
3a070e0d3d0abb543338e9b1bffc80830d43dd57 refs/heads/main
```

After that, `.git/refs/heads/main` no longer exists as a file — **use Git commands (`show-ref`, `rev-parse`), not `cat`, to read refs**. When a packed branch moves, Git writes a new loose file that takes precedence. (Newer Git versions can also use the "reftable" format instead of files; the commands behave the same.)

### Resolving names

`git rev-parse` applies Git's lookup rules: for a name `x` it tries `x` (e.g. `HEAD`), `refs/x`, `refs/tags/x`, `refs/heads/x`, `refs/remotes/x`, `refs/remotes/x/HEAD`. So a tag and a branch with the same name are ambiguous — avoid it (Git warns `refname 'x' is ambiguous`).

```bash
git rev-parse HEAD HEAD^{tree} HEAD:README.md main
git rev-parse --git-dir --show-toplevel
```

**Output:**

```text
3a070e0d3d0abb543338e9b1bffc80830d43dd57
f805ac7069cc78d79f0db966504f48c9a619d4c1
08053569aa67a914c0121298091f2b60d29bbe4c
3a070e0d3d0abb543338e9b1bffc80830d43dd57
.git
/home/student/git-lab/gradebook
```

## Plumbing for Refs

| Command | Purpose |
|---------|---------|
| `git show-ref [--heads] [--tags]` | List refs with ids |
| `git symbolic-ref HEAD` | What HEAD points to (fails if detached) |
| `git update-ref refs/heads/x <id>` | Set a ref safely (with reflog) — what `branch -f` does underneath |
| `git for-each-ref --format='%(refname:short) %(objectname:short)' refs/heads` | Scriptable listing |
| `git rev-parse <name>` | Resolve to an id |

Prefer porcelain (`git branch`, `git tag`) in daily work; plumbing is for scripts and understanding.

## Commands

All read commands above are **safe anywhere**; `git update-ref` and `git symbolic-ref <name> <ref>` **change local state** — **Practice repository first**.

## Step-by-Step Example

Prove that a branch is only a name:

1. `git branch experiment` then `git show-ref --heads` — a new line, same id as `main`.
2. `git rev-parse experiment main` — identical ids.
3. `git branch -d experiment` — the commit is untouched (`git cat-file -t <id>` still says `commit`).

## Common Mistakes

- **Reading `.git/refs/heads/<branch>` in scripts** — fails after refs are packed. Use `git rev-parse`.
- **Editing ref files by hand** — use `git update-ref` (atomic, logged).
- **Same name for a tag and a branch** — ambiguous references.
- **Thinking deleting a branch deletes commits.**

## Interview Angle

"What is HEAD, internally?" — `.git/HEAD`, a symbolic ref containing `ref: refs/heads/<branch>`; detached when it holds an id. "How are branches stored?" — files under `refs/heads` (or in `packed-refs`) holding a commit id. Mention special refs (`ORIG_HEAD`, `FETCH_HEAD`).

## Recap

- Refs map names to ids: `refs/heads`, `refs/tags`, `refs/remotes`, `refs/stash`.
- HEAD is a symbolic ref to the current branch; a direct id means detached.
- Refs may be loose files or packed in `packed-refs` — read them with Git commands.
- `rev-parse`, `show-ref`, `symbolic-ref`, `update-ref`, `for-each-ref` are the ref plumbing.

## Related Topics

- [The Git Object Model](../git-object-model/content.md)
- [Branches](../../branching-and-merging/branches-fundamentals/content.md)
- [git reflog](../../undoing-and-recovery/git-reflog/content.md)
