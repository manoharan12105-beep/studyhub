# Searching Code and History — Practice

### P1. Where is it used?

**Difficulty:** Easy · **Type:** Command · **Concepts:** git grep

List every line (with line numbers) in tracked Java files that mentions `ClassReport`.

<details>
<summary>Answer</summary>

`git grep -n "ClassReport" -- '*.java'`

</details>

### P2. Pick the pickaxe

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** -S vs -G

You want every commit that modified any line containing `return 'B'`, including ones that only changed the threshold. Which command?

- A) `git log -S "return 'B'"`
- B) `git log -G "return .B."`
- C) `git log --grep "return 'B'"`
- D) `git grep "return 'B'"`

<details>
<summary>Answer</summary>

**Answer:** B) `git log -G "return .B."`

`-S` misses edits that keep the occurrence count the same; `--grep` searches messages; `git grep` searches contents, not history of changes.

</details>

### P3. Search an old release

**Difficulty:** Medium · **Type:** Command · **Concepts:** grep in a commit

Did tag `v1.0.0` already contain `Math.round`? Search that commit's `src` directory.

<details>
<summary>Answer</summary>

`git grep -n "Math.round" v1.0.0 -- src` — no output means it wasn't there.

</details>

### P4. Read a word diff

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** word-diff

What changed here? `if (average >= [-75)-]{+78)+} return 'B';`

<details>
<summary>Answer</summary>

The threshold `75` was replaced by `78`; the rest of the line is unchanged.

</details>

### P5. When did it disappear?

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** pickaxe for removals

The method `ClassReport.highest()` existed last month and is gone now. Find the commit that removed it, on any branch, and show its diff.

<details>
<summary>Answer</summary>

`git log --all -S "highest(" -p -- src/main/java/com/example/gradebook/ClassReport.java` — the newest listed commit that changed the count is where it was removed (its diff shows the removed lines).

</details>
