# What Is Spring AI?

**Module:** Spring AI: Foundations · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain what Spring AI is in one sentence and what problem it solves for a Spring developer.
- Place Spring AI in the Spring ecosystem next to Spring Boot, Spring Data and Spring Security.
- Name the main building blocks the rest of this module teaches: models, `ChatClient`, prompts, advisors, tools, vector stores and observability.
- Distinguish what the framework does from what the model provider does.

## Definition

**Spring AI** is a Spring project that lets a Java application talk to AI models (chat, embedding, image, audio and moderation models) through **portable Spring abstractions**, with Spring Boot auto-configuration, configuration properties, observability and testing support. You write `chatClient.prompt().user(question).call().content()`; Spring AI turns it into the HTTP request that OpenAI, Anthropic, Ollama, Google Gemini or another provider expects, and turns the reply back into Java objects.

## Why It Matters

Calling an AI model is "just an HTTP call", but a real feature needs much more around that call:

| Need | Without a framework | With Spring AI |
|------|---------------------|----------------|
| Talk to a provider | Hand-written HTTP client per provider | `ChatModel` implementation picked by a starter |
| Build prompts | String concatenation | `ChatClient` fluent API, `PromptTemplate`, message roles |
| Map the reply to a Java type | Parse JSON yourself | `.entity(StudyPlan.class)` |
| Remember a conversation | Store and resend history yourself | `ChatMemory` + `MessageChatMemoryAdvisor` |
| Let the model call your code | Implement the tool protocol | `@Tool` methods and the tool-calling loop |
| Answer from your documents | Embed, store, search, stuff the prompt | `VectorStore` + `QuestionAnswerAdvisor` |
| See latency, tokens and errors | Custom metrics | Micrometer observations out of the box |

The value is the same as Spring Data for databases: a familiar programming model, swappable implementations and production concerns handled consistently.

## Where Spring AI Fits in the Spring Ecosystem

```text
┌──────────────────────────── Your Spring Boot application ────────────────────────────┐
│  @RestController ──► @Service ──► ChatClient ──► advisors ──► ChatModel ──► HTTP ──────────► Provider API
│                                     │                            ▲                         (OpenAI, Anthropic,
│                                     ├── tools (@Tool methods) ───┘                          Ollama, Gemini …)
│                                     ├── ChatMemory (JDBC, Redis, in-memory)
│                                     └── VectorStore (pgvector, Redis, …) ◄── EmbeddingModel
│  Spring Boot: auto-configuration, properties, Actuator, Micrometer, testing
└───────────────────────────────────────────────────────────────────────────────────────┘
```

Spring AI is **not** a model and it does not host one. It is an integration layer that lives inside your application, exactly like Spring Data JPA lives between your code and the database. It reuses Spring Boot for everything around the model call:

- **Auto-configuration** creates a `ChatModel` bean and a `ChatClient.Builder` bean when a model starter is on the classpath ([Auto-Configuration](../../spring-boot-core/auto-configuration/content.md)).
- **Externalized configuration** holds the API key, model name and options (`spring.ai.openai.api-key`, `spring.ai.openai.chat.model`) ([Externalized Configuration](../../spring-boot-core/externalized-configuration/content.md)).
- **Micrometer** records observations for chat calls, advisors, tools, embeddings and vector stores ([Actuator and Monitoring](../../production/actuator-and-monitoring/content.md)).

## The Building Blocks

| Building block | What it is | Taught in |
|----------------|-----------|-----------|
| `ChatModel`, `EmbeddingModel`, `ImageModel` … | Provider-neutral interfaces for each model type | [Architecture](../spring-ai-architecture/content.md) |
| `ChatClient` | Fluent API on top of `ChatModel` that most application code uses | [ChatClient fluent API](../../spring-ai-chat-client/chatclient-fluent-api/content.md) |
| `Prompt`, `Message`, `PromptTemplate` | The request: role-tagged messages plus options | [Messages and roles](../../spring-ai-chat-client/spring-ai-messages-and-roles/content.md) |
| Structured output | Map the reply to records and lists | [Structured output](../../spring-ai-chat-client/spring-ai-structured-output/content.md) |
| Advisors | Interceptors around a `ChatClient` call (memory, RAG, logging, safety) | [Advisors API](../../spring-ai-tools-and-advisors/spring-ai-advisors-api/content.md) |
| Tools | Java methods the model may ask your application to run | [Tool calling](../../spring-ai-tools-and-advisors/tool-calling-fundamentals/content.md) |
| `ChatMemory` | Stores recent messages per conversation | [Chat memory](../../spring-ai-prompts-and-memory/spring-ai-chat-memory/content.md) |
| `VectorStore`, ETL readers and splitters | Store and search document embeddings for RAG | [Embeddings and RAG module](../../spring-ai-rag/rag-architecture/content.md) |
| Observability, evaluators | Metrics, traces and quality checks | [Production module](../../spring-ai-production/spring-ai-observability/content.md) |

## Framework vs Provider

Interviewers like this distinction because it shows you know where a bug lives.

| Spring AI (the framework) provides | The model provider provides |
|------------------------------------|-----------------------------|
| Java interfaces, builders, auto-configuration | The model itself and its quality |
| Prompt construction, templates, message roles | Context window size, token pricing, rate limits |
| Tool-calling loop, advisors, memory, RAG plumbing | Whether a model supports tools, images, JSON schema output |
| Structured-output conversion and validation retries | Which options exist (`reasoning effort`, `seed`, …) |
| Observability and error mapping | Latency, availability, content policy |

A capability exists only when **both** sides support it. Spring AI can send an image, but only a vision-capable model can read it; Spring AI can request native JSON-schema output, but only some models enforce it.

## How a Call Flows

1. Your service calls `chatClient.prompt().user(...).call().content()`.
2. `ChatClient` builds a `Prompt` (messages + options) and passes it through the **advisor chain** (memory, retrieval, logging, the tool-calling advisor).
3. The last step calls `ChatModel.call(prompt)`; the provider-specific implementation (for example `OpenAiChatModel`) sends the HTTP request.
4. The reply comes back as a `ChatResponse` (generations, token usage, finish reason) and travels back through the advisors.
5. `ChatClient` returns what you asked for: a `String`, the full `ChatResponse`, or a mapped entity.

## Example

The smallest useful Spring AI code is a service that receives a `ChatClient.Builder` from auto-configuration:

```java
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
class ConceptExplainer {

    private final ChatClient chatClient;

    ConceptExplainer(ChatClient.Builder builder) {
        this.chatClient = builder
                .defaultSystem("You explain Java concepts to beginners in at most three sentences.")
                .build();
    }

    String explain(String concept) {
        return chatClient.prompt()
                .user("Explain: " + concept)
                .call()
                .content();
    }
}
```

### Code walkthrough

- `ChatClient.Builder` is injected because a model starter (for example `spring-ai-starter-model-openai`) auto-configures one. You never write HTTP code.
- `defaultSystem(...)` sets an instruction sent with every request from this client.
- `prompt()` starts a request, `user(...)` adds the user message, `call()` chooses the blocking mode and `content()` executes the call and returns the reply text.

**Expected behaviour:** `explain("dependency injection")` returns a short, model-written explanation. The exact wording differs between runs and models; your code only depends on getting a `String` back. The [Practice Lab](../spring-ai-practice-lab/content.md) shows how to run this kind of code offline with a scripted model, and [Your First Spring AI Application](../first-spring-ai-application/content.md) wires it to a real provider.

## Common Mistakes and Troubleshooting

- **Treating Spring AI as the model.** Answer quality, cost and latency come from the provider and model you choose; Spring AI changes how you integrate, not what the model knows.
- **Expecting identical output every run.** Models are probabilistic. Test the structure and the handling around the call, not exact sentences ([Testing AI services](../../spring-ai-production/testing-ai-services/content.md)).
- **Mixing major versions.** Spring AI 2.x needs Spring Boot 4.x; Spring AI 1.x needs Spring Boot 3.4/3.5. See [Versions and Compatibility](../spring-ai-versions-and-compatibility/content.md).
- **Following an old blog post.** Several APIs changed between 1.0 and 2.0 (`PromptChatMemoryAdvisor` was removed, `.options()` now takes a builder). Check the version a tutorial targets.

## Production Considerations

- Every call costs money (tokens) and adds latency measured in seconds, not milliseconds. Design for timeouts, retries and caching from the start.
- Model output is untrusted input to the rest of your system: validate it before acting on it.
- Prompts may contain personal data; decide what you log and which provider is allowed to receive it.

## Common Interview Traps

- **"Spring AI is a Java machine-learning library."** It does not train models; it integrates application code with hosted or local models.
- **"Spring AI only supports OpenAI."** It ships implementations for many providers (OpenAI, Anthropic, Ollama, Google GenAI, Mistral, Amazon Bedrock and more) behind the same interfaces.
- **"Switching provider is free."** The interfaces are portable, but prompts, model options, token limits and quality are provider-specific; switching still needs evaluation.

## Key Takeaways

- Spring AI is an integration framework: portable interfaces (`ChatModel`, `EmbeddingModel`, `VectorStore`) plus the high-level `ChatClient`.
- It brings Spring Boot's strengths (auto-configuration, properties, observability, testing) to AI features.
- Separate framework responsibilities from provider capabilities when designing and debugging.

## Official References

- [Spring AI reference overview](https://docs.spring.io/spring-ai/reference/)
- [AI concepts](https://docs.spring.io/spring-ai/reference/concepts.html)
- [Getting started](https://docs.spring.io/spring-ai/reference/getting-started.html)
