# git log: Reading and Filtering History — Practice

### P1. Recent five

**Difficulty:** Easy · **Type:** Command · **Concepts:** limiting

Show the last five commits, one line each.

<details>
<summary>Answer</summary>

`git log --oneline -5`

</details>

### P2. What does --grep search?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** grep

`git log --grep="rounding"` finds commits whose…

- A) changed lines contain "rounding"
- B) message contains "rounding"
- C) file names contain "rounding"
- D) author name contains "rounding"

<details>
<summary>Answer</summary>

**Answer:** B) message contains "rounding"

For changed code use `-S` or `-G`.

</details>

### P3. Missing commit

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** date filters

At 18:00 you run `git log --since="2026-10-04" --oneline`. A commit made at 09:30 on 4 October isn't listed. Why, and how do you fix the command?

<details>
<summary>Answer</summary>

A date without a time uses the current time of day, so the filter means "since 4 October 18:00". Use `--since="2026-10-04 00:00"`.

</details>

### P4. Report format

**Difficulty:** Medium · **Type:** Command · **Concepts:** format

Print one line per commit as `<short hash> <YYYY-MM-DD> <author name>: <subject>` for the current branch.

<details>
<summary>Answer</summary>

`git log --format='%h %ad %an: %s' --date=short`

</details>

### P5. Only the main line

**Difficulty:** Hard · **Type:** Output prediction · **Concepts:** first-parent

In the gradebook history (feature branch with two commits merged into `main` by `10b9974`), which two commits disappear from `git log --oneline` when you add `--first-parent`?

<details>
<summary>Answer</summary>

`8b503ca Show each student's average in ClassReport` and `3e2381d Add ClassReport with one line per student` — they are reachable only through the merge's second parent. The merge commit itself stays.

</details>
