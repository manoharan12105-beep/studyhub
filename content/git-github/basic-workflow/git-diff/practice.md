# git diff: Unstaged, Staged and Committed Changes — Practice

### P1. Which diff?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** diff targets

You staged `pom.xml` and want to review exactly what will be committed. Which command?

- A) `git diff`
- B) `git diff --staged`
- C) `git status`
- D) `git log -p`

<details>
<summary>Answer</summary>

**Answer:** B) `git diff --staged`

Plain `git diff` shows only changes that are not yet staged.

</details>

### P2. Read the hunk

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** diff format

How many lines were added and removed?

```text
@@ -3,3 +3,4 @@ public class App {
     public static void main(String[] args) {
-        System.out.println("Hello");
+        System.out.println("Gradebook");
+        System.out.println("v1.0");
     }
```

<details>
<summary>Answer</summary>

One line removed and two added (one line changed plus one new line). The hunk covers 3 old lines and 4 new lines starting at line 3, matching the header `-3,3 +3,4`.

</details>

### P3. Everything since the last commit

**Difficulty:** Medium · **Type:** Command · **Concepts:** git diff HEAD

Some of your changes are staged and some aren't. Which single command shows all of them compared with the last commit?

<details>
<summary>Answer</summary>

`git diff HEAD`.

</details>

### P4. Only the test changes

**Difficulty:** Medium · **Type:** Command · **Concepts:** pathspec

Show the names (with A/M/D status) of files changed under `src/test` in the last commit.

<details>
<summary>Answer</summary>

`git diff --name-status HEAD~1 HEAD -- src/test` (or `git show --name-status HEAD -- src/test`).

</details>

### P5. Whitespace storm

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** whitespace, line endings

A teammate's change to one method shows every line of a 300-line file as removed and re-added. `git diff -w` shows only the one method. What probably happened, and what should be fixed?

<details>
<summary>Answer</summary>

Whitespace changed on every line — typically line endings converted (LF ↔ CRLF) or an editor reformatting indentation. `-w` hides whitespace-only differences, revealing the real change. Fix the cause (consistent editor settings, a `.gitattributes` with `* text=auto` and explicit `eol` rules) and recommit without the whitespace churn so history stays readable.

</details>
