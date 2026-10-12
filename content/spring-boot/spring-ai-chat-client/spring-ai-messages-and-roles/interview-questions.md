# System, User, Assistant and Tool Messages — Interview Questions

## Beginner

### Q1. What are the four message roles in Spring AI and who produces each?

**Style:** Direct

<details>
<summary>Answer</summary>

`SYSTEM` (your application's instructions), `USER` (the end user's question and data), `ASSISTANT` (the model's earlier replies, including tool-call requests) and `TOOL` (your application's results for requested tool calls). Classes: `SystemMessage`, `UserMessage`, `AssistantMessage`, `ToolResponseMessage`; `getMessageType()` returns the role.

</details>

### Q2. What belongs in the system message?

**Style:** Direct

<details>
<summary>Answer</summary>

Trusted, application-controlled instructions: the assistant's role and scope, rules (including when to refuse or say "I don't know"), and the output format and length. User input and retrieved documents do not belong there.

</details>

## Intermediate

### Q3. How does a model "remember" a conversation if it is stateless?

**Style:** How

<details>
<summary>Answer</summary>

The application resends earlier turns as `USER` and `ASSISTANT` messages in every request. Spring AI automates this with `ChatMemory` and `MessageChatMemoryAdvisor`, which load the conversation's recent messages and add them to the prompt, then store the new exchange after the response.

</details>

### Q4. Why can an `AssistantMessage` have empty text?

**Style:** Why

<details>
<summary>Answer</summary>

When the model decides to use a tool, its reply is a tool-call request — tool name, arguments and a call id — rather than an answer. The application executes the tool, adds a `ToolResponseMessage` with the result (same id) and calls the model again to get the final text.

</details>

### Q5. Why is it risky to put user input into the system message?

**Style:** Scenario

<details>
<summary>Answer</summary>

Models give system messages the highest priority. If user text is concatenated into it, a user can write instructions ("ignore the rules above…") that the model treats as system-level. Keeping user input in the user message, clearly delimited, keeps a separation between instructions and data. It is not a complete defence, but it removes an easy attack path.

</details>

## Advanced

### Q6. A provider rejects a request with "tool result without a matching tool call". What happened?

**Style:** Debugging

<details>
<summary>Answer</summary>

A `ToolResponseMessage` was sent whose id does not answer a tool call in the preceding `AssistantMessage` — for example because history was trimmed between the call and its result, or a memory store dropped tool-call messages but kept results. Trim history only at turn boundaries and keep tool calls and results together (or drop both); `MessageWindowChatMemory` evicts whole turns for this reason.

</details>
