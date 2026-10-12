# Spring AI Versions and Compatibility (1.x vs 2.x) — Practice

### P1. Match the lines

**Difficulty:** Easy · **Type:** MCQ

A project uses Spring Boot 3.5. Which Spring AI version should it use?

- A) 2.0.1
- B) 1.1.x
- C) 2.1.0-M1
- D) Any version works with any Boot version

<details>
<summary>Answer</summary>

**Answer:** B) 1.1.x

</details>

### P2. Renamed module

**Difficulty:** Easy · **Type:** MCQ

Which artifact provides `QuestionAnswerAdvisor` in Spring AI 2.0?

- A) `spring-ai-advisors-vector-store`
- B) `spring-ai-vector-store-advisor`
- C) `spring-ai-rag`
- D) `spring-ai-starter-model-openai`

<details>
<summary>Answer</summary>

**Answer:** B) `spring-ai-vector-store-advisor`

**Explanation:** A is the 1.x name; `spring-ai-rag` holds `RetrievalAugmentationAdvisor` and the modular RAG components.

</details>

### P3. Find the 1.x code

**Difficulty:** Medium · **Type:** Code analysis

Which lines would not compile, or would fail, in a Spring AI 2.0 project?

```java
// Illustrative fragment
String id = ChatMemory.DEFAULT_CONVERSATION_ID;                              // 1
var options = ToolCallingChatOptions.builder()
        .internalToolExecutionEnabled(false).build();                       // 2
chatClient.prompt("Hi").options(OpenAiChatOptions.builder().temperature(0.3)) // 3
        .call().content();
var advisor = PromptChatMemoryAdvisor.builder(chatMemory).build();          // 4
```

<details>
<summary>Answer</summary>

Lines 1, 2 and 4 do not compile: `DEFAULT_CONVERSATION_ID`, `internalToolExecutionEnabled` and `PromptChatMemoryAdvisor` were removed in 2.0. Line 3 is correct 2.0 code — it passes an options builder.

</details>

### P4. Diagnose a dependency problem

**Difficulty:** Medium · **Type:** Debugging

`./mvnw dependency:tree -Dincludes=org.springframework.ai` shows `spring-ai-openai:2.0.1` and `spring-ai-client-chat:1.1.8`. How can that happen, and what do you change?

<details>
<summary>Answer</summary>

Some dependency declares an explicit Spring AI version (or another BOM imported earlier overrides the Spring AI BOM), so modules come from different releases. Remove explicit versions from Spring AI dependencies, import exactly one Spring AI BOM that matches the Boot line, and re-check the tree.

</details>

### P5. Upgrade plan

**Difficulty:** Hard · **Type:** Design

Your service uses Spring Boot 3.5, Spring AI 1.1, JDBC chat memory and two `@Tool` classes registered with `toolNames(...)`. Write an ordered upgrade checklist to Spring AI 2.0.

<details>
<summary>Answer</summary>

1. Upgrade Spring Boot to 4.x and fix Boot-level breakages (Jakarta EE 11, Jackson 3, removed Boot APIs).
2. Switch the Spring AI BOM to 2.0.x; rename modules (`spring-ai-vector-store-advisor` etc.).
3. Move properties to flat 2.0 names.
4. Replace `toolNames(...)` with `tools(new MyTools())` or `ToolCallback` beans; remove `internalToolExecutionEnabled`.
5. Pass `ChatMemory.CONVERSATION_ID` on every memory call; replace `PromptChatMemoryAdvisor`.
6. Add the `sequence_id` column to the JDBC chat-memory table as described in the upgrade notes.
7. Run unit tests, then the evaluation suite; review advisor ordering because memory now sits outside the tool loop by default.

</details>
