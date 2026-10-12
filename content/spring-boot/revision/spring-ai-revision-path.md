# 30-Minute Spring AI API Revision

A timed path through the APIs you write every day. Read each block, then say the answer aloud before moving on.

## Minutes 0–5: Setup and Configuration

- Spring AI 2.0.x needs Spring Boot 4.x. Import the BOM and add one model starter.
- Use the flat properties: `spring.ai.openai.api-key`, `spring.ai.openai.chat.model`, and `spring.ai.openai.chat.max-completion-tokens`.
- The auto-configured `ChatClient.Builder` is a prototype bean. Build one `ChatClient` per purpose, with defaults.
- Self-check: which property chooses the active chat provider? (`spring.ai.model.chat`)

## Minutes 5–10: ChatClient

```java
// Illustrative fragment
ChatClient client = builder
        .defaultSystem("You are a concise Java tutor.")
        .defaultAdvisors(MessageChatMemoryAdvisor.builder(memory).build())
        .build();

String text = client.prompt()
        .user(u -> u.text("Explain {topic} in two sentences.").param("topic", topic))
        .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, userId))
        .call()
        .content();
```

- `.call().entity(Type.class)` returns structured output. Always validate it.
- `.call().chatResponse()` gives the usage and finish reason. `.chatClientResponse()` also gives the advisor context.
- `.stream().content()` returns a `Flux<String>`; call advisors do not run.

## Minutes 10–15: Memory and Prompts

- `MessageWindowChatMemory` keeps 20 messages by default. A JDBC repository persists them.
- The conversation id comes from the authenticated user.
- Prompt templates use `{name}` placeholders. Few-shot examples are messages or template text.
- Treat user, document and tool text as untrusted data.

## Minutes 15–22: Tools and Advisors

```java
// Illustrative fragment
class CourseTools {
    @Tool(description = "List the current learner's courses")
    List<String> myCourses(ToolContext ctx) {
        return service.coursesOf((String) ctx.getContext().get("learnerId"));
    }
}

client.prompt().user(q).tools(new CourseTools()).toolContext(Map.of("learnerId", id)).call().content();
```

- The tool loop runs in `ToolCallingAdvisor` at `HIGHEST_PRECEDENCE + 300`.
- Advisors at ordinary orders (0, 100) run inside the loop, once per model call. Memory (+200) runs outside it.
- `returnDirect = true` returns the tool result as the answer. The default converter makes it JSON.
- A custom advisor implements `CallAdvisor` and `StreamAdvisor`, or extends `BaseAdvisor`.

## Minutes 22–30: Embeddings and RAG

```java
// Illustrative fragment
RetrievalAugmentationAdvisor rag = RetrievalAugmentationAdvisor.builder()
        .documentRetriever(VectorStoreDocumentRetriever.builder()
                .vectorStore(store).similarityThreshold(0.5).topK(3).build())
        .queryAugmenter(ContextualQueryAugmenter.builder().allowEmptyContext(true).build())
        .build();
```

- Ingest with a reader, then `TokenTextSplitter.builder()...build()`, then `vectorStore.add(chunks)`.
- Filter with `FilterExpressionBuilder` or `SearchRequest.builder().filterExpression(...)`.
- The simpler alternative is `QuestionAnswerAdvisor` (module `spring-ai-vector-store-advisor`).
- Self-check: what does an empty retrieval do with the default augmenter? (The query is replaced with an out-of-scope instruction, and the model is still called.)
