# Collaboration Workflows: Centralized, Feature-Branch and Forking — Practice

### P1. No write access

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** forking workflow

Which workflow lets contributors propose changes without write access to the main repository?

- A) Centralized
- B) Feature-branch
- C) Forking
- D) None — write access is always required

<details>
<summary>Answer</summary>

**Answer:** C) Forking

</details>

### P2. Match team to workflow

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** choosing a workflow

Match: (a) two friends building a hackathon prototype in 24 hours; (b) a company team of eight shipping weekly; (c) a public Java library with hundreds of occasional contributors.

<details>
<summary>Answer</summary>

(a) Centralized (or very light feature branches) (b) Feature-branch with protected `main`, PRs and CI (c) Forking workflow.

</details>

### P3. Centralized etiquette

**Difficulty:** Medium · **Type:** Command · **Concepts:** pull --rebase

In a centralized workflow, write the commands to publish your local commits on `main` without creating merge commits.

<details>
<summary>Answer</summary>

```bash
git pull --rebase
# resolve conflicts if any, run the tests
git push
```

</details>

### P4. Workflow without teeth

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** protection

A team says it uses feature branches, but half the commits on `main` were pushed directly and CI often fails there. What two settings would enforce the workflow?

<details>
<summary>Answer</summary>

Protect `main` (rulesets/branch protection) to require pull requests — blocking direct pushes — and require the CI status check (plus at least one approval) before merging.

</details>
