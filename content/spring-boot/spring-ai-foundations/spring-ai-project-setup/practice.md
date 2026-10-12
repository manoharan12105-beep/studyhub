# Project Setup: Spring Initializr, BOM and Starters — Practice

### P1. Missing piece

**Difficulty:** Easy · **Type:** MCQ

Maven reports `'dependencies.dependency.version' for org.springframework.ai:spring-ai-starter-model-openai:jar is missing`. What is missing?

- A) The OpenAI API key
- B) The Spring AI BOM import in `dependencyManagement`
- C) The `spring-boot-maven-plugin`
- D) An `@EnableAi` annotation

<details>
<summary>Answer</summary>

**Answer:** B) The Spring AI BOM import in `dependencyManagement`

</details>

### P2. Choose the module

**Difficulty:** Easy · **Type:** MCQ

Which dependency provides `RetrievalAugmentationAdvisor`?

- A) `spring-ai-vector-store-advisor`
- B) `spring-ai-rag`
- C) `spring-ai-starter-vector-store-pgvector`
- D) `spring-ai-pdf-document-reader`

<details>
<summary>Answer</summary>

**Answer:** B) `spring-ai-rag`

</details>

### P3. Trim the configuration

**Difficulty:** Medium · **Type:** Coding

An application uses only OpenAI chat and embeddings. Write the properties that disable the other OpenAI model types.

<details>
<summary>Answer</summary>

```properties
spring.ai.model.image=none
spring.ai.model.audio.speech=none
spring.ai.model.audio.transcription=none
spring.ai.model.moderation=none
```

</details>

### P4. Read the failure

**Difficulty:** Medium · **Type:** Debugging

After adding `spring-ai-starter-model-chat-memory-repository-jdbc`, startup fails: *"required a bean of type 'org.springframework.jdbc.core.JdbcTemplate' that could not be found"*. Explain and fix.

<details>
<summary>Answer</summary>

The JDBC chat-memory repository needs a `JdbcTemplate`, which Spring Boot only creates when a `DataSource` is configured. Add a database driver and `spring.datasource.*` properties (or an embedded database for development), or remove the starter if you do not need persistent memory.

</details>

### P5. Design the dependency set

**Difficulty:** Hard · **Type:** Design

Plan the dependencies for a service that (1) chats with a local Ollama model in development and OpenAI in production, (2) stores chat memory in PostgreSQL, and (3) exposes two tools to MCP clients. Also say how you avoid bean conflicts between the two model providers.

<details>
<summary>Answer</summary>

`spring-boot-starter-web`, `spring-ai-starter-model-ollama`, `spring-ai-starter-model-openai`, `spring-ai-starter-model-chat-memory-repository-jdbc` with the PostgreSQL driver, and `spring-ai-starter-mcp-server-webmvc`. Select the provider per profile: `application-dev.properties` sets `spring.ai.model.chat=ollama` and `spring.ai.model.embedding=ollama`; `application-prod.properties` sets both to `openai`. Only the selected provider's models are then auto-configured.

</details>
