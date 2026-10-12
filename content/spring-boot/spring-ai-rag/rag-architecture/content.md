# RAG Architecture with RetrievalAugmentationAdvisor

**Module:** Spring AI: Embeddings and RAG · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Draw the two halves of a RAG system: ingestion and question answering.
- Build a modular RAG pipeline with `RetrievalAugmentationAdvisor` and its components.
- Predict how RAG behaves with conversation memory, follow-up questions and empty retrieval.
- Configure the advisor for production: order, executor and empty-context policy.

## Definition

**Retrieval-augmented generation (RAG)** answers a question by first retrieving relevant passages from your own data and then asking the model to answer using those passages. Spring AI offers two advisors:

| Advisor | Module | Use when |
|---------|--------|----------|
| `QuestionAnswerAdvisor` | `spring-ai-vector-store-advisor` | One vector store, raw query, simple template ([QuestionAnswerAdvisor](../../spring-ai-tools-and-advisors/question-answer-advisor/content.md)) |
| `RetrievalAugmentationAdvisor` | `spring-ai-rag` | Composable pipeline: query transformation, expansion, any retriever, joining, post-processing, augmentation policy |

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-rag</artifactId>
</dependency>
```

## Why It Matters

RAG is the standard way to make an LLM answer from private, current data without retraining. Interviews probe the whole architecture — ingestion, chunking, embeddings, vector store, retrieval, prompt augmentation, generation, evaluation — and the failure modes in between. `RetrievalAugmentationAdvisor` maps each step to a replaceable component, which makes the architecture explicit in code.

## How It Works

```text
INGESTION (offline)                         QUESTION ANSWERING (per request)
files → reader → splitter → embed → store   question
                                              ├─ QueryTransformer(s)   rewrite / compress / translate
                                              ├─ QueryExpander         one query → several
                                              ├─ DocumentRetriever     vector search (+ filter) per query
                                              ├─ DocumentJoiner        merge + dedupe
                                              ├─ DocumentPostProcessor re-rank / trim
                                              ├─ QueryAugmenter        build the final user message
                                              └─ ChatModel             answer (+ DOCUMENT_CONTEXT in the response context)
```

Defaults and behaviour checked against 2.0.1:

| Aspect | Behaviour |
|--------|-----------|
| Default augmenter | `ContextualQueryAugmenter`: "Context information is below… Query: {query} Answer:" |
| Empty retrieval | `allowEmptyContext` defaults to `false`: the user message is **replaced** with "The user query is outside your knowledge base. Politely inform the user that you can't answer it." — the model is still called |
| Transformed query | Used for **retrieval only**; the final prompt contains the user's original wording |
| Retrieved documents | Response context key `RetrievalAugmentationAdvisor.DOCUMENT_CONTEXT` |
| Per-request filter | Advisor context key `VectorStoreDocumentRetriever.FILTER_EXPRESSION` (string or `Filter.Expression`) |
| Default order | 0 — inside the tool loop when tools are used; set `.order(Ordered.HIGHEST_PRECEDENCE + 250)` to retrieve once per request ([Advisor Ordering](../../spring-ai-tools-and-advisors/advisor-ordering-and-transformations/content.md)) |
| Default task executor | Without `.taskExecutor(...)`, each advisor creates its own `ThreadPoolTaskExecutor` (4–16 threads, prefix `ai-advisor-`) that Spring does not manage |

## Example

A RAG client with chat memory and a `CompressionQueryTransformer`; three questions, including a follow-up and an off-topic one:

```java
import java.util.List;
import java.util.Map;

import com.example.studyai.lab.KeywordEmbeddingModel;
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.document.Document;
import org.springframework.ai.rag.advisor.RetrievalAugmentationAdvisor;
import org.springframework.ai.rag.preretrieval.query.transformation.CompressionQueryTransformer;
import org.springframework.ai.rag.retrieval.search.VectorStoreDocumentRetriever;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.core.task.SimpleAsyncTaskExecutor;

public class RagPipelineDemo {

    public static void main(String[] args) {
        SimpleVectorStore store = SimpleVectorStore.builder(new KeywordEmbeddingModel()).build();
        store.add(List.of(
                new Document("sec-1", "A JWT access token should expire within 15 minutes.", Map.of("course", "security-201")),
                new Document("sec-2", "A refresh token can live for 7 days and must be stored securely.", Map.of("course", "security-201"))));

        ScriptedChatModel model = new ScriptedChatModel()
                .reply("How long should a JWT access token live?")                     // query 1, compressed
                .reply("Access tokens should expire within 15 minutes.")               // answer 1
                .reply("How long should a JWT refresh token live?")                    // query 2, compressed
                .reply("A refresh token can live for 7 days.")                         // answer 2
                .reply("What is the capital of France?")                               // query 3, compressed
                .reply("Sorry, I can't answer that.");                                 // answer 3

        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("rag-");
        executor.setVirtualThreads(true);       // otherwise the advisor creates its own unmanaged thread pool

        RetrievalAugmentationAdvisor rag = RetrievalAugmentationAdvisor.builder()
                .queryTransformers(CompressionQueryTransformer.builder()
                        .chatClientBuilder(ChatClient.builder(model))
                        .build())
                .documentRetriever(VectorStoreDocumentRetriever.builder()
                        .vectorStore(store)
                        .similarityThreshold(0.5)
                        .topK(3)
                        .build())
                .taskExecutor(executor)
                .build();
        System.out.println("RAG advisor default order: " + rag.getOrder());

        ChatMemory memory = MessageWindowChatMemory.builder().build();
        ChatClient client = ChatClient.builder(model)
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(memory).build(), rag)
                .build();

        for (String question : List.of("How long should a JWT access token live?", "And the other one?",
                "What is the capital of France?")) {
            ChatClientResponse response = client.prompt().user(question)
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, "asha"))
                    .call().chatClientResponse();
            @SuppressWarnings("unchecked")
            var docs = (List<Document>) response.context().get(RetrievalAugmentationAdvisor.DOCUMENT_CONTEXT);
            System.out.println("Q: " + question);
            System.out.println("   retrieved " + docs.stream().map(Document::getId).toList()
                    + " | answer: " + response.chatResponse().getResult().getOutput().getText());
        }
        System.out.println("Model calls: " + model.prompts().size());
        System.out.println("--- compression request for question 2 ---");
        System.out.println(model.prompts().get(2).getUserMessage().getText());
        System.out.println("--- user message sent with question 2 ---");
        System.out.println(model.prompts().get(3).getUserMessage().getText());
        System.out.println("--- user message for question 3 ---");
        System.out.println(model.lastPrompt().getUserMessage().getText());
    }
}
```

**Output:**

```text
RAG advisor default order: 0
Q: How long should a JWT access token live?
   retrieved [sec-2, sec-1] | answer: Access tokens should expire within 15 minutes.
Q: And the other one?
   retrieved [sec-2, sec-1] | answer: A refresh token can live for 7 days.
Q: What is the capital of France?
   retrieved [] | answer: Sorry, I can't answer that.
Model calls: 6
--- compression request for question 2 ---
Given the following conversation history and a follow-up query, your task is to synthesize
a concise, standalone query that incorporates the context from the history.
Ensure the standalone query is clear, specific, and maintains the user's intent.

Conversation history:
USER: How long should a JWT access token live?
ASSISTANT: Access tokens should expire within 15 minutes.
USER: And the other one?

Follow-up query:
And the other one?

Standalone query:

--- user message sent with question 2 ---
Context information is below.

---------------------
A refresh token can live for 7 days and must be stored securely.
A JWT access token should expire within 15 minutes.
---------------------

Given the context information and no prior knowledge, answer the query.

Follow these rules:

1. If the answer is not in the context, just say that you don't know.
2. Avoid statements like "Based on the context..." or "The provided information...".

Query: And the other one?

Answer:

--- user message for question 3 ---
The user query is outside your knowledge base.
Politely inform the user that you can't answer it.
```

The scripted model plays both roles — query compressor and answerer — so the six replies are listed in call order. The prompts, retrieval and control flow are real 2.0.1 behaviour.

### Code walkthrough

- **Two model calls per question.** `CompressionQueryTransformer` called the model on every request, even the first one, before retrieval. Budget for it or apply it only when there is history.
- **Memory runs first.** `MessageChatMemoryAdvisor` (+200) had already added the current question to the history, so it appears both as the last history line and as the follow-up query.
- **The rewritten query is for retrieval.** The final prompt still says "Query: And the other one?" — the model resolves "the other one" from the chat history that memory supplies. Without memory, the answer step would lack that context.
- **Empty context.** For the France question nothing passed the threshold, so the augmenter replaced the user message with the "outside your knowledge base" instruction; the model was still called.
- **Executor.** Passing a virtual-thread executor avoids the advisor's private thread pool (whose non-daemon threads kept this standalone program from exiting until it was added).

### In a Spring Boot application

```java
// Illustrative fragment
@Bean
ChatClient tutorClient(ChatClient.Builder builder, VectorStore vectorStore, ChatMemory chatMemory,
                       @Qualifier("applicationTaskExecutor") TaskExecutor taskExecutor) {
    var rag = RetrievalAugmentationAdvisor.builder()
            .queryTransformers(CompressionQueryTransformer.builder().chatClientBuilder(builder.clone()).build())
            .documentRetriever(VectorStoreDocumentRetriever.builder()
                    .vectorStore(vectorStore).topK(5).similarityThreshold(0.6).build())
            .queryAugmenter(ContextualQueryAugmenter.builder().allowEmptyContext(false).build())
            .taskExecutor(taskExecutor)
            .order(Ordered.HIGHEST_PRECEDENCE + 250)     // after memory, before the tool loop
            .build();
    return builder
            .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build(), rag)
            .build();
}
```

## Common Mistakes and Troubleshooting

- **Expecting no model call when nothing is retrieved.** The default augmenter still calls the model with a refusal instruction; short-circuit yourself if you need a fixed response.
- **`allowEmptyContext(true)` by accident.** The original question goes to the model without context, and it answers from general knowledge.
- **Follow-ups without memory.** Compression needs history in the query; the answer step needs memory to resolve references.
- **Forgetting the order.** At order 0 with tools, retrieval and compression repeat on every tool round.
- **No executor.** Each advisor instance creates an unmanaged thread pool.

## Production Considerations

- Count model calls per request: transformers + expander + answer. Use a cheaper model for query rewriting (`chatClientBuilder` of a different `ChatModel`).
- Log `DOCUMENT_CONTEXT` ids for every answer — the basis for citations, debugging and evaluation.
- Apply tenant/permission filters per request from the authenticated user.
- Evaluate retrieval and answers separately ([RAG Evaluation and Failures](../rag-evaluation-and-failures/content.md)).

## Common Interview Traps

- **"RAG retrains the model."** It changes the prompt, not the model.
- **"The rewritten query is what the model answers."** In Spring AI it is used for retrieval; the augmented prompt contains the original query.
- **"Empty retrieval means the model isn't called."** It is called with an "outside your knowledge base" instruction by default.

## Key Takeaways

- RAG = offline ingestion + per-request retrieve → augment → generate.
- `RetrievalAugmentationAdvisor` composes transformers, expander, retriever, joiner, post-processors and augmenter.
- Defaults: empty context not allowed (refusal prompt), order 0, private executor unless provided.
- Memory and query compression solve different halves of follow-up questions.

## Official References

- [Retrieval Augmented Generation](https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html)
- [Advisors API](https://docs.spring.io/spring-ai/reference/api/advisors.html)
- Related: [QuestionAnswerAdvisor](../../spring-ai-tools-and-advisors/question-answer-advisor/content.md) · [Retrieval Quality](../retrieval-quality/content.md) · [Grounding and Citations](../rag-grounding-and-citations/content.md)
