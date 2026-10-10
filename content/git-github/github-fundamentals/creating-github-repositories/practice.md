# Creating a GitHub Repository and Writing a README — Practice

### P1. Empty or initialised?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** initial commit

You have a local gradebook repository with 12 commits and want to put it on GitHub. How should you create the GitHub repository?

- A) With a README, so the page isn't empty
- B) With a `.gitignore` template and a license
- C) Empty — no README, `.gitignore` or license
- D) As a fork of another repository

<details>
<summary>Answer</summary>

**Answer:** C) Empty — no README, `.gitignore` or license

Any initial file creates a commit unrelated to your history.

</details>

### P2. Connect and publish

**Difficulty:** Easy · **Type:** Command · **Concepts:** remote add, push -u

Write the commands to connect your local repository to `https://github.com/your-username/gradebook.git` and publish `main`.

<details>
<summary>Answer</summary>

```bash
git remote add origin https://github.com/your-username/gradebook.git
git push -u origin main
```

</details>

### P3. Visibility choice

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** public vs private

A university assignment must not be shared until grading ends, but you want it on your portfolio later. What visibility do you choose now, and what must you check before changing it?

<details>
<summary>Answer</summary>

Private now. Before making it public, review the **whole history** (not just the latest files) for secrets, personal data and anything the course forbids sharing — making a repository public exposes every commit.

</details>

### P4. Improve the README

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** README quality

A README contains only `# gradebook` and "My project". List four sections you would add for a Java/Maven project.

<details>
<summary>Answer</summary>

A one-sentence description; requirements (JDK 17+, Maven 3.9+); build and test (`mvn -B verify`); how to run (`java -cp target/classes com.example.gradebook.App`) with sample output; plus contributing and license.

</details>
