# Forks vs Clones, Permissions and Repository Security — Practice

### P1. Fork or clone?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** fork vs clone

You want to fix a typo in a popular open-source Java library where you have no write access. What do you do first?

- A) Clone it and push your branch to it
- B) Fork it on GitHub, then clone your fork
- C) Ask to be made Admin
- D) Download a ZIP and email the change

<details>
<summary>Answer</summary>

**Answer:** B) Fork it on GitHub, then clone your fork

You can push to your fork and open a PR to the original.

</details>

### P2. Least privilege

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** roles

Assign roles: (a) a QA engineer who labels and closes issues but shouldn't push code; (b) developers; (c) an auditor who only reads code.

<details>
<summary>Answer</summary>

(a) Triage (b) Write (c) Read.

</details>

### P3. Remotes after forking

**Difficulty:** Easy · **Type:** Command · **Concepts:** upstream remote

You cloned your fork. Add the original repository `https://github.com/your-org/gradebook.git` as `upstream`.

<details>
<summary>Answer</summary>

`git remote add upstream https://github.com/your-org/gradebook.git`

</details>

### P4. Private is not secret

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** security

A teammate argues that committing the database password is fine "because the repository is private". Give two reasons this is wrong.

<details>
<summary>Answer</summary>

Everyone with access — now and in the future, including forks and new members — can read the password in history; repositories can be made public later, cloned to insecure machines, or exposed through a leaked token. Secrets belong in a secret store or environment configuration, never in Git.

</details>
