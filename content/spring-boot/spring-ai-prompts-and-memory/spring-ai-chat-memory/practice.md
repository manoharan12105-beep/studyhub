# Chat Memory: Stateless Models and Application-Managed History — Practice

### P1. Default window

**Difficulty:** Easy · **Type:** MCQ

What is the default maximum number of messages kept by `MessageWindowChatMemory`?

- A) 5
- B) 10
- C) 20
- D) Unlimited

<details>
<summary>Answer</summary>

**Answer:** C) 20

</details>

### P2. Which advisor?

**Difficulty:** Easy · **Type:** MCQ

Which advisor adds conversation history to the prompt as separate messages in Spring AI 2.0?

- A) `PromptChatMemoryAdvisor`
- B) `MessageChatMemoryAdvisor`
- C) `QuestionAnswerAdvisor`
- D) `SimpleLoggerAdvisor`

<details>
<summary>Answer</summary>

**Answer:** B) `MessageChatMemoryAdvisor`

**Explanation:** `PromptChatMemoryAdvisor` was removed in 2.0.

</details>

### P3. Predict the prompt

**Difficulty:** Medium · **Type:** Behavior

A client has `MessageChatMemoryAdvisor` over an empty memory and a default system message. Two calls with the same conversation id: "I like Kotlin." then "Which language do I like?". List the messages of the second request.

<details>
<summary>Answer</summary>

`SYSTEM` (default), `USER` "I like Kotlin.", `ASSISTANT` (the first reply), `USER` "Which language do I like?".

</details>

### P4. Fix the 2.0 code

**Difficulty:** Medium · **Type:** Debugging

```java
// Illustrative fragment
ChatClient client = ChatClient.builder(chatModel)
        .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
        .build();
String answer = client.prompt().user("Hello").call().content();
```

This throws at runtime in Spring AI 2.0. Why, and what is the fix?

<details>
<summary>Answer</summary>

No conversation id was supplied, and 2.0 has no default, so the advisor throws `IllegalArgumentException: conversationId cannot be null`. Add `.advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))` with an id derived from the user and session.

</details>

### P5. Memory vs history

**Difficulty:** Hard · **Type:** Design

A tutoring product must (1) keep the model focused on the current conversation, (2) show learners their complete past conversations, and (3) delete everything on request. Design the storage.

<details>
<summary>Answer</summary>

Use `MessageWindowChatMemory` over a persistent `ChatMemoryRepository` (for example JDBC) for the model's working set, keyed by `userId:conversationId`. Store the complete transcript in your own table (Spring Data entity with user id, conversation id, role, text, timestamp) written by the service after each exchange. Deletion removes both: `chatMemory.clear(conversationId)` (or deleting via the repository) and the transcript rows for that user.

</details>
