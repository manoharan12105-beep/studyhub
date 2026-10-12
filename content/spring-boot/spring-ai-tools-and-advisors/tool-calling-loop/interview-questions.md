# The Tool-Calling Loop: Errors, Limits and Direct Returns — Interview Questions

## Beginner

### Q1. Who executes tools in Spring AI 2.0?

**Style:** Direct

<details>
<summary>Answer</summary>

The application. `ChatClient` auto-registers `ToolCallingAdvisor`, which loops: call the model, execute requested tools through `ToolCallingManager`, send the results back, repeat until the model answers without tool calls. A `ChatModel` called directly returns tool calls but does not execute them.

</details>

### Q2. What does `returnDirect = true` do?

**Style:** Direct

<details>
<summary>Answer</summary>

The tool's result is returned to the caller without sending it back to the model for a final answer — saving one model call. The result is the output of the tool's result converter (JSON by default). It only applies if every tool called in that round is `returnDirect`.

</details>

## Intermediate

### Q3. A tool throws `IllegalArgumentException`. What happens by default, and how would you change it?

**Style:** How

<details>
<summary>Answer</summary>

The default `ToolExecutionExceptionProcessor` sends the exception message to the model as the tool result, so the model can correct its arguments or explain the failure. Checked exceptions and `Error`s are rethrown. Set `spring.ai.tools.throw-exception-on-error=true` to rethrow runtime exceptions too, or define a custom `ToolExecutionExceptionProcessor` bean to sanitise messages.

</details>

### Q4. How do you stop a model from calling `search` fifty times in one turn?

**Style:** How

<details>
<summary>Answer</summary>

Tool-call limits: `spring.ai.tools.limits.max-calls-per-tool-default` (40), `max-total-tool-calls` (150) and `on-limit-exceeded` (`THROW` or `RETURN_ERROR_RESPONSE`), or programmatically `ToolCallingManager.builder().maxCallsPerTool(n)` passed to `ToolCallingAdvisor.builder().toolCallingManager(...)`. With `THROW`, the advisor ends the turn with finish reason `toolCallLimitExceeded`; check it before showing the text.

</details>

## Advanced

### Q5. Why did moving the loop into an advisor matter, and when would you write the loop yourself?

**Style:** Design

<details>
<summary>Answer</summary>

As an advisor at order +300, the loop becomes part of the chain: advisors before it run once per request (memory, auditing), advisors after it run on every round (per-call logging, memory that should capture tool messages). It is also replaceable with a custom `ToolCallingManager`. Write the loop yourself — `ChatModel.call` + `ToolCallingManager.executeToolCalls` + a round limit — when every round needs custom handling: human approval before a write tool, persisting each step for audit, or switching models between rounds.

</details>
