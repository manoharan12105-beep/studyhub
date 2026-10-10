# Git Submodules

**Module:** Submodules, Worktrees and Specialized Workflows · **Interview priority:** Awareness

> [!NOTE]
> **Advanced topic.** Captured in the practice lab with a local "rubric" library repository; on GitHub the URL would be `https://github.com/your-org/rubric.git`.

## Learning Objectives

- Explain what a submodule records and how it differs from copying code.
- Add, clone, initialise and update submodules.
- Recognise common submodule mistakes and simpler alternatives.

## What Is It?

A **submodule** embeds another Git repository at a path inside your repository, **pinned to a specific commit**. Your repository stores only:

- a `.gitmodules` file mapping the path to the other repository's URL, and
- a special tree entry (mode `160000`) holding the **commit id** of the submodule — not its files.

The submodule's files live in its own repository, checked out inside yours.

## Why It Matters

Submodules let several projects share code while each project controls exactly which version it uses. They also confuse teams constantly: empty folders after cloning, "modified" submodules nobody touched, and updates that someone forgot to commit. Knowing the mechanics avoids most of that — and helps you decide when not to use them.

## How It Works

### Adding

```bash
git submodule add https://github.com/your-org/rubric.git libs/rubric
```

In the lab (local path URL), Git first refused:

**Output:**

```text
Cloning into '/home/student/git-lab/gradebook/libs/rubric'...
fatal: transport 'file' not allowed
fatal: clone of '/home/student/git-lab/remotes/rubric.git' into submodule path '/home/student/git-lab/gradebook/libs/rubric' failed
```

Since Git 2.38.1, submodules from **local file paths** are blocked by default for security; the lab allows it per command with `git -c protocol.file.allow=always submodule add …`. HTTPS and SSH URLs are unaffected.

**Output (`git status -s` after adding):**

```text
A  .gitmodules
A  libs/rubric
```

```text
[submodule "libs/rubric"]
	path = libs/rubric
	url = /home/student/git-lab/remotes/rubric.git
```

```bash
git diff --cached libs/rubric
```

**Output:**

```text
diff --git a/libs/rubric b/libs/rubric
new file mode 160000
index 0000000..dfcfc69
--- /dev/null
+++ b/libs/rubric
@@ -0,0 +1 @@
+Subproject commit dfcfc69380bf5fb43817724dc51a798f675edfd7
```

Commit both; the parent repository now pins `rubric` at `dfcfc69`.

### Cloning a repository with submodules

A plain clone leaves the submodule folder **empty**:

```bash
git clone https://github.com/your-org/gradebook.git && cd gradebook
git submodule status
```

**Output:**

```text
-dfcfc69380bf5fb43817724dc51a798f675edfd7 libs/rubric
```

The `-` means "not initialised". Fix:

```bash
git submodule update --init
```

**Output:**

```text
Submodule 'libs/rubric' (/home/student/git-lab/remotes/rubric.git) registered for path 'libs/rubric'
Cloning into '/home/student/git-lab/arjun/libs/rubric'...
done.
Submodule path 'libs/rubric': checked out 'dfcfc69380bf5fb43817724dc51a798f675edfd7'
```

Or in one step: `git clone --recurse-submodules <url>`. The submodule is checked out at the **pinned commit** (detached HEAD) — not at the library's latest commit.

### Updating to a newer library version

The library added `DISTINCTION_MARK`. Move the pin:

```bash
git submodule update --remote libs/rubric
git status -s
git diff libs/rubric
```

**Output:**

```text
From /home/student/git-lab/remotes/rubric
   dfcfc69..e480e7e  main       -> origin/main
Submodule path 'libs/rubric': checked out 'e480e7ebba3a4fc5bd9995cb64525607e5a6711d'
 M libs/rubric
diff --git a/libs/rubric b/libs/rubric
index dfcfc69..e480e7e 160000
--- a/libs/rubric
+++ b/libs/rubric
@@ -1 +1 @@
-Subproject commit dfcfc69380bf5fb43817724dc51a798f675edfd7
+Subproject commit e480e7ebba3a4fc5bd9995cb64525607e5a6711d
```

Nobody else gets the new version until you **commit** this pointer change (`git commit -am "Update rubric to e480e7e"`) and push. Teammates then run `git submodule update` after pulling (or set `git config submodule.recurse true`).

`git submodule status` prefixes: (space) checked out at the pinned commit, `-` not initialised, `+` checked-out commit differs from the pinned one, `U` merge conflict.

## Common Submodule Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Cloning without `--recurse-submodules` | Empty folder, build fails | `git submodule update --init --recursive` |
| Pulling the parent but not updating submodules | `+` in status; old library code | `git submodule update` (or `submodule.recurse=true`) |
| Committing inside the submodule on a detached HEAD | Commits "lost" on next update | Switch to a branch in the submodule first; push it before committing the new pointer |
| Pushing the parent before the submodule's new commit is pushed | Teammates get "not our ref" / can't fetch the commit | Push the submodule first (`git push --recurse-submodules=check` warns) |
| Accidentally committing a pointer change | Unexpected `M libs/rubric` in a PR | Check `git diff` for `Subproject commit` lines before committing |

## When Submodules Are — and Aren't — Justified

**Justified:** you must pin a separately-versioned repository you also edit, with no package registry (vendored firmware, shared documentation, a fork you patch).

**Simpler alternatives** for most Java projects:

- **A Maven dependency** — publish `rubric` as an artifact (even to GitHub Packages or a local repository) and depend on a version in `pom.xml`. Versioning, transitive dependencies and builds just work.
- **A monorepo** — keep tightly coupled modules in one repository (a Maven multi-module build).
- **Copying (vendoring)** a small, rarely changed file with a note about its origin.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git submodule add <url> <path>` | Add and pin | Changes local state |
| `git clone --recurse-submodules <url>` | Clone with submodules | Safe |
| `git submodule update --init [--recursive]` | Check out pinned commits | Changes local state |
| `git submodule update --remote [<path>]` | Move to the tracked branch's latest commit | Changes local state (commit the pointer to share it) |
| `git submodule status` | Pinned vs checked-out commit | Safe anywhere |

## Step-by-Step Example

1. `git clone --recurse-submodules https://github.com/your-org/gradebook.git`.
2. Build: the rubric sources are present.
3. Upgrade the library: `git submodule update --remote libs/rubric`, run the tests.
4. `git commit -am "Update rubric library to e480e7e"` and push.
5. Teammates: `git pull && git submodule update`.

## Common Mistakes

See the table above; the most common is simply forgetting that the parent stores a **commit pointer** that must be updated and committed deliberately.

## Interview Angle

"What are Git submodules and their drawbacks?" — a repository embedded at a pinned commit; parent stores `.gitmodules` and a gitlink; drawbacks: extra clone/update steps, detached HEADs, pointer updates to commit, push ordering. Mention alternatives (package manager dependency, monorepo).

## Recap

- A submodule = `.gitmodules` entry + a pinned commit (mode 160000), not files.
- Clone with `--recurse-submodules` or run `git submodule update --init`.
- Updating a submodule means moving and committing the pointer.
- Prefer a Maven dependency or a monorepo unless you truly need pinned, separately-developed source.

## Related Topics

- [Git Worktrees](../git-worktrees/content.md)
- [The Git Object Model](../../git-internals/git-object-model/content.md)
- [Sparse Checkout, Partial Clone and LFS](../sparse-checkout-and-lfs/content.md)
