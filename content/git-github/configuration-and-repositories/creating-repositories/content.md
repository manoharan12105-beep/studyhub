# Creating Repositories: git init, git clone and the .git Directory

**Module:** Configuration and Repository Creation · **Interview priority:** Core

## Learning Objectives

- Create a repository from an existing folder with `git init`.
- Copy an existing repository with `git clone`, and know what you get.
- Explain what the `.git` directory contains and why you never edit it by hand.

## What Is It?

A **Git repository** is a project folder plus a hidden `.git` directory. The folder's visible files are the **working tree** (the files you edit). The `.git` directory is the **repository database**: every commit, branch, tag and setting.

There are two ways to get one:

- **`git init`** turns the current folder into a new, empty repository (no commits yet).
- **`git clone <url>`** copies an existing repository — its full history — into a new folder and checks out the default branch.

## Why It Matters

Every Git workflow starts with one of these two commands. Knowing what `.git` is explains several facts you will rely on: deleting `.git` deletes all history, copying the folder copies the repository, and Git commands work from any subfolder because Git searches upwards for `.git`.

## How It Works

```text
gradebook/                     ← working tree: files you edit
├── pom.xml
├── src/...
└── .git/                      ← the repository database
    ├── HEAD                   ← which branch you are on ("ref: refs/heads/main")
    ├── config                 ← local configuration (remotes, settings)
    ├── objects/               ← all content: files, folder listings, commits
    ├── refs/heads/            ← branches (one file per branch, holding a commit id)
    ├── refs/tags/             ← tags
    ├── hooks/                 ← sample hook scripts (inactive until renamed)
    ├── info/exclude           ← personal ignore rules (not shared)
    ├── description            ← used only by some web front-ends
    └── index                  ← the staging area (appears after the first git add)
```

## git init

```bash
cd ~/git-lab/gradebook
git init
```

**Output:**

```text
Initialized empty Git repository in /home/student/git-lab/gradebook/.git/
```

```bash
ls -1F .git
cat .git/HEAD
```

**Output:**

```text
HEAD
config
description
hooks/
info/
objects/
refs/
ref: refs/heads/main
```

`HEAD` already says you are on `main`, but `refs/heads/main` doesn't exist yet: a branch is created by the first commit. That is why `git status` says `No commits yet` and `git log` fails in a new repository.

```bash
cat .git/config
```

**Output (captured on Windows):**

```text
[core]
	repositoryformatversion = 0
	filemode = false
	bare = false
	logallrefupdates = true
	symlinks = false
	ignorecase = true
```

On Linux and macOS `filemode` is `true`, and the `symlinks`/`ignorecase` lines are usually absent — Git records what the file system supports.

> [!WARNING]
> Running `git init` in the wrong place — your home directory, for example — makes every file below it look "untracked". Check `pwd` first. To undo a mistaken `init` (before any commits you care about), delete that folder's `.git` directory after making sure it is the one you just created.

## git clone

```bash
cd ~/git-lab
git clone ~/git-lab/remotes/gradebook.git gradebook-copy
```

**Output:**

```text
Cloning into 'gradebook-copy'...
done.
```

```bash
cd gradebook-copy
git log --oneline
git remote -v
```

**Output:**

```text
a62ef5f Create gradebook project
origin	/home/student/git-lab/remotes/gradebook.git (fetch)
origin	/home/student/git-lab/remotes/gradebook.git (push)
```

A clone gives you:

1. A new folder (named after the repository unless you give a name).
2. The **complete history** — every commit, not just the latest files.
3. A remote named **`origin`** pointing at the URL you cloned from.
4. **Remote-tracking branches** (`origin/main`) recording where the remote's branches were.
5. A local `main` branch checked out and set to track `origin/main`.

The URL can be HTTPS (`https://github.com/your-org/gradebook.git`), SSH (`git@github.com:your-org/gradebook.git`) or a local path, as here.

Cloning into a folder that already has files fails safely:

**Output:**

```text
fatal: destination path 'gradebook' already exists and is not an empty directory.
```

## Bare Repositories

`git init --bare remotes/gradebook.git` creates a repository with **no working tree** — just the database. Servers and hosting services store repositories this way, because nobody edits files there; people only push and fetch. The practice lab uses one as a stand-in for GitHub.

## Commands

### git init

**Syntax:** `git init [directory]` · **Safety:** changes local state (creates `.git`). Running it again in an existing repository is harmless ("Reinitialized existing Git repository").

| Option | Effect |
|--------|--------|
| `-b <name>` / `--initial-branch=<name>` | Name of the first branch for this repository |
| `--bare` | Create a repository without a working tree |

### git clone

**Syntax:** `git clone <url> [directory]` · **Safety:** safe (creates a new folder).

| Option | Effect |
|--------|--------|
| `-b <branch>` | Check out this branch instead of the default |
| `--depth <n>` | Shallow clone: only the latest *n* commits (faster for CI, limited history) |
| `-o <name>` | Name the remote something other than `origin` |

## Step-by-Step Example

1. `cd ~/git-lab/gradebook && pwd` — confirm the location.
2. `git init` — create the repository.
3. `git status` — every project file is listed as untracked; nothing is in history yet.
4. Continue with [The Three Areas of Git](../../basic-workflow/three-areas-of-git/content.md) to make the first commit.

## Common Mistakes

- **Cloning inside another repository.** You get a nested repository the outer one can't track properly. Clone into a plain folder.
- **Deleting `.git` to "fix" a problem.** It deletes all local history and unpushed commits. Inspect first.
- **Editing files inside `.git` by hand.** Use Git commands; hand edits can corrupt the repository.
- **Downloading a ZIP from GitHub instead of cloning.** A ZIP has no history and no remote.

## Interview Angle

"What happens when you run `git clone`?" — full history copied, `origin` remote created, remote-tracking branches created, default branch checked out with tracking set. "What is in `.git`?" — objects, refs, HEAD, config, index, hooks.

## Recap

- `git init` creates an empty repository; the first branch appears with the first commit.
- `git clone` copies the whole history and sets up `origin` and tracking.
- `.git` is the repository; the rest of the folder is the working tree.
- Bare repositories have no working tree and are used on servers.

## Related Topics

- [.gitignore and Tracking Files](../gitignore-and-tracking/content.md)
- [Remotes and origin](../../remote-repositories/remotes-and-origin/content.md)
- [The Git Object Model](../../git-internals/git-object-model/content.md)
