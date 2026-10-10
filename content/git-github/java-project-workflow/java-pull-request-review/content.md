# Reviewing Java Pull Requests, Recovering a Broken Commit and Tagging a Release

**Module:** Java Project Git Workflow · **Interview priority:** Frequently asked

> [!NOTE]
> The broken commit, its revert and the 1.0.0 release were reproduced in the practice lab with real Maven builds (Maven 3.9.12).

## Learning Objectives

- Review a Java pull request with Git commands as well as the web view.
- Recover quickly when a commit breaks the build on `main`.
- Tag a working Maven release so it can be rebuilt and rolled back to.

## What Is It?

Three moments in a Java project's life where Git skills decide the outcome: **before** a change lands (review), **when** a bad change lands (recovery), and **when** a good state should be preserved (release tagging).

## Why It Matters

A broken `main` blocks every teammate; a release that can't be rebuilt from a tag can't be fixed safely. These are the situations interviewers like to probe with "what would you do?".

## How It Works

### Reviewing a Java PR from the command line

```bash
git fetch origin
git log --oneline main..origin/feature/highest-mark      # the commits
git diff --stat main...origin/feature/highest-mark       # files touched
git diff main...origin/feature/highest-mark -- src/test  # tests first
```

**Output (test changes for the highest-mark feature):**

```text
 src/test/java/com/example/gradebook/GradeCalculatorTest.java | 5 +++++
 1 file changed, 5 insertions(+)
```

Reading tests first tells you what the author claims the code does. Then check it out and build: `git switch --detach origin/feature/highest-mark && mvn -B verify` (or use a [worktree](../../specialized-workflows/git-worktrees/content.md)).

**Java review checklist:**

| Area | Look for |
|------|----------|
| Behaviour | Boundaries (75 vs 74.99), empty input, `null`, integer division |
| Tests | Fail without the change; cover edge cases; no `@Disabled` added quietly |
| API | Public methods documented; breaking changes flagged (semantic versioning) |
| Exceptions | Specific types, useful messages, nothing swallowed |
| Resources and security | Closed streams/connections, parameterised SQL, no secrets or personal data in logs |
| Build | `pom.xml` changes justified; no `target/` or IDE files in the diff |

See [Reviewing Pull Requests](../../pull-requests-and-review/reviewing-pull-requests/content.md) for comments and verdicts.

### Recovering a broken commit on main

Arjun's commit "Return grade C as text" landed on `main`. The build:

```bash
mvn -B compile
```

**Output (error line):**

```text
[ERROR] /home/student/git-lab/gradebook/src/main/java/com/example/gradebook/GradeCalculator.java:[21,35] incompatible types: java.lang.String cannot be converted to char
```

```bash
git log --oneline -2
```

**Output:**

```text
56db226 Return grade C as text
bc1de0f Merge branch 'main' into feature/highest-mark
```

The culprit is obvious here; when it isn't, [git bisect](../../advanced-inspection/git-bisect/content.md) finds it. Because `main` is shared, **revert** — don't reset:

```bash
git revert --no-edit HEAD
mvn -B verify
```

**Output:**

```text
[main adc62d6] Revert "Return grade C as text"
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

`main` is green again within minutes; Arjun fixes the change on a branch and re-submits it through a PR. Required CI checks on `main` would have stopped the commit in the first place ([Branch Protection](../../team-workflows/branch-protection-and-code-ownership/content.md)).

### Tagging a working release

The Maven version and the Git tag should agree:

```bash
# pom.xml: <version>1.0.0-SNAPSHOT</version>  →  <version>1.0.0</version>
git commit -am "Release 1.0.0"
git tag -a v1.0.0 -m "gradebook 1.0.0"
mvn -B clean verify
ls target/*.jar
```

**Output:**

```text
target/gradebook-1.0.0.jar
```

Then start the next version:

```bash
# pom.xml: <version>1.0.0</version>  →  <version>1.1.0-SNAPSHOT</version>
git commit -am "Start 1.1.0 development"
git log --oneline --decorate -3
git describe
```

**Output:**

```text
024a4ee (HEAD -> main) Start 1.1.0 development
76bdcdf (tag: v1.0.0) Release 1.0.0
adc62d6 Revert "Return grade C as text"
v1.0.0-1-g024a4ee
```

`git push origin main v1.0.0` publishes both. Anyone can now rebuild exactly 1.0.0 with `git switch --detach v1.0.0 && mvn -B verify`, and a hotfix starts from the tag ([GitHub Releases and Rollback Planning](../../tags-and-releases/github-releases/content.md)). Tools such as the Maven Release Plugin automate these steps; the Git result is the same.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git diff main...<branch> -- src/test` | Review tests first | Safe anywhere |
| `git revert <commit>` | Undo a shared broken commit | Changes local state; safe to push |
| `git tag -a vX.Y.Z -m "…"` | Mark the release commit | Changes local state |
| `git describe` | Version string for builds between releases | Safe anywhere |

## Step-by-Step Example

1. Review PR: tests first, then code; build locally; approve.
2. After merge, CI on `main` fails → `git revert` the culprit, push, notify the author.
3. Release: set the POM version, commit, tag `v1.0.0`, build the JAR from the tag, push, bump to the next SNAPSHOT.

## Common Mistakes

- **Approving Java PRs without building them** (or without CI).
- **Resetting `main` and force-pushing** to remove a broken commit.
- **Tagging a commit whose POM still says SNAPSHOT** — the tag and the artifact disagree.
- **Building release JARs from a dirty working tree.**

## Interview Angle

"Main is broken after a merge — what do you do?" — identify the commit (log, CI, bisect), `git revert` it, verify the build, push, then fix forward on a branch; add required checks. "How do you release a Maven project?" — version without SNAPSHOT, commit, annotated tag, build from the tag, push tag, bump to next SNAPSHOT.

## Recap

- Review Java PRs with `log ..`, `diff ...` (tests first) and a local build.
- Broken shared commit → `git revert`, verify, push; fix forward.
- Release = non-SNAPSHOT version commit + annotated tag + build from the tag + next SNAPSHOT.

## Related Topics

- [Java Feature Branch Workflow](../java-feature-branch-workflow/content.md)
- [git revert](../../undoing-and-recovery/git-revert/content.md)
- [Semantic Versioning](../../tags-and-releases/semantic-versioning/content.md)
