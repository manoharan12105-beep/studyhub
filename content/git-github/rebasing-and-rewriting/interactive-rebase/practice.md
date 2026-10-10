# Interactive Rebase: Reorder, Squash, Reword, Edit — Practice

### P1. Order of the list

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** todo list

In the `git rebase -i` todo list, the first line is:

- A) The newest commit
- B) The oldest commit being rebased
- C) The base commit
- D) Always a merge commit

<details>
<summary>Answer</summary>

**Answer:** B) The oldest commit being rebased

The list runs top to bottom in the order the commits will be replayed — the reverse of `git log`.

</details>

### P2. Edit the list

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** fixup, reword, drop

Given:

```text
pick a1 Add GradeReport
pick b2 wip
pick c3 add tests
pick d4 temp logging
```

Write a list that folds `wip` into `Add GradeReport` silently, keeps `add tests` but renames it, and removes `temp logging`.

<details>
<summary>Answer</summary>

```text
pick a1 Add GradeReport
fixup b2 wip
reword c3 add tests
drop d4 temp logging
```

</details>

### P3. Fix an earlier commit later

**Difficulty:** Medium · **Type:** Command · **Concepts:** fixup commits

You found a bug in commit `b14de07` (two commits back) and fixed it in the working tree. Record the fix so that a later autosquash folds it into `b14de07`, then run the rebase.

<details>
<summary>Answer</summary>

```bash
git add <files>
git commit --fixup=b14de07
git rebase -i --autosquash main
```

</details>

### P4. Lost a line

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** recovery

You saved the todo list after accidentally deleting the line for "Add tests"; the rebase finished. How do you get that commit back?

<details>
<summary>Answer</summary>

The original commit still exists. Find it with `git reflog` (or `git log ORIG_HEAD`, which points at the pre-rebase tip) and either reset the branch back (`git reset --hard ORIG_HEAD`, then redo the rebase) or `git cherry-pick <hash-of-Add-tests>` onto the current branch.

</details>

### P5. Did I change any code?

**Difficulty:** Medium · **Type:** Command · **Concepts:** verification

Before tidying you ran `git branch backup/tidy`. After squashing and rewording only, which command confirms the final code is identical to before?

<details>
<summary>Answer</summary>

`git diff backup/tidy HEAD` — it should print nothing. (Dropping a commit would, correctly, show a difference.)

</details>
