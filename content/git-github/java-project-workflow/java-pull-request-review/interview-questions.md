# Reviewing Java Pull Requests, Recovering a Broken Commit and Tagging a Release — Interview Questions

## Beginner

### Q1. The build on `main` broke after the latest merge. What do you do?

**Style:** Scenario

<details>
<summary>Answer</summary>

Confirm the failure and identify the commit (CI log, `git log`, `git bisect` if unclear), `git revert` it on an up-to-date `main`, run the build and tests, push, and tell the author. The proper fix comes later through a PR. Never reset and force-push `main`.

</details>

## Intermediate

### Q2. Why review the tests before the code in a Java PR?

**Style:** Why

<details>
<summary>Answer</summary>

Tests state the author's claim about behaviour. Reading them first shows what's covered and what isn't (boundaries, empty input, exceptions), so you then read the code looking for gaps between claim and implementation.

</details>

### Q3. How do you tag a Maven release properly?

**Style:** How

<details>
<summary>Answer</summary>

Change the POM version from `X.Y.Z-SNAPSHOT` to `X.Y.Z`, commit, create an annotated tag `vX.Y.Z`, build the artifact from that commit (ideally in CI), push the commit and tag, then bump the POM to the next `-SNAPSHOT` version and commit.

</details>

## Advanced

### Q4. How would you guarantee that a broken commit can't reach `main` again?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Require pull requests into `main`, a CI workflow that runs `mvn -B verify` on each PR (ideally on the merge result), and branch protection requiring that status check and at least one approval; optionally a merge queue so each merge is tested against the latest `main`. Local hooks help but can be bypassed.

</details>
