# Project Setup: Spring Initializr, BOM and Starters

**Module:** Spring AI: Foundations · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Generate a Spring Boot 4.1 project with Spring AI from Spring Initializr.
- Read the resulting `pom.xml`: parent, Spring AI BOM, starters and optional modules.
- Choose the extra modules a feature needs (vector store, advisors, RAG, document readers, chat memory, MCP).
- Switch off model types you do not use so startup stays fast and quiet.

## Definition

A Spring AI project is an ordinary Spring Boot project with three additions: the **Spring AI BOM** in `dependencyManagement`, one or more **model starters** (for example `spring-ai-starter-model-openai`), and any **feature modules** the application needs (a vector store starter, `spring-ai-vector-store-advisor`, `spring-ai-rag`, document readers, a chat-memory repository).

## Why It Matters

Most setup problems are dependency problems: a missing module (`QuestionAnswerAdvisor` not found), a renamed 1.x module, two providers fighting over the same bean type, or a vector store starter without an embedding model. A clean `pom.xml` avoids all of them. Starter conventions are explained in [Spring Boot Starters and Maven](../../spring-boot-core/spring-boot-starters-and-maven/content.md).

## How It Works

1. **Spring Initializr** (start.spring.io or your IDE) lets you pick Spring Boot 4.1, Java 21 and AI dependencies such as *OpenAI*, *Ollama*, *Anthropic Claude* or *PGvector Vector Database*. It adds the BOM and the matching starters for you.
2. The **BOM** (`spring-ai-bom`) fixes the versions of all Spring AI modules; you declare starters without versions.
3. Each **starter** pulls the implementation, its client library and auto-configuration. On startup, auto-configuration creates beans (`ChatModel`, `ChatClient.Builder`, `EmbeddingModel`, `VectorStore`, `ChatMemory` …) based on what is on the classpath and in your properties.

## The Course Project's `pom.xml`

This is the project used by the [Practice Lab](../spring-ai-practice-lab/content.md) and the three projects in this course (`studyai`, package `com.example.studyai`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.1.1</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>studyai</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
        <spring-ai.version>2.0.1</spring-ai.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!-- Chat + embedding models from OpenAI -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-starter-model-openai</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.ai</groupId>
                <artifactId>spring-ai-bom</artifactId>
                <version>${spring-ai.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

## Adding Feature Modules

Add only what a feature uses. All of these are versioned by the BOM:

| Feature | Dependency | Brings |
|---------|------------|--------|
| Local models | `spring-ai-starter-model-ollama` | `OllamaChatModel`, `OllamaEmbeddingModel` |
| PostgreSQL vector store | `spring-ai-starter-vector-store-pgvector` | `PgVectorStore` (needs a DataSource and an `EmbeddingModel`) |
| `QuestionAnswerAdvisor`, `VectorStoreChatMemoryAdvisor` | `spring-ai-vector-store-advisor` | Advisors backed by a `VectorStore` |
| Modular RAG | `spring-ai-rag` | `RetrievalAugmentationAdvisor`, query transformers, retrievers |
| Persistent chat memory | `spring-ai-starter-model-chat-memory-repository-jdbc` | `JdbcChatMemoryRepository` |
| Read PDFs | `spring-ai-pdf-document-reader` | `PagePdfDocumentReader`, `ParagraphPdfDocumentReader` |
| Read Markdown | `spring-ai-markdown-document-reader` | `MarkdownDocumentReader` |
| Read Word, HTML and more | `spring-ai-tika-document-reader` | `TikaDocumentReader` |
| Consume MCP servers | `spring-ai-starter-mcp-client` | MCP clients and tool callbacks |
| Expose MCP tools | `spring-ai-starter-mcp-server-webmvc` | MCP server on Spring MVC |
| Testcontainers service connections | `spring-ai-spring-boot-testcontainers` | Connection details for AI services in tests |

For example, the document Q&A project adds:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-vector-store-pgvector</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-vector-store-advisor</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-pdf-document-reader</artifactId>
</dependency>
```

## Minimal Configuration

```properties
spring.application.name=studyai
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.model=gpt-5-mini
# Turn off model types this application does not use
spring.ai.model.image=none
spring.ai.model.audio.speech=none
spring.ai.model.audio.transcription=none
spring.ai.model.moderation=none
```

The OpenAI starter can create chat, embedding, image, speech, transcription and moderation models. Switching off unused types keeps startup lean and makes the active configuration obvious. Keep embedding enabled if you will add RAG.

## Example

Check which AI beans auto-configuration created. Run the application with this runner, then remove it.

```java
import java.util.Arrays;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class AiBeanReport {

    @Bean
    ApplicationRunner listAiBeans(ApplicationContext context) {
        return args -> Arrays.stream(context.getBeanDefinitionNames())
                .filter(name -> name.toLowerCase().contains("chat")
                        || name.toLowerCase().contains("embedding")
                        || name.toLowerCase().contains("vectorstore"))
                .sorted()
                .forEach(name -> System.out.println(name + " -> "
                        + context.getType(name).getSimpleName()));
    }
}
```

**Expected behaviour:** with the `pom.xml` and properties above (and `OPENAI_API_KEY` set), the list includes `chatClientBuilder -> DefaultChatClientBuilder`, `chatMemory -> MessageWindowChatMemory`, `openAiChatModel -> OpenAiChatModel` and `openAiEmbeddingModel -> OpenAiEmbeddingModel`, plus auto-configuration and `…Properties` beans whose names contain the same words. Beans for the model types set to `none` are absent; adding the pgvector starter adds `vectorStore -> PgVectorStore`. These names were checked in a Spring Boot 4.1.1 / Spring AI 2.0.1 context.

### Code walkthrough

- `ApplicationRunner` runs once after startup, so the context is fully built.
- Filtering bean names is a quick way to see what Boot created; the condition evaluation report (`--debug`) explains *why* each auto-configuration did or did not apply ([Debugging Startup and Configuration](../../debugging/debugging-startup-and-configuration/content.md)).

## Common Mistakes and Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Could not find artifact org.springframework.ai:...` with no version | BOM missing from `dependencyManagement` | Add the `spring-ai-bom` import |
| `QuestionAnswerAdvisor` cannot be resolved | Advisor module missing | Add `spring-ai-vector-store-advisor` |
| `RetrievalAugmentationAdvisor` cannot be resolved | RAG module missing | Add `spring-ai-rag` |
| "required a single bean, but 2 were found" for a model type | Two provider starters | Set `spring.ai.model.chat` / `spring.ai.model.embedding` |
| Vector store bean fails: no `EmbeddingModel` | Embedding disabled or no provider | Enable an embedding model |
| `JdbcTemplate` bean missing for JDBC chat memory | No DataSource configured | Add a database and `spring.datasource.*` properties |
| Startup fails with a credential error | API key not set | See [Configuration and Secrets](../spring-ai-configuration-and-secrets/content.md) |

## Production Considerations

- Keep the dependency set minimal; every starter adds auto-configuration, classpath scanning and sometimes network checks.
- Let the BOM manage versions and update it on a schedule, reading the upgrade notes each time.
- Add Actuator from the start: AI metrics are exported through Micrometer ([Observability](../../spring-ai-production/spring-ai-observability/content.md)).

## Common Interview Traps

- **"The BOM adds Spring AI to the project."** A BOM only manages versions; you still declare each starter.
- **"`spring-ai-starter-model-openai` gives me a vector store."** It gives models only; a vector store needs its own starter.
- **"Spring Initializr is required."** It is a convenience; a hand-written `pom.xml` with the BOM works the same.

## Key Takeaways

- Spring Boot parent + Spring AI BOM + model starter is the minimum.
- Add feature modules per feature: vector store starter, `spring-ai-vector-store-advisor`, `spring-ai-rag`, readers, memory repositories, MCP.
- Disable unused model types with `spring.ai.model.<type>=none`.

## Official References

- [Getting started: Initializr, repositories, BOM](https://docs.spring.io/spring-ai/reference/getting-started.html)
- [Retrieval Augmented Generation (module dependencies)](https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html)
- [ETL pipeline (document reader modules)](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html)
