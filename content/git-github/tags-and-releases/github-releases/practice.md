# GitHub Releases, Release Notes and Rollback Planning — Practice

### P1. What does a clone contain?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** tag vs release

After `git clone`, which of these do you have locally?

- A) Release notes of v1.1.0
- B) The JAR attached to the v1.1.0 release
- C) The `v1.1.0` tag
- D) The "latest release" flag

<details>
<summary>Answer</summary>

**Answer:** C) The `v1.1.0` tag

Notes, assets and flags are GitHub data.

</details>

### P2. Changes between releases

**Difficulty:** Easy · **Type:** Command · **Concepts:** release notes

List the non-merge commits between `v1.0.0` and `v1.1.0`, one line each.

<details>
<summary>Answer</summary>

`git log --oneline --no-merges v1.0.0..v1.1.0`

</details>

### P3. Hotfix an old version

**Difficulty:** Medium · **Type:** Command · **Concepts:** hotfix branch

`main` has moved on to 1.2 work. Create a branch to fix version 1.1.0 and, after committing the fix, tag it `v1.1.1` with an annotated tag.

<details>
<summary>Answer</summary>

```bash
git switch -c hotfix/1.1.1 v1.1.0
# fix + test, then
git commit -am "Handle students with no marks in ClassReport"
git tag -a v1.1.1 -m "Release 1.1.1"
git push origin hotfix/1.1.1 v1.1.1
```

Then merge or cherry-pick the fix into `main`.

</details>

### P4. Bad rollback idea

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** rollback planning

A teammate suggests rolling back by deleting tag `v1.1.0` and force-pushing `main` to the `v1.0.0` commit. Explain the problems and propose a better plan.

<details>
<summary>Answer</summary>

Deleting a published tag and rewriting `main` breaks clones, erases later commits from `main` and loses the record of what shipped. Better: redeploy the 1.0.0 artifact now; then revert the bad change on `main` (or hotfix from `v1.1.0`) and release 1.1.1.

</details>
