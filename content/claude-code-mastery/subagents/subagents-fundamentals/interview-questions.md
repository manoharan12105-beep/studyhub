# What Are Subagents? Delegation and Context Isolation — Interview Questions

## Beginner

### Q1. What is a subagent in Claude Code?

**Style:** What

<details>
<summary>Answer</summary>

A separate Claude worker started with the Agent tool. It has its own context window, system prompt and tool set, works on one delegated task and returns a single result. Its intermediate reads and command output stay out of the main conversation.

</details>

### Q2. Name the main built-in subagents.

**Style:** What

<details>
<summary>Answer</summary>

Explore (fast, read-only search; skips CLAUDE.md), Plan (read-only research in plan mode), and general-purpose (all subagent tools, can modify). There are also helpers such as `claude`, `statusline-setup` and `claude-code-guide`.

</details>

## Intermediate

### Q3. When should you not use a subagent?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When the task needs back-and-forth with you, shares a lot of context across phases, is a quick targeted change, or when latency matters — a fresh subagent has to rebuild context. Use the main conversation (or a fork if the side task needs the conversation).

</details>

### Q4. What's the difference between a fork and an ordinary subagent?

**Style:** Comparison

<details>
<summary>Answer</summary>

A fork inherits the whole conversation, system prompt, tools and model and shares the prompt cache; an ordinary subagent starts fresh from its definition and the task message. Both keep their own tool calls out of your context and return only a result.

</details>

## Advanced

### Q5. A subagent returned a confident but wrong root cause. What went wrong and how do you prevent it?

**Style:** Debugging

<details>
<summary>Answer</summary>

Likely an under-specified delegation (no scope, no evidence requirement) and a summary accepted without checking. Require `file:line` evidence and a confidence label (confirmed vs suspected), give it the reproduction or stack trace, and verify the cited code or reproduce the failure before acting. A subagent report is a claim, not proof.

</details>

### Q6. How do subagents help security, and where do they not?

**Style:** Security

<details>
<summary>Answer</summary>

They let you give a worker fewer tools (read-only reviewers), keep untrusted content in a separate context, and Claude Code scans subagent reports for instruction-shaped text. They don't make untrusted input safe: what the main conversation does with a report still goes through permissions, hooks and sandboxing, which are the actual controls.

</details>
