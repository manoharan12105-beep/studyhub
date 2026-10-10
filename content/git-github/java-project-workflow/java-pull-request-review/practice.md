# Reviewing Java Pull Requests, Recovering a Broken Commit and Tagging a Release — Practice

### P1. Tests of a PR

**Difficulty:** Easy · **Type:** Command · **Concepts:** three-dot diff with path

Show only the test changes that `origin/feature/highest-mark` introduces relative to `main`.

<details>
<summary>Answer</summary>

`git diff main...origin/feature/highest-mark -- src/test`

</details>

### P2. Read the compiler error

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** build failure

```text
[ERROR] …/GradeCalculator.java:[21,35] incompatible types: java.lang.String cannot be converted to char
```

What does `[21,35]` mean, and what kind of change caused it?

<details>
<summary>Answer</summary>

Line 21, column 35 of `GradeCalculator.java`. A `String` (`"C"`) was returned where the method's return type is `char` (`'C'`).

</details>

### P3. Undo on main

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** revert vs reset

The breaking commit is `HEAD` on the shared `main`. Which command undoes it safely?

- A) `git reset --hard HEAD~1`
- B) `git revert HEAD`
- C) `git commit --amend`
- D) `git checkout HEAD~1`

<details>
<summary>Answer</summary>

**Answer:** B) `git revert HEAD`

</details>

### P4. Release steps

**Difficulty:** Medium · **Type:** Command · **Concepts:** release tagging

The POM is at `1.2.0-SNAPSHOT`. After editing it to `1.2.0`, write the Git commands to commit, tag and publish the release.

<details>
<summary>Answer</summary>

```bash
git commit -am "Release 1.2.0"
git tag -a v1.2.0 -m "gradebook 1.2.0"
git push origin main v1.2.0
```

Then set the POM to `1.3.0-SNAPSHOT` and commit "Start 1.3.0 development".

</details>

### P5. Rebuild an old version

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** building from tags

A school still runs gradebook 1.0.0 and reports a bug. How do you build exactly that version locally?

<details>
<summary>Answer</summary>

`git fetch --tags`, `git switch --detach v1.0.0` (or a worktree at the tag), `mvn -B verify`. For a fix, `git switch -c hotfix/1.0.1 v1.0.0`.

</details>
