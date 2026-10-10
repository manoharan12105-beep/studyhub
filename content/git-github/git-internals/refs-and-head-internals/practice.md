# References and HEAD Internals — Practice

### P1. Where is the tag?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ref namespaces

Under which ref namespace is tag `v1.0.0` stored?

- A) `refs/heads/v1.0.0`
- B) `refs/tags/v1.0.0`
- C) `refs/remotes/origin/v1.0.0`
- D) `.git/objects/v1.0.0`

<details>
<summary>Answer</summary>

**Answer:** B) `refs/tags/v1.0.0`

</details>

### P2. Where does HEAD point?

**Difficulty:** Easy · **Type:** Command · **Concepts:** symbolic-ref

Print the full ref name that HEAD points to, in a way that fails if HEAD is detached.

<details>
<summary>Answer</summary>

`git symbolic-ref HEAD` (e.g. `refs/heads/main`).

</details>

### P3. Missing file

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** packed-refs

After `git gc`, `cat .git/refs/heads/main` says "No such file or directory", but `git log main` works. Explain.

<details>
<summary>Answer</summary>

`git gc` packed the refs into `.git/packed-refs`; `main` is now a line in that file. Git reads both locations. Use `git rev-parse main` instead of reading files.

</details>

### P4. List branches for a script

**Difficulty:** Medium · **Type:** Command · **Concepts:** for-each-ref

Print each local branch as `<short-name> <short-id>`, one per line, in a script-friendly way.

<details>
<summary>Answer</summary>

`git for-each-ref --format='%(refname:short) %(objectname:short)' refs/heads`

</details>
