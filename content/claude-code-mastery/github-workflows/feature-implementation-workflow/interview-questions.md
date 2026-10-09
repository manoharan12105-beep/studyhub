# Working with Issues and the Feature Implementation Workflow — Interview Questions

## Beginner

### Q1. Walk me through how you implement a feature with Claude Code.

**Style:** How

<details>
<summary>Answer</summary>

Branch from a clean tree; inspect the issue and code in plan mode; agree a file-by-file plan with one test per acceptance criterion; write tests and see them fail; implement in small diffs; run the full build; review the diff (myself and with a review tool); fix validated findings; summarize what changed, how it was verified and what wasn't; then commit and open a PR deliberately.

</details>

## Intermediate

### Q2. Why separate planning from implementation?

**Style:** Why

<details>
<summary>Answer</summary>

So misunderstandings and scope creep surface while they cost one message instead of a review cycle. Plan mode lets Claude read and propose without editing, and the plan becomes the yardstick for reviewing the diff. For one-sentence changes, skip it.

</details>

### Q3. How do you know the tests Claude wrote are meaningful?

**Style:** How

<details>
<summary>Answer</summary>

Each maps to a requirement, asserts specified behaviour, and has been seen to fail — before the implementation exists, or by temporarily breaking the code. Review test diffs for weakened assertions and check the build output yourself.

</details>

## Advanced

### Q4. The issue is ambiguous. What do you do?

**Style:** Scenario

<details>
<summary>Answer</summary>

Have Claude list the unclear points during inspection, resolve them with the issue owner, and write the decisions into the issue or plan. Don't let the agent guess silently; if a decision must be made to proceed, record it as an assumption in the summary and PR description.

</details>

### Q5. How would you make this workflow repeatable for a team?

**Style:** Design

<details>
<summary>Answer</summary>

Put the definition of done and commands in CLAUDE.md; turn steps into skills (investigation, regression test, review, summary format); add read-only reviewer subagents; enforce must-hold rules with hooks and permissions (ask on commit/push, protected migrations); and keep CI plus required human review as the gate.

</details>
