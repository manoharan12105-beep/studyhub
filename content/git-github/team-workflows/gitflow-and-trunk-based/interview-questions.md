# Gitflow and Trunk-Based Development — Interview Questions

## Beginner

### Q1. What branches does Gitflow use?

**Style:** What

<details>
<summary>Answer</summary>

Long-lived `main` (production releases) and `develop` (integration), plus short-lived `feature/*` (from and into `develop`), `release/*` (from `develop`, merged into `main` and `develop`) and `hotfix/*` (from `main`, merged into `main` and `develop`).

</details>

### Q2. What is trunk-based development?

**Style:** What

<details>
<summary>Answer</summary>

A model where everyone integrates into a single main branch at least daily, using very short-lived branches (or committing directly), keeping `main` always releasable, and hiding unfinished features behind feature flags. It relies on strong automated testing and CI.

</details>

## Intermediate

### Q3. Gitflow vs trunk-based — when would you choose each?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Gitflow suits scheduled, versioned releases and maintaining several released versions (packaged or mobile software, regulated release cycles). Trunk-based suits continuous delivery of services, where frequent small integration reduces conflicts and release risk. The cost of Gitflow is process overhead and late integration; trunk-based demands test and CI discipline.

</details>

### Q4. What are feature flags and why does trunk-based development need them?

**Style:** Why

<details>
<summary>Answer</summary>

Runtime switches that enable or disable code paths. They let incomplete features be merged into `main` (and even deployed) while turned off, so work integrates daily without exposing unfinished behaviour. Flags must be removed after full rollout to avoid dead code.

</details>

## Advanced

### Q5. In Gitflow, why must a hotfix be merged into both `main` and `develop`?

**Style:** Why

<details>
<summary>Answer</summary>

`main` gets the fix for production immediately (and a new tag), while `develop` is where the next release is built. If the hotfix isn't merged into `develop` (or the current `release/*` branch), the next release reintroduces the bug.

</details>
