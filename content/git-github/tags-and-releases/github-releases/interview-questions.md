# GitHub Releases, Release Notes and Rollback Planning — Interview Questions

## Beginner

### Q1. What is the difference between a Git tag and a GitHub Release?

**Style:** Comparison

<details>
<summary>Answer</summary>

A tag is a Git reference to a commit, stored in the repository and copied by clones. A GitHub Release is platform data built on a tag: a title, release notes, downloadable assets such as JARs, and flags like pre-release, draft and latest. Clones don't contain releases.

</details>

## Intermediate

### Q2. How do you produce release notes for version 1.1.0?

**Style:** How

<details>
<summary>Answer</summary>

List changes since the previous tag — `git log --oneline --no-merges v1.0.0..v1.1.0`, or merged PRs via GitHub's "Generate release notes" — then rewrite them for users: grouped into new, changed, fixed, with breaking changes and upgrade notes called out.

</details>

### Q3. Why should release artifacts be built from the tag in CI?

**Style:** Why

<details>
<summary>Answer</summary>

So the published JAR matches exactly the tagged source and was produced in a clean, reproducible environment after tests passed — not from a laptop with uncommitted changes or different dependencies.

</details>

## Advanced

### Q4. Version 1.1.0 is causing errors in production. What's your rollback plan?

**Style:** Scenario

<details>
<summary>Answer</summary>

Immediately redeploy the last known-good artifact (1.0.0) if data compatibility allows. Then fix forward: identify the bad change (`git log v1.0.0..v1.1.0`, `bisect`), revert it on `main` or fix on `hotfix/1.1.1` branched from `v1.1.0`, release 1.1.1, and merge the fix into `main`. Don't move or delete published tags or force-push `main`.

</details>
