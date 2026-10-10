# Merge Conflicts: Markers, Resolution and Aborting — Practice

### P1. Whose version?

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** markers

You are on `main` and ran `git merge feature/strict-b`:

```text
<<<<<<< HEAD
        if (average >= 78) return 'B';
=======
        if (average >= 80) return 'B';
>>>>>>> feature/strict-b
```

Which value comes from `main`?

<details>
<summary>Answer</summary>

78 — the section after `<<<<<<< HEAD` is the current branch's (`main`'s) version.

</details>

### P2. Finish the merge

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** marking resolved

You've edited the conflicted file to the correct content and removed the markers. What's next?

- A) `git merge --continue` without staging
- B) `git add <file>` then `git commit`
- C) `git merge --abort`
- D) `git push`

<details>
<summary>Answer</summary>

**Answer:** B) `git add <file>` then `git commit`

`git add` marks the path resolved; the commit concludes the merge (`git merge --continue` also works after staging).

</details>

### P3. Back out

**Difficulty:** Easy · **Type:** Command · **Concepts:** abort

The merge produced conflicts in 14 files and you want to start over after talking to the other author. Which command restores the state before the merge?

<details>
<summary>Answer</summary>

`git merge --abort`

</details>

### P4. Read with the base

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** zdiff3

```text
<<<<<<< HEAD
    return Math.round(average * 100) / 100.0;
||||||| 4b17431
    return average;
=======
    return Math.max(0, average);
>>>>>>> fix/negative-marks
```

What did each side intend, and what is a sensible resolution?

<details>
<summary>Answer</summary>

The base returned `average`. `main` added rounding; the fix branch clamped negatives to 0. Both intents can be kept: `return Math.round(Math.max(0, average) * 100) / 100.0;` — then run the tests for both behaviours.

</details>

### P5. Deleted vs modified

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** modify/delete conflict

`git status` shows `deleted by them: src/main/java/com/example/gradebook/LegacyReport.java`. What happened, and what are your two options?

<details>
<summary>Answer</summary>

Your branch modified `LegacyReport.java` while the branch being merged deleted it. Keep it with your changes (`git add <file>`) if it's still needed, or accept the deletion (`git rm <file>`) — after checking whether your modification needs to move elsewhere.

</details>

### P6. Clean merge, broken code

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** semantic conflicts

Arjun renamed `letterGrade()` to `grade()` on his branch. Priya added a call to `letterGrade()` in a new `ReportCard.java` on hers. Both branches merge without any conflict. What happens, and what would have caught it?

<details>
<summary>Answer</summary>

The merged code doesn't compile: `ReportCard.java` calls a method that no longer exists. Git saw no overlapping lines. Building and running tests after the merge — or CI on the pull request with `main` merged in — catches it.

</details>
