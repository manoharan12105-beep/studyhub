# Pull Requests: Creating and Describing Changes — Interview Questions

## Beginner

### Q1. What is a pull request?

**Style:** What

<details>
<summary>Answer</summary>

A request on a hosting platform (GitHub, Bitbucket; "merge request" on GitLab) to merge one branch into another. It shows the commits and the diff since the branches diverged, and adds discussion, code review, automated checks and a controlled merge.

</details>

### Q2. What should a pull request description contain?

**Style:** What

<details>
<summary>Answer</summary>

What changed, why (with the linked issue), notable design decisions, how it was tested (and what wasn't), screenshots or output if relevant, and a closing keyword such as `Fixes #12`.

</details>

## Intermediate

### Q3. What is the difference between a branch-based and a fork-based pull request?

**Style:** Comparison

<details>
<summary>Answer</summary>

In a branch-based PR the head branch is in the same repository, so the author needs write access — typical inside a team. In a fork-based PR the head branch lives in the contributor's fork, so anyone can propose changes without write access to the original — typical in open source.

</details>

### Q4. When would you open a draft pull request?

**Style:** Scenario

<details>
<summary>Answer</summary>

When you want early feedback on an approach, CI results, or visibility for teammates while the work is unfinished. Drafts can't be merged and don't trigger code-owner review requests until marked ready.

</details>

## Advanced

### Q5. Your pull request has 1,800 changed lines across a feature, a refactor and a dependency upgrade. How do you make it reviewable?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Split it into a sequence: the dependency upgrade first, then the refactor (no behaviour change), then the feature on top. Each PR has one purpose, its own tests and description, and can be reviewed and merged independently; stacked branches can target each other until the earlier ones merge. Large PRs get superficial reviews and hide bugs.

</details>
