# git reflog: Recovering Lost Commits and Branches — Practice

### P1. Find the old tip

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** reading the reflog

```text
d0e8c67 HEAD@{0}: reset: moving to HEAD~2
3a070e0 HEAD@{1}: commit: Raise the B threshold to 78
10b9974 HEAD@{2}: merge feature/class-report: Merge made by the 'ort' strategy.
```

Which commit was the branch on just before the reset?

<details>
<summary>Answer</summary>

`3a070e0` (`HEAD@{1}`).

</details>

### P2. Shared or local?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** reflog scope

Arjun deleted a branch on his laptop. Can Priya find its commits in her own reflog?

- A) Yes, the reflog is pushed with the branch
- B) Yes, if she runs `git fetch`
- C) No, each clone has its own reflog
- D) Only on GitHub

<details>
<summary>Answer</summary>

**Answer:** C) No, each clone has its own reflog

If the branch was pushed, Priya may have it as `origin/<branch>` or in her remote-tracking reflog; otherwise only Arjun's reflog has it.

</details>

### P3. Restore the branch

**Difficulty:** Medium · **Type:** Command · **Concepts:** branch recovery

The reflog shows `a8cdcbf HEAD@{1}: commit: Sketch CSV export`, the last commit on the branch `spike/csv-export` you deleted. Recreate it.

<details>
<summary>Answer</summary>

`git branch spike/csv-export a8cdcbf` (or `git branch spike/csv-export HEAD@{1}`).

</details>

### P4. Without the reflog

**Difficulty:** Hard · **Type:** Command · **Concepts:** fsck

Which command lists commits that exist in the object database but are unreachable from any ref, ignoring reflog entries?

<details>
<summary>Answer</summary>

`git fsck --unreachable --no-reflogs` (filter with `| grep commit`).

</details>

### P5. What survived?

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** limits

Before an accidental `git reset --hard HEAD~1`, you had: the last commit, a staged change to `pom.xml`, and an unstaged change to `README.md`. What can you recover, and how?

<details>
<summary>Answer</summary>

The commit — via the reflog. The staged `pom.xml` content was stored as a blob when you ran `git add`, so `git fsck --lost-found` may find it as a dangling blob (no file name). The unstaged `README.md` change was never stored and is gone.

</details>
