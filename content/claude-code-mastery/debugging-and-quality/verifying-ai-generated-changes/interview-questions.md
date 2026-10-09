# Verifying AI-Generated Changes — Interview Questions

## Beginner

### Q1. How do you verify code an AI agent wrote?

**Style:** How

<details>
<summary>Answer</summary>

Compile it, run the targeted tests and the full build, read the whole diff (including tests), and check behaviour where tests don't reach. Accept command output and observed behaviour as evidence — not the agent's summary.

</details>

## Intermediate

### Q2. What failure modes do you watch for in AI-generated code?

**Style:** What

<details>
<summary>Answer</summary>

Invented APIs, flags and config keys; tests that assert nothing real (mocks testing themselves); weakened or disabled tests; scope creep (unrelated refactors, dependency bumps); and "it should work" without running anything.

</details>

### Q3. How do you make the agent verify its own work?

**Style:** How

<details>
<summary>Answer</summary>

Give it a runnable check (tests, build, a script) and ask it to run the check, iterate, and show the output. Strengthen with `/goal`, a Stop hook running tests, a reviewer subagent, and CI. Still review the result yourself.

</details>

## Advanced

### Q4. Why are invented configuration keys more dangerous than invented methods?

**Style:** Trade-off

<details>
<summary>Answer</summary>

An invented method fails compilation immediately. Invented or misspelled config keys are often silently ignored, so a safety setting you believe is active does nothing. Verify keys against documentation and test the behaviour they should cause.

</details>

### Q5. What belongs in a PR description for AI-assisted work?

**Style:** Design

<details>
<summary>Answer</summary>

What changed and why, how each requirement was verified (tests, commands, output), what was not verified or assumed, and where reviewers should focus. Being explicit about gaps is what makes AI-assisted changes trustworthy to review.

</details>
