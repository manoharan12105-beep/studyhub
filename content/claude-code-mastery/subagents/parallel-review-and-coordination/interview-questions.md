# Parallel Code Review and Coordinating Results — Interview Questions

## Beginner

### Q1. Why make AI reviewers read-only?

**Style:** Why

<details>
<summary>Answer</summary>

So finding and fixing are separate steps. A read-only reviewer can't introduce unreviewed changes or be steered into editing by text in the code it reads; a human decides which findings to act on.

</details>

## Intermediate

### Q2. How do you coordinate results from several reviewers?

**Style:** How

<details>
<summary>Answer</summary>

Merge into one list, keep the source of each finding, combine duplicates, validate each finding against the cited code (and reproduce with a test where it matters), classify as validated / rejected / needs a human, then prioritize. Only validated findings drive changes.

</details>

### Q3. What are the costs of parallel review?

**Style:** Trade-off

<details>
<summary>Answer</summary>

More tokens (each reviewer has its own context, and every report lands in the main conversation), more noise and false positives to validate, and coordination effort. Wall-clock time is roughly the slowest reviewer, so latency improves compared with running them one after another.

</details>

## Advanced

### Q4. Two reviewers disagree. How do you decide?

**Style:** Scenario

<details>
<summary>Answer</summary>

Look for the deciding evidence: the specification for behaviour questions, a reproducing test for defects, the actual code for claims about it. If neither settles it, escalate to a human with both arguments. Majority vote between models is not evidence.

</details>

### Q5. Design an AI-assisted review process for a team that merges 30 pull requests a day.

**Style:** Design

<details>
<summary>Answer</summary>

Deterministic CI (build, tests, static analysis) as the gate; one AI review pass on every PR with a strict evidence format; parallel lens reviewers only for risky areas (security-sensitive paths, migrations) chosen by path; read-only tools and no secrets; findings posted as suggestions, not commits; required human approval for merge; and periodic measurement of how many AI findings were validated vs rejected to tune prompts and decide if the cost is worth it.

</details>
