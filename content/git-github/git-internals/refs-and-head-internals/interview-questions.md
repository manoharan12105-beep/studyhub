# References and HEAD Internals — Interview Questions

## Beginner

### Q1. How does Git store a branch?

**Style:** What happens internally

<details>
<summary>Answer</summary>

As a ref: a file `.git/refs/heads/<branch>` (or a line in `.git/packed-refs`) containing the id of the branch's latest commit. Creating a branch writes that small file; committing overwrites it with the new commit's id.

</details>

## Intermediate

### Q2. What is a symbolic ref?

**Style:** What

<details>
<summary>Answer</summary>

A ref that points to another ref rather than to an object. `HEAD` is the main example: `ref: refs/heads/main`. `git symbolic-ref HEAD` prints the target; in detached HEAD it fails because HEAD then holds an object id directly.

</details>

### Q3. What are `ORIG_HEAD` and `FETCH_HEAD`?

**Style:** What

<details>
<summary>Answer</summary>

Special refs. `ORIG_HEAD` records where HEAD was before a potentially dangerous operation (reset, rebase, merge), enabling `git reset --hard ORIG_HEAD` to undo it. `FETCH_HEAD` records what the last `git fetch` retrieved, which `git pull` merges.

</details>

## Advanced

### Q4. Why might a script that reads `.git/refs/heads/main` break?

**Style:** Debugging

<details>
<summary>Answer</summary>

After `git gc` or `git pack-refs`, refs move into `.git/packed-refs` and the loose file disappears; newer repositories may even use the reftable format. Scripts should resolve refs with `git rev-parse main` or `git show-ref`, which handle every storage format.

</details>
