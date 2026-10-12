# Chat Memory Advisors — Practice

### P1. Predict the stored messages

**Difficulty:** Easy · **Type:** Behavior

`MessageChatMemoryAdvisor` with its default order and an in-memory `ChatMemory`. The model calls one tool and then answers. Which message types are stored?

<details>
<summary>Answer</summary>

`[USER, ASSISTANT]` — only the question and the final answer; the advisor runs outside the tool loop.

</details>

### P2. Inside the loop

**Difficulty:** Medium · **Type:** Behavior

Same as P1, but the advisor is built with `.order(BaseAdvisor.HIGHEST_PRECEDENCE + 400)`. Which message types are stored?

<details>
<summary>Answer</summary>

`[USER, ASSISTANT, TOOL, ASSISTANT]` — the question, the assistant's tool-call message, the tool result and the final answer.

</details>

### P3. Where does vector memory go?

**Difficulty:** Easy · **Type:** MCQ

Where does `VectorStoreChatMemoryAdvisor` put retrieved memory?

- A) As separate `USER` and `ASSISTANT` messages before the question
- B) Inside the system message, under `LONG_TERM_MEMORY`
- C) Appended to the user message
- D) In `ToolContext`

<details>
<summary>Answer</summary>

**Answer:** B) Inside the system message, under `LONG_TERM_MEMORY`

</details>

### P4. Configure it

**Difficulty:** Medium · **Type:** Coding

Build a `ChatClient` that uses vector-store memory with the five most relevant earlier messages, and send one question for conversation `"asha"`.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
ChatClient client = ChatClient.builder(chatModel)
        .defaultAdvisors(VectorStoreChatMemoryAdvisor.builder(vectorStore).defaultTopK(5).build())
        .build();

String answer = client.prompt().user("When is my Java exam?")
        .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, "asha"))
        .call().content();
```

The top-K can also be set per request with the advisor parameter `VectorStoreChatMemoryAdvisor.TOP_K`.

</details>

### P5. Recent context lost

**Difficulty:** Hard · **Type:** Scenario

A team replaced `MessageChatMemoryAdvisor` with `VectorStoreChatMemoryAdvisor` "to support long conversations". Now "Can you explain that again?" gets unrelated answers. Explain and propose a fix.

<details>
<summary>Answer</summary>

Vector memory retrieves by similarity to the new question; "that" has little semantic content, so the most recent exchange may not be retrieved, and entries are not in time order. Use both: a small `MessageChatMemoryAdvisor` window for recent turns, plus vector memory (or summaries) for long-term facts — making sure the two do not double-store the same content without reason, and measuring the extra tokens.

</details>
