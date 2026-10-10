# git commit: Recording Snapshots — Practice

### P1. Read the output

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** commit output

What do `main` and `01d355d` mean in this output?

```text
[main 01d355d] Add D grade for averages from 50 to 59
 1 file changed, 2 insertions(+), 1 deletion(-)
```

<details>
<summary>Answer</summary>

`main` is the branch that moved to the new commit; `01d355d` is the new commit's abbreviated hash.

</details>

### P2. The missing file

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** commit -a

You created `Student.java` and edited `App.java`, then ran `git commit -am "Add Student"`. What does the commit contain?

- A) Both files
- B) Only `App.java`
- C) Only `Student.java`
- D) Nothing; the commit fails

<details>
<summary>Answer</summary>

**Answer:** B) Only `App.java`

`-a` stages tracked files only. `Student.java` stays untracked.

</details>

### P3. Fix the message

**Difficulty:** Medium · **Type:** Command · **Concepts:** amend

Your last (unpushed) commit has the message "fix stuf". Write the command that changes it to "Fix rounding of class averages" without changing the content.

<details>
<summary>Answer</summary>

`git commit --amend -m "Fix rounding of class averages"` — with nothing newly staged, only the message changes (the commit still gets a new hash).

</details>

### P4. Commit a colleague's patch

**Difficulty:** Medium · **Type:** Command · **Concepts:** author

Arjun emailed you a fix that you applied by hand. Commit it so that Arjun is credited as the author.

<details>
<summary>Answer</summary>

`git commit --author="Arjun Mehta <arjun@example.com>" -m "Handle empty marks in average"`. You remain the committer.

</details>

### P5. Safe to amend?

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** amend after push

You pushed a commit to `main` ten minutes ago and two teammates have pulled. You notice a typo in a comment. Should you amend? What should you do instead?

<details>
<summary>Answer</summary>

No. Amending creates a new commit id; pushing it would require a force push that rewrites `main` under your teammates, who would then have diverged histories. Make a new small commit that fixes the typo.

</details>
