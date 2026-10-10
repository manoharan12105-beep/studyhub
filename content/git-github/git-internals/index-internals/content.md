# The Index: How the Staging Area Works

**Module:** Git Internals · **Interview priority:** Awareness

> [!NOTE]
> **Advanced topic.** Read [The Three Areas of Git](../../basic-workflow/three-areas-of-git/content.md) and [The Git Object Model](../git-object-model/content.md) first.

## Learning Objectives

- Describe what the index file stores for each tracked path.
- Follow exactly what `git add` and `git commit` do to objects, the index and refs.
- Build a commit with plumbing commands to prove the model, and know the index's role in conflicts and performance.

## What Is It?

The **index** (`.git/index`, also called the staging area or cache) is a single binary file listing **every tracked path** with:

- the **blob id** of the content to be committed,
- the **mode** (regular, executable, symlink, submodule),
- a **stage number** (0 normally; 1–3 during a merge conflict),
- cached **file-system metadata** (size, modification time, inode…) used to detect changes quickly.

It is a complete proposed snapshot — not a list of changes.

## Why It Matters

Understanding the index explains why `git add` takes a snapshot of the file at that moment, why `git status` is fast in large repositories, what "mark resolved" means in a conflict, and why `git commit` is quick: the tree is built straight from the index.

## How It Works

### git add, step by step

```bash
git ls-files --stage README.md
```

**Output (clean repository):**

```text
100644 08053569aa67a914c0121298091f2b60d29bbe4c 0	README.md
```

Priya appends a line to `README.md`. Before `git add`, the index still holds the old blob; the new content's id is different:

```bash
git ls-files --stage README.md
git hash-object README.md
```

**Output:**

```text
100644 08053569aa67a914c0121298091f2b60d29bbe4c 0	README.md
763ffb5ea3ac118aa4015ff390bf527e33f3fa74
```

```bash
git add README.md
git ls-files --stage README.md
```

**Output:**

```text
100644 763ffb5ea3ac118aa4015ff390bf527e33f3fa74 0	README.md
```

`git add` (1) wrote the new content as blob `763ffb5…` into the object database and (2) updated the README entry in the index. `git diff --cached --raw` compares the index with `HEAD`'s tree:

**Output:**

```text
:100644 100644 0805356 763ffb5 M	README.md
```

### git commit, by hand

`git commit` = build a tree from the index + create a commit object + move the branch. The plumbing equivalents:

```bash
TREE=$(git write-tree)                                              # tree from the index
NEW=$(echo "Invite contributions in README" | git commit-tree $TREE -p HEAD)
git update-ref refs/heads/main $NEW                                 # move the branch
git log --oneline -2
```

**Output:**

```text
0bab087 Invite contributions in README
3a070e0 Raise the B threshold to 78
```

`git status` afterwards is clean — exactly as if `git commit` had been used. (Porcelain `git commit` also runs hooks, writes the reflog message and handles the editor — use it in real work.)

### Stages during a conflict

During a merge conflict the index holds up to three entries for one path — stage 1 (base), 2 (ours), 3 (theirs) — as seen in [Merge Conflicts](../../branching-and-merging/merge-conflicts/content.md) with `git ls-files -u`. `git add` replaces them with a single stage-0 entry: that is "marking resolved". A commit can't be made while any path has stages 1–3.

### Why git status is fast

For each path, Git compares the file's current size and modification time with the values cached in the index. If they match, it assumes the content is unchanged without reading or hashing the file. Only changed-looking files are hashed. (File-system monitors such as `core.fsmonitor` speed this up further in very large repositories.)

## Index Flags (Use Carefully)

| Command | Effect | Appropriate use |
|---------|--------|-----------------|
| `git update-index --assume-unchanged <file>` | Git stops checking the file for changes | Performance hint for huge, never-changing files — **not** a way to ignore local edits |
| `git update-index --skip-worktree <file>` | Git keeps the index version and ignores local modifications | Locally modified config you must not commit (sparse checkout uses it too) |

Both are local to your clone and easy to forget; prefer `.gitignore` with an example file for local configuration ([Spring Boot Repository Collaboration](../../java-project-workflow/spring-boot-repository-collaboration/content.md)).

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git ls-files --stage` | Index entries with mode, blob id, stage | Safe anywhere |
| `git ls-files -u` | Unmerged (conflicted) entries | Safe anywhere |
| `git diff --cached --raw` | Index vs HEAD, raw form | Safe anywhere |
| `git write-tree` / `git commit-tree` / `git update-ref` | Build a commit by hand | Changes local state — **Practice repository first** |

## Step-by-Step Example

Show that staged content is a snapshot:

1. Edit `README.md`, `git add README.md`, note the blob id with `git ls-files --stage README.md`.
2. Edit `README.md` again — `git ls-files --stage` still shows the first id (`MM` in `git status -s`).
3. `git commit` records the first version; the second edit remains unstaged.

## Common Mistakes

- **Thinking the index stores diffs.** It stores the full proposed snapshot (as blob ids).
- **Using `--assume-unchanged` to hide local edits** — Git may overwrite them on checkout; use `--skip-worktree` or, better, ignored local files.
- **Deleting `.git/index` to "fix" status** — Git can rebuild it with `git reset`, but you lose what was staged.

## Interview Angle

"What is the index?" — a binary file representing the next commit's snapshot: path, mode, blob id, stage, plus cached stat data for speed. "What does `git add` do internally?" — writes a blob and updates the index entry. "How is a commit built?" — `write-tree` from the index, `commit-tree`, update the branch ref.

## Recap

- The index lists every tracked path with blob id, mode, stage and cached stat data.
- `git add` = write blob + update index; `git commit` = write tree from index + commit + move ref.
- Conflicts use stages 1–3; `git add` resolves to stage 0.
- Cached stat data makes `git status` fast.

## Related Topics

- [The Three Areas of Git](../../basic-workflow/three-areas-of-git/content.md)
- [The Git Object Model](../git-object-model/content.md)
- [References and HEAD Internals](../refs-and-head-internals/content.md)
