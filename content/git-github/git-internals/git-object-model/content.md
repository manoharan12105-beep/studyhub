# The Git Object Model: Blobs, Trees, Commits and Tags

**Module:** Git Internals · **Interview priority:** Frequently asked

> [!NOTE]
> **Advanced topic.** You can use Git well without it, but it explains *why* commands behave as they do. Study [Commits, Hashes and the History Graph](../../history-and-inspection/commits-and-history-graph/content.md) first.

## Learning Objectives

- Name Git's four object types and what each stores.
- Explain content-addressed storage and why identical files are stored once.
- Inspect any object with `git cat-file`, `git ls-tree` and `git rev-parse`.

## What Is It?

Git's database (`.git/objects`) is a **key–value store**: the key is a hash of the content, the value is the content. Everything Git records is one of four **object types**:

| Object | Stores | Points to |
|--------|--------|-----------|
| **blob** | The bytes of one file version — no name, no permissions | — |
| **tree** | One directory: entries of mode, type, hash and **name** | blobs (files) and trees (subdirectories) |
| **commit** | A snapshot: one root tree, parent commit(s), author, committer, message | one tree, 0+ commits |
| **tag** (annotated) | Tagger, date, message, optional signature | one object (usually a commit) |

## Why It Matters

This tiny model explains a lot: why commits are snapshots, why renaming a file doesn't duplicate it, why changing any old commit changes every later hash, why branches are cheap (they're not objects at all), and why "deleted" content survives in history.

## How It Works

```text
commit 3a070e0 ──► tree f805ac7 (project root)
                     ├── blob 1c35f74   .gitignore
                     ├── blob 0805356   README.md
                     ├── blob d3a48eb   pom.xml
                     └── tree 17858bc   src
                           └── … tree main/java/com/example/gradebook
                                     ├── blob 49c1f6d  App.java
                                     ├── blob 7f31406  GradeCalculator.java
                                     └── …
```

### Content addressing

An object's id is the SHA-1 hash of a header (`blob <size>\0`) plus its content. Same content → same id, regardless of file name or location:

```bash
echo "hello" | git hash-object --stdin
printf 'hello\n' > a.txt; cp a.txt b.txt
git hash-object a.txt b.txt
```

**Output:**

```text
ce013625030ba8dba906f756967f9e9ca394464a
ce013625030ba8dba906f756967f9e9ca394464a
ce013625030ba8dba906f756967f9e9ca394464a
```

Two files, one blob. Every Git installation in the world computes the same id for that content.

### A commit

```bash
git cat-file -p HEAD
```

**Output:**

```text
tree f805ac7069cc78d79f0db966504f48c9a619d4c1
parent 10b997404d7d28c0dcbe8c24d68cd655ec2dfc74
author Priya Sharma <priya@example.com> 1791355620 +0530
committer Priya Sharma <priya@example.com> 1791355620 +0530

Raise the B threshold to 78
```

### A tree

```bash
git cat-file -p HEAD^{tree}
```

**Output:**

```text
100644 blob 1c35f74928a87a7f221bcde47ee6d9825a2583a2	.gitignore
100644 blob 08053569aa67a914c0121298091f2b60d29bbe4c	README.md
100644 blob d3a48ebc79c0a75801059b9c71298a1829d2062f	pom.xml
040000 tree 17858bcfb4bc4a05ae804a01ae35ef394e8767db	src
```

Modes: `100644` regular file, `100755` executable, `120000` symbolic link, `040000` directory (tree), `160000` submodule (a commit in another repository). **File names live in trees, not blobs** — which is why a rename doesn't create a new blob.

`git ls-tree -r` walks the whole snapshot:

**Output (`git ls-tree -r --abbrev HEAD`):**

```text
100644 blob 1c35f74	.gitignore
100644 blob 0805356	README.md
100644 blob d3a48eb	pom.xml
100644 blob 49c1f6d	src/main/java/com/example/gradebook/App.java
100644 blob 65828d0	src/main/java/com/example/gradebook/ClassReport.java
100644 blob 7f31406	src/main/java/com/example/gradebook/GradeCalculator.java
100644 blob e4b3558	src/main/java/com/example/gradebook/Student.java
100644 blob bf48b87	src/test/java/com/example/gradebook/GradeCalculatorTest.java
```

### A blob

```bash
git rev-parse HEAD:README.md
git cat-file -t 08053569aa67a914c0121298091f2b60d29bbe4c
git cat-file -s 08053569aa67a914c0121298091f2b60d29bbe4c
```

**Output:**

```text
08053569aa67a914c0121298091f2b60d29bbe4c
blob
224
```

`-t` gives the type, `-s` the size in bytes, `-p` pretty-prints the content.

### An annotated tag

A tag object names its target and type (from [Lightweight and Annotated Tags](../../tags-and-releases/git-tags/content.md)):

```text
object 3a070e0d3d0abb543338e9b1bffc80830d43dd57
type commit
tag v1.0.0
tagger Priya Sharma <priya@example.com> 1791434060 +0530

First release: averages and letter grades
```

### Writing an object by hand

```bash
echo "notes" > NOTES.md
git hash-object -w NOTES.md
```

**Output:**

```text
bfa655111293037a5564088d1a9bbca4cbcf446b
```

`-w` writes it as a **loose object** at `.git/objects/bf/a655111293037a5564088d1a9bbca4cbcf446b` — the first two hex characters are the folder name. (`git add` does exactly this for each file, then records it in the index.)

## Why Changing History Changes Every Hash

```text
change README in an old commit → new blob id → new tree id → new commit id
→ the next commit's "parent" line changes → new id → … all the way to HEAD
```

This chain is what makes history tamper-evident and what makes rewriting history visible to everyone.

## Snapshots vs "Git Stores Diffs"

Conceptually every commit is a **full snapshot** — its tree lists every file. It's efficient because unchanged files reuse the same blob and unchanged directories the same tree; a commit that changes one file creates one new blob plus new trees only along that file's path. Diffs are **computed** when you ask (`git diff`, `git log -p`). Physical compression with deltas happens separately, in packfiles — see [Snapshots, Packfiles and Storage](../packfiles-and-storage/content.md).

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git cat-file -t/-s/-p <object>` | Type / size / content | Safe anywhere |
| `git ls-tree [-r] <tree-ish> [<path>]` | List a tree | Safe anywhere |
| `git rev-parse <rev>` / `<rev>^{tree}` / `<rev>:<path>` | Resolve names to ids | Safe anywhere |
| `git hash-object [-w] <file>` | Compute (and optionally write) a blob id | `-w` writes an object; otherwise safe |

## Step-by-Step Example

Trace `GradeCalculator.java` in commit `HEAD` by hand:

1. `git cat-file -p HEAD` → tree `f805ac7`.
2. `git cat-file -p f805ac7` → `src` is tree `17858bc`.
3. Follow `main`, `java`, `com`, `example`, `gradebook` with `git cat-file -p` on each tree.
4. The entry `GradeCalculator.java` → blob `7f31406`; `git cat-file -p 7f31406` prints the file.
5. Shortcut: `git rev-parse HEAD:src/main/java/com/example/gradebook/GradeCalculator.java`.

## Common Mistakes

- **"Git stores diffs."** It stores snapshots; deltas are a storage optimisation.
- **"Branches are objects."** They're refs (files) pointing at commits.
- **"A blob knows its file name."** Names are in trees.
- **Editing files under `.git/objects`.** Objects are immutable; use Git commands.

## Interview Angle

"Explain Git's object model" — blobs (content), trees (directories with names), commits (tree + parents + metadata), annotated tags; content-addressed by hash; branches and HEAD are refs outside the object store. Bonus: why a change deep in history changes all descendant hashes.

## Recap

- Four object types: blob, tree, commit, tag; ids are hashes of content.
- Trees hold names and modes; blobs hold bytes; commits point to one tree and their parents.
- Identical content is stored once; every commit is a full snapshot by reference.
- `cat-file`, `ls-tree`, `rev-parse` and `hash-object` let you inspect it all.

## Related Topics

- [References and HEAD Internals](../refs-and-head-internals/content.md)
- [The Index](../index-internals/content.md)
- [Snapshots, Packfiles and Storage](../packfiles-and-storage/content.md)
