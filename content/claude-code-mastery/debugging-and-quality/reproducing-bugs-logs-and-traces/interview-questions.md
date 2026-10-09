# Reproducible Bugs, Stack Traces and Logs — Interview Questions

## Beginner

### Q1. How do you read a Java stack trace?

**Style:** How

<details>
<summary>Answer</summary>

Exception type and message first (the helpful NPE message names the null reference), then the first frame in your own package for where it happened, frames below for the call path, and the last `Caused by:` for the root cause.

</details>

## Intermediate

### Q2. What do you give an AI agent when asking it to fix a bug?

**Style:** What

<details>
<summary>Answer</summary>

Exact steps or a request, expected vs actual behaviour, the error output or trace, relevant files or the issue, and an instruction to reproduce with a failing test before changing code. A runnable check is what lets the agent verify its own work.

</details>

### Q3. Why reproduce before fixing?

**Style:** Why

<details>
<summary>Answer</summary>

Without a reproduction you can't tell whether a change fixed the bug or just changed something. The failing test proves the bug exists, guides the fix, proves the fix works, and stays as a regression test.

</details>

## Advanced

### Q4. The trace points to a line where a value is null, but null is a valid input. Where do you fix it?

**Style:** Scenario

<details>
<summary>Answer</summary>

Where the null is used, by handling it correctly (BUG-101: no discount code means no discount). If null were invalid, the fix would be upstream — validation at the boundary — so the bad value never arrives. The specification decides which.

</details>

### Q5. How do you debug safely with production logs?

**Style:** Security

<details>
<summary>Answer</summary>

Copy only the necessary window, redact personal data and secrets, never paste credentials into prompts, keep stack traces out of client responses, and reproduce with synthetic data locally rather than production data.

</details>
