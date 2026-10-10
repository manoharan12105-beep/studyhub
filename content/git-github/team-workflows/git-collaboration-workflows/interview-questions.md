# Collaboration Workflows: Centralized, Feature-Branch and Forking — Interview Questions

## Beginner

### Q1. What is the feature-branch workflow?

**Style:** What

<details>
<summary>Answer</summary>

Every change is developed on its own short-lived branch in the shared repository and integrated into a protected `main` through a pull request with review and CI checks. `main` stays releasable; branches are deleted after merging.

</details>

## Intermediate

### Q2. Compare the centralized, feature-branch and forking workflows.

**Style:** Comparison

<details>
<summary>Answer</summary>

Centralized: everyone commits to `main` directly — simplest, but no review and high risk. Feature-branch: branches and PRs in one repository — review and CI before `main`, requires write access for all. Forking: contributors work in their own forks and open PRs — no write access needed, best for open source, more setup.

</details>

### Q3. Which workflow would you choose for a 6-person team building a Spring Boot API?

**Style:** Scenario

<details>
<summary>Answer</summary>

Feature-branch workflow: protected `main`, PRs with at least one approval, required Maven CI checks, short-lived branches named by issue, squash or merge commits by convention. It gives review and automated testing with little overhead; forks would add friction without benefit inside a trusted team.

</details>

## Advanced

### Q4. Is there a "best" Git workflow?

**Style:** Trap

<details>
<summary>Answer</summary>

No. The right workflow depends on team size, trust and access model, release cadence (continuous vs scheduled), regulatory needs and tooling. A solo project doesn't need PRs; open source needs forks; a team doing continuous deployment benefits from trunk-based short branches. Good answers name the trade-offs.

</details>
