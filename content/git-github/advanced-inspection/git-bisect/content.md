# git bisect: Finding the Commit That Broke Something

**Module:** Advanced Inspection and Search · **Interview priority:** Frequently asked

## Learning Objectives

- Explain how `git bisect` uses binary search over commit history.
- Run a manual bisect session with `good`, `bad`, `skip` and `reset`.
- Automate it with `git bisect run` and a test script whose exit code decides good or bad.

## What Is It?

`git bisect` finds the **first bad commit** — the commit that introduced a bug — between a known good commit and a known bad one. It repeatedly checks out the commit in the middle of the remaining range; you (or a script) say whether it's good or bad; Git halves the range each time.

With *n* commits in the range it needs about **log₂ n** tests: 10 commits → ~3–4 steps, 1,000 commits → ~10.

## Why It Matters

"It worked in release 1.0 and fails now, 200 commits later" is a common, painful question. Reading 200 diffs is slow and error-prone; bisect answers it in about 8 tests — fully automatically if you have a test.

## How It Works

```text
good                                                        bad
c378147  5d7492f  5b5d153  c740162  4063a61  3e5e6f0  8c2be3a  61c4a1a  4c1fbfb  9e4f576
   ✔                                  ? test 1 → good
                                                 ? test 3 → good
                                                          ? test 2 → bad
                                                          └── first bad commit
```

The bug: `letterGrade(75)` returns `'C'` instead of `'B'`. History (newest first):

```text
9e4f576 Tidy App output
4c1fbfb Mention JDK 17 requirement
61c4a1a Add contributing notes
8c2be3a Use a ternary for the C grade
3e5e6f0 Explain rounding in README
4063a61 Rename loop variable in average
c740162 Clarify the empty marks error
5b5d153 Add grading scale to README
5d7492f Document the build in README
c378147 Create gradebook project
```

No message mentions the B threshold — reading messages wouldn't find it.

### A test for the bug

A small checker outside the repository (so every checked-out commit can use it), `~/git-lab/BBoundaryCheck.java`:

```java
import com.example.gradebook.GradeCalculator;

public class BBoundaryCheck {
    public static void main(String[] args) {
        char grade = new GradeCalculator().letterGrade(75);
        System.out.println("letterGrade(75) = " + grade);
        System.exit(grade == 'B' ? 0 : 1);
    }
}
```

and `~/git-lab/check-b-boundary.sh`, run from the repository root:

```bash
#!/bin/sh
# Exit 0 = good, 1 = bad, 125 = cannot test (skip). Used by git bisect run.
out=$(mktemp -d)
javac -d "$out" src/main/java/com/example/gradebook/GradeCalculator.java || exit 125
javac -cp "$out" -d "$out" ../BBoundaryCheck.java || exit 125
java -cp "$out" BBoundaryCheck
```

### Manual bisect

```bash
git bisect start
git bisect bad                 # current commit (9e4f576) is bad
git bisect good c378147        # the first commit was fine
```

**Output:**

```text
status: waiting for both good and bad commits
status: waiting for good commit(s), bad commit known
Bisecting: 4 revisions left to test after this (roughly 2 steps)
[4063a61332859aca01961b59bb455c9cb4f617d0] Rename loop variable in average
```

Test, then report the result; repeat:

```bash
sh ../check-b-boundary.sh      # letterGrade(75) = B
git bisect good
sh ../check-b-boundary.sh      # letterGrade(75) = C
git bisect bad
sh ../check-b-boundary.sh      # letterGrade(75) = B
git bisect good
```

**Output (last `git bisect good`, first lines):**

```text
8c2be3aaf6535b68ed4634287e51a5bc87231bc8 is the first bad commit
commit 8c2be3aaf6535b68ed4634287e51a5bc87231bc8
Author: Priya Sharma <priya@example.com>
Date:   Thu Oct 1 10:08:00 2026 +0530

    Use a ternary for the C grade
```

```bash
git show 8c2be3a
```

**Output (the change):**

```text
-        if (average >= 75) return 'B';
+        if (average > 75) return 'B';
```

A "refactor" quietly changed `>=` to `>`. Finish with:

```bash
git bisect reset
```

which returns you to the branch you started on (`Switched to branch 'main'`). Always reset — during bisect you're on a detached HEAD.

### Automatic bisect

```bash
git bisect start HEAD c378147          # bad first, then good
git bisect run sh ../check-b-boundary.sh
```

**Output (shortened):**

```text
Bisecting: 4 revisions left to test after this (roughly 2 steps)
[4063a61332859aca01961b59bb455c9cb4f617d0] Rename loop variable in average
running 'sh' '../check-b-boundary.sh'
letterGrade(75) = B
Bisecting: 2 revisions left to test after this (roughly 1 step)
[8c2be3aaf6535b68ed4634287e51a5bc87231bc8] Use a ternary for the C grade
running 'sh' '../check-b-boundary.sh'
letterGrade(75) = C
Bisecting: 0 revisions left to test after this (roughly 0 steps)
[3e5e6f0db957c3b9e392f1252c61226b108b2a23] Explain rounding in README
running 'sh' '../check-b-boundary.sh'
letterGrade(75) = B
8c2be3aaf6535b68ed4634287e51a5bc87231bc8 is the first bad commit
…
bisect found first bad commit
```

**Exit codes the script must use:** `0` good, `1`–`127` bad — **except `125`**, which means "can't test this commit, skip it" (for example it doesn't compile for an unrelated reason). Exit codes above 127 abort the bisect.

With Maven you can often use the test suite directly — `git bisect run mvn -q -B test` — as long as the test that detects the bug exists in every commit being tested; otherwise keep the test outside the repository as above.

## Useful Subcommands

| Command | Purpose |
|---------|---------|
| `git bisect skip` | This commit can't be tested; choose another nearby |
| `git bisect log` | Record of the session (replayable with `git bisect replay <file>`) |
| `git bisect visualize` / `view` | Show the remaining suspects |
| `git bisect terms --term-old fast --term-new slow` | Use other words, e.g. hunting a performance regression |
| `git bisect start --first-parent` | Only step through main-line commits (merges as units) |

## Commands

### git bisect

**Syntax:** `git bisect start [<bad> [<good>…]]`, `good`, `bad`, `skip`, `run <cmd>`, `reset` · **Safety:** changes local state (checks out commits, detached HEAD); start with a clean working tree and always `reset`.

## Step-by-Step Example

1. Make sure `git status` is clean (stash if needed).
2. Find a good commit (a release tag: `v1.0.0`) and confirm the bug at `HEAD`.
3. Write a script that exits 0/1/125 for good/bad/skip.
4. `git bisect start HEAD v1.0.0` and `git bisect run <script>`.
5. `git show <first-bad>`; `git bisect reset`.
6. Fix forward with a test for the boundary — and revert the bad commit if it's simpler.

## Common Mistakes

- **Forgetting `git bisect reset`** — you stay detached on an old commit.
- **Marking a commit bad for a different failure** (it fails to compile) — use `skip` / exit 125.
- **Test scripts inside the repository** that don't exist in older commits.
- **Commits that don't build** throughout history — bisect works best when every commit builds ([Atomic Commits](../../basic-workflow/commit-messages-and-atomic-commits/content.md)).

## Interview Angle

"How would you find which commit introduced a bug among hundreds?" — `git bisect` with a known good and bad commit; binary search, about log₂ n steps; automate with `bisect run` and a script returning 0/1/125. Bonus: `skip`, `--first-parent`, keeping commits buildable.

## Recap

- Bisect = binary search between a good and a bad commit for the first bad commit.
- Manual: `start`, `bad`, `good`, test, repeat, `reset`.
- Automatic: `git bisect run <script>`; exit 0 good, 1–127 bad, 125 skip.
- Works best with buildable, focused commits and a reliable test.

## Related Topics

- [Ranges and Ancestry](../ranges-and-ancestry/content.md)
- [git blame](../../history-and-inspection/git-blame/content.md)
- [Recovering a Broken Commit in a Java Project](../../java-project-workflow/java-pull-request-review/content.md)
