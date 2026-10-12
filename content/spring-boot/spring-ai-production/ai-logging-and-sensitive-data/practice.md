# Logging AI Calls Without Leaking Sensitive Data — Practice

### P1. Default setting

**Difficulty:** Easy · **Type:** MCQ

What is the default of `spring.ai.chat.client.observations.log-prompt` in Spring AI 2.0.1?

- A) `true`
- B) `false`
- C) `true` in the `dev` profile only
- D) It depends on the provider

<details>
<summary>Answer</summary>

**Answer:** B) `false`

</details>

### P2. What may be logged?

**Difficulty:** Easy · **Type:** Conceptual

Sort into "log always", "log only redacted and on demand", "never log": token usage, user email, API key, retrieved document ids, the user's question, model name.

<details>
<summary>Answer</summary>

Log always: token usage, retrieved document ids, model name. Redacted and on demand: the user's question. Never: user email (use a pseudonymous id), API key.

</details>

### P3. Fix the regex

**Difficulty:** Medium · **Type:** Debugging

A redactor uses `[\w.+-]+@[\w-]+\.[\w.]+` for emails. For "Mail priya@example.com. Thanks" the log shows "Mail [email] Thanks". What went wrong and what is a better pattern?

<details>
<summary>Answer</summary>

`[\w.]+` at the end also matches the sentence's full stop, so the period is replaced too. Use `[\w.+-]+@[\w-]+(?:\.[\w-]+)+`, which requires each dot to be followed by a label. Test redaction patterns against real samples — they are easy to get subtly wrong.

</details>

### P4. Configure SimpleLoggerAdvisor

**Difficulty:** Medium · **Type:** Coding

Configure `SimpleLoggerAdvisor` to log only the finish reason and total tokens of responses, and the redacted user text of requests.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
SimpleLoggerAdvisor logger = SimpleLoggerAdvisor.builder()
        .requestToString(request -> Redactor.redact(request.prompt().getUserMessage().getText()))
        .responseToString(response -> "finish=" + response.getResult().getMetadata().getFinishReason()
                + " tokens=" + response.getMetadata().getUsage().getTotalTokens())
        .build();
```

Output appears at DEBUG for `org.springframework.ai.chat.client.advisor`.

</details>

### P5. Leak review

**Difficulty:** Hard · **Type:** Scenario

A security review finds customer messages in three places: application logs, a tracing backend and the vector store. Which settings or designs probably caused each, and what do you change?

<details>
<summary>Answer</summary>

Application logs: `SimpleLoggerAdvisor` at DEBUG in production, or code logging prompts/exception messages — remove or redact, lower log levels. Tracing: observation content options (`log-prompt`, `log-completion`, `include-content`) enabled — set to `false` and purge stored traces. Vector store: `VectorStoreChatMemoryAdvisor` or an ingestion job storing conversations — decide whether long-term memory is needed, add retention and deletion, and tenant filters. Then document the data flows and add a check in CI/configuration reviews.

</details>
