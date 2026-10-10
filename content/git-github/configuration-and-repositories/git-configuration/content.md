# Git Configuration: Levels, Identity and Defaults

**Module:** Configuration and Repository Creation · **Interview priority:** Frequently asked

## Learning Objectives

- Name the three configuration levels and which one wins.
- Set your name, email, default branch and editor correctly before the first commit.
- Find out where a setting comes from with `--show-origin`.

## What Is It?

`git config` reads and writes Git's settings. Settings are stored in plain text files at three main **levels**:

| Level | Flag | File | Applies to |
|-------|------|------|-----------|
| System | `--system` | `etc/gitconfig` inside the Git installation (`/etc/gitconfig` on Linux) | Every user on the machine |
| Global | `--global` | `~/.gitconfig` (or `~/.config/git/config`) | Every repository of your user account |
| Local | `--local` (default when writing inside a repository) | `.git/config` in the repository | This repository only |

**Precedence:** the most specific level wins — **local overrides global, global overrides system**.

## Why It Matters

Every commit permanently records an **author name and email**. They come from `user.name` and `user.email`. Wrong values (a work email on a personal project, a typo, `root@localhost`) end up in history, and GitHub links commits to your account by email — commits with an unknown email are not attributed to you.

## How It Works

When Git needs a setting, it reads system, then global, then local, and the last value read wins:

```text
system  (etc/gitconfig)     core.autocrlf = true
global  (~/.gitconfig)      user.email   = priya@example.com
local   (.git/config)       user.email   = priya.work@example.com   ◄── wins in this repository
```

## First-Time Setup

```bash
git config --global user.name "Priya Sharma"
git config --global user.email "priya@example.com"
git config --global init.defaultBranch main
git config --global core.editor "code --wait"      # or nano, vim, notepad++ …
```

- `init.defaultBranch main` makes `git init` name the first branch `main` instead of the historical default `master`.
- `core.editor` is the program Git opens for commit messages and interactive rebases. `code --wait` keeps Git waiting until you close the VS Code tab.

> [!TIP]
> Using a GitHub account email that should stay private? GitHub provides a `no-reply` address in your account's email settings; use that as `user.email` for public repositories.

## Reading Settings and Their Origin

```bash
git config user.name
git config --list --show-origin --show-scope
```

Inside `~/git-lab/gradebook`, after setting a repository-specific email with `git config user.email priya.work@example.com`:

**Output:**

```text
global	file:/home/student/.gitconfig	user.name=Priya Sharma
global	file:/home/student/.gitconfig	user.email=priya@example.com
global	file:/home/student/.gitconfig	init.defaultbranch=main
local	file:.git/config	user.email=priya.work@example.com
```

(Other lines were omitted.) `user.email` appears twice; the **local** value is the one used here:

```bash
git config --show-origin user.email
```

**Output:**

```text
file:.git/config	priya.work@example.com
```

Remove the local override and the global value applies again:

```bash
git config --unset user.email
git config user.email
```

**Output:**

```text
priya@example.com
```

## Per-Repository Identity

A common real need: personal email globally, work email in work repositories.

```bash
cd ~/work/payments-service
git config user.email "priya.sharma@company.example"    # local: this repository only
```

Advanced users automate this with `includeIf` in `~/.gitconfig`, which loads an extra file for every repository under a folder:

```text
[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work
```

## Commands

### git config

**Purpose:** read or write a setting. **Safety:** changes local state (configuration only — no history is touched).

| Form | Effect |
|------|--------|
| `git config --global key value` | Set for your user |
| `git config key value` (inside a repo) | Set for this repository |
| `git config key` | Print the effective value |
| `git config --list --show-origin` | All values and the file each comes from |
| `git config --unset key` | Remove a value from one level |
| `git config --global --edit` | Open the file in your editor |

> [!NOTE]
> Git 2.46 added subcommand forms — `git config get user.name`, `git config set --global user.name "…"`, `git config unset …`, `git config list`. Both forms work in current Git; this subject uses the classic form because it works on every version.

## Step-by-Step Example

1. Check what Git will put in your next commit: `git config user.name` and `git config user.email`.
2. If either is empty, set it globally.
3. In a repository that needs a different identity, set the local value.
4. Confirm with `git config --show-origin user.email`.
5. Make a commit and verify with `git log -1 --format='%an <%ae>'`.

## Common Mistakes

- **Committing before configuring.** Git either stops with `Author identity unknown` or guesses an identity from your computer's user and host names and prints a warning; a guessed email is almost always wrong.
- **Setting `--global` when you meant one repository** (or the reverse). Use `--show-origin` to see which file holds a value.
- **Forgetting `--wait` for GUI editors.** Without it, `code` returns immediately and Git sees an empty commit message and aborts.
- **Thinking changing `user.email` fixes old commits.** It affects new commits only; fixing old ones requires rewriting history — see [Troubleshooting Commits and Branches](../../troubleshooting/troubleshooting-commits-and-branches/content.md).

## Interview Angle

"What are Git's configuration levels?" — system, global, local; local wins. Follow-up: "Your commits on GitHub don't show your avatar" — the commit email isn't one of your GitHub account's verified emails.

## Recap

- Three levels: system, global (`~/.gitconfig`), local (`.git/config`); the most specific wins.
- Set `user.name`, `user.email`, `init.defaultBranch` and `core.editor` before the first commit.
- `--show-origin` answers "where does this value come from?".
- Identity changes affect future commits only.

## Related Topics

- [Creating Repositories](../creating-repositories/content.md)
- [Useful Aliases and git archive](../../advanced-inspection/archive-and-aliases/content.md)
