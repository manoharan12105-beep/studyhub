# Agentic Workflows and Agents — Interview Questions

## Beginner

### Q1. What is the difference between an AI workflow and an AI agent?

**Style:** Compare

<details>
<summary>Answer</summary>

In a workflow, application code decides the sequence of LLM calls and checks; in an agent, the model decides the next action itself, usually by calling tools in a loop until it reaches the goal. Workflows are more predictable, cheaper and testable; agents handle open-ended tasks but need strict limits.

</details>

### Q2. Name three agentic patterns.

**Style:** Direct

<details>
<summary>Answer</summary>

Prompt chaining (sequential steps with checks), routing (classify and dispatch to a specialised prompt or model), parallelisation (independent calls combined), orchestrator–workers (a planner delegates subtasks), and evaluator–optimizer (generate, critique, revise).

</details>

## Intermediate

### Q3. How do you implement an evaluator–optimizer loop safely?

**Style:** How

<details>
<summary>Answer</summary>

Write the loop in Java with a maximum number of attempts; have the evaluator return structured output (verdict enum + feedback); feed the feedback into the next generation; add deterministic checks where possible; stop and hand over to a human when the limit is reached; log every attempt with tokens and cost.

</details>

### Q4. What limits does an autonomous agent need?

**Style:** Scenario

<details>
<summary>Answer</summary>

Maximum steps/rounds, maximum tool calls (`spring.ai.tools.limits.*`), a token or cost budget, a wall-clock timeout, tool-level authorisation and approval for irreversible actions, and a defined failure behaviour (report progress and stop) when any limit is hit.

</details>

## Advanced

### Q5. Design an assistant that creates a weekly study plan from a learner's progress, calendar and goals.

**Style:** Design

<details>
<summary>Answer</summary>

A workflow, not a free agent: (1) gather data with deterministic code (progress service, calendar API) — no LLM needed; (2) one LLM call with structured output producing a draft plan record; (3) deterministic validation (hours per day within availability, prerequisites respected, total time); (4) if invalid, an evaluator–optimizer loop with the validation errors as feedback, max 3 attempts; (5) show the plan for learner approval before writing calendar events (write tool behind confirmation). Trace each step, budget tokens per learner, and evaluate plan quality on sample learners.

</details>
