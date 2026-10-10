# Searching Code and History: git grep, log -S, log -G and Word Diffs

**Module:** Advanced Inspection and Search · **Interview priority:** Frequently asked

## Learning Objectives

- Search tracked files in any commit with `git grep`.
- Find the commits that introduced, removed or changed code with the pickaxe options `-S` and `-G`, and know their difference.
- Read small changes precisely with `--word-diff`.

## What Is It?

| Tool | Searches | Answers |
|------|----------|---------|
| `git grep <pattern> [<commit>]` | **File contents** of the working tree or any commit | "Where is `letterGrade` used?" |
| `git log -S <string>` | Commits whose diff **changes the number of occurrences** of the string | "When was `Math.round` added (or removed)?" |
| `git log -G <regex>` | Commits whose diff **adds or removes a line matching** the regex | "When did any line with `return 'B'` change?" |
| `git log --grep <pattern>` | Commit **messages** | "Which commits mention rounding?" |
| `git diff --word-diff` | Changes **within lines** | "What exactly changed on this line?" |

## Why It Matters

Debugging and code archaeology are mostly searching: where is this used, when did it appear, who changed this constant. These commands answer that across the whole history in seconds — no checkout of old versions needed.

## How It Works

### git grep

```bash
git grep -n "letterGrade"
```

**Output:**

```text
src/main/java/com/example/gradebook/App.java:7:        System.out.printf("Average: %.2f, grade: %c%n", average, calculator.letterGrade(average));
src/main/java/com/example/gradebook/ClassReport.java:15:                  .append(calculator.letterGrade(average))
src/main/java/com/example/gradebook/GradeCalculator.java:19:    public char letterGrade(double average) {
src/test/java/com/example/gradebook/GradeCalculatorTest.java:24:        assertEquals('A', calculator.letterGrade(90));
src/test/java/com/example/gradebook/GradeCalculatorTest.java:25:        assertEquals('B', calculator.letterGrade(89.9));
src/test/java/com/example/gradebook/GradeCalculatorTest.java:26:        assertEquals('D', calculator.letterGrade(59.9));
src/test/java/com/example/gradebook/GradeCalculatorTest.java:27:        assertEquals('F', calculator.letterGrade(49.9));
```

Unlike plain `grep -r`, it searches only **tracked** files (skipping `target/` and other ignored files) and can search any commit:

```bash
git grep -n "return 'B'" 8ddf4ed -- src
```

**Output:**

```text
8ddf4ed:src/main/java/com/example/gradebook/GradeCalculator.java:20:        if (average >= 75) return 'B';
```

Combining patterns — lines containing both words, Java files only:

```bash
git grep -n -e "average" --and -e "double" -- '*.java'
```

**Output:**

```text
src/main/java/com/example/gradebook/App.java:6:        double average = calculator.average(82, 91, 77);
src/main/java/com/example/gradebook/ClassReport.java:12:            double average = calculator.average(student.marks());
src/main/java/com/example/gradebook/GradeCalculator.java:6:    public double average(int... marks) {
src/main/java/com/example/gradebook/GradeCalculator.java:14:        double average = (double) total / marks.length;
src/main/java/com/example/gradebook/GradeCalculator.java:19:    public char letterGrade(double average) {
```

Useful options: `-n` line numbers, `-c` count per file, `-i` ignore case, `-w` whole words, `-l` file names only, `-p` show the enclosing method.

### The pickaxe: -S vs -G

```bash
git log --oneline -S "Math.round"
```

**Output:**

```text
d0e8c67 Round averages to two decimals
```

The commit that added the first `Math.round`. Now search for the B-grade line:

```bash
git log --oneline -S "return 'B'"
git log --oneline -G "return .B.;"
```

**Output:**

```text
8ddf4ed Create gradebook project
3a070e0 Raise the B threshold to 78
8ddf4ed Create gradebook project
```

`-S` found **only** the commit that created the line. The commit that changed `>= 75` to `>= 78` kept exactly one occurrence of `return 'B'`, so the **count** didn't change and `-S` ignored it. `-G` matches any added or removed line matching the regex, so it also found `3a070e0`.

> [!TIP]
> Use `-S` to find when something **appeared or disappeared** (a method, a constant, a secret). Use `-G` to find **every change to lines** matching a pattern. Add `-p` to see the diffs, `--all` to search every branch, and `-- <path>` to limit to files.

### Word diffs

```bash
git diff --word-diff d0e8c67 3a070e0
```

**Output (last lines):**

```text
        if (average >= 90) return 'A';
        if (average >= [-75)-]{+78)+} return 'B';
        if (average >= 60) return 'C';
        if (average >= 50) return 'D';
        return 'F';
```

`[-…-]` removed, `{+…+}` added — far easier to read than a removed and an added line for one-character changes, especially in long lines and Markdown. `--word-diff=color` uses colours instead of markers.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git grep [-n] [-e …] [<commit>] [-- <paths>]` | Search contents | Safe anywhere |
| `git log -S <string> [-p] [--all]` | Occurrence count changed | Safe anywhere |
| `git log -G <regex> [-p] [--all]` | Matching lines added/removed | Safe anywhere |
| `git log --grep <pattern>` | Search messages | Safe anywhere |
| `git diff --word-diff` | In-line changes | Safe anywhere |

## Step-by-Step Example

"Students say grades changed — when did the grading rules change, and where is the rule used?"

1. `git log --oneline -G "return '[A-F]'" -- src/main` — every commit that touched a grade rule.
2. `git show 3a070e0` — the threshold change.
3. `git grep -n letterGrade` — every caller that's affected.
4. `git log --oneline -S "letterGrade(75)" -- src/test` — was a boundary test ever added? (No output → add one.)

## Common Mistakes

- **Using `-S` to find modifications of a line** — it only reports count changes; use `-G`.
- **Forgetting `--all`** — the commit may be on another branch.
- **`grep -r` in a Maven project** — floods results with `target/`; `git grep` skips untracked and ignored files.
- **Searching messages (`--grep`) when you meant code (`-S`).**

## Interview Angle

"How would you find the commit that introduced a particular function or string?" — `git log -S <string>` (with `-p`, `--all`); explain `-G` for line changes and `git grep` for current or historical file contents. Mentioning the `-S`/`-G` difference stands out.

## Recap

- `git grep` searches tracked contents, now or at any commit.
- `log -S` = occurrences changed (added/removed); `log -G` = matching lines changed.
- `log --grep` searches messages, not code.
- `--word-diff` shows exactly what changed inside a line.

## Related Topics

- [git log](../../history-and-inspection/git-log/content.md)
- [Ranges and Ancestry](../ranges-and-ancestry/content.md)
- [Secrets in Git History](../../authentication-and-security/secrets-in-git-history/content.md)
