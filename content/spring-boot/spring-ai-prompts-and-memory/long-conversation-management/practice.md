# Long Conversations: Windows, Summaries and Context Limits — Practice

### P1. Predict the window

**Difficulty:** Easy · **Type:** Behavior

A `MessageWindowChatMemory` with `maxMessages(5)` holds a system message, then four turns (Q1/A1 … Q4/A4) are added. Which messages remain?

<details>
<summary>Answer</summary>

`SYSTEM`, `Q3`, `A3`, `Q4`, `A4`. The system message is preserved and counts towards the five.

</details>

### P2. Upper bound

**Difficulty:** Easy · **Type:** MCQ

Why can `MessageWindowChatMemory` keep fewer messages than `maxMessages`?

- A) It drops assistant messages first
- B) It evicts whole turns, moving the cut forward to the next user message
- C) It compresses messages
- D) It removes system messages first

<details>
<summary>Answer</summary>

**Answer:** B) It evicts whole turns, moving the cut forward to the next user message

</details>

### P3. Budget estimate

**Difficulty:** Medium · **Type:** Conceptual

A system prompt is 300 tokens, the window holds 20 messages of about 80 tokens each, and the new question is 40 tokens. Roughly how many input tokens does each call use, and what is the simplest way to halve the history cost?

<details>
<summary>Answer</summary>

300 + 20 × 80 + 40 = 1,940 tokens. Halving the window to 10 messages cuts the history from 1,600 to 800 tokens (total about 1,140); a summary of older turns can preserve key facts while doing so.

</details>

### P4. Write the compaction trigger

**Difficulty:** Medium · **Type:** Coding

Write a method that compacts a conversation only when it has more than 16 stored messages, keeping the newest 6, using the `compact(repository, id, summarizer, keepRecent)` method from the lesson.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
void compactIfLong(ChatMemoryRepository repository, String conversationId, ChatClient summarizer) {
    if (repository.findByConversationId(conversationId).size() > 16) {
        compact(repository, conversationId, summarizer, 6);
    }
}
```

Call it after the response is returned (for example from an `@Async` method or an event listener) so the user does not wait for the summarising call.

</details>

### P5. Diagnose the failure

**Difficulty:** Hard · **Type:** Scenario

After a release, long support chats start failing with a provider error about the maximum context length. The team had replaced `MessageWindowChatMemory` with a custom `ChatMemory` that "keeps everything for audit". What went wrong and how do you fix it?

<details>
<summary>Answer</summary>

The custom memory sends the full history on every call, so long chats exceed the context window (and cost grew long before that). Separate the two concerns: keep the full transcript in an audit table written by the service, and give the model a bounded window (optionally with a summary). Add a test or alert on input-token count per call.

</details>
