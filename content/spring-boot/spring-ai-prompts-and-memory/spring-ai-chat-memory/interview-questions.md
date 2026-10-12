# Chat Memory: Stateless Models and Application-Managed History — Interview Questions

## Beginner

### Q1. Do chat models remember previous requests?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Each request is independent; the model sees only the messages in that request. Conversation continuity comes from the application resending earlier messages — chat memory.

</details>

### Q2. What do `ChatMemory`, `ChatMemoryRepository` and `MessageChatMemoryAdvisor` do?

**Style:** Direct

<details>
<summary>Answer</summary>

`ChatMemory` is the policy deciding which messages to keep (default `MessageWindowChatMemory`, last 20 messages). `ChatMemoryRepository` stores and loads messages (in-memory by default; JDBC, Redis, Cassandra, Neo4j, MongoDB available). `MessageChatMemoryAdvisor` loads the conversation's messages into the prompt before the call and stores the new user and assistant messages after it.

</details>

## Intermediate

### Q3. What is the difference between chat memory and chat history?

**Style:** Comparison

<details>
<summary>Answer</summary>

Chat memory is the bounded working set of messages sent to the model to keep context; it intentionally drops old messages. Chat history is the complete record of every message, for auditing, display or analytics. Spring AI's `ChatMemory` is designed for memory; full history should be stored separately, for example with Spring Data.

</details>

### Q4. How does `MessageWindowChatMemory` decide what to drop?

**Style:** How

<details>
<summary>Answer</summary>

When the number of messages exceeds `maxMessages`, it evicts the oldest ones, always preserving system messages (a new system message replaces older ones). In 2.0 it evicts whole turns — from a user message through the assistant replies and tool messages that follow — so the kept window never starts in the middle of a turn. The actual count can therefore be below the maximum.

</details>

### Q5. What happens if you forget the conversation id in Spring AI 2.0?

**Style:** What happens if

<details>
<summary>Answer</summary>

The memory advisor throws `IllegalArgumentException: conversationId cannot be null`. The 1.x default conversation id and the builder's `.conversationId()` were removed, so every call must pass `ChatMemory.CONVERSATION_ID` as an advisor parameter.

</details>

## Advanced

### Q6. How would you implement memory when calling `ChatModel` directly?

**Style:** How

<details>
<summary>Answer</summary>

Add the user message to `ChatMemory`, call the model with `new Prompt(chatMemory.get(id))` (plus a system message if needed), then add the response's `AssistantMessage` to memory. This is exactly what the advisor automates; doing it by hand gives full control, for example to skip storing certain messages.

</details>

### Q7. What privacy questions does chat memory raise?

**Style:** Scenario

<details>
<summary>Answer</summary>

Stored messages may contain personal or confidential data. Decide retention periods, encryption at rest, who can read stored conversations, how users delete them, whether memory may be shared across devices, and which provider receives the resent history. Isolation by conversation id is essential so one user's messages never reach another user's prompt.

</details>
