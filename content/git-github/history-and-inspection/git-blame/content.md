# git blame: Who Changed This Line and Why

**Module:** Commit History and Inspection · **Interview priority:** Frequently asked

## Learning Objectives

- Read `git blame` output and find the commit that last changed a line.
- Limit blame to a range of lines and ignore whitespace or moved code.
- Use blame as the start of an investigation, not a verdict about a person.

## What Is It?

`git blame <file>` annotates every line of a file with the commit that **last changed** that line: abbreviated hash, author, date and line number. From the hash, `git show` gives the full commit and its message — the *why*.

## Why It Matters

When a line looks wrong ("why is the B threshold 78?"), blame jumps straight to the commit that introduced it, its author, its message and the related changes. It turns a guessing game into a two-command lookup.

## How It Works

Git walks history backwards from the given commit, and for each line finds the most recent commit whose diff added or changed it.

```bash
git blame -L 18,26 src/main/java/com/example/gradebook/GradeCalculator.java
```

**Output:**

```text
8ba66e31 (Priya Sharma 2026-10-02 10:04:00 +0530 18)     /** A for 90+, B for 75+, C for 60+, D for 50+, F below 50. */
^8ddf4ed (Priya Sharma 2026-10-01 10:02:00 +0530 19)     public char letterGrade(double average) {
^8ddf4ed (Priya Sharma 2026-10-01 10:02:00 +0530 20)         if (average >= 90) return 'A';
3a070e0d (Priya Sharma 2026-10-07 12:17:00 +0530 21)         if (average >= 78) return 'B';
^8ddf4ed (Priya Sharma 2026-10-01 10:02:00 +0530 22)         if (average >= 60) return 'C';
8ba66e31 (Priya Sharma 2026-10-02 10:04:00 +0530 23)         if (average >= 50) return 'D';
^8ddf4ed (Priya Sharma 2026-10-01 10:02:00 +0530 24)         return 'F';
^8ddf4ed (Priya Sharma 2026-10-01 10:02:00 +0530 25)     }
^8ddf4ed (Priya Sharma 2026-10-01 10:02:00 +0530 26) }
```

| Part | Meaning |
|------|---------|
| `3a070e0d` | Commit that last changed the line |
| `^8ddf4ed` | `^` = the line comes from the boundary commit — here the root commit; the line hasn't changed since the file was created |
| `(Priya Sharma 2026-10-07 … 21)` | Author, author date, line number |

Blame found something interesting: line 21 (`78`) was changed on 7 October, while the Javadoc on line 18 — still saying "B for 75+" — dates from 2 October. The comment is now **wrong**. `git show 3a070e0` explains the change, and the fix is to update the comment.

## Useful Options

| Option | Effect |
|--------|--------|
| `-L 18,26` | Only lines 18–26 |
| `-L :letterGrade` | Only the function `letterGrade` — needs the Java function-name rule, see the note below |
| `-w` | Ignore whitespace-only changes (a reindent won't hide the real author) |
| `-M` | Detect lines moved within the file |
| `-C` | Detect lines moved or copied from other files in the same commit (`-C -C` searches more widely) |
| `-e` | Show the author email instead of the name |
| `<commit> -- <file>` | Blame as of an older commit |
| `--ignore-rev <hash>` / `--ignore-revs-file <file>` | Skip a commit such as a mass reformat |

> [!NOTE]
> `-L :name` finds a function by Git's "function header" rules, and the default rule doesn't understand indented Java methods: without configuration, `git blame -L :letterGrade …` fails with `fatal: -L parameter 'letterGrade' starting at line 1: no match`. Add the line `*.java diff=java` to the repository's `.gitattributes` and it selects lines 19–26 — the method through to the end of the class (Git cannot tell where a Java method ends, so it stops at the next method header or the end of the file). The same attribute improves the `@@` context shown in Java diffs.

A team that reformats the whole codebase usually adds the reformat commit's hash to a `.git-blame-ignore-revs` file and runs `git config blame.ignoreRevsFile .git-blame-ignore-revs`; GitHub's blame view honours that file too.

## Blame on GitHub and in IDEs

GitHub's **Blame** button on any file shows the same information with links to each commit and pull request. IntelliJ IDEA's *Annotate with Git Blame* and VS Code's built-in or extension blame views show it beside the editor.

## Commands

### git blame

**Syntax:** `git blame [-L <start>,<end>] [-w] [-M] [-C] [<commit>] [--] <file>` · **Safety:** safe anywhere.

## Step-by-Step Example

"Why does a student with 77 get a C?"

1. `git blame -L 19,26 src/main/java/com/example/gradebook/GradeCalculator.java` (or `-L :letterGrade` with the `diff=java` attribute) — line 21 changed in `3a070e0`.
2. `git show 3a070e0` — "Raise the B threshold to 78", one line changed.
3. If the message doesn't say why, check the pull request linked to that commit on GitHub, or ask the author.
4. If the line was only reformatted, rerun with `-w` or blame the parent: `git blame 3a070e0^ -- <file>`.

## Common Mistakes

- **Using blame to assign fault.** The last person to touch a line may only have moved or reformatted it. Blame finds the commit; the conversation is about the change.
- **Stopping at a formatting commit.** Use `-w`, `-M`/`-C`, ignore-revs files, or blame the parent commit.
- **Forgetting that blame shows only the last change.** A line changed five times shows only the newest commit; to see earlier versions, blame the parent (`git blame <hash>^ -- <file>`) or read `git log -L 21,21:<file>`, which lists every commit that touched that line range.

## Interview Angle

"How do you find who introduced a particular line?" — `git blame -L` on the lines, then `git show` on the commit for the message and context. Mention `-w`/`-C` and ignore-revs to show you know blame's blind spots.

## Recap

- `git blame` annotates each line with the commit, author and date of its last change.
- `^hash` marks lines unchanged since the boundary (often the root) commit.
- `-L` limits lines; `-w`, `-M`, `-C` and ignore-revs see through formatting and moves.
- Follow up with `git show` — the message explains why.

## Related Topics

- [git log](../git-log/content.md)
- [git show and Comparing Commits](../git-show-and-comparing/content.md)
- [git bisect](../../advanced-inspection/git-bisect/content.md)
