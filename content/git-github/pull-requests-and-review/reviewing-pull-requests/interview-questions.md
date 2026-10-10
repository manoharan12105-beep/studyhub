# Reviewing Pull Requests and Addressing Reviews — Interview Questions

## Beginner

### Q1. What do you look for when reviewing a pull request?

**Style:** What

<details>
<summary>Answer</summary>

That it solves the described problem correctly (including edge cases), has meaningful tests, fits the design and naming of the codebase, handles errors properly, introduces no security problems or secrets, and contains nothing unrelated. I read the description and check CI first.

</details>

## Intermediate

### Q2. How do you review a large pull request effectively?

**Style:** How

<details>
<summary>Answer</summary>

Check it out locally (`gh pr checkout <n>` or `git fetch origin pull/<n>/head:pr-<n>`), build and run the tests, walk through it commit by commit if the commits are well structured, start with the tests and public interfaces, and mark files viewed. If it's too large to review well, ask for it to be split.

</details>

### Q3. How should an author respond to review comments?

**Style:** How

<details>
<summary>Answer</summary>

Reply to each comment (done, or reasoning for a different choice), push fixes as new commits so changes since the last review are visible, resolve conversations according to team convention, and re-request review. Ask for clarification instead of guessing, and keep the discussion about the code.

</details>

## Advanced

### Q4. A reviewer and you disagree on a design choice. What do you do?

**Style:** Scenario

<details>
<summary>Answer</summary>

Explain the reasoning and trade-offs with evidence (requirements, performance, consistency with existing code), and listen to theirs. If it isn't converging in comments, talk directly and record the outcome in the PR. Prefer existing team conventions; if it's a matter of taste, the author's choice usually stands; if it's a significant architectural decision, involve the tech lead.

</details>
