# Sparse Checkout, Partial Clone and Large-File Storage

**Module:** Submodules, Worktrees and Specialized Workflows · **Interview priority:** Awareness

> [!NOTE]
> **Advanced topic.** Sparse checkout, partial clone and Git LFS (3.7.1) were run in the practice lab against local repositories. Pushing LFS files to GitHub was not tested (**Partly tested**).

## Learning Objectives

- Check out only part of a repository with sparse checkout.
- Download less history with partial clone, and know what happens when missing objects are needed.
- Explain Git LFS pointers and when large-file storage is justified.

## What Is It?

Three techniques for repositories that are **too big** in different ways:

| Problem | Technique | What it limits |
|---------|-----------|----------------|
| Too many files in the working directory (huge monorepo) | **Sparse checkout** | Which paths are checked out |
| Too much history to download | **Partial clone** (`--filter=blob:none`) / shallow clone | Which objects are downloaded up front |
| Large binary files bloating history | **Git LFS** (Large File Storage) | Where big file contents live |

## Why It Matters

For a student project these are rarely needed. In large companies and game or ML projects they're essential — and misusing them (LFS for everything, sparse checkouts nobody understands) adds friction. Knowing when they're justified is as important as knowing the commands.

## How It Works

### Sparse checkout

```bash
git clone --no-checkout https://github.com/your-org/gradebook.git sparse
cd sparse
git sparse-checkout set --cone src/main
git checkout main
```

Only root files and the chosen directory appear:

**Output (files in the working directory):**

```text
./.gitignore
./README.md
./pom.xml
./src/main/java/com/example/gradebook/App.java
./src/main/java/com/example/gradebook/ClassReport.java
./src/main/java/com/example/gradebook/GradeCalculator.java
./src/main/java/com/example/gradebook/Student.java
```

**Output (`git status`):**

```text
On branch main
Your branch is up to date with 'origin/main'.

You are in a sparse checkout with 88% of tracked files present.

nothing to commit, working tree clean
```

`src/test` isn't on disk, but it's still in every commit — sparse checkout changes only what's **checked out**, not what's in the repository. **Cone mode** (the default) works with whole directories and is fast; `git sparse-checkout add <dir>` adds more; `git sparse-checkout disable` restores everything.

### Partial clone

```bash
git clone --filter=blob:none https://github.com/your-org/gradebook.git partial
```

**Output:**

```text
Cloning into 'partial'...
```

All commits and trees are downloaded, but **file contents (blobs) only for the checked-out commit**. In the lab, 6 historical blobs were missing after cloning (`git rev-list --objects --all --missing=print` lists them with `?`). When a command needs one — `git show 8ddf4ed:README.md` — Git fetches it on demand from the remote, and the count of missing objects dropped from 6 to 5.

| Clone type | Downloads | Trade-off |
|------------|-----------|-----------|
| Full | Everything | Largest, fully offline |
| `--filter=blob:none` | All commits/trees, blobs on demand | Small; needs network for old file versions; full `log` works |
| `--depth 1` (shallow) | Only the latest commit(s) | Smallest; history-based commands (log, blame, bisect) limited |

Partial clone requires server support (GitHub supports it). Combine with sparse checkout for very large monorepos.

### Git LFS

**Git LFS** replaces large files in Git with small **pointer files**, storing the real content on an LFS server (GitHub provides one, with storage and bandwidth quotas).

```bash
git lfs install --local          # installs LFS hooks for this repository
git lfs track "*.png"
cat .gitattributes
```

**Output:**

```text
Updated Git hooks.
Git LFS initialized.
Tracking "*.png"
*.png filter=lfs diff=lfs merge=lfs -text
```

Commit `.gitattributes` and a 300,000-byte `docs/report-sample.png`, then look at what **Git** stored:

```bash
git lfs ls-files
git show HEAD:docs/report-sample.png
git cat-file -s HEAD:docs/report-sample.png
```

**Output:**

```text
46df9d04b4 * docs/report-sample.png
version https://git-lfs.github.com/spec/v1
oid sha256:<sha256-of-file>
size 300000
131
```

(The 64-character SHA-256 is shortened here.) Git's blob is a **131-byte pointer**; the 300 KB file lives in `.git/lfs/objects` locally and on the LFS server after `git push`. Clones download LFS content for the checked-out commit only.

## When Each Is Justified

| Use | When | Simpler alternative first |
|-----|------|---------------------------|
| Sparse checkout | Monorepo with many teams; you need one area | Split repositories if teams are independent |
| Partial / shallow clone | Huge history; CI that only builds the latest commit | Normal clone for typical projects |
| Git LFS | Binary assets you must version with the code (images, models, design files) | **Don't commit build outputs at all** (JARs belong in a package registry or release assets); keep large datasets outside Git |

> [!WARNING]
> Adding LFS later doesn't shrink history: large files already committed stay in old commits. Moving them needs a history rewrite (`git lfs migrate`), with the same coordination as any rewrite ([Rewriting History Safely](../../rebasing-and-rewriting/rewriting-history-safely/content.md)). GitHub also rejects files over 100 MB in normal Git pushes — see [Troubleshooting Remotes and Pushes](../../troubleshooting/troubleshooting-remotes-and-push/content.md).

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git sparse-checkout set --cone <dirs>` / `add` / `list` / `disable` | Control checked-out paths | Changes local state (files appear/disappear from disk, not from history) |
| `git clone --filter=blob:none <url>` | Partial clone | Safe |
| `git clone --depth 1 <url>` | Shallow clone | Safe |
| `git lfs install`, `git lfs track "<pattern>"`, `git lfs ls-files` | Set up and inspect LFS | Changes local state; commit `.gitattributes` |

## Step-by-Step Example

A design team adds 40 MB of mock-up images to gradebook's documentation:

1. Ask first: do they belong in Git at all? (Maybe a design tool or release assets.)
2. If yes: `git lfs install`, `git lfs track "docs/design/*.png"`, commit `.gitattributes` **before** adding images.
3. Add images and push; check `git lfs ls-files`.
4. Tell teammates to install Git LFS, or they'll get pointer files instead of images.

## Common Mistakes

- **Expecting sparse checkout to reduce repository size** — it reduces checked-out files; combine with partial clone for downloads.
- **Tracking with LFS after committing the files** — history still has the big blobs.
- **Teammates without Git LFS** — they see 130-byte pointer text instead of images.
- **Shallow clones for development** — `blame`, `bisect` and merges suffer.

## Interview Angle

"How do you handle large files or huge repositories in Git?" — keep build outputs out; Git LFS for necessary binaries (pointers in Git, content on an LFS server); partial clone or shallow clone to limit downloads; sparse checkout to limit the working directory; consider repository boundaries.

## Recap

- Sparse checkout: fewer files on disk; history unchanged.
- Partial clone: fetch blobs on demand; shallow clone: truncated history.
- Git LFS: pointer files in Git, content on an LFS server; set it up before committing binaries.
- Prefer not committing large or generated files at all.

## Related Topics

- [Snapshots, Packfiles and Storage](../../git-internals/packfiles-and-storage/content.md)
- [Git Submodules](../git-submodules/content.md)
- [Creating Repositories (shallow clones)](../../configuration-and-repositories/creating-repositories/content.md)
