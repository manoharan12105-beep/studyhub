# .gitignore and Tracking Files

**Module:** Configuration and Repository Creation · **Interview priority:** Core

## Learning Objectives

- Distinguish tracked, untracked and ignored files.
- Write `.gitignore` patterns for a Java/Maven project and test them with `git check-ignore`.
- Stop tracking a file that was committed by mistake without deleting it from disk.

## What Is It?

Every file in the working tree is in one of three groups:

| Group | Meaning | Shown by `git status --short` |
|-------|---------|-------------------------------|
| **Tracked** | Git knows the file: it was committed or staged | ` M` modified, `A ` added, `D ` deleted, nothing when unchanged |
| **Untracked** | Present on disk, never added | `??` |
| **Ignored** | Matches an ignore rule; Git leaves it out of `status` and `git add .` | `!!` (only with `--ignored`) |

A **`.gitignore`** file lists patterns for files Git should ignore. It is committed, so the whole team shares the same rules.

> [!IMPORTANT]
> `.gitignore` only affects **untracked** files. A file that is already tracked stays tracked — and keeps showing changes — even if it matches a rule.

## Why It Matters

Build output (`target/`), IDE settings (`.idea/`), logs and local secrets (`.env`) do not belong in history. Committed build output causes constant noise and merge conflicts; committed secrets leak. A good `.gitignore` written on day one prevents both.

## How It Works

In the gradebook lab, a build and an IDE have created extra files:

```bash
git status
```

**Output:**

```text
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.env
	.idea/
	README.md
	logs/
	pom.xml
	src/

nothing added to commit but untracked files present (use "git add" to track)
```

Now create `.gitignore`:

```text
target/
*.log
.idea/
.env
```

```bash
git status --short --ignored
```

**Output:**

```text
?? .gitignore
?? README.md
?? pom.xml
?? src/
!! .env
!! .idea/
!! logs/
!! target/
```

`git add .` would now add only the source files and `.gitignore`.

## Pattern Rules

| Pattern | Matches |
|---------|---------|
| `*.log` | Any file ending in `.log`, in any folder |
| `target/` | A directory named `target` anywhere (trailing `/` = directories only) |
| `/target/` | Only the `target` directory at the repository root (leading `/` anchors to the `.gitignore`'s folder) |
| `docs/*.pdf` | PDFs directly inside `docs/` (a pattern containing `/` is relative to the `.gitignore`'s folder) |
| `**/build/` | `build` directories at any depth |
| `!keep.log` | Negation: re-include a file an earlier pattern excluded |
| `# comment` | Ignored line |

Later rules override earlier ones. Negation has one important limit:

> [!WARNING]
> **You cannot re-include a file if its parent directory is excluded.** With `logs/` followed by `!logs/keep.log`, Git never looks inside `logs/`, so `keep.log` stays ignored. Use `*.log` + `!keep.log`, or `logs/*` + `!logs/keep.log`, instead.

Captured: with `logs/` and `!logs/keep.log`, `git status --short --ignored` reports only `!! logs/`; with `*.log` and `!keep.log` it reports `?? logs/` (because `keep.log` is now visible) and `!! logs/app.log`.

## Where Ignore Rules Live

| File | Shared? | Use for |
|------|---------|---------|
| `.gitignore` (any folder; committed) | Yes | Project rules: build output, logs, local config |
| `.git/info/exclude` | No — this clone only | Personal files for one repository (`notes.txt`) |
| Global file (`git config --global core.excludesFile ~/.gitignore_global`) | No — all your repositories | OS and editor junk (`.DS_Store`, `Thumbs.db`) |

## Testing Patterns: git check-ignore

```bash
git check-ignore -v logs/app.log target/classes/App.class .env
```

**Output:**

```text
.gitignore:2:*.log	logs/app.log
.gitignore:1:target/	target/classes/App.class
.gitignore:4:.env	.env
```

`-v` shows the file, line number and pattern responsible. For a file that is not ignored, `git check-ignore pom.xml` prints nothing and exits with status 1.

## Untracking an Accidentally Committed File

Suppose `logs/app.log` was committed before `*.log` was added. The rule has no effect on it:

```bash
git status --short
```

**Output:**

```text
 M logs/app.log
?? .gitignore
```

Remove it from the index (the next commit) but keep it on disk:

```bash
git rm --cached logs/app.log
git status --short
```

**Output:**

```text
rm 'logs/app.log'
D  logs/app.log
?? .gitignore
```

```bash
git add .gitignore
git commit -m "Stop tracking log files"
```

**Output:**

```text
[main e44c0f9] Stop tracking log files
 2 files changed, 1 insertion(+), 1 deletion(-)
 create mode 100644 .gitignore
 delete mode 100644 logs/app.log
```

`ls logs` still shows `app.log` — the file is now ignored, not deleted. For a whole directory use `git rm -r --cached target/`.

> [!CAUTION]
> `git rm --cached` removes the file from **future** commits only. Every earlier commit still contains it. If it held a password or key, treat the secret as leaked: revoke and rotate it — see [Secrets in Git History](../../authentication-and-security/secrets-in-git-history/content.md). Also, when teammates pull this commit, Git **deletes** their copy of the file (it was tracked and is now removed); warn them to back up local versions first.

## A Java/Maven .gitignore

```text
# Build output
target/
*.class

# Logs
*.log

# IDEs
.idea/
*.iml
.vscode/
.settings/
.project
.classpath

# OS files
.DS_Store
Thumbs.db

# Local configuration and secrets
.env
application-local.properties
```

Keep `pom.xml`, `src/`, the Maven wrapper (`mvnw`, `mvnw.cmd`, `.mvn/wrapper/maven-wrapper.properties`) and `README.md` tracked. The full Java project setup is in [Setting Up a Maven Project Repository](../../java-project-workflow/maven-repository-setup/content.md).

## Commands

### git check-ignore

**Syntax:** `git check-ignore -v <path>...` · **Purpose:** explain why a path is ignored. **Safety:** safe anywhere.

### git status --ignored

**Purpose:** list ignored files too (`!!`). **Safety:** safe anywhere.

### git rm --cached

**Syntax:** `git rm --cached <file>` (`-r` for directories) · **Purpose:** stop tracking, keep the file on disk. **Safety:** changes local state; affects teammates when pushed (their copies are removed on pull).

### git ls-files

**Purpose:** list tracked files — the authoritative answer to "is this file tracked?". **Safety:** safe anywhere.

## Common Mistakes

- **Adding a rule for a file that is already tracked and expecting it to disappear.** Untrack it with `git rm --cached`.
- **Ignoring a directory and then trying to re-include one file inside it.** Ignore its contents (`dir/*`) instead.
- **Committing secrets "just for now".** Ignored-from-the-start is the only safe state.
- **Putting personal editor files in the project `.gitignore`.** Use your global excludes file.

## Interview Angle

"You added a file to `.gitignore` but Git still shows it as modified. Why?" — it's tracked; `.gitignore` only affects untracked files; `git rm --cached` and commit. Follow-up: "Is the file gone from the repository now?" — No, it's still in every old commit.

## Recap

- Tracked, untracked and ignored are separate states; `.gitignore` only stops untracked files from being added.
- Test patterns with `git check-ignore -v`.
- `git rm --cached` untracks without deleting; history still contains the file.
- Secrets that were committed must be rotated, not just untracked.

## Related Topics

- [Creating Repositories](../creating-repositories/content.md)
- [git status and git add](../../basic-workflow/git-status-and-add/content.md)
- [Setting Up a Maven Project Repository](../../java-project-workflow/maven-repository-setup/content.md)
