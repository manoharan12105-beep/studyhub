# Navigating a GitHub Repository — Interview Questions

## Beginner

### Q1. What is the difference between watching, starring and forking a repository?

**Style:** Comparison

<details>
<summary>Answer</summary>

Watching controls which notifications you receive about the repository. Starring bookmarks it (and signals appreciation) without notifications. Forking creates your own server-side copy of the repository under your account, which you can push to and use for pull requests.

</details>

## Intermediate

### Q2. How would you find out on GitHub why a particular line of code exists?

**Style:** How

<details>
<summary>Answer</summary>

Open the file, use **Blame** to find the commit that last changed the line, open that commit to see its message and the linked pull request, then read the PR description and review discussion. If the commit was only a reformat, use blame's option to view the previous revision.

</details>

### Q3. What is a permalink and why use one?

**Style:** Why

<details>
<summary>Answer</summary>

A URL that includes a specific commit hash (press `y` on a file page), so it always shows the file exactly as it was at that commit. Links using a branch name break or point elsewhere as the file changes; permalinks stay accurate in issues and reviews.

</details>

## Advanced

### Q4. Which repository settings would you review when setting up a team repository?

**Style:** Scenario

<details>
<summary>Answer</summary>

Default branch; allowed merge methods and auto-deletion of head branches; branch protection or rulesets on `main` (required reviews, required status checks, no force pushes or deletions); collaborator and team roles with least privilege; Dependabot, secret scanning and push protection; secrets for Actions; and a review of webhooks, deploy keys and installed apps.

</details>
