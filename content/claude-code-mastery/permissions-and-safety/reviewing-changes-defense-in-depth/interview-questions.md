# Reviewing Changes and Defense in Depth — Interview Questions

## Beginner

### Q1. How do you review changes Claude Code makes?

**Style:** How

<details>
<summary>Answer</summary>

Start from a clean tree, then read `git diff --stat` for scope and `git diff` for content (or `/diff` and the IDE diff viewer), check tests were added and none weakened, confirm the build ran after the last edit, and look for security and configuration changes. I review the diff, not the summary, and commit only what I understand.

</details>

### Q2. What is defense in depth?

**Style:** What

<details>
<summary>Answer</summary>

Layering independent controls so one failure doesn't cause an incident. For Claude Code: permission modes and rules, hooks, the sandbox, checkpoints and Git, tests and CI, human review, branch protection and least-privilege credentials — each catches failures the others miss.

</details>

## Intermediate

### Q3. Why do tests not replace code review for AI changes?

**Style:** Why

<details>
<summary>Answer</summary>

Tests only check behaviour they cover, and they can be edited to pass. Review catches wrong intent, scope creep, weakened assertions, security flaws that tests don't exercise, unnecessary dependencies and invented APIs.

</details>

### Q4. Which configuration creates mandatory review points?

**Style:** How

<details>
<summary>Answer</summary>

Ask rules for commits, pushes, build files, migrations and CI workflows (they prompt in every mode); deny rules for forbidden actions; server-side branch protection requiring a PR, a passing check and an approving review; and CI environments with required reviewers for deploys.

</details>

## Advanced

### Q5. Give an example where every automated layer passes but the change is still wrong.

**Style:** Scenario

<details>
<summary>Answer</summary>

Claude fixes a pricing bug by changing the test's expected value to match the buggy output. The build is green, no permission rule is involved, no hook triggers and auto mode sees nothing dangerous. Only a reviewer who compares the assertion with the requirement notices. That's why test-file changes get special attention.

</details>

### Q6. How do you keep AI-assisted changes reviewable at scale?

**Style:** Workflow design

<details>
<summary>Answer</summary>

Small tasks with explicit scope, plan mode for multi-file changes, a definition of done that includes "only necessary changes" and reporting what wasn't verified, separate commits per concern, automated checks for formatting and dependency changes in CI, AI-assisted review as a second opinion, and human review focused on intent, tests and security.

</details>
