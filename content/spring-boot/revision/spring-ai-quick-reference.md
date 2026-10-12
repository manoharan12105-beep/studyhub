# Spring AI Quick Reference

One-screen reference for Spring AI 2.0.1 on Spring Boot 4.1.1 and JDK 21. Defaults and orders were checked against 2.0.1; provider behaviour varies.

## Versions and Setup

- Spring AI **2.x** ↔ Spring Boot 4 / Framework 7; Spring AI **1.x** ↔ Spring Boot 3. Do not mix them.
- Import `org.springframework.ai:spring-ai-bom` and add one starter per provider, such as `spring-ai-starter-model-openai`.
- Use the flat 2.0 properties: `spring.ai.openai.chat.model` (the `.options.model` form is deprecated).
- Choose the active provider with `spring.ai.model.chat=openai` and `spring.ai.model.embedding=openai`.
- Read the key from `${OPENAI_API_KEY}`; never commit it.

## Core Types

| Type | Role |
|------|------|
| `ChatModel` | Provider call: `call(Prompt)`, `stream(Prompt)` |
| `ChatClient` | Fluent API: system/user, options, advisors, tools, `.content()`, `.entity()` |
| `Prompt` / `Message` | Messages: system, user, assistant, tool |
| `ChatResponse` | Generations, metadata (model, usage, finish reason) |
| `EmbeddingModel` / `VectorStore` | Vectors; `add`, `similaritySearch`, `delete(filter)` |
| `Advisor` | Interceptor around the call: memory, RAG, guard, logging |
| `ToolCallback` / `@Tool` | Functions the model can request |

## ChatClient Cheats

- `.prompt().system(..).user(..).call().content()`: returns text.
- `.call().entity(Record.class)`: structured output. Validate the result afterwards.
- `.stream().content()`: returns a `Flux<String>`. Only `StreamAdvisor`s run.
- `.options(builder)` on a request **replaces** the client's `defaultOptions`; gaps come from the model's defaults.
- `.advisors(a -> a.param(ChatMemory.CONVERSATION_ID, id))`: sets the conversation for memory.
- `.tools(obj)` and `.toolContext(Map.of("userId", id))`: pass identity outside the prompt.

## Advisor Orders (lower runs first, outside)

```text
HIGHEST_PRECEDENCE + 200  MessageChatMemoryAdvisor, VectorStoreChatMemoryAdvisor  (outside the loop)
HIGHEST_PRECEDENCE + 300  ToolCallingAdvisor                                       (the tool loop)
0                         QuestionAnswerAdvisor, RetrievalAugmentationAdvisor,
                          SafeGuardAdvisor                                         (inside the loop)
```

## RAG Defaults

| Setting | Default |
|---------|---------|
| `SearchRequest` topK / threshold | 4 / 0.0 |
| `TokenTextSplitter` chunk size | 800 tokens, no overlap; use the builder (the constructors are deprecated) |
| `ContextualQueryAugmenter.allowEmptyContext` | false (the query is replaced with an out-of-scope instruction) |
| `MultiQueryExpander` | 3 queries, original included |
| Retrieved documents in the response | `RetrievalAugmentationAdvisor.DOCUMENT_CONTEXT` |
| Per-request filter key | `VectorStoreDocumentRetriever.FILTER_EXPRESSION` |
| pgvector | HNSW, cosine distance, `initialize-schema=false` |

## Production

| Concern | Setting or fact |
|---------|-----------------|
| OpenAI SDK retries and timeout | `spring.ai.openai.chat.max-retries` (3), `spring.ai.openai.chat.timeout` (60s) |
| Output limit | `spring.ai.openai.chat.max-completion-tokens`, `spring.ai.anthropic.chat.max-tokens` |
| Framework retries | `@EnableResilientMethods` + `@Retryable` (Spring Framework 7) |
| Observations | `spring.ai.chat.client`, `spring.ai.advisor`, `spring.ai.tool`, `gen_ai.client.operation` |
| Token metric | `gen_ai.client.token.usage` |
| Content logging | Off by default; keep it off in production |
| Evaluators | Pass only on the judge reply "yes" |

## MCP

- The server starter is `spring-ai-starter-mcp-server-webmvc`, with `@McpTool` and `@McpToolParam`.
- Set `spring.ai.mcp.server.protocol=STREAMABLE`. With the property unset, 2.0.1 exposed SSE, and a streamable client got a 404.
- The client connects with `spring.ai.mcp.client.streamable-http.connections.<name>.url`. The request timeout defaults to 20s.
