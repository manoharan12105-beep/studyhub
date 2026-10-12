# The Document Ingestion Pipeline (ETL)

**Module:** Spring AI: Embeddings and RAG · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Build an extract → transform → load pipeline with `DocumentReader`, `DocumentTransformer` and `DocumentWriter`.
- Choose a reader for Markdown, PDF, HTML, JSON, text and office files.
- Attach metadata that later powers filtering, citations and deletion.
- Make ingestion idempotent so re-running a job does not duplicate content.

## Definition

**Ingestion** turns source files into searchable chunks in a vector store. Spring AI models it as an **ETL pipeline** of three functional interfaces:

| Stage | Interface | Built-in implementations |
|-------|-----------|--------------------------|
| Extract | `DocumentReader` (a `Supplier<List<Document>>`) | `TextReader`, `JsonReader` (core); `MarkdownDocumentReader`; `PagePdfDocumentReader`, `ParagraphPdfDocumentReader`; `JsoupDocumentReader` (HTML); `TikaDocumentReader` (Word, PowerPoint, PDF and many more) |
| Transform | `DocumentTransformer` (a `Function<List<Document>, List<Document>>`) | `TokenTextSplitter`, `ContentFormatTransformer`, metadata enrichers |
| Load | `DocumentWriter` (a `Consumer<List<Document>>`) | Every `VectorStore`, `FileDocumentWriter` |

Readers other than `TextReader` and `JsonReader` live in separate modules: `spring-ai-markdown-document-reader`, `spring-ai-pdf-document-reader`, `spring-ai-jsoup-document-reader` and `spring-ai-tika-document-reader`.

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-markdown-document-reader</artifactId>
</dependency>
```

## Why It Matters

Retrieval can only find what ingestion stored, in the shape ingestion stored it. Most "RAG gives bad answers" problems are ingestion problems: boilerplate text indexed, tables flattened, headings lost, no metadata to filter by, stale or duplicated chunks. Treat ingestion as a real batch job with tests, not a one-off script.

## How It Works

```text
files ──▶ reader.get()          → Documents (text + source metadata)
      ──▶ enrich metadata        → course, tenant, version, permissions
      ──▶ splitter.apply(...)    → chunks (metadata copied to each chunk)
      ──▶ vectorStore.delete(old chunks of this source)
      ──▶ vectorStore.add(chunks)  (embeds, then writes)
```

Because the interfaces are `Supplier`, `Function` and `Consumer`, a pipeline can be written as `vectorStore.accept(splitter.apply(reader.get()))`.

Design decisions:

- **Metadata from the start.** Add `source`, `course`/`tenant`, `version`, `updatedAt` and access labels at ingestion; you cannot filter or cite by metadata you never stored.
- **Idempotency.** Random ids mean re-running the job duplicates chunks. Replace per source (delete by `source` filter, then add) or use deterministic ids.
- **Incremental updates.** Track a content hash per source; re-ingest only changed files and delete chunks of removed files.
- **Clean text.** Strip navigation, headers/footers and boilerplate; `ExtractedTextFormatter` helps with PDF page headers and footers.

## Example

A Markdown note is read, enriched, split and loaded — then the job is run again, without and with replacing the source:

```java
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import com.example.studyai.lab.KeywordEmbeddingModel;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.markdown.MarkdownDocumentReader;
import org.springframework.ai.reader.markdown.config.MarkdownDocumentReaderConfig;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.FileSystemResource;

public class IngestionDemo {

    static final String NOTES = """
            # JWT basics

            A JWT token has a header, a payload and a signature.

            ## Expiry

            Access tokens should expire within minutes. Refresh tokens last longer.

            ~~~java
            Jwts.builder().expiration(in15Minutes).compact();
            ~~~
            """;

    /** Extract → transform → load, replacing earlier chunks from the same source. */
    static List<Document> ingest(VectorStore store, Path file, String course, boolean replaceSource) {
        // 1. Extract
        var config = MarkdownDocumentReaderConfig.builder()
                .withIncludeCodeBlock(false)
                .withAdditionalMetadata("course", course)
                .withAdditionalMetadata("source", file.getFileName().toString())
                .build();
        List<Document> documents = new MarkdownDocumentReader(new FileSystemResource(file), config).get();

        // 2. Transform
        List<Document> chunks = TokenTextSplitter.builder().withChunkSize(200).build().apply(documents);

        // 3. Load: delete the previous version of this source first, so re-ingesting is idempotent
        if (replaceSource) {
            store.delete("source == '" + file.getFileName() + "'");
        }
        store.add(chunks);
        return chunks;
    }

    static int count(VectorStore store) {
        return store.similaritySearch(SearchRequest.builder().query("jwt token")
                .topK(100).similarityThreshold(SearchRequest.SIMILARITY_THRESHOLD_ACCEPT_ALL).build()).size();
    }

    public static void main(String[] args) throws Exception {
        Path file = Files.writeString(Path.of("jwt-notes.md"), NOTES);
        SimpleVectorStore store = SimpleVectorStore.builder(new KeywordEmbeddingModel()).build();

        for (Document chunk : ingest(store, file, "security-201", true)) {
            var m = chunk.getMetadata();
            System.out.printf("%-11s %-12s %s%n", m.get("category"), m.get("title"), chunk.getText().replace("\n", " "));
        }
        System.out.println("Chunks in store: " + count(store));

        ingest(store, file, "security-201", false);   // re-run without replacing the source
        System.out.println("After re-ingesting without delete: " + count(store));
        ingest(store, file, "security-201", true);    // re-run with replace
        System.out.println("After re-ingesting with delete:    " + count(store));
        Files.delete(file);
    }
}
```

**Output:**

```text
header_1    JWT basics   A JWT token has a header, a payload and a signature.
header_2    Expiry       Access tokens should expire within minutes. Refresh tokens last longer.
code_block  null         Jwts.builder().expiration(in15Minutes).compact();
Chunks in store: 3
After re-ingesting without delete: 6
After re-ingesting with delete:    3
```

### Code walkthrough

- `MarkdownDocumentReader` created one document per section and recorded the heading as `title` and the heading level as `category`.
- `withIncludeCodeBlock(false)` does **not** drop code: it puts each code block in its own document (`category=code_block`, no `title`). With `true`, code stays inside the surrounding section's document. Choose based on how users ask questions about code.
- `withAdditionalMetadata` added `course` and `source` to every document; the splitter copied them to every chunk, which is what makes `delete("source == 'jwt-notes.md'")` possible.
- Running the job twice without the delete doubled the store (6); with the delete it stayed at 3.

### As a Spring Boot job

```java
// Illustrative fragment
@Component
class NotesIngestionJob {
    private final VectorStore vectorStore;
    private final TokenTextSplitter splitter = TokenTextSplitter.builder().withChunkSize(400).build();

    NotesIngestionJob(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    @Scheduled(cron = "0 0 2 * * *")
    void ingestChangedNotes() {
        for (Resource note : changedNotes()) {                       // compare stored content hashes
            String source = note.getFilename();
            var reader = new MarkdownDocumentReader(note, MarkdownDocumentReaderConfig.builder()
                    .withAdditionalMetadata("source", source).build());
            vectorStore.delete("source == '" + source + "'");       // file names validated at upload
            vectorStore.add(splitter.apply(reader.get()));
        }
    }
}
```

## Common Mistakes and Troubleshooting

- **Ingesting inside the request path.** Embedding hundreds of chunks takes time and rate-limit budget; run ingestion asynchronously or as a scheduled job.
- **No `source` metadata.** You cannot delete, update or cite a document's chunks later.
- **Delete-then-add is not atomic** in most stores: a search between the two calls sees no chunks for that source. For hot documents, write new chunks with a new version and switch the filter, or accept the short gap.
- **Scanned PDFs.** PDF readers extract text layers; image-only PDFs need OCR first.
- **Building delete filters from untrusted names.** Validate source names (see [Metadata Filtering](../vector-metadata-filtering/content.md)).

## Production Considerations

- Record ingestion runs: source, hash, chunk count, embedding model, duration, errors.
- Respect permissions: store access labels as metadata and filter by them at query time.
- Personal data: decide what may be embedded and sent to the embedding provider; support deletion requests by source or by user.
- Re-ingest everything when the splitter settings or the embedding model change, and compare retrieval metrics before switching.

## Common Interview Traps

- **"RAG quality is about the model."** Most quality comes from ingestion and retrieval.
- **"`vectorStore.add` updates existing chunks."** With random ids it inserts duplicates.
- **"One reader fits all files."** Tika is general, but specialised readers keep structure (Markdown headings, PDF pages) as metadata.

## Key Takeaways

- ETL: `DocumentReader` → `DocumentTransformer` → `DocumentWriter` (a `VectorStore` is a writer).
- Readers come in separate modules; pick by file type and the structure you want to keep.
- Metadata (source, tenant, version, permissions) is added at ingestion and copied to chunks.
- Make ingestion idempotent and incremental.

## Official References

- [ETL Pipeline](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html)
- [Vector Databases: deleting documents](https://docs.spring.io/spring-ai/reference/api/vectordbs.html)
- Related: [Text Splitting and Chunking](../text-splitting-and-chunking/content.md) · [Vector Metadata Filtering](../vector-metadata-filtering/content.md) · [Async and Scheduling](../../production/async-and-scheduling/content.md)
