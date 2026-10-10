# git cherry-pick: Copying Individual Commits — Interview Questions

## Beginner

### Q1. What does `git cherry-pick` do?

**Style:** What

<details>
<summary>Answer</summary>

It applies the change introduced by an existing commit onto the current branch as a new commit with the same message and author but a new id. The original commit is untouched.

</details>

## Intermediate

### Q2. When would you use cherry-pick?

**Style:** Scenario

<details>
<summary>Answer</summary>

Back-porting a bug fix from `main` to a maintained release branch, rescuing one useful commit from an abandoned branch, or moving a commit that was made on the wrong branch. Use `-x` to record the source commit.

</details>

### Q3. Why not cherry-pick every commit of a feature branch into `main`?

**Style:** Trade-off

<details>
<summary>Answer</summary>

It duplicates every commit with new ids, loses the record that the branch was integrated, makes later merges between the branches conflict on already-copied changes, and is error-prone with dependencies. Merging (or rebasing then merging) integrates the branch as a unit.

</details>

## Advanced

### Q4. What does `-x` add, and why does it matter for releases?

**Style:** Why

<details>
<summary>Answer</summary>

It appends `(cherry picked from commit <hash>)` to the message. On release branches this traceability shows which `main` commit a back-port corresponds to, which helps audits, release notes and checking whether a fix is present on every supported line.

</details>
