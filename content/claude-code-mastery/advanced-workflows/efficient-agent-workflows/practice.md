# Delegation, Tool Calls, Cost and Latency — Practice

### P1. Fast mode

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** fast mode

What does `/fast` change?

- A) Switches to a smaller, cheaper model
- B) Runs Claude Opus with a faster, more expensive configuration at the same quality
- C) Lowers the effort level
- D) Skips permission prompts

<details>
<summary>Answer</summary>

**Answer:** B) Runs Claude Opus with a faster, more expensive configuration at the same quality

It's not a different model and not lower effort.

</details>

### P2. Delegate?

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** delegation

Fix one typo in an error message. Main conversation, subagent or team?

<details>
<summary>Answer</summary>

Main conversation. Delegation adds requests and startup latency for no benefit on a one-line change.

</details>

### P3. Cheaper worker

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** subagent model

Write frontmatter for a read-only subagent that summarizes logs on the Haiku model.

<details>
<summary>Answer</summary>

```yaml
---
name: log-summarizer
description: Summarizes long Maven or application logs into the first error and its cause. Use for logs over a few hundred lines.
tools: Read, Grep
model: haiku
---
```

</details>

### P4. Wasted calls

**Difficulty:** Medium · **Type:** Code review · **Concepts:** tool calls

Claude runs `./mvnw -B verify` (40 seconds) after each of 12 small edits while fixing one failing test. Suggest a better loop.

<details>
<summary>Answer</summary>

Iterate with the single failing test (`./mvnw -q test -Dtest=PriceCalculatorTest`), then run the full build once at the end. Say so in the prompt: "while iterating, run only PriceCalculatorTest; run ./mvnw -B verify once before reporting".

</details>

### P5. Effort vs model

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** effort levels

You're renaming fields across five files. Which do you lower first, the model or the effort? Why?

<details>
<summary>Answer</summary>

Either can save money; for a mechanical rename, lowering effort (less thinking) or using a Sonnet-class model are both reasonable. Keep the verification step either way. For a subtle concurrency bug you'd do the opposite.

</details>

### P6. Why usage climbed

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** long sessions

A session open all day used far more of the plan than the work suggests. Name four documented causes.

<details>
<summary>Answer</summary>

Long context re-sent with every request; cache misses after breaks longer than the cache lifetime; scheduled tasks or goal check-ins firing while idle; subagents and teammates sending their own requests; and compaction, which is itself a large request. `/usage` flags the ones that matter.

</details>

### P7. Team or subagents?

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** team cost

For three independent code reviews of one PR, compare parallel subagents with an agent team on cost and value.

<details>
<summary>Answer</summary>

Parallel subagents: three contexts plus three reports; findings return to you for validation. An agent team: separate sessions that can debate, with coordination overhead and much higher token use (the docs cite about 7× a standard session when teammates plan), and experimental limitations. Choose the team only when reviewers challenging each other adds value worth that cost.

</details>
