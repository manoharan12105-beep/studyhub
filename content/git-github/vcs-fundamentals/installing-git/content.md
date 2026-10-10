# Installing Git and Getting Help

**Module:** Version Control Fundamentals · **Interview priority:** Awareness

## Learning Objectives

- Install Git on Windows, macOS or Linux and verify the installation.
- Read Git's built-in help three ways: full manual, quick usage summary and concept guides.
- Recognise the "not a git repository" error and what it means.

## What Is It?

Git is a command-line program named `git`. Installing it puts `git` on your `PATH`, so every terminal (and every IDE that uses Git, such as IntelliJ IDEA or VS Code) can run it. Every Git operation is a **subcommand**: `git <command> [options] [arguments]`.

## Why It Matters

Every later topic assumes a working `git` in a terminal. Knowing how to find help yourself — the exact options of `git log`, what `--staged` means — is faster and more reliable than searching the web, and the built-in help always matches **your** installed version.

## How It Works

### Installing

| System | Recommended install | Notes |
|--------|---------------------|-------|
| Windows | Git for Windows from git-scm.com, or `winget install --id Git.Git -e --source winget` | Includes **Git Bash** (a Bash terminal) and Git Credential Manager for HTTPS sign-in |
| macOS | `xcode-select --install` (Apple's Git), or `brew install git` with Homebrew for a newer version | Running `git` the first time may offer to install the command-line tools |
| Ubuntu / Debian | `sudo apt update && sudo apt install git` | Distribution packages may lag behind the latest release |
| Fedora | `sudo dnf install git` | |

> [!NOTE]
> The Git for Windows installer asks how to handle **line endings**. The default ("Checkout Windows-style, commit Unix-style") sets `core.autocrlf=true`. That is a sensible default for Windows-only teams; mixed teams usually prefer a `.gitattributes` file in the repository — see [Troubleshooting Conflicts, Ignored Files and Line Endings](../../troubleshooting/troubleshooting-conflicts-and-files/content.md).

### Verifying

```bash
git --version
```

**Output (varies):**

```text
git version 2.52.0.windows.1
```

On Linux and macOS the version has no `.windows.1` suffix. Any recent 2.x release works for this subject; commands introduced in newer versions (for example `git switch` and `git restore`, added in Git 2.23) are labelled when they appear.

## Getting Help

| Command | Shows | Use it when |
|---------|-------|-------------|
| `git help <command>` or `git <command> --help` | The full manual page (opens a browser page on Windows) | You need every option and its exact meaning |
| `git <command> -h` | A short usage summary in the terminal | You remember the command but not an option |
| `git help -g` | The list of concept guides (tutorial, glossary, workflows…) | You want background on a concept |
| `git help -a` | Every available command | You are exploring |

```bash
git add -h
```

**Output (first lines):**

```text
usage: git add [<options>] [--] <pathspec>...

    -n, --[no-]dry-run    dry run
    -v, --[no-]verbose    be verbose

    -i, --[no-]interactive
                          interactive picking
    -p, --[no-]patch      select hunks interactively
```

```bash
git help -g
```

**Output (first lines):**

```text
The Git concept guides are:
   core-tutorial    A Git core tutorial for developers
   credentials      Providing usernames and passwords to Git
   cvs-migration    Git for CVS users
   diffcore         Tweaking diff output
   everyday         A useful minimum set of commands for Everyday Git
   faq              Frequently asked questions about using Git
   glossary         A Git Glossary
```

## Commands

### git --version

**Purpose:** print the installed version. **Safety:** safe anywhere.

### git help

**Purpose:** open a manual page or guide. `git help glossary` explains Git's vocabulary (HEAD, index, ref…). **Safety:** safe anywhere.

### git COMMAND -h

**Purpose:** quick usage summary in the terminal. **Safety:** safe anywhere.

## Step-by-Step Example

Check that Git works, then see the error you get outside a repository:

```bash
git --version
mkdir -p ~/git-lab/hello && cd ~/git-lab/hello
git status
```

**Output (last command):**

```text
fatal: not a git repository (or any of the parent directories): .git
```

Git looked for a `.git` directory in the current folder and every parent folder and found none. Most commands (`status`, `log`, `commit`) only work inside a repository; `git init` or `git clone` creates one — see [Creating Repositories](../../configuration-and-repositories/creating-repositories/content.md).

## Common Mistakes

- **Installing Git but opening an old terminal.** The `PATH` change applies to terminals opened after installation.
- **Running Git commands in the wrong folder.** `fatal: not a git repository` means "you are not inside a repository" — `cd` into the project.
- **Copying options from the web for another version.** Check `git <command> -h` for your version.

## Interview Angle

Rarely asked directly, but "How do you find out what an option does?" shows self-sufficiency: `git <command> -h` for a summary, `git help <command>` for the manual.

## Recap

- Install Git for Windows (with Git Bash), Apple's or Homebrew's Git, or your Linux package.
- Verify with `git --version`.
- `-h` for a quick summary, `git help <command>` for the full manual, `git help -g` for guides.
- `fatal: not a git repository` means you are outside any repository.

## Related Topics

- [The Git Practice Lab](../git-practice-lab/content.md)
- [Git Configuration](../../configuration-and-repositories/git-configuration/content.md)
