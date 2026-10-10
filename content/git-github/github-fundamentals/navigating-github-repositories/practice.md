# Navigating a GitHub Repository — Practice

### P1. Git equivalent

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** GitHub views

Match each GitHub view to a Git command: (a) a file's **History**, (b) **Blame**, (c) the **Compare** page for `main...feature`.

<details>
<summary>Answer</summary>

(a) `git log -- <path>` (b) `git blame <path>` (c) `git diff main...feature` (with `git log main..feature` for the commit list).

</details>

### P2. Quiet notifications

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** watching

You only want to hear when a library you use publishes a new version. Which option?

- A) Star the repository
- B) Watch → All Activity
- C) Watch → Custom → Releases
- D) Fork the repository

<details>
<summary>Answer</summary>

**Answer:** C) Watch → Custom → Releases

</details>

### P3. Stable link

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** permalinks

You link to line 21 of `GradeCalculator.java` on `main` in an issue. A week later the link highlights the wrong line. Why, and what should you have shared?

<details>
<summary>Answer</summary>

A branch link shows the current version, and lines moved. A permalink (with the commit hash — press `y` on the file page) always shows the file as it was at that commit.

</details>

### P4. Settings audit

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** repository security

You inherit admin access to a repository. Name three settings areas to review first for security, and what you'd look for.

<details>
<summary>Answer</summary>

Collaborators and teams (remove people who no longer need access, reduce roles to least privilege); branch protection/rulesets (protect `main`, block force pushes, require reviews and checks); integrations — webhooks, deploy keys and GitHub Apps (remove unused ones with write access). Also enable secret scanning and Dependabot.

</details>
