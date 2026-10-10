# Git and GitHub: What They Are — Practice

### P1. Tool or platform?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Git vs GitHub

Which of these is provided by GitHub but **not** by Git itself?

- A) Creating a branch
- B) Viewing the commit history
- C) Reviewing a pull request with inline comments
- D) Merging two branches

<details>
<summary>Answer</summary>

**Answer:** C) Reviewing a pull request with inline comments

Branching, history and merging are Git operations. Pull requests and their reviews are a platform feature.

</details>

### P2. Alternatives

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** hosting platforms

GitLab is best described as an alternative to:

- A) Git
- B) GitHub
- C) Java
- D) Maven

<details>
<summary>Answer</summary>

**Answer:** B) GitHub

GitLab hosts Git repositories, as GitHub does. You still use Git with it.

</details>

### P3. Correct the sentence

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** terminology

Rewrite "I committed my code to GitHub" so that it describes what really happens.

<details>
<summary>Answer</summary>

"I committed my code in my local repository with Git, then pushed the commit to the remote repository on GitHub." Committing and pushing are separate steps.

</details>

### P4. Deleted remote

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** distributed history

Someone accidentally deletes the team's GitHub repository. Three developers pulled `main` this morning. Is the history lost? What is lost?

<details>
<summary>Answer</summary>

The Git history is not lost: each clone holds everything up to its last fetch, and one developer can push it to a new repository. What is lost is platform data — issues, pull request discussions, reviews, settings, releases' notes — and any commits pushed after the developers' last fetch.

</details>
