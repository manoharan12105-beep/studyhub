# Spring AI Versions and Compatibility (1.x vs 2.x)

**Module:** Spring AI: Foundations · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 and 1.1.8 · Spring Boot 4.1.1 and 3.5 · JDK 21

## Learning Objectives

- Match a Spring AI line to the Spring Boot line it supports.
- Set up a project on either line without mixing artifacts or APIs.
- Recognise the 1.x → 2.0 breaking changes most likely to appear in tutorials, code reviews and interviews.
- Decide which line to use for a new or existing project.

## Definition

Spring AI has two supported major lines. **Spring AI 2.x** is built on Spring Boot 4 and Spring Framework 7 (and therefore Jakarta EE 11 and Jackson 3). **Spring AI 1.x** is built on Spring Boot 3. A project must use the Spring AI line that matches its Spring Boot line; the two are not interchangeable.

| Spring AI | Supported Spring Boot | JSON library | Status in this course |
|-----------|----------------------|--------------|-----------------------|
| **2.0.x** (2.0.1 current) | 4.0.x and 4.1.x | Jackson 3 | **Primary — all lessons use it** |
| 1.1.x (1.1.8 current) | 3.4.x and 3.5.x | Jackson 2 | Covered in this compatibility guide |
| 2.1.0-M1 | — | — | Milestone (preview); not for production |

Both lines' jars are compiled for Java 17. This course uses **JDK 21** throughout, like the rest of the Spring Boot subject.

## Why It Matters

Most broken Spring AI projects come from mixing lines: a Boot 3 application with a 2.0 starter, or 2.0 code copied from a 1.x blog post. The 1.x → 2.0 upgrade also changed APIs that interviewers like to ask about — where the tool loop runs, why conversation ids are mandatory, and why `ChatClient.options(...)` takes a builder.

## How Version Management Works

You never write individual Spring AI versions. Import the **BOM** (bill of materials) once and declare starters without versions:

```xml
<!-- Primary line: Spring Boot 4.1 + Spring AI 2.0 -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.1.1</version>
    <relativePath/>
</parent>

<properties>
    <java.version>21</java.version>
    <spring-ai.version>2.0.1</spring-ai.version>
</properties>

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

<dependencies>
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-starter-model-openai</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-vector-store-advisor</artifactId>
    </dependency>
</dependencies>
```

The same project on the 1.x line:

```xml
<!-- Spring AI 1.1.x line: Spring Boot 3.5 + Spring AI 1.1 -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.16</version>
    <relativePath/>
</parent>

<properties>
    <java.version>21</java.version>
    <spring-ai.version>1.1.8</spring-ai.version>
</properties>

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

<dependencies>
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-starter-model-openai</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-advisors-vector-store</artifactId>
    </dependency>
</dependencies>
```

Use the current 3.5.x patch release of Spring Boot on the 1.x line (3.5.16 when this was checked). Released versions of both lines are on Maven Central — no extra repository is needed. Milestones and snapshots need the Spring milestone/snapshot repositories and are not for production.

## Breaking Changes from 1.x to 2.0

| Area | Spring AI 1.x | Spring AI 2.0 | Lesson |
|------|---------------|---------------|--------|
| Platform | Boot 3, Framework 6, Jackson 2 | Boot 4, Framework 7, Jackson 3 | this topic |
| Tool-calling loop | Inside each `ChatModel` | `ToolCallingAdvisor`, auto-registered by `ChatClient`; `ChatModel` no longer executes tools | [Tool-Calling Loop](../../spring-ai-tools-and-advisors/tool-calling-loop/content.md) |
| Opting out of the loop | `internalToolExecutionEnabled(false)` | Removed; use `AdvisorParams.toolCallingAdvisorAutoRegister(false)` or `spring.ai.chat.client.tool-calling.enabled=false` | same |
| Tools by bean name | `toolNames("myFunction")` resolved `Function` beans | Removed; register explicit `ToolCallback` beans or `@Tool` objects | [Registering Tools](../../spring-ai-tools-and-advisors/tool-registration-and-descriptions/content.md) |
| `ChatClient.tools(Consumer<ToolSpec>)` | Existed | Removed; `tools(Object...)` + `toolContext(Map)` | same |
| Per-call options | `.options(builtOptions)` | `.options(optionsBuilder)` — a builder, merged over defaults | [ChatClient fluent API](../../spring-ai-chat-client/chatclient-fluent-api/content.md) |
| Options objects | Mutable, `copy()` | Immutable, `mutate()` | [Architecture](../spring-ai-architecture/content.md) |
| Property names | `spring.ai.openai.chat.options.model` | `spring.ai.openai.chat.model` (flattened; old form deprecated) | [Configuration](../spring-ai-configuration-and-secrets/content.md) |
| Conversation id | Optional, default `"default"` | Required on every memory call; `DEFAULT_CONVERSATION_ID` and `.conversationId()` removed | [Conversation IDs](../../spring-ai-prompts-and-memory/conversation-ids-and-isolation/content.md) |
| `PromptChatMemoryAdvisor` | Existed | Removed; use `MessageChatMemoryAdvisor` | [Chat Memory Advisors](../../spring-ai-tools-and-advisors/chat-memory-advisors/content.md) |
| Memory advisor default order | `HIGHEST_PRECEDENCE + 1000` | `HIGHEST_PRECEDENCE + 200` (outside the tool loop) | [Advisor Ordering](../../spring-ai-tools-and-advisors/advisor-ordering-and-transformations/content.md) |
| QA advisor module | `spring-ai-advisors-vector-store` | `spring-ai-vector-store-advisor` | [QuestionAnswerAdvisor](../../spring-ai-tools-and-advisors/question-answer-advisor/content.md) |
| Structured output reliability | Converter only | `entity(Type.class, spec -> spec.validateSchema())`, `useProviderStructuredOutput()` | [Structured Output](../../spring-ai-chat-client/spring-ai-structured-output/content.md) |
| OpenAI module | Spring AI's own HTTP client | Official `openai-java` SDK under the hood; client-level retries | [Resilience](../../spring-ai-production/ai-resilience-and-provider-errors/content.md) |
| Removed modules | Azure OpenAI, OpenAI SDK, OCI GenAI modules … | Use `spring-ai-openai` for Azure/Foundry; OCI moved to Oracle's project | upgrade notes |
| JDBC chat memory schema | Timestamp ordering | New `sequence_id` column — migrate existing tables | [Memory Storage](../../spring-ai-prompts-and-memory/chat-memory-storage/content.md) |

## Choosing a Line

- **New project:** Spring Boot 4.1 + Spring AI 2.0. It is the current line and the documentation describes it.
- **Existing Boot 3 project:** stay on Spring AI 1.1.x until you upgrade Spring Boot; then upgrade Spring AI to 2.0 in the same change set (upgrade Boot first, then follow the Spring AI upgrade notes).
- **Never** combine a Boot 3 parent with the 2.0 BOM, or the reverse; and never pin individual Spring AI artifacts to different versions.

## Example

A quick self-check you can drop into either project to print the versions actually on the classpath:

```java
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.boot.SpringBootVersion;
import org.springframework.core.SpringVersion;

public class VersionReport {

    public static void main(String[] args) {
        System.out.println("Spring Boot:      " + SpringBootVersion.getVersion());
        System.out.println("Spring Framework: " + SpringVersion.getVersion());
        System.out.println("Spring AI:        " + ChatClient.class.getPackage().getImplementationVersion());
        System.out.println("Java:             " + Runtime.version().feature());
    }
}
```

**Output:**

```text
Spring Boot:      4.1.1
Spring Framework: 7.0.9
Spring AI:        2.0.1
Java:             21
```

This was captured in the course project (Spring Boot 4.1.1 with the Spring AI 2.0.1 BOM). If Spring AI prints `null`, the class came from a folder without a jar manifest; check `./mvnw dependency:tree -Dincludes=org.springframework.ai` instead.

### Code walkthrough

- `SpringBootVersion` and `SpringVersion` read the versions from the Boot and Framework jars.
- `getImplementationVersion()` reads the `Implementation-Version` entry of the jar that contains `ChatClient` (`spring-ai-client-chat`).
- A mismatch you can spot immediately: Spring Boot `3.x` with Spring AI `2.x`, or the reverse.

## Common Mistakes and Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `NoClassDefFoundError` or `NoSuchMethodError` naming Spring Framework, Spring Boot or Jackson classes at startup | Spring AI line does not match the Spring Boot line (Framework 7/Jackson 3 vs Framework 6/Jackson 2) | Align the Spring AI BOM with the Boot version |
| `Could not find artifact org.springframework.ai:spring-ai-advisors-vector-store` with the 2.0 BOM | 1.x artifact name | Use `spring-ai-vector-store-advisor` |
| `internalToolExecutionEnabled` does not compile | Removed in 2.0 | Use the `ToolCallingAdvisor` mechanisms |
| `ChatMemory.DEFAULT_CONVERSATION_ID` does not compile | Removed in 2.0 | Pass an explicit conversation id every call |
| `IllegalArgumentException: conversationId cannot be null` at runtime | 2.0 memory advisor called without `ChatMemory.CONVERSATION_ID` | Add `.advisors(a -> a.param(ChatMemory.CONVERSATION_ID, id))` |
| Properties seem ignored after upgrade | Still using `.options.` keys | Move to flat 2.0 property names |
| Mixed versions in `dependency:tree` | A starter declared with an explicit version | Remove explicit versions; let the BOM manage them |

## Production Considerations

- Upgrade on a branch, read the upgrade notes end to end, and run your evaluation suite: prompts, tool behaviour and memory ordering changed in 2.0.
- Pin the Spring AI version through the BOM property and upgrade deliberately; patch releases (2.0.0 → 2.0.1) contain fixes and occasional module renames listed in the upgrade notes.

## Common Interview Traps

- **"Spring AI 2.0 works with Spring Boot 3.5."** It requires Spring Boot 4.0.x or 4.1.x.
- **"The 1.x and 2.x APIs are the same, only the version changes."** Tool execution, memory ids, options and several modules changed.
- **"Snapshots are fine for production."** Only released versions belong in production builds.

## Key Takeaways

- Spring AI 2.0.x ↔ Spring Boot 4.0/4.1; Spring AI 1.1.x ↔ Spring Boot 3.4/3.5.
- Import the BOM and let it manage every Spring AI artifact version.
- Know the headline 2.0 changes: tool loop in `ToolCallingAdvisor`, required conversation ids, builder-based options, flattened properties, renamed and removed modules.

## Official References

- [Getting started: supported Spring Boot versions, BOM, repositories](https://docs.spring.io/spring-ai/reference/getting-started.html)
- [Upgrade notes (1.1.x → 2.0.0 and 2.0.1)](https://docs.spring.io/spring-ai/reference/upgrade-notes.html)
- [Spring AI 1.1 reference](https://docs.spring.io/spring-ai/reference/1.1/index.html)
