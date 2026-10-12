# Chat Memory Storage: In-Memory, JDBC and Redis — Interview Questions

## Beginner

### Q1. What is the difference between `ChatMemory` and `ChatMemoryRepository`?

**Style:** Compare

<details>
<summary>Answer</summary>

`ChatMemory` is the strategy that decides which messages to keep (by default `MessageWindowChatMemory`, the last 20 messages). `ChatMemoryRepository` only stores and loads messages per conversation id (in-memory, JDBC, Redis, Cassandra, Neo4j, MongoDB). You can change one without the other.

</details>

### Q2. Why is the default in-memory repository not enough for production?

**Style:** Why

<details>
<summary>Answer</summary>

It lives in one JVM's heap: a restart or deployment loses every conversation, and with several instances behind a load balancer each instance sees only the requests routed to it, so conversations break apart. It also grows without a retention limit on the number of conversations.

</details>

## Intermediate

### Q3. How do you switch from in-memory to JDBC chat memory in Spring Boot?

**Style:** How

<details>
<summary>Answer</summary>

Add `spring-ai-starter-model-chat-memory-repository-jdbc` and a JDBC driver with `spring.datasource.*` settings. Auto-configuration then provides `JdbcChatMemoryRepository`, and the auto-configured `ChatMemory` uses it. For a non-embedded database, create the table (set `spring.ai.chat.memory.repository.jdbc.initialize-schema=always` or, better, a Flyway migration with `never`). No advisor or service code changes.

</details>

### Q4. Your assistant uses tools and JDBC chat memory. What is stored?

**Style:** Trap

<details>
<summary>Answer</summary>

Only user, assistant (without tool calls) and system messages. `JdbcChatMemoryRepository` silently filters assistant messages that contain tool calls and `ToolResponseMessage`s on save (Cassandra and MongoDB too). With its default order, `MessageChatMemoryAdvisor` sits outside the tool loop and never sees those messages anyway; ordering it inside the loop only helps with a repository that keeps tool messages (in-memory, Redis, Neo4j). If tool exchanges must be persisted, use the Spring AI Session project or store the facts in your own tables.

</details>

### Q5. Inserts start failing after you add a tenant prefix to conversation ids. Why?

**Style:** Debug

<details>
<summary>Answer</summary>

The bundled JDBC schemas define `conversation_id VARCHAR(36)`. `tenant:user:uuid` is longer than 36 characters, so the database rejects it ("value too long"). Either keep the key within 36 characters (a UUID mapped to tenant and user in your own table) or widen the column in your own migration and disable schema initialisation.

</details>

## Advanced

### Q6. Design chat memory storage for a SaaS assistant running on six instances with a 90-day retention rule.

**Style:** Design

<details>
<summary>Answer</summary>

A shared store is required, so not in-memory. Option one: PostgreSQL with `JdbcChatMemoryRepository`, schema owned by Flyway (`initialize-schema=never`), conversation ids that fit the column (or a widened column), a nightly job deleting conversations older than 90 days, and the database encrypted and backed up. Option two: Redis Stack with `spring.ai.chat.memory.repository.redis.time-to-live=90d`, which handles expiry and keeps tool messages, but needs Redis persistence configured if losing memory on a Redis restart is unacceptable. In both cases `MessageWindowChatMemory` bounds what is sent to the model, the full transcript (if needed) lives in a separate domain table, and deletion requests remove both.

</details>
