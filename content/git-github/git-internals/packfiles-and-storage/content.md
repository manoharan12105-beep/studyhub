# Snapshots, Packfiles and Storage Efficiency

**Module:** Git Internals · **Interview priority:** Awareness

> [!NOTE]
> **Advanced topic.** Read [The Git Object Model](../git-object-model/content.md) first.

## Learning Objectives

- Distinguish loose objects from packfiles and know when Git packs.
- Explain how delta compression makes snapshots cheap to store.
- Read `git count-objects -v` and describe what `git gc` does — including to unreachable objects.

## What Is It?

Objects are stored in two forms:

- **Loose objects** — one zlib-compressed file per object at `.git/objects/xx/yyyy…`. New objects start here.
- **Packfiles** — `.git/objects/pack/pack-<hash>.pack` with an `.idx` index: many objects in one file, where similar objects are stored as **deltas** (differences) against another object.

**Garbage collection** (`git gc`, also run automatically after some commands) packs loose objects, packs refs and removes unreachable objects that have expired.

## Why It Matters

It resolves the apparent paradox "every commit is a full snapshot, yet `.git` stays small", explains why cloning is efficient (the server sends a pack), and why "deleted" objects linger until garbage collection.

## How It Works

### Snapshot model, storage reality

```text
Logical:   commit C3 → tree → blob roster v4 (full content)
           commit C2 → tree → blob roster v3 (full content)

Physical (in a pack):  roster v4  stored in full (compressed)
                       roster v3  stored as "v4 with line 13 changed back"   (tiny delta)
```

The **model** never changes: `git cat-file -p` gives you full content for any version. Deltas are an invisible storage detail — and Git prefers to keep **recent** versions whole and older ones as deltas, because recent versions are read most.

### Seeing it

A 300-line `roster.txt` was committed, then one line changed in each of three more commits:

```bash
git count-objects -v      # before packing
```

**Output (first two lines):**

```text
count: 12
size: 4
```

12 loose objects using about 4 KiB on disk. After `git gc`:

**Output (`git count-objects -v`, lines 3–5):**

```text
in-pack: 12
packs: 1
size-pack: 3
```

```bash
git verify-pack -v .git/objects/pack/pack-*.idx | grep blob
```

**Output:**

```text
a9b2bec7c231674306496835ff336ed26ed08b7a blob   18792 826 605
6e4a2cdc13d0be5e0bb51283754f3eeb60c88441 blob   24 37 1431 1 a9b2bec7c231674306496835ff336ed26ed08b7a
f8c1141e0f1c7f54c80e3515177365d41aad351e blob   37 49 1468 2 6e4a2cdc13d0be5e0bb51283754f3eeb60c88441
da1d6fc741dcd5485c42f54cee561b506096a913 blob   24 36 1517 3 f8c1141e0f1c7f54c80e3515177365d41aad351e
```

Columns: id, type, size, size in pack, offset — and for deltas, the chain depth and the base object. The newest version (18,792 bytes) is stored whole and compresses to 826 bytes; each older version is a **24–37-byte delta**. Four full snapshots cost under 1 KB in the pack.

### What git gc does

On the gradebook repository (with one unreachable blob written by `git hash-object -w`):

**Output (`git count-objects -v` before / after `git gc`):**

```text
count: 91
size: 10
in-pack: 0
packs: 0
size-pack: 0
prune-packable: 0
garbage: 0
size-garbage: 0
count: 0
size: 0
in-pack: 91
packs: 2
size-pack: 11
prune-packable: 0
garbage: 0
size-garbage: 0
```

After `gc`, `.git/objects/pack/` held two packs: the main pack, and a smaller **cruft pack** (it has an extra `.mtimes` file) holding the unreachable object until it's old enough to delete. `gc` also moved branch refs into `packed-refs` ([References and HEAD Internals](../refs-and-head-internals/content.md)).

Garbage-collection timing, by default:

- unreachable objects are pruned once older than **2 weeks** (`gc.pruneExpire`), **and** no longer referenced by any reflog entry;
- reflog entries for unreachable commits expire after **30 days**, for reachable ones after **90 days**.

That's why reflog recovery works for weeks — and why it eventually stops working.

## Why Git Is Efficient at Snapshots

1. **Content addressing** — identical files and directories are stored once across all commits and branches.
2. **Structural sharing** — a commit that changes one file creates one blob and the trees on its path; everything else is reused.
3. **zlib compression** of every object.
4. **Delta compression** in packfiles across similar objects (even across files and versions).
5. **Network efficiency** — fetch and push negotiate what the other side already has and send a pack of only the missing objects.

Binary files (images, JARs, videos) compress and delta poorly, which is why large binaries bloat repositories — see [Sparse Checkout, Partial Clone and LFS](../../specialized-workflows/sparse-checkout-and-lfs/content.md).

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git count-objects -v` (`-vH` for human sizes) | Loose vs packed object counts and sizes | Safe anywhere |
| `git verify-pack -v <pack>.idx` | List objects in a pack with delta info | Safe anywhere |
| `git gc` | Pack objects and refs, prune expired unreachable objects | Changes local state; safe in normal use |
| `git gc --prune=now` + `git reflog expire --expire=now --all` | Delete unreachable objects immediately | **Practice repository first** — destroys recovery options |

## Step-by-Step Example

1. In a lab repository, commit a large text file and three one-line changes.
2. `git count-objects -v` — note `count` and `size`.
3. `git gc`, then `git count-objects -v` and `git verify-pack -v` — see the deltas.
4. `git cat-file -p HEAD~3:roster.txt | head -2` — the oldest version is still fully readable; deltas are invisible to you.

## Common Mistakes

- **Concluding from packfiles that "Git stores diffs".** The model is snapshots; deltas are storage.
- **Running aggressive pruning to "save space"** while you might still need the reflog to recover something.
- **Committing large binaries** and expecting Git to compress them away.
- **Manually deleting files in `.git/objects`** — corrupts the repository.

## Interview Angle

"If every commit is a snapshot, why are Git repositories small?" — content-addressed deduplication, reuse of unchanged trees and blobs, zlib, and delta-compressed packfiles; network transfers send only missing objects as a pack. "What does `git gc` do?" — packs objects and refs, prunes expired unreachable objects.

## Recap

- New objects are loose; `git gc` packs them, storing similar objects as deltas.
- Logically every commit is a full snapshot; deltas are invisible storage optimisation.
- Unreachable objects survive in cruft packs and reflogs until they expire (2 weeks prune, 30/90-day reflogs by default).
- Text compresses and deltas well; large binaries don't.

## Related Topics

- [The Git Object Model](../git-object-model/content.md)
- [git reflog](../../undoing-and-recovery/git-reflog/content.md)
- [Sparse Checkout, Partial Clone and LFS](../../specialized-workflows/sparse-checkout-and-lfs/content.md)
