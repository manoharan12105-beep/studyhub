# Contributing to Open Source: Forks, Upstream and Sync — Interview Questions

## Beginner

### Q1. What are `origin` and `upstream` in a fork workflow?

**Style:** What

<details>
<summary>Answer</summary>

`origin` is your fork (you push branches there); `upstream` is the original project (you fetch from it to stay current and open pull requests against it). Both are just remote names configured with `git remote add`.

</details>

## Intermediate

### Q2. How do you keep your fork up to date with the original repository?

**Style:** How

<details>
<summary>Answer</summary>

`git fetch upstream`, `git switch main`, `git merge --ff-only upstream/main`, `git push origin main` — or GitHub's **Sync fork** button / `gh repo sync`. Never commit directly on the fork's `main`, so the fast-forward always works.

</details>

### Q3. How would you make your first open-source contribution?

**Style:** Scenario

<details>
<summary>Answer</summary>

Read CONTRIBUTING and the code of conduct, find a `good first issue` and comment that you'll take it, fork and clone, add `upstream`, branch from the latest `upstream/main`, make a small focused change with tests, run the build, push to your fork, open a PR linking the issue, and respond to review.

</details>

## Advanced

### Q4. A maintainer asks you to "rebase on the latest main" for your fork PR. What exactly do you run?

**Style:** How

<details>
<summary>Answer</summary>

```bash
git fetch upstream
git switch fix/42-readme-build
git rebase upstream/main          # resolve conflicts if any
mvn -B verify
git push --force-with-lease origin fix/42-readme-build
```

The PR updates automatically because it points at that branch on your fork.

</details>
