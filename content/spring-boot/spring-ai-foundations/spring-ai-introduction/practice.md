# What Is Spring AI? — Practice

### P1. What Spring AI is

**Difficulty:** Easy · **Type:** MCQ

Which statement describes Spring AI correctly?

- A) A Java library for training neural networks
- B) An integration framework that connects Spring applications to AI models through portable abstractions
- C) A hosted AI model offered by the Spring team
- D) A replacement for Spring Boot in AI applications

<details>
<summary>Answer</summary>

**Answer:** B) An integration framework that connects Spring applications to AI models through portable abstractions

**Explanation:** Spring AI neither trains nor hosts models, and it builds on Spring Boot rather than replacing it.

</details>

### P2. Framework or provider?

**Difficulty:** Easy · **Type:** MCQ

A request fails because the prompt is longer than the model's context window. Which side defines that limit?

- A) Spring AI
- B) Spring Boot
- C) The model provider and the chosen model
- D) The JVM heap size

<details>
<summary>Answer</summary>

**Answer:** C) The model provider and the chosen model

**Explanation:** The context window is a property of the model. Spring AI only sends the prompt; trimming history or retrieved context is your application's job.

</details>

### P3. Pick the building block

**Difficulty:** Easy · **Type:** Conceptual

Match each need to a Spring AI building block: (a) remember the last ten messages of a chat, (b) answer questions from your company handbook, (c) let the model look up an order status in your database, (d) turn the reply into a `StudyPlan` record.

<details>
<summary>Answer</summary>

(a) `ChatMemory` with `MessageChatMemoryAdvisor`; (b) a `VectorStore` with embeddings and a RAG advisor such as `QuestionAnswerAdvisor`; (c) a `@Tool` method passed to `ChatClient.tools(...)`; (d) structured output with `.entity(StudyPlan.class)`.

</details>

### P4. When does the request leave the application?

**Difficulty:** Medium · **Type:** Behavior

```java
// Illustrative fragment
var spec = chatClient.prompt().user("Explain JVM memory");
var callSpec = spec.call();
String text = callSpec.content();
```

On which line is the HTTP request to the provider sent?

<details>
<summary>Answer</summary>

On the third line. `call()` only chooses the synchronous mode and returns a spec; the model is invoked when a terminal method such as `content()`, `chatResponse()` or `entity(...)` runs.

</details>

### P5. A portability claim

**Difficulty:** Medium · **Type:** Scenario

Your manager says: "We use Spring AI, so we can switch from one provider to another on Friday with no risk." Write a three-point reply.

<details>
<summary>Answer</summary>

1. The `ChatClient` code is portable, so the code change is small (starter, properties, possibly options classes).
2. Model behaviour is not portable: quality, formatting, tool-calling reliability, context window and cost change, so prompts may need tuning.
3. Run the evaluation and regression suite and a canary rollout before switching; keep the old provider configurable for rollback.

</details>
