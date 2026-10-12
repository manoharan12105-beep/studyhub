# Agentic Workflows and Agents — Practice

### P1. Pick the pattern

**Difficulty:** Easy · **Type:** MCQ

Support messages must go to a billing prompt, a technical prompt or a course-content prompt. Which pattern fits?

- A) Evaluator–optimizer
- B) Routing
- C) Orchestrator–workers
- D) Autonomous agent

<details>
<summary>Answer</summary>

**Answer:** B) Routing

</details>

### P2. Count the calls

**Difficulty:** Easy · **Type:** Behavior

The lesson's `QuizWorkflow` runs with `maxAttempts = 3` and the evaluator never returns `PASS`. How many model calls happen, and what is returned?

<details>
<summary>Answer</summary>

Six calls (three generator + three evaluator). The result has `accepted=false` with the last draft, for human review.

</details>

### P3. Parallel review

**Difficulty:** Medium · **Type:** Coding

Run three independent reviews (security, style, tests) of the same code in parallel with virtual threads and combine the results.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    var aspects = List.of("security", "style", "test coverage");
    List<Future<String>> reviews = aspects.stream()
            .map(aspect -> executor.submit(() -> reviewer.prompt()
                    .user(u -> u.text("Review this code for {aspect} only:\n{code}").param("aspect", aspect).param("code", code))
                    .call().content()))
            .toList();
    String combined = String.join("\n\n", reviews.stream().map(f -> {
        try { return f.get(); } catch (Exception e) { return "review failed: " + e.getMessage(); }
    }).toList());
}
```

Latency ≈ the slowest review instead of the sum; cost is unchanged.

</details>

### P4. Runaway agent

**Difficulty:** Medium · **Type:** Debugging

An agent with a `searchDocs` tool ran 140 tool calls for one question and cost more than a day of normal traffic. What controls were missing?

<details>
<summary>Answer</summary>

Tool-call limits (`spring.ai.tools.limits.max-calls-per-tool-default`, `max-total-tool-calls`), a token/cost budget per task, a timeout, and a tool that returns helpful "no results — try X" messages so the model stops retrying. Also alerting on unusually long runs, and reconsidering whether a fixed retrieval workflow would serve better.

</details>

### P5. Agent or workflow?

**Difficulty:** Hard · **Type:** Scenario

A team proposes a multi-agent system (planner, researcher, writer, critic) to generate course summaries from existing lesson files. What do you recommend?

<details>
<summary>Answer</summary>

A workflow: read the lesson files (code), summarise each with one structured-output call, validate length and required sections deterministically, optionally run one evaluator pass with bounded revision, and publish after human review. The steps are known in advance, so planner/researcher agents add cost, latency and unpredictability without benefit. Re-evaluate only if measured quality gaps appear that a more agentic design addresses.

</details>
