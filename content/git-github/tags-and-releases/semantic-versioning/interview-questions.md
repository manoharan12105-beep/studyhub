# Semantic Versioning and Pre-Releases — Interview Questions

## Beginner

### Q1. What is semantic versioning?

**Style:** What

<details>
<summary>Answer</summary>

A versioning convention MAJOR.MINOR.PATCH: increment MAJOR for incompatible API changes, MINOR for backward-compatible new features, PATCH for backward-compatible bug fixes, resetting the lower parts to zero. Pre-release labels (`-beta.1`, `-rc.1`) and build metadata (`+build`) can be appended.

</details>

## Intermediate

### Q2. Your library is at 2.3.1. You add an optional method and fix a bug. What's the next version?

**Style:** Scenario

<details>
<summary>Answer</summary>

2.4.0 — a backward-compatible feature bumps MINOR and resets PATCH; the bug fix is included.

</details>

### Q3. Which is greater: `3.0.0-rc.2` or `3.0.0`?

**Style:** Trap

<details>
<summary>Answer</summary>

`3.0.0`. A pre-release has lower precedence than the associated normal version. (Git's `v:refname` sort needs `versionsort.suffix=-rc` to order them that way.)

</details>

## Advanced

### Q4. Is changing a method's behaviour without changing its signature a breaking change?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Yes, if users depend on the old behaviour — for example raising gradebook's B threshold from 75 to 78 changes results for existing callers. SemVer is about the public contract, which includes documented behaviour, not just signatures. Bump MAJOR, or make the new behaviour opt-in in a MINOR release.

</details>
