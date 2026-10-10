# Lightweight and Annotated Tags

**Module:** Tags, Releases and Versioning · **Interview priority:** Frequently asked

## Learning Objectives

- Create, list, inspect and push lightweight and annotated tags.
- Explain why releases use annotated tags.
- Delete and (if you must) move tags safely, locally and on the remote.

## What Is It?

A **tag** is a named reference to a specific commit that, unlike a branch, **doesn't move**. It marks points such as releases (`v1.0.0`).

| | Lightweight tag | Annotated tag |
|-|-----------------|---------------|
| Created with | `git tag v1.0.0` | `git tag -a v1.0.0 -m "…"` |
| What it is | A ref pointing straight at a commit | A **tag object** (tagger, date, message, optionally a signature) that points at the commit |
| `git cat-file -t` | `commit` | `tag` |
| `git describe` uses it by default | No (needs `--tags`) | Yes |
| Use for | Private bookmarks | Releases and anything shared |

## Why It Matters

Tags answer "what exactly did we ship as 1.0.0?" forever. Deployments, Maven artifacts, GitHub Releases, hotfix branches and rollbacks all start from a tag. A tag that moves — or was never pushed — breaks that guarantee.

## How It Works

```text
v1.0.0 (tag object: tagger Priya, 2026-10-08, "First release…") ──► 3a070e0 (commit)
checkpoint-before-merge (lightweight) ─────────────────────────────► 4b17431 (commit)
main ──► 2adc903 (moves with every commit; tags don't)
```

### Creating

```bash
git tag checkpoint-before-merge 4b17431                                   # lightweight
git tag -a v1.0.0 -m "First release: averages and letter grades" 3a070e0   # annotated
git cat-file -t checkpoint-before-merge
git cat-file -t v1.0.0
```

**Output:**

```text
commit
tag
```

Without a commit argument, the tag goes on `HEAD`.

### Inspecting

```bash
git show v1.0.0 --stat
```

**Output (first lines):**

```text
tag v1.0.0
Tagger: Priya Sharma <priya@example.com>
Date:   Thu Oct 8 10:04:20 2026 +0530

First release: averages and letter grades
```

…followed by the tagged commit. The raw tag object:

```bash
git cat-file -p v1.0.0
```

**Output:**

```text
object 3a070e0d3d0abb543338e9b1bffc80830d43dd57
type commit
tag v1.0.0
tagger Priya Sharma <priya@example.com> 1791434060 +0530

First release: averages and letter grades
```

| Listing | Command |
|---------|---------|
| All tags | `git tag` |
| With messages | `git tag -n` |
| Matching a pattern | `git tag -l "v1.*"` |
| In version order | `git tag -l --sort=v:refname "v1.*"` — see [Semantic Versioning](../semantic-versioning/content.md) |
| Tags containing a commit | `git tag --contains <commit>` |

### git describe

```bash
git describe
```

**Output (one commit after `v1.0.0`):**

```text
v1.0.0-1-g2adc903
```

Nearest annotated tag, number of commits since it, and `g` + the abbreviated hash — a handy build version string. On the tagged commit itself it prints just `v1.0.0`.

## Pushing Tags

`git push` does **not** push tags:

```bash
git push origin v1.0.0
```

**Output:**

```text
To /home/student/git-lab/remotes/gradebook.git
 * [new tag]         v1.0.0 -> v1.0.0
```

```bash
git ls-remote --tags origin
```

**Output:**

```text
17d08368c2690b320ded2e3e9dd4a8b9ae82b49a	refs/tags/v1.0.0
3a070e0d3d0abb543338e9b1bffc80830d43dd57	refs/tags/v1.0.0^{}
```

The first line is the tag object; `^{}` shows the commit it points to ("peeled"). `git push --follow-tags` pushes annotated tags that point at commits being pushed — a good default (`git config --global push.followTags true`). `git push origin --tags` pushes **all** local tags, including private bookmarks — use it carefully.

## Deleting and Moving Tags

```bash
git tag -d checkpoint-before-merge          # local
git push origin --delete v1.0.1             # remote
```

**Output:**

```text
Deleted tag 'checkpoint-before-merge' (was 4b17431)
To /home/student/git-lab/remotes/gradebook.git
 - [deleted]         v1.0.1
```

Creating a tag that exists fails (`fatal: tag 'v1.0.1' already exists`). `-f` replaces it:

**Output (`git tag -f -a v1.0.1 -m "…" HEAD~1`):**

```text
Updated tag 'v1.0.1' (was 7f8b561)
```

> [!CAUTION]
> **Don't move a published release tag.** Others' clones keep the old tag — Git doesn't overwrite existing tags on fetch — so "v1.0.1" would mean different code on different machines, and published artifacts no longer match the tag. If a release is wrong, **publish a new version** (`v1.0.2`). Moving a tag is only acceptable before anyone has fetched it.

## Commands

### git tag

**Syntax:** `git tag [-a] [-m <msg>] [-f] <name> [<commit>]`, `git tag -d <name>`, `git tag -l [--sort=…] [<pattern>]` · **Safety:** creating/deleting changes local state; `-f` on a published tag is **Practice repository first**.

### Tag pushing

**Syntax:** `git push origin <tag>`, `git push --follow-tags`, `git push origin --delete <tag>` · **Safety:** **Changes the remote**.

## Step-by-Step Example

Release gradebook 1.0.0:

1. `git switch main && git pull`, `mvn -B verify` — build is green.
2. Set `<version>1.0.0</version>` in `pom.xml` and commit "Release 1.0.0" (if your project versions the POM).
3. `git tag -a v1.0.0 -m "Release 1.0.0"`.
4. `git push origin main v1.0.0`.
5. Create a GitHub Release from the tag ([GitHub Releases](../github-releases/content.md)).

## Common Mistakes

- **Lightweight tags for releases** — no author, date or message; `git describe` ignores them.
- **Forgetting to push the tag.**
- **Moving or reusing a published tag.**
- **Tagging the wrong commit** (a local branch that isn't pushed yet) — tag after pulling, on the commit CI tested.

## Interview Angle

"Lightweight vs annotated tags?" — annotated tags are objects with tagger, date, message (and optional GPG signature), recommended for releases; lightweight tags are bare pointers. "Do tags get pushed?" — no, explicitly or with `--follow-tags`. "Can you change a tag?" — technically `-f`, but never for published releases.

## Recap

- Tags are fixed pointers; branches move.
- Annotated tags (`-a -m`) are objects with metadata — use them for releases.
- Push tags explicitly; `--follow-tags` is a good default.
- Delete with `-d` / `push --delete`; never move published tags — release a new version.

## Related Topics

- [Semantic Versioning](../semantic-versioning/content.md)
- [GitHub Releases and Rollback Planning](../github-releases/content.md)
- [The Git Object Model](../../git-internals/git-object-model/content.md)
- [Lab 11 — Tag a Version and Prepare a Release](../../labs/git-lab-11-tag-and-release/content.md)
