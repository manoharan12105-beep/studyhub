# Spring AI Versions and Compatibility (1.x vs 2.x) — Interview Questions

## Beginner

### Q1. Which Spring Boot versions does each Spring AI line support?

**Style:** Direct

<details>
<summary>Answer</summary>

Spring AI 2.0.x supports Spring Boot 4.0.x and 4.1.x (Spring Framework 7, Jackson 3). Spring AI 1.1.x supports Spring Boot 3.4.x and 3.5.x (Spring Framework 6, Jackson 2). Use the line that matches your Boot version.

</details>

### Q2. Why import the Spring AI BOM instead of writing versions on each dependency?

**Style:** Why

<details>
<summary>Answer</summary>

The BOM fixes compatible versions for every Spring AI module, starter and some third-party libraries in one place. Starters can be declared without versions, upgrades change one property, and you avoid mixing artifacts from different releases.

</details>

## Intermediate

### Q3. Name four breaking changes between Spring AI 1.x and 2.0.

**Style:** Direct

<details>
<summary>Answer</summary>

Any four of: the tool-calling loop moved from each `ChatModel` into the auto-registered `ToolCallingAdvisor` (and `internalToolExecutionEnabled` was removed); conversation ids became mandatory for memory advisors (`DEFAULT_CONVERSATION_ID` removed); `PromptChatMemoryAdvisor` was removed; `ChatClient.options(...)` takes a builder; options became immutable (`mutate()` replaces `copy()`); properties were flattened (`spring.ai.openai.chat.model`); `spring-ai-advisors-vector-store` was renamed `spring-ai-vector-store-advisor`; tool resolution by bean name (`toolNames`) was removed; the platform moved to Boot 4/Jackson 3.

</details>

### Q4. A colleague's 2.0 application throws `IllegalArgumentException: conversationId cannot be null`. The same code worked in 1.x. Explain.

**Style:** Debugging

<details>
<summary>Answer</summary>

In 1.x memory advisors fell back to a default conversation id. In 2.0 the id is required: every call through `MessageChatMemoryAdvisor` (or `VectorStoreChatMemoryAdvisor`) must pass `ChatMemory.CONVERSATION_ID` in the advisor context, and a missing value throws. Add `.advisors(a -> a.param(ChatMemory.CONVERSATION_ID, id))` with an id derived from the user or session.

</details>

### Q5. How would you upgrade a Spring Boot 3.5 + Spring AI 1.1 service to the 2.0 line?

**Style:** How

<details>
<summary>Answer</summary>

Upgrade Spring Boot to 4.x first (Jakarta EE 11, Jackson 3 and other Boot 4 changes), then switch the Spring AI BOM to 2.0.x in the same change set. Work through the upgrade notes: rename modules, move to flat properties, replace removed APIs (`internalToolExecutionEnabled`, `PromptChatMemoryAdvisor`, `toolNames`), pass conversation ids, migrate the JDBC chat-memory schema (`sequence_id`). Then run unit tests and the AI evaluation suite, because tool and memory behaviour also changed.

</details>

## Advanced

### Q6. Why did Spring AI 2.0 move tool execution into an advisor?

**Style:** Why

<details>
<summary>Answer</summary>

With the loop hidden inside every `ChatModel`, memory, logging, retries and custom logic could not see or influence individual iterations, and each provider implemented the loop separately. As an advisor, the loop is a composable part of the chain: advisor order decides whether memory or other advisors run once per request or once per iteration, custom `ToolAdvisor`s can add approval gates or budgets, and observability covers it uniformly.

</details>

### Q7. Is it acceptable to use a Spring AI milestone in production?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Generally no. Milestones and snapshots can change APIs before release and receive no support guarantees. Use released versions from Maven Central; evaluate milestones in a branch if you need a feature early, and plan the upgrade for the GA release.

</details>
