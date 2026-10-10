# Creating a GitHub Repository and Writing a README — Interview Questions

## Beginner

### Q1. How do you publish an existing local project to GitHub?

**Style:** How

<details>
<summary>Answer</summary>

Create an empty repository on GitHub (no README, `.gitignore` or license), then locally `git remote add origin <url>` and `git push -u origin main`. With the GitHub CLI: `gh repo create <name> --source=. --push`.

</details>

### Q2. What is the difference between a public and a private repository?

**Style:** Comparison

<details>
<summary>Answer</summary>

A public repository's code and full history are visible to everyone; anyone can fork it and propose changes. A private repository is visible only to its owner, invited collaborators and organisation members with access. Neither is a place for secrets.

</details>

## Intermediate

### Q3. What should a good README contain?

**Style:** What

<details>
<summary>Answer</summary>

What the project does in a sentence or two, requirements, how to build, test and run it (commands that work), a usage example, how to contribute, and the license. For applications, sample output or screenshots; for libraries, an API example.

</details>

### Q4. Your first push to a new GitHub repository is rejected. What likely happened?

**Style:** Debugging

<details>
<summary>Answer</summary>

The repository was initialised on GitHub with a README (or license/.gitignore), creating a commit your local history doesn't have, so the push isn't a fast-forward. Either `git pull --rebase origin main` (add `--allow-unrelated-histories` if merging instead) and push, or delete and recreate the repository empty.

</details>
