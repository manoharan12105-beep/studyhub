# GitHub Issues and Discussions — Interview Questions

## Beginner

### Q1. What makes a good bug report?

**Style:** What

<details>
<summary>Answer</summary>

A specific title; steps to reproduce; expected versus actual behaviour (with the exact error); environment and version; and only one problem per issue. Search for duplicates first and never include secrets or personal data.

</details>

## Intermediate

### Q2. How do you automatically close an issue when a pull request is merged?

**Style:** How

<details>
<summary>Answer</summary>

Put a closing keyword and the issue reference — e.g. `Fixes #12` — in the PR description (or a commit message). When the PR is merged into the repository's default branch, GitHub closes issue #12 and links it to the PR.

</details>

### Q3. When would you use GitHub Discussions instead of Issues?

**Style:** Comparison

<details>
<summary>Answer</summary>

For questions, ideas, announcements and debates that aren't yet actionable work. Issues should represent concrete work with an owner and an end; a discussion can be converted into an issue once a decision is reached.

</details>
