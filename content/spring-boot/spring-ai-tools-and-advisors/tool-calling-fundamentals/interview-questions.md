# Tool Calling Fundamentals — Interview Questions

## Beginner

### Q1. What is tool calling?

**Style:** Direct

<details>
<summary>Answer</summary>

A model capability where the application sends tool definitions (name, description, input schema) with a request, the model replies with a request to call a tool with JSON arguments, the application executes the tool and returns the result as a tool message, and the model uses it to answer. It gives the model live data and the ability to trigger actions.

</details>

### Q2. Does the model execute the tool?

**Style:** Trap

<details>
<summary>Answer</summary>

No. The model only produces a tool-call request. The application (in Spring AI, `ToolCallingAdvisor` via `ToolCallingManager`) decides to execute it, runs the Java method and sends the result back. That is why validation and authorisation are the application's job.

</details>

## Intermediate

### Q3. How many model calls does one `ChatClient` call with one tool use make?

**Style:** How

<details>
<summary>Answer</summary>

At least two: the first returns the tool call; after the tool runs, a second call carries the user message, the assistant tool-call message and the tool result, and returns the final answer. Each extra tool round adds another call.

</details>

### Q4. What changed about tool execution between Spring AI 1.x and 2.0?

**Style:** Compare

<details>
<summary>Answer</summary>

In 1.x each `ChatModel` ran the tool loop internally (controlled by `internalToolExecutionEnabled`). In 2.0 the loop moved to `ToolCallingAdvisor`, auto-registered by `ChatClient`; `ChatModel` returns tool calls without executing them. Opt out with `AdvisorParams.toolCallingAdvisorAutoRegister(false)` or `spring.ai.chat.client.tool-calling.enabled=false`. `toolNames(...)` and bean-name resolution of plain `Function` beans were removed.

</details>

### Q5. Tool or RAG for "What is the refund policy?" and "What is the status of my refund?"

**Style:** Scenario

<details>
<summary>Answer</summary>

The policy is static document knowledge — RAG (or a search tool over the documents). The refund status is live, user-specific data — a tool that queries the order system as the authenticated user.

</details>

## Advanced

### Q6. What risks does tool calling add, and how do you contain them?

**Style:** Design

<details>
<summary>Answer</summary>

Arguments are model output and can be wrong or attacker-influenced (prompt injection), loops can run away, and actions can have side effects. Contain by exposing narrow tools per feature, validating arguments, passing identity through `ToolContext` and authorising in code, requiring confirmation for irreversible actions, relying on tool call limits, making actions idempotent, and logging/observing every call.

</details>
