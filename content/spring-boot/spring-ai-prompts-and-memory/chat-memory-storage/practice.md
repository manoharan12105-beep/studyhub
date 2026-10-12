# Chat Memory Storage: In-Memory, JDBC and Redis — Practice

### P1. Default repository

**Difficulty:** Easy · **Type:** MCQ

With no chat memory repository starter on the classpath, which repository does Spring Boot auto-configure?

- A) `JdbcChatMemoryRepository` with H2
- B) `InMemoryChatMemoryRepository`
- C) None — you must define one
- D) `RedisChatMemoryRepository`

<details>
<summary>Answer</summary>

**Answer:** B) `InMemoryChatMemoryRepository`

</details>

### P2. Schema initialisation

**Difficulty:** Easy · **Type:** MCQ

What is the default value of `spring.ai.chat.memory.repository.jdbc.initialize-schema`?

- A) `always`
- B) `never`
- C) `embedded`
- D) `create-drop`

<details>
<summary>Answer</summary>

**Answer:** C) `embedded`

**Explanation:** The table is created automatically only for embedded databases such as H2. For PostgreSQL, create it with a migration or set `always`.

</details>

### P3. Predict what is stored

**Difficulty:** Medium · **Type:** Behavior

With `JdbcChatMemoryRepository`, you add four messages to conversation `c-1`: a user question, an assistant message with a tool call, a tool response, and the final assistant answer. What does `findByConversationId("c-1")` return?

<details>
<summary>Answer</summary>

Two messages: the user question and the final assistant answer. The assistant message with tool calls and the tool response are filtered out on save.

</details>

### P4. Startup failure

**Difficulty:** Medium · **Type:** Debugging

After adding `spring-ai-starter-model-chat-memory-repository-jdbc`, the application fails with "required a bean of type 'org.springframework.jdbc.core.JdbcTemplate' that could not be found". What is missing?

<details>
<summary>Answer</summary>

A `DataSource`: there is no JDBC driver or `spring.datasource.*` configuration (or DataSource auto-configuration was excluded), so Spring Boot creates no `JdbcTemplate`. Add the driver and connection settings, or remove the starter if persistence is not wanted.

</details>

### P5. Choose a store

**Difficulty:** Hard · **Type:** Scenario

A support chatbot runs on three instances. Conversations matter for 24 hours, tool results must be visible after an instance restart, and the team already operates Redis Stack. Choose a repository and the key settings.

<details>
<summary>Answer</summary>

`RedisChatMemoryRepository` via `spring-ai-starter-model-chat-memory-repository-redis`: shared by all instances, keeps tool-call messages (which JDBC would drop), and expires data with `spring.ai.chat.memory.repository.redis.time-to-live=24h`. Configure Redis persistence so a Redis restart does not lose active conversations, and order `MessageChatMemoryAdvisor` inside the tool loop (an order greater than `ToolCallingAdvisor`'s `HIGHEST_PRECEDENCE + 300`) — with its default order it stores only the user message and final reply.

</details>
