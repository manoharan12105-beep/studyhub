# The Three Areas of Git and File States — Practice

### P1. Which area?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** staging area

Which area holds the exact snapshot that the next `git commit` will record?

- A) The working directory
- B) The staging area (index)
- C) The remote repository
- D) The stash

<details>
<summary>Answer</summary>

**Answer:** B) The staging area (index)

`git commit` records the index, not the working directory.

</details>

### P2. Two columns

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** short status

Interpret each line:

```text
A  src/Report.java
 M pom.xml
M  README.md
?? notes.txt
```

<details>
<summary>Answer</summary>

`Report.java` is a new file, staged. `pom.xml` is modified but not staged. `README.md` is modified and staged. `notes.txt` is untracked.

</details>

### P3. What gets committed?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** staging after edit

You edit `App.java` to fix a bug, run `git add App.java`, then add a `System.out.println` debug line to the same file and run `git commit -m "Fix bug"`. Does the commit contain the debug line?

- A) Yes, the commit always contains the latest file
- B) No, it contains the file as it was when staged
- C) Git refuses to commit because the file changed
- D) Only if `core.autocrlf` is set

<details>
<summary>Answer</summary>

**Answer:** B) No, it contains the file as it was when staged

The debug line remains as an unstaged change (status `M` in the right column after the commit).

</details>

### P4. Name the command

**Difficulty:** Medium · **Type:** Command · **Concepts:** moving between areas

Give the command for each move: (a) working directory → staging area, (b) staging area → repository, (c) unstage a file without changing the working copy, (d) see what is staged.

<details>
<summary>Answer</summary>

(a) `git add <file>` (b) `git commit` (c) `git restore --staged <file>` (d) `git diff --staged` (or `git diff --cached`).

</details>

### P5. Split one session into two commits

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** focused commits

In one sitting you fixed the B-grade boundary in `GradeCalculator.java` and reformatted `App.java`. Describe how to produce two commits, each with one purpose.

<details>
<summary>Answer</summary>

```bash
git add src/main/java/com/example/gradebook/GradeCalculator.java
git commit -m "Fix B grade boundary"
git add src/main/java/com/example/gradebook/App.java
git commit -m "Reformat App"
```

If both changes were in the **same** file, `git add -p` stages selected hunks only.

</details>
