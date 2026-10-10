# Ranges and Ancestry — Practice

### P1. Which side?

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** two-dot

`main` has commits `M1`, `M2` since diverging; `feature` has `F1`, `F2`, `F3`. What does `git log --oneline feature..main` list?

<details>
<summary>Answer</summary>

`M2` and `M1` — commits on `main` that `feature` doesn't have.

</details>

### P2. PR view

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** diff with three dots

Which command shows exactly the changes a pull request from `feature` into `main` would introduce?

- A) `git diff main feature`
- B) `git diff main..feature`
- C) `git diff main...feature`
- D) `git log main...feature`

<details>
<summary>Answer</summary>

**Answer:** C) `git diff main...feature`

A and B are tip-to-tip; D lists commits from both sides.

</details>

### P3. Script check

**Difficulty:** Medium · **Type:** Command · **Concepts:** --is-ancestor

Write a shell line that prints `included` if commit `a9f609c` is part of `release/1.0`, and `missing` otherwise.

<details>
<summary>Answer</summary>

`git merge-base --is-ancestor a9f609c release/1.0 && echo included || echo missing`

</details>

### P4. How many commits?

**Difficulty:** Easy · **Type:** Command · **Concepts:** rev-list --count

Print how many commits `main` has gained since tag `v1.0.0`.

<details>
<summary>Answer</summary>

`git rev-list --count v1.0.0..main`

</details>

### P5. Who has the fix?

**Difficulty:** Medium · **Type:** Command · **Concepts:** --contains

List all local branches and all tags that contain commit `8b503ca`.

<details>
<summary>Answer</summary>

```bash
git branch --contains 8b503ca
git tag --contains 8b503ca
```

</details>
