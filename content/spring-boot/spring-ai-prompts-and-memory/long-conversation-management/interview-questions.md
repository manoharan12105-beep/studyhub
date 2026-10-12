# Long Conversations: Windows, Summaries and Context Limits — Interview Questions

## Beginner

### Q1. Why does a long chat get slower and more expensive over time?

**Style:** Why

<details>
<summary>Answer</summary>

The model is stateless, so the remembered history is resent as input tokens on every request. More history means more input tokens to pay for and process on each call, until the request hits the model's context window.

</details>

### Q2. What does `MessageWindowChatMemory` keep when it is full?

**Style:** Direct

<details>
<summary>Answer</summary>

All system messages plus the newest messages up to `maxMessages` (20 by default). It evicts whole turns from the oldest end — a turn starts at a user message — so it may keep slightly fewer than `maxMessages`.

</details>

## Intermediate

### Q3. Compare a sliding window with summarisation.

**Style:** Compare

<details>
<summary>Answer</summary>

A window is simple and has a predictable size but forgets early facts entirely. Summarisation replaces older turns with a short model-written summary, keeping key facts at low token cost, but it needs an extra model call and the summary can lose or distort details. They combine well: summary + window of recent turns.

</details>

### Q4. Users complain the assistant forgets their target role after a long chat. How do you fix it properly?

**Style:** Scenario

<details>
<summary>Answer</summary>

The fact was in an evicted turn. Durable facts should not depend on chat history: store them in the user's profile (or a structured preferences table) and add them to the system prompt each call. A summary of older turns is a second option for facts that are not part of a profile.

</details>

## Advanced

### Q5. Design the memory policy for a tutoring assistant whose sessions last two hours.

**Style:** Design

<details>
<summary>Answer</summary>

Measure tokens per turn first. Use `MessageWindowChatMemory` sized to recent context (for example 20–30 messages, at least one full tool turn), a background compaction that summarises older turns into one labelled summary message when the stored conversation crosses a threshold, and a learner profile (level, goals, weak topics) injected into the system prompt. Optionally add retrieval over past messages for "what did we say about X earlier?". Log input tokens per call, cap the total, and offer a "new session" action. Treat the summary as untrusted model output.

</details>
