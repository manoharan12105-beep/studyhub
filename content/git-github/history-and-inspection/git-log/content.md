# git log: Reading and Filtering History

**Module:** Commit History and Inspection · **Interview priority:** Core

## Learning Objectives

- Display history in full, one-line and graph form.
- Filter commits by author, date, message text and file path.
- Format log output for reports and scripts.

## What Is It?

`git log` lists commits reachable from `HEAD` (or from the commits you name), newest first, walking parent links backwards. Options control **which** commits are shown and **how** each is printed.

## Why It Matters

History is only useful if you can find things in it: "what changed in `GradeCalculator` this week?", "what did Arjun commit?", "when did we add rounding?". `git log` answers these in seconds, offline.

## How It Works

```text
git log [what to show] [how to show it] [-- paths]
          │                 │                 └─ only commits that touched these paths
          │                 └─ --oneline, --graph, --stat, -p, --format
          └─ revisions/ranges, --author, --since, --grep, -n
```

## Default and One-Line Output

```bash
git log -3
```

**Output:**

```text
commit 3a070e0d3d0abb543338e9b1bffc80830d43dd57
Author: Priya Sharma <priya@example.com>
Date:   Wed Oct 7 12:17:00 2026 +0530

    Raise the B threshold to 78

commit 10b997404d7d28c0dcbe8c24d68cd655ec2dfc74
Merge: d0e8c67 8b503ca
Author: Priya Sharma <priya@example.com>
Date:   Tue Oct 6 12:15:00 2026 +0530

    Merge branch 'feature/class-report'

commit 8b503ca3a25db20f9a2d8c72a66897a365ce9ed9
Author: Arjun Mehta <arjun@example.com>
Date:   Mon Oct 5 12:14:00 2026 +0530

    Show each student's average in ClassReport
```

The `Merge:` line lists the merge commit's two parents. Long output opens in a **pager** (`less`): press `q` to quit, `/text` to search, Space to page.

```bash
git log --oneline
```

**Output:**

```text
3a070e0 Raise the B threshold to 78
10b9974 Merge branch 'feature/class-report'
8b503ca Show each student's average in ClassReport
d0e8c67 Round averages to two decimals
3e2381d Add ClassReport with one line per student
4b17431 Document the grading scale in README
7c8bad0 Add Student record
8ba66e3 Add D grade for averages from 50 to 59
8ddf4ed Create gradebook project
```

Add `--graph --decorate --all` to draw branches and show labels — see [Commits, Hashes and the History Graph](../commits-and-history-graph/content.md) for the full graph.

## Filtering

| Question | Command |
|----------|---------|
| Last *n* commits | `git log -5` |
| Commits by an author (substring or regex of name/email) | `git log --author="Arjun"` |
| Commits in a date range | `git log --since="2026-10-04 00:00" --until="2026-10-05 23:59"` |
| Commits whose message mentions a word | `git log --grep="grade" -i` |
| Commits that touched a file | `git log -- path/to/File.java` |
| …following the file across renames | `git log --follow -- path/to/File.java` |
| Without merge commits | `git log --no-merges` |
| Only the main line (first parents) | `git log --first-parent` |
| Commits that added/removed a string in the code | `git log -S "letterGrade"` — see [Searching Code and History](../../advanced-inspection/searching-code-and-history/content.md) |

Captured examples:

```bash
git log --oneline --author="Arjun"
```

**Output:**

```text
8b503ca Show each student's average in ClassReport
3e2381d Add ClassReport with one line per student
7c8bad0 Add Student record
```

```bash
git log --oneline -- src/main/java/com/example/gradebook/GradeCalculator.java
```

**Output:**

```text
3a070e0 Raise the B threshold to 78
d0e8c67 Round averages to two decimals
8ba66e3 Add D grade for averages from 50 to 59
8ddf4ed Create gradebook project
```

```bash
git log --oneline --grep="grade" -i
```

**Output:**

```text
8ba66e3 Add D grade for averages from 50 to 59
8ddf4ed Create gradebook project
```

`--grep` searches messages only, as a pattern — "gradebook" matches "grade" too.

> [!WARNING]
> **Date-only filters use the current time of day.** `--since="2026-10-04"` run at 19:36 means "since 4 October, 19:36", so a commit made at 10:08 that day is missed. Include the time: `--since="2026-10-04 00:00"`. With explicit times, the range above returned four commits including `4b17431 Document the grading scale in README` (10:08 on 4 October); without them, it returned three.

Filters combine with AND between different options (`--author` and `--since`), while several `--grep` or `--author` options match any of them (add `--all-match` to require all greps).

## Formatting

```bash
git log --format='%h %an %ad %s' --date=short -4
```

**Output:**

```text
3a070e0 Priya Sharma 2026-10-07 Raise the B threshold to 78
10b9974 Priya Sharma 2026-10-06 Merge branch 'feature/class-report'
8b503ca Arjun Mehta 2026-10-05 Show each student's average in ClassReport
d0e8c67 Priya Sharma 2026-10-05 Round averages to two decimals
```

| Placeholder | Meaning |
|-------------|---------|
| `%h` / `%H` | Abbreviated / full hash |
| `%an` / `%ae` | Author name / email |
| `%ad` / `%ar` | Author date / relative ("3 days ago") |
| `%cn`, `%cd` | Committer name, date |
| `%s` | Subject |
| `%p` | Parent hashes |

Other useful views: `--stat` (files per commit), `-p` (full patch per commit), `--name-only`.

```bash
git log --stat -1 d0e8c67
```

**Output:**

```text
commit d0e8c67a8106c826a100d7eb4a216d8e7c55eb03
Author: Priya Sharma <priya@example.com>
Date:   Mon Oct 5 11:12:00 2026 +0530

    Round averages to two decimals

 src/main/java/com/example/gradebook/GradeCalculator.java | 3 ++-
 1 file changed, 2 insertions(+), 1 deletion(-)
```

## Commands

### git log

**Syntax:** `git log [<options>] [<revision-range>] [[--] <path>...]` · **Safety:** safe anywhere.

| Option | Effect |
|--------|--------|
| `--oneline` | One line per commit |
| `--graph --decorate --all` | Draw the DAG with branch/tag labels, all branches |
| `-n <N>` / `-<N>` | Limit the number of commits |
| `--author`, `--committer` | Filter by person |
| `--since`, `--until` | Filter by date (include a time) |
| `--grep` (`-i` for case-insensitive) | Filter by message |
| `-- <path>`, `--follow` | Filter by file |
| `--stat`, `-p`, `--format` | Change what each entry shows |

## Step-by-Step Example

"Arjun says he fixed the report output last week — which commit?"

1. `git log --oneline --author="Arjun" --since="2026-10-01 00:00"` — his recent commits.
2. `git log --oneline --author="Arjun" -- src/main/java/com/example/gradebook/ClassReport.java` — only those touching the report.
3. `git show 8b503ca` — read the change.

## Common Mistakes

- **Expecting `git log` to show other branches.** It shows history reachable from `HEAD`; add `--all` or name the branch.
- **Date filters without a time** (see the warning above).
- **Forgetting `--` before a path** that could be confused with a branch name.
- **Getting stuck in the pager.** Press `q`; or run `git --no-pager log -5`.

## Interview Angle

"How do you see the history of one file?" — `git log --follow -- <file>`, plus `-p` for its changes. "How do you find commits by a person or in a date range?" — `--author`, `--since/--until`. Mention `--oneline --graph --all` for a quick picture of branches.

## Recap

- `git log` walks parents from `HEAD`, newest first.
- Filter by author, date (with times), message, path; combine filters.
- Format with `--oneline`, `--graph`, `--stat`, `-p` or `--format`.
- `--all` shows every branch; `--first-parent` shows the main line.

## Related Topics

- [git show and Comparing Commits](../git-show-and-comparing/content.md)
- [git blame](../git-blame/content.md)
- [Searching Code and History](../../advanced-inspection/searching-code-and-history/content.md)
