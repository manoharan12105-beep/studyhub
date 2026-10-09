# Delegation, Tool Calls, Cost and Latency — Interview Questions

## Beginner

### Q1. What drives the cost of a Claude Code session?

**Style:** What

<details>
<summary>Answer</summary>

How much context each request carries (instructions, tools, history, file contents), how many requests are made (tool calls, retries, subagents, teammates) and the price of the model and mode (including thinking tokens and fast mode).

</details>

## Intermediate

### Q2. When does delegating to a subagent save money, and when does it cost more?

**Style:** Trade-off

<details>
<summary>Answer</summary>

It saves your main context (and later requests' size) when the work is verbose and the answer is short. It costs more in total when the task is small or sequential, because the subagent sends its own requests and may re-read context. Forks share the prompt cache, which lowers their start cost.

</details>

### Q3. What's the difference between fast mode and lower effort?

**Style:** Comparison

<details>
<summary>Answer</summary>

Fast mode runs Opus faster at a higher price per token with the same quality. Lower effort reduces thinking, so it's cheaper and quicker but may lose quality on complex tasks.

</details>

## Advanced

### Q4. How would you cut a team's Claude Code spend by 30 % without hurting outcomes?

**Style:** Design

<details>
<summary>Answer</summary>

Measure first (`/usage`, analytics). Then: shorter CLAUDE.md with procedures in skills; disable unused MCP servers; specific prompts and focused test runs; `/clear` between tasks; right-size model and effort per task; Haiku-class subagents for searches and summaries; avoid teams unless discussion adds value; turn-and-budget limits on automation. Re-measure and check that defect rates didn't rise.

</details>

### Q5. How do you reduce latency in an interactive debugging session?

**Style:** How

<details>
<summary>Answer</summary>

Give exact file and failure up front, iterate with a single test, keep context small, and use fast mode early in the conversation if speed matters more than cost. Avoid unnecessary delegation, which adds startup time.

</details>
