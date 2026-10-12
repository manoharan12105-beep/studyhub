# Project 2: Document Q&A with RAG

**Module:** Spring AI: Projects · **Interview priority:** Portfolio · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Build a document question-answering service that ingests handbook text, retrieves relevant chunks and answers only from them.
- Return the sources used with every answer, and refuse cleanly when nothing relevant is found.
- Move from the in-memory store to pgvector without changing the services.

## Definition

The **document Q&A service** has two halves that run at different times:

| Half | When | Spring AI pieces |
|------|------|------------------|
| Ingestion | When a document is uploaded | `TokenTextSplitter` (builder), `Document` metadata, `VectorStore.add` |
| Question answering | For each question | `RetrievalAugmentationAdvisor`, `VectorStoreDocumentRetriever`, `ContextualQueryAugmenter` |

It applies these lessons:

- [Ingestion](../../spring-ai-rag/document-ingestion-pipeline/content.md)
- [Chunking](../../spring-ai-rag/text-splitting-and-chunking/content.md)
- [RAG Architecture](../../spring-ai-rag/rag-architecture/content.md)
- [Grounding and Citations](../../spring-ai-rag/rag-grounding-and-citations/content.md)

## Why It Matters

"Chat with our documents" is the most common enterprise AI request. A good build shows you understand chunking, thresholds, empty-context behaviour, sources, metadata filtering and evaluation. Interviewers probe these as soon as you say "RAG".

## How It Works

```text
upload ─▶ IngestionService ─▶ split ─▶ add metadata (docId, title) ─▶ VectorStore (embeds + stores)

question ─▶ QaService ─▶ RetrievalAugmentationAdvisor
                           ├─ VectorStoreDocumentRetriever (topK 3, threshold 0.5)
                           ├─ ContextualQueryAugmenter (allowEmptyContext = true)
                           └─ ChatClient call ─▶ answer + sources from DOCUMENT_CONTEXT
```

Steps:

1. **Ingest.** Split each document, and keep `docId` and `title` metadata on every chunk.
2. **Set a threshold.** Retrieve with a similarity threshold so that unrelated questions retrieve nothing.
3. **Choose the empty-context wording.** With `allowEmptyContext(true)`, your system prompt decides the "don't know" reply. With the default `false`, Spring AI replaces the query with its own out-of-scope instruction.
4. **Return sources.** Read the retrieved documents from the response context and return their titles.
5. **Go to production.** Replace `SimpleVectorStore` with pgvector.

## Configuration

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-rag</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-vector-store-pgvector</artifactId>
</dependency>
```

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/studyai
spring.datasource.username=studyai
spring.datasource.password=${DB_PASSWORD}

spring.ai.model.embedding=openai
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.embedding.model=text-embedding-3-small

spring.ai.vectorstore.pgvector.initialize-schema=false
spring.ai.vectorstore.pgvector.table-name=course_chunks
spring.ai.vectorstore.pgvector.dimensions=1536
```

> [!NOTE]
> This pgvector configuration comes from [pgvector with Spring AI](../../spring-ai-rag/pgvector-with-spring-ai/content.md). It was not run against a database for this lesson. The runnable example below uses `SimpleVectorStore` and the Practice Lab's `KeywordEmbeddingModel`.

## Example

```java
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.example.studyai.lab.KeywordEmbeddingModel;
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.document.Document;
import org.springframework.ai.rag.advisor.RetrievalAugmentationAdvisor;
import org.springframework.ai.rag.generation.augmentation.ContextualQueryAugmenter;
import org.springframework.ai.rag.retrieval.search.VectorStoreDocumentRetriever;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.task.SimpleAsyncTaskExecutor;

public class DocumentQaProject {

    record Answer(String text, List<String> sources) {}

    /** Ingestion: split, tag with metadata, store. Runs at upload time, not per question. */
    static class IngestionService {
        private final VectorStore store;
        private final TokenTextSplitter splitter = TokenTextSplitter.builder().withChunkSize(60).withMinChunkSizeChars(20).build();

        IngestionService(VectorStore store) { this.store = store; }

        int ingest(String docId, String title, String text) {
            List<Document> chunks = splitter.apply(List.of(new Document(text, Map.of("docId", docId, "title", title))));
            store.add(chunks);
            return chunks.size();
        }
    }

    /** Question answering: retrieve, augment, generate, and return the sources used. */
    static class QaService {
        private final ChatClient client;

        QaService(ChatClient.Builder builder, VectorStore store) {
            SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("rag-");
            executor.setVirtualThreads(true);
            this.client = builder
                    .defaultSystem("Answer only from the context. If the context does not contain the answer, "
                            + "say \"I don't know based on the documents.\"")
                    .defaultAdvisors(RetrievalAugmentationAdvisor.builder()
                            .documentRetriever(VectorStoreDocumentRetriever.builder()
                                    .vectorStore(store).similarityThreshold(0.5).topK(3).build())
                            .queryAugmenter(ContextualQueryAugmenter.builder().allowEmptyContext(true).build())
                            .taskExecutor(executor)
                            .build())
                    .build();
        }

        Answer ask(String question) {
            ChatClientResponse response = client.prompt().user(question).call().chatClientResponse();
            @SuppressWarnings("unchecked")
            List<Document> docs = (List<Document>) response.context().get(RetrievalAugmentationAdvisor.DOCUMENT_CONTEXT);
            List<String> sources = docs.stream().map(d -> (String) d.getMetadata().get("title")).distinct()
                    .collect(Collectors.toList());
            String text = response.chatResponse().getResult().getOutput().getText();
            return new Answer(text, sources);
        }
    }

    public static void main(String[] args) {
        SimpleVectorStore store = SimpleVectorStore.builder(new KeywordEmbeddingModel()).build();
        IngestionService ingestion = new IngestionService(store);
        int chunks = ingestion.ingest("handbook-security", "Security handbook",
                "Passwords are hashed with BCrypt and never stored in plain text. "
                        + "A JWT access token expires after 15 minutes. "
                        + "Refresh tokens are rotated on every use and stored as a hash.");
        chunks += ingestion.ingest("handbook-db", "Database handbook",
                "Every PostgreSQL table has a primary key. "
                        + "Add an index for columns used in frequent query filters.");
        System.out.println("chunks stored: " + chunks);

        ScriptedChatModel model = new ScriptedChatModel()
                .reply("A JWT access token expires after 15 minutes.")
                .reply("I don't know based on the documents.");
        QaService qa = new QaService(ChatClient.builder(model), store);

        Answer a1 = qa.ask("When does a JWT token expire?");
        System.out.println("Q1: " + a1.text() + " sources=" + a1.sources());
        Answer a2 = qa.ask("What is a good pasta recipe?");
        System.out.println("Q2: " + a2.text() + " sources=" + a2.sources());
        System.out.println("context sent for Q1 mentions 15 minutes: "
                + model.prompts().get(0).getUserMessage().getText().contains("15 minutes"));
    }
}
```

**Output:**

```text
chunks stored: 2
Q1: A JWT access token expires after 15 minutes. sources=[Security handbook]
Q2: I don't know based on the documents. sources=[]
context sent for Q1 mentions 15 minutes: true
```

### Code walkthrough

- **Chunks.** Each handbook text is shorter than one 60-token chunk, so each became one chunk. Real documents produce many. The splitter copies the `docId` and `title` metadata to every chunk.
- **Q1.** Only the security chunk was retrieved; the database chunk scored below 0.5. The prompt sent to the model contained the "15 minutes" fact.
- **Q2.** Nothing was retrieved. Because `allowEmptyContext(true)` is set, the question went to the model unchanged, and the system prompt produced the agreed refusal. `sources=[]` lets the UI show "no sources".
- **What this run proves.** The answers come from the scripted model, so the run proves the wiring, not answer quality. Measure answer quality with evaluations ([RAG Evaluation](../../spring-ai-rag/rag-evaluation-and-failures/content.md)).

### API shape

```java
// Illustrative fragment
@PostMapping("/api/docs/ask")
Answer ask(@Valid @RequestBody AskRequest request) {
    return qaService.ask(request.question());
}

@PostMapping(path = "/api/docs", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
@PreAuthorize("hasRole('EDITOR')")
Map<String, Integer> upload(@RequestParam MultipartFile file, @RequestParam String title) throws IOException {
    String text = new String(file.getBytes(), StandardCharsets.UTF_8);
    return Map.of("chunks", ingestion.ingest(UUID.randomUUID().toString(), title, text));
}
```

## Common Mistakes and Troubleshooting

- **Threshold left at 0.0 (the default).** Every question retrieves something, so the model "answers" off-topic questions from unrelated chunks.
- **Ingesting on every request.** Embedding is the expensive part; ingest once, at upload.
- **Losing metadata.** Without `docId` you cannot delete or re-ingest a document. Without `title` you cannot cite it.
- **Keeping the default executor.** In testing, `RetrievalAugmentationAdvisor`'s private thread pool kept a plain `main` program alive. Pass your own executor (the example uses virtual threads).
- **Duplicate chunks after a re-upload.** Delete the old chunks with a `docId` filter before re-ingesting.

## Production Considerations

- **Uploads.** Restrict size, type and role. Treat document text as untrusted, because it can contain injected instructions ([Prompt Injection](../../spring-ai-prompts-and-memory/prompt-injection-and-untrusted-input/content.md)).
- **Multi-tenant data.** Put a metadata filter on every search. Build it with `FilterExpressionBuilder`, never by string concatenation ([Metadata Filtering](../../spring-ai-rag/vector-metadata-filtering/content.md)).
- **Evaluation.** Keep a set of questions with their expected sources. Run it whenever you change chunk size, threshold or embedding model.

## Project Checklist

- [ ] Ingestion and Q&A are separate services; ingestion runs once per document.
- [ ] Chunks carry `docId` and `title`, plus a tenant id if needed.
- [ ] The similarity threshold is set and tuned on real questions.
- [ ] The empty-context behaviour (`allowEmptyContext`) is a deliberate choice.
- [ ] Every answer returns its sources.
- [ ] Re-ingestion deletes the old chunks first.
- [ ] The evaluation set is run before retrieval settings change.

## Key Takeaways

- RAG means: ingest once, retrieve for each question, answer from the context, return the sources.
- The threshold and the empty-context policy decide how the service behaves on unknown questions.
- The vector store is swappable; the services do not change.

## Official References

- [Spring AI Retrieval Augmented Generation](https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html)
- [Spring AI ETL Pipeline](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html)
- [Spring AI PGvector](https://docs.spring.io/spring-ai/reference/api/vectordbs/pgvector.html)
- Related: [Project 1: Study Assistant](../project-study-assistant/content.md) · [Project 3: Tool-Calling Service](../project-tool-calling-service/content.md) · [Retrieval Quality](../../spring-ai-rag/retrieval-quality/content.md)
