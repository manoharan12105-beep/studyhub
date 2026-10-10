# Working with Feature Branches — Interview Questions

## Beginner

### Q1. Walk me through how you develop a feature with Git.

**Style:** How

<details>
<summary>Answer</summary>

Update `main`, create `feature/<name>` from it, make small tested commits, keep the branch current with `main`, push it and open a pull request, address review and CI, merge into `main`, and delete the branch locally and remotely.

</details>

## Intermediate

### Q2. How do you keep a long-running feature branch up to date with `main`?

**Style:** How

<details>
<summary>Answer</summary>

Regularly fetch and either merge `main` (or `origin/main`) into the feature branch — safe for shared branches, adds merge commits — or rebase the branch onto `main` for a linear history if it's private, then force-push with `--force-with-lease`. Run the tests after each update.

</details>

### Q3. How can you tell how far your branch is behind `main`?

**Style:** How

<details>
<summary>Answer</summary>

`git rev-list --left-right --count main...feature` prints "behind ahead" counts; `git log --oneline feature..main` lists the missing commits. With an upstream set, `git status` shows "ahead N, behind M" relative to the remote-tracking branch after a fetch.

</details>

## Advanced

### Q4. What's wrong with a feature branch that lives for a month?

**Style:** Trade-off

<details>
<summary>Answer</summary>

It drifts from `main`: conflicts accumulate and arrive all at once, the final review is huge and shallow, integration problems surface late, and others can't build on the work. Prefer splitting into smaller mergeable pieces (behind a feature flag if needed) and integrating often.

</details>
