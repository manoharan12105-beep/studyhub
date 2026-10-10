# git archive, Useful Aliases and Efficient Investigation

**Module:** Advanced Inspection and Search · **Interview priority:** Awareness

## Learning Objectives

- Export a clean snapshot of any commit with `git archive`.
- Define aliases that shorten frequent commands, including shell aliases.
- Combine inspection commands into a fast, repeatable investigation routine.

## What Is It?

- **`git archive`** writes the files of a commit (or a subdirectory) into a ZIP or TAR file — tracked files only, without `.git`, `target/` or your uncommitted changes.
- **Aliases** are your own Git subcommands, stored in configuration: `git config --global alias.lg "log --oneline --graph --decorate --all"` makes `git lg` work.

## Why It Matters

`git archive` is the reliable way to hand someone "exactly version 1.1.0" — for a submission, an audit or a source release. Aliases turn the long commands from this subject into habits, which is what makes investigation fast in practice.

## How It Works

### git archive

```bash
git archive --format=zip --prefix=gradebook-1.1.0/ -o ../gradebook-1.1.0.zip HEAD
unzip -l ../gradebook-1.1.0.zip | tail -4
```

**Output:**

```text
        0  2026-10-07 12:17   gradebook-1.1.0/src/test/java/com/example/gradebook/
      809  2026-10-07 12:17   gradebook-1.1.0/src/test/java/com/example/gradebook/GradeCalculatorTest.java
---------                     -------
     3930                     20 files
```

- `--prefix` puts everything in a top-level folder (end it with `/`).
- File dates are the **commit's** date, so archives of the same commit are reproducible.
- Use a tag for releases: `git archive -o gradebook-v1.1.0.zip v1.1.0`.

Only part of the tree, as a gzipped tar:

```bash
git archive --format=tar.gz -o ../src.tgz HEAD src/main
tar -tzf ../src.tgz
```

**Output:**

```text
src/
src/main/
src/main/java/
src/main/java/com/
src/main/java/com/example/
src/main/java/com/example/gradebook/
src/main/java/com/example/gradebook/App.java
src/main/java/com/example/gradebook/ClassReport.java
src/main/java/com/example/gradebook/GradeCalculator.java
src/main/java/com/example/gradebook/Student.java
```

A `.gitattributes` line `docs/internal/ export-ignore` excludes paths from every archive.

### Aliases

```bash
git config --global alias.st "status -sb"
git config --global alias.lg "log --oneline --graph --decorate --all"
git config --global alias.last "log -1 --stat"
git config --global alias.unstage "restore --staged"
git config --global alias.amend-noedit "commit --amend --no-edit"
git config --global alias.aliases '!git config --get-regexp ^alias\.'
```

```bash
git st
git lg -6
```

**Output:**

```text
## main
* 3a070e0 (HEAD -> main) Raise the B threshold to 78
*   10b9974 Merge branch 'feature/class-report'
|\  
| * 8b503ca (feature/class-report) Show each student's average in ClassReport
| * 3e2381d Add ClassReport with one line per student
* | d0e8c67 Round averages to two decimals
|/  
* 4b17431 Document the grading scale in README
```

```bash
git aliases
```

**Output:**

```text
alias.st status -sb
alias.lg log --oneline --graph --decorate --all
alias.last log -1 --stat
alias.unstage restore --staged
alias.amend-noedit commit --amend --no-edit
alias.aliases !git config --get-regexp ^alias\.
```

An alias starting with `!` runs a **shell command** (here, a `git config` query) — powerful, so only add shell aliases you understand, and never copy one blindly from the internet. Aliases can't override built-in commands (`alias.status` is ignored).

> [!CAUTION]
> Avoid aliases that hide danger, such as `alias.nuke = reset --hard` or `alias.pf = push --force`. Aliases are for frequent, safe commands; risky operations should stay explicit. If you alias a force push, make it `push --force-with-lease`.

## An Efficient Investigation Routine

When something is wrong, answer the questions in order — each step uses commands from this module:

| Question | Command |
|----------|---------|
| Where am I, what's changed? | `git st`, `git diff --stat` |
| What does history look like? | `git lg -15` |
| What changed between good and bad? | `git log --oneline good..bad`, `git diff good bad --stat` |
| Where is the code? | `git grep -n <symbol>` |
| When did it change? | `git log -G <regex> -p -- <path>`, `git log -S <string>` |
| Why did this line change? | `git blame -L <lines> <file>` → `git show <commit>` |
| Which commit broke it? | `git bisect run <script>` |
| Is the fix released? | `git tag --contains <fix>` |

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git archive [--format=zip\|tar.gz] [--prefix=dir/] -o <file> <tree-ish> [<path>]` | Export a snapshot | Safe anywhere (writes a file outside the repository) |
| `git config --global alias.<name> "<command>"` | Define an alias | Local configuration |
| `git config --get-regexp ^alias\.` | List aliases | Safe anywhere |

## Step-by-Step Example

Submit gradebook version 1.1.0 for grading:

1. `git switch main && git pull && git status` — clean.
2. `git archive --format=zip --prefix=gradebook-1.1.0/ -o ~/gradebook-1.1.0.zip v1.1.0`.
3. `unzip -l ~/gradebook-1.1.0.zip` — no `target/`, no `.git`, no `.env`.
4. Submit the ZIP; the tag records exactly what was submitted.

## Common Mistakes

- **Zipping the project folder by hand** — includes `.git`, `target/`, IDE files and local secrets.
- **Archiving `HEAD` with uncommitted changes and expecting them included** — archive uses the commit.
- **Too many cryptic aliases** — nobody else (including future you) can read them.
- **Shell aliases from untrusted sources.**

## Interview Angle

Rarely a direct question, but "how do you investigate a regression with Git?" is — walk through the routine above. Mentioning `git archive` for clean source bundles and a couple of aliases shows practical fluency.

## Recap

- `git archive` exports a commit's tracked files to ZIP/TAR, reproducibly.
- Aliases shorten frequent commands; `!` aliases run shell commands — use with care.
- Investigation: status → graph → range → grep → pickaxe → blame → bisect → contains.

## Related Topics

- [Searching Code and History](../searching-code-and-history/content.md)
- [git bisect](../git-bisect/content.md)
- [Git Configuration](../../configuration-and-repositories/git-configuration/content.md)
