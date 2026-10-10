# git restore: Discard Edits, Unstage, Restore from Any Commit — Practice

### P1. Unstage, keep edits

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** restore --staged

You staged `pom.xml` by mistake and want it unstaged with your edits kept. Which command?

- A) `git restore pom.xml`
- B) `git restore --staged pom.xml`
- C) `git reset --hard pom.xml`
- D) `git rm pom.xml`

<details>
<summary>Answer</summary>

**Answer:** B) `git restore --staged pom.xml`

A copies the index into the working copy, so the file stays staged (and any later unstaged edits would be lost); C is rejected — `--hard` can't be combined with a path; D deletes the file.

</details>

### P2. Predict the status

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** status columns

`git status -s` shows `MM README.md`. You run `git restore README.md`. What does `git status -s` show now?

<details>
<summary>Answer</summary>

`M  README.md` — the unstaged edits are discarded (working copy = index), and the staged change remains.

</details>

### P3. Old version of one file

**Difficulty:** Medium · **Type:** Command · **Concepts:** --source

Restore `src/main/java/com/example/gradebook/App.java` to how it was in tag `v1.0.0`, staged and in the working directory, without moving your branch.

<details>
<summary>Answer</summary>

`git restore --source=v1.0.0 --staged --worktree src/main/java/com/example/gradebook/App.java`

</details>

### P4. Lost edits?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** irreversibility

You ran `git restore GradeCalculator.java` and realise an hour of unstaged work is gone. Can Git get it back? What might?

<details>
<summary>Answer</summary>

No — unstaged content was never written to Git's object database, so there's nothing in the reflog or `fsck`. An IDE's local history (IntelliJ IDEA's *Local History*, VS Code's *Timeline*) or an editor backup may still have it. Lesson: stash or commit before discarding.

</details>
