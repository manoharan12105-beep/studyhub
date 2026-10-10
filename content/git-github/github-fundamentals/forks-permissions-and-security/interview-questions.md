# Forks vs Clones, Permissions and Repository Security — Interview Questions

## Beginner

### Q1. What is the difference between a fork and a clone?

**Style:** Comparison

<details>
<summary>Answer</summary>

A clone is a local copy of a repository made with `git clone`. A fork is a copy of a repository on GitHub under your own account, made with GitHub. You fork when you can't push to the original (open source), then clone your fork, push branches to it and open pull requests to the original.

</details>

## Intermediate

### Q2. What repository roles does GitHub offer for organisation repositories?

**Style:** What

<details>
<summary>Answer</summary>

Read (view and comment), Triage (manage issues and PRs without pushing), Write (push and merge), Maintain (Write plus non-destructive settings) and Admin (full control including access and deletion). Grant the least role needed, preferably through teams.

</details>

### Q3. Name five basic security measures for a GitHub repository.

**Style:** Scenario

<details>
<summary>Answer</summary>

Two-factor authentication for all members; branch protection on the default branch (PR reviews, required checks, no force push or deletion); secret scanning with push protection and never committing secrets; Dependabot alerts for vulnerable dependencies; least-privilege access for people, deploy keys, tokens and apps, reviewed regularly. A `SECURITY.md` for vulnerability reports is a good sixth.

</details>

## Advanced

### Q4. Why do open-source projects use the fork-and-pull-request model instead of giving contributors write access?

**Style:** Why

<details>
<summary>Answer</summary>

It lets anyone propose changes without trust: contributors push only to their own fork, maintainers review every PR before it enters the project, and CI runs on the proposal. Write access stays with a small group, limiting damage from mistakes or malicious contributors.

</details>
