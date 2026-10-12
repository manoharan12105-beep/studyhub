# Chat Memory Storage: In-Memory, JDBC and Redis

**Module:** Spring AI: Prompts and Conversations · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Separate the two layers of chat memory: `ChatMemory` (what to keep) and `ChatMemoryRepository` (where to store it).
- Choose between the in-memory, JDBC, Redis, Cassandra, Neo4j and MongoDB repositories.
- Configure the JDBC repository with Spring Boot, including schema initialisation and migrations.
- Avoid the two JDBC traps: the 36-character conversation id column and silently dropped tool messages.

## Definition

`ChatMemoryRepository` is the storage interface behind chat memory: `findConversationIds()`, `findByConversationId(id)`, `saveAll(id, messages)` and `deleteByConversationId(id)`. It only stores and loads messages. `ChatMemory` (by default `MessageWindowChatMemory`) sits on top and decides **which** messages to keep. Changing the repository changes durability and scaling, not the advisor or prompt code.

## Why It Matters

The default `InMemoryChatMemoryRepository` keeps conversations in a `ConcurrentHashMap` inside one JVM. A restart loses every conversation, and two instances behind a load balancer each see a different half of the conversation. Persistent storage fixes both problems, but every store has limits you must know before production.

## How It Works

1. Spring Boot auto-configures a `ChatMemory` bean (`MessageWindowChatMemory`, 20 messages) and a `ChatMemoryRepository` bean.
2. With no repository starter on the classpath, the repository is `InMemoryChatMemoryRepository`. If a repository starter is present (JDBC, Cassandra, Neo4j, Redis, MongoDB), its repository is used instead — no code change.
3. `MessageWindowChatMemory.add(id, messages)` loads the stored list, appends, trims to the window and calls `saveAll(id, keptMessages)`, which replaces the stored conversation.
4. The memory advisor reads with `chatMemory.get(id)` before the call and adds the new user and assistant messages after it.

| Repository | Starter | Durable | Shared across instances | Tool-call messages | Retention |
|------------|---------|---------|-------------------------|--------------------|-----------|
| `InMemoryChatMemoryRepository` | none (default) | No | No | Kept | Until restart |
| `JdbcChatMemoryRepository` | `spring-ai-starter-model-chat-memory-repository-jdbc` | Yes | Yes | Filtered out | Your own cleanup job |
| `RedisChatMemoryRepository` | `spring-ai-starter-model-chat-memory-repository-redis` | Yes (Redis persistence) | Yes | Kept | `time-to-live` |
| `CassandraChatMemoryRepository` | `spring-ai-starter-model-chat-memory-repository-cassandra` | Yes | Yes | Filtered out | `time-to-live` |
| `Neo4jChatMemoryRepository` | `spring-ai-starter-model-chat-memory-repository-neo4j` | Yes | Yes | Kept | Your own cleanup |
| `MongoChatMemoryRepository` | `spring-ai-starter-model-chat-memory-repository-mongodb` | Yes | Yes | Filtered out | Your own cleanup or a TTL index |

> [!NOTE]
> Separately from the repository, `MessageChatMemoryAdvisor` with its **default order** sits outside the tool loop and stores only the user message and the final assistant reply. Tool messages reach memory only when you order the advisor inside the loop (see [Chat Memory Advisors](../../spring-ai-tools-and-advisors/chat-memory-advisors/content.md)) or write them yourself — and then only the repositories marked "Kept" can hold them.

## JDBC Repository

Add the starter and a JDBC driver; Spring Boot provides the `DataSource` and `JdbcTemplate`:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-chat-memory-repository-jdbc</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
```

The 2.0.1 jar ships dialects and schema scripts for PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, HSQLDB, H2 and SQLite. This is the PostgreSQL script (`schema-postgresql.sql`) exactly as it appears in the jar:

```sql
CREATE TABLE IF NOT EXISTS SPRING_AI_CHAT_MEMORY (
    conversation_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL')),
    "timestamp" TIMESTAMP NOT NULL,
    sequence_id BIGINT NOT NULL
    );

CREATE INDEX IF NOT EXISTS SPRING_AI_CHAT_MEMORY_CONVERSATION_ID_TIMESTAMP_IDX
ON SPRING_AI_CHAT_MEMORY(conversation_id, "timestamp");

CREATE INDEX IF NOT EXISTS SPRING_AI_CHAT_MEMORY_CONVERSATION_ID_SEQUENCE_ID_IDX
ON SPRING_AI_CHAT_MEMORY(conversation_id, sequence_id);
```

Schema creation is controlled by one property:

```properties
# embedded (default): create the table only for embedded databases such as H2
# always: run the script on every start (CREATE ... IF NOT EXISTS)
# never: you own the table, for example through Flyway or Liquibase
spring.ai.chat.memory.repository.jdbc.initialize-schema=never
```

`spring.ai.chat.memory.repository.jdbc.schema` points to a custom script and `spring.ai.chat.memory.repository.jdbc.platform` overrides the detected platform name used in the default script path.

> [!IMPORTANT]
> **Upgrading from 1.x:** the 2.0 schema adds the `sequence_id` column that orders messages. An existing table needs a migration before the 2.0 repository can write to it — follow the steps in the upgrade notes.

### Message order and timestamps

Messages come back oldest first, ordered by `sequence_id`. Each message carries its creation time in metadata under `JdbcChatMemoryRepository.CONVERSATION_TS` as an `Instant`, useful for showing times in a chat UI.

## Redis Repository

`RedisChatMemoryRepository` needs Redis Stack (Redis Query Engine and RedisJSON). It stores each message as a JSON document, keeps tool messages, and supports expiry:

```properties
spring.ai.chat.memory.repository.redis.host=localhost
spring.ai.chat.memory.repository.redis.port=6379
spring.ai.chat.memory.repository.redis.time-to-live=30d
```

Redis suits short-lived, high-traffic conversations where expiry is the retention policy. Pick JDBC when the data must live beside your other relational data, with backups and SQL reporting you already have.

## Example

A Spring Boot application with `spring-ai-starter-model-chat-memory-repository-jdbc` and H2 on the classpath. Because H2 is an embedded database, the default `initialize-schema=embedded` creates the table. The runner stores a tool-calling exchange and then tries a long tenant-scoped id:

```java
package com.example.studyai.memory;

import java.util.List;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.ToolResponseMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class MemoryStorageCheck {

    @Bean
    ApplicationRunner memoryCheckRunner(ChatMemory chatMemory, ChatMemoryRepository repository) {
        return args -> {
            System.out.println("Repository: " + repository.getClass().getSimpleName());

            var toolCall = new AssistantMessage.ToolCall("call-1", "function", "getGrade", "{\"studentId\":\"s42\"}");
            chatMemory.add("asha:c-1", List.of(
                    new UserMessage("What grade did I get?"),
                    AssistantMessage.builder().content("").toolCalls(List.of(toolCall)).build(),
                    ToolResponseMessage.builder().responses(List.of(
                            new ToolResponseMessage.ToolResponse("call-1", "getGrade", "\"A\""))).build(),
                    new AssistantMessage("You got an A.")));
            List<Message> stored = repository.findByConversationId("asha:c-1");
            System.out.println("Stored: " + stored.stream().map(m -> m.getMessageType() + " " + m.getText()).toList());

            try {
                chatMemory.add("acme-tenant:asha:0f8fad5b-d9cb-469f-a165-70867728950e", new UserMessage("Hi"));
            } catch (RuntimeException e) {
                Throwable root = e;
                while (root.getCause() != null) {
                    root = root.getCause();
                }
                System.out.println("Long id: " + root.getMessage().lines().findFirst().orElse(""));
            }
        };
    }
}
```

**Output:**

```text
Repository: JdbcChatMemoryRepository
Stored: [USER What grade did I get?, ASSISTANT You got an A.]
Long id: Value too long for column "CONVERSATION_ID CHARACTER VARYING(36)": "'acme-tenant:asha:0f8fad5b-d9cb-469f-a165-70867728950e' (53)"; SQL statement:
```

### Code walkthrough

- Adding the JDBC starter replaced the in-memory repository with `JdbcChatMemoryRepository`; the runner's code did not change.
- Four messages went in, two came back: the assistant message with tool calls and the `ToolResponseMessage` were **silently filtered** on save. Cassandra and MongoDB behave the same. The documentation recommends the Spring AI Session project (with its JDBC session store) when every message type must be persisted.
- The 53-character id failed because the column is `VARCHAR(36)` — enough for a UUID, not for `tenant:user:uuid`. The same limit is in the PostgreSQL script above.
- The output was captured from a real run of this runner on Spring Boot 4.1.1 with H2; on PostgreSQL the error text is PostgreSQL's own ("value too long for type character varying(36)").

## Common Mistakes and Troubleshooting

- **`required a bean of type 'org.springframework.jdbc.core.JdbcTemplate'`** at startup: the JDBC memory starter is on the classpath but no `DataSource` is configured. Add a driver and `spring.datasource.*` settings, or remove the starter.
- **Table not created on PostgreSQL.** `initialize-schema` defaults to `embedded`, so a real database gets no table. Set `always` for a quick start, or create the table with a migration and set `never`.
- **Long conversation ids fail on insert.** Keep the stored key within 36 characters (for example a UUID that maps to `tenant:user` in your own table), or widen the column in your own migration and set `initialize-schema=never`.
- **Tool results "forgotten" after a restart.** JDBC, Cassandra and MongoDB drop tool messages on save; re-run the tool, or keep the facts in your own domain tables.
- **Using memory as the chat history UI.** The window holds only recent messages; keep the full transcript in your own table.

## Production Considerations

- **Retention:** JDBC has no expiry. Schedule a job that deletes old conversations (`deleteByConversationId`), or use Redis/Cassandra TTL. Apply the same rule to backups.
- **Personal data:** memory stores raw user text. Include it in data-export and deletion processes, and encrypt the database at rest.
- **Migrations:** own the schema with Flyway or Liquibase in production (`initialize-schema=never`), so upgrades such as the 2.0 `sequence_id` change are reviewed and versioned.
- **Load:** each call reads and rewrites a whole conversation window; a small window keeps both the database work and token cost down.

## Common Interview Traps

- **"Changing the repository changes the memory strategy."** No — the window is `ChatMemory`; the repository is only storage.
- **"JDBC memory keeps tool calls."** It filters them out on save in 2.0.1.
- **"Any id length works."** The bundled schemas use `VARCHAR(36)`.
- **"Schema is created automatically everywhere."** Only for embedded databases by default.

## Key Takeaways

- `ChatMemory` decides what to keep; `ChatMemoryRepository` decides where. Swapping the starter swaps the store.
- In-memory is for development and single-instance demos; JDBC, Redis, Cassandra, Neo4j and MongoDB persist and scale out.
- Know the JDBC limits: `VARCHAR(36)` ids, tool messages dropped, schema only for embedded databases, `sequence_id` migration from 1.x.
- Plan retention and deletion from day one.

## Official References

- [Chat Memory: Memory Storage](https://docs.spring.io/spring-ai/reference/api/chat-memory.html)
- [Upgrade notes: JDBC chat memory schema](https://docs.spring.io/spring-ai/reference/upgrade-notes.html)
- Related: [Chat Memory](../spring-ai-chat-memory/content.md) · [Conversation IDs and Session Isolation](../conversation-ids-and-isolation/content.md) · [Long Conversations](../long-conversation-management/content.md)
