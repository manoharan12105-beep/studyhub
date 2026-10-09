# Reusable Workflows: Review, Testing, Documentation and Release — Interview Questions

## Beginner

### Q1. Why turn a team procedure into a skill?

**Style:** Why

<details>
<summary>Answer</summary>

So every developer and Claude follow the same steps and report the same evidence. It removes the variation that comes from how each person phrases a request, captures team knowledge, and costs little context until it is used.

</details>

### Q2. What should every review skill require in its output?

**Style:** What

<details>
<summary>Answer</summary>

Evidence — a `file:line` for every finding — in a fixed format such as Must fix / Should fix / Question, and an explicit statement that it doesn't edit files. Evidence makes invented findings easy to catch.

</details>

## Intermediate

### Q3. How do you stop a test-generation workflow from writing useless tests?

**Style:** How

<details>
<summary>Answer</summary>

Require that the test asserts the *specified* behaviour, not the current output, and that it is run and shown to fail first for the expected reason. Forbid production changes inside the test-writing step and flag any change to existing assertions in review.

</details>

### Q4. Which workflows should Claude never start on its own, and how do you enforce that?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Ones with side effects or deliberate timing: releases, deployments, documentation edits to shared files, notifications. Set `disable-model-invocation: true` (Claude Code blocks Claude's attempts and hides the description), and keep the skill's own actions limited — a release *check* never tags or pushes.

</details>

## Advanced

### Q5. A colleague says "our review skill checks security, so we can skip the security review". How do you respond?

**Style:** Scenario

<details>
<summary>Answer</summary>

A skill is instructions to a model, not a guarantee. It reduces misses and makes reviews consistent, but it can miss issues and can be steered by untrusted input. Keep deterministic checks (tests, static analysis, dependency scanning) and human review for security-relevant changes; treat the skill as one layer.

</details>

### Q6. How would you design a pre-release skill that can't report a false pass?

**Style:** Design

<details>
<summary>Answer</summary>

Make each check produce quoted evidence (the `Tests run:` line, the `git status` output), allow NOT CHECKED when evidence can't be collected, and require every check to PASS for GO. Inject the repository state so it isn't remembered from the conversation, pre-approve only the commands it runs, make it manual-only, and forbid tagging, pushing and deploying.

</details>
