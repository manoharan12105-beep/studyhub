# git rm and git mv: Deleting and Renaming Files — Practice

### P1. Keep it on disk

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** rm --cached

You want Git to stop tracking `local.properties` but keep the file on your machine. Which command?

- A) `git rm local.properties`
- B) `git rm --cached local.properties`
- C) `git rm -f local.properties`
- D) `git restore --staged local.properties`

<details>
<summary>Answer</summary>

**Answer:** B) `git rm --cached local.properties`

Then add it to `.gitignore` and commit.

</details>

### P2. Manual move

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** rename detection

You run `mv Report.java Summary.java` (no Git command). What does `git status -s` show, and what does it show after `git add -A`?

<details>
<summary>Answer</summary>

Before: ` D Report.java` and `?? Summary.java`. After `git add -A`: `R  Report.java -> Summary.java` (assuming the content is still similar).

</details>

### P3. The refusal

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** rm safety

`git rm Notes.md` prints `error: the following file has local modifications`. You do want the file gone, but you'd like to keep a copy of your edits. What do you do?

<details>
<summary>Answer</summary>

Save the edits first — copy the file elsewhere, or commit or stash them — then run `git rm Notes.md`. Avoid `git rm -f` unless you're sure the edits are disposable.

</details>

### P4. Follow the history

**Difficulty:** Medium · **Type:** Command · **Concepts:** log --follow

`App.java` was renamed to `GradebookApp.java` last week. Show one line per commit for the file's entire history, including before the rename.

<details>
<summary>Answer</summary>

`git log --follow --oneline -- src/main/java/com/example/gradebook/GradebookApp.java`

</details>
