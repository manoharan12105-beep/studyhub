# Gitflow and Trunk-Based Development — Practice

### P1. Where does a hotfix start?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Gitflow

In Gitflow, a `hotfix/1.0.1` branch is created from:

- A) `develop`
- B) `main`
- C) the latest `feature/*` branch
- D) `release/1.1`

<details>
<summary>Answer</summary>

**Answer:** B) `main`

It fixes what's in production; it's then merged back into `main` and `develop`.

</details>

### P2. Model for the context

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** choosing a model

A team deploys its Spring Boot API to production several times a day with strong automated tests. Which model fits better, and why?

<details>
<summary>Answer</summary>

Trunk-based development: integration happens continuously into an always-releasable `main`, matching frequent deployment; Gitflow's `develop`/`release` stages would only add delay.

</details>

### P3. Not really trunk-based

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** short-lived branches

A team says it practises trunk-based development, but its feature branches typically live three weeks and merges are painful. What's missing?

<details>
<summary>Answer</summary>

Frequent integration: trunk-based means merging into `main` at least daily with small branches, using feature flags for incomplete work. Three-week branches are a feature-branch workflow with late integration — hence the painful merges.

</details>

### P4. Finish a release

**Difficulty:** Hard · **Type:** Command · **Concepts:** Gitflow release

Write the commands to finish `release/1.1` in Gitflow: merge it into `main`, tag `v1.1.0`, and merge it back into `develop`, keeping merge commits.

<details>
<summary>Answer</summary>

```bash
git switch main
git merge --no-ff release/1.1
git tag -a v1.1.0 -m "Release 1.1.0"
git switch develop
git merge --no-ff release/1.1
git branch -d release/1.1
git push origin main develop v1.1.0
```

</details>
