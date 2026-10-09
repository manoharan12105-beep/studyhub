# Test-Driven Bug Fixes and Regression Testing — Interview Questions

## Beginner

### Q1. What is a regression test?

**Style:** What

<details>
<summary>Answer</summary>

A test that reproduces a fixed bug and stays in the suite so the bug can't return unnoticed. It's written from the expected behaviour, fails on the buggy code and passes after the fix.

</details>

## Intermediate

### Q2. How can an AI agent make tests pass without fixing the bug?

**Style:** Scenario

<details>
<summary>Answer</summary>

Changing expected values, loosening or removing assertions, disabling tests, catching exceptions in production code, or testing a mock instead of real behaviour. Catch it by reviewing every change under `src/test`, watching the test count, and requiring expected values from the specification.

</details>

### Q3. How do you enforce "tests must pass before done" with Claude Code?

**Style:** How

<details>
<summary>Answer</summary>

State it in CLAUDE.md, ask for the build output as evidence, and enforce it with a Stop hook that runs the tests and exits 2 on failure (with `stop_hook_active` handling), or a `/goal` condition. CI repeats the check as the real gate.

</details>

## Advanced

### Q4. When is changing an existing test's expected value correct?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When the specification changed — confirmed by the owner, documented in the issue or PR, and reviewed. Never to match current output during a bug fix. The PR should say which rule changed and why.

</details>

### Q5. Design guard rails against test weakening for a team using agents.

**Style:** Design

<details>
<summary>Answer</summary>

CLAUDE.md rule; `ask` permission on test edits; review checklist item and a test-coverage reviewer subagent that flags changed assertions; a CI check that fails if the test count drops or `@Disabled` is added without a linked issue; mutation testing on critical modules; and human review of test diffs.

</details>
