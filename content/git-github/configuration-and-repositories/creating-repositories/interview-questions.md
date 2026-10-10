# Creating Repositories: git init, git clone and the .git Directory — Interview Questions

## Beginner

### Q1. What is the difference between `git init` and `git clone`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`git init` creates a new, empty repository in the current folder — no commits, no remote. `git clone <url>` copies an existing repository, including its full history, into a new folder, creates the `origin` remote, sets up remote-tracking branches and checks out the default branch.

</details>

### Q2. What is the `.git` directory?

**Style:** What

<details>
<summary>Answer</summary>

The repository itself: the object database (all file contents, trees and commits), references (branches, tags), `HEAD`, the index (staging area), local configuration and hooks. The rest of the folder is just the working tree. Deleting `.git` deletes all local history.

</details>

## Intermediate

### Q3. What does `git clone` set up besides copying files?

**Style:** What happens internally

<details>
<summary>Answer</summary>

It downloads every reachable object, creates the remote `origin` with the URL, creates remote-tracking branches such as `origin/main` for the remote's branches, creates a local branch for the remote's default branch with `origin/main` as its upstream, and checks it out.

</details>

### Q4. What is a bare repository and where is it used?

**Style:** What

<details>
<summary>Answer</summary>

A repository with no working tree — only the Git database (`git init --bare`). It is used where nobody edits files directly: servers and hosting services that people push to and fetch from. Pushing to a non-bare repository's checked-out branch is refused by default because it would make that working tree inconsistent.

</details>

## Advanced

### Q5. When would you use a shallow clone, and what is the trade-off?

**Style:** Trade-off

<details>
<summary>Answer</summary>

`git clone --depth 1` downloads only recent history, which is faster and smaller — common in CI jobs that only need to build the latest commit. The trade-off is limited history: `git log`, `git blame` and `git bisect` see only the fetched commits, and some merges need more history (`git fetch --unshallow` retrieves the rest).

</details>
