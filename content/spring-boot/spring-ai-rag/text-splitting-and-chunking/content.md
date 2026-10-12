# Text Splitting and Chunking

**Module:** Spring AI: Embeddings and RAG · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain why documents are split into chunks before embedding.
- Configure `TokenTextSplitter` and predict how it cuts text.
- Choose a chunk size by weighing precision, context and cost.
- Recognise chunking failures in retrieval results and fix them.

## Definition

**Chunking** splits a document into smaller pieces that are embedded and retrieved independently. Spring AI's `TokenTextSplitter` (a `DocumentTransformer`) counts tokens with the jtokkit `CL100K_BASE` encoding, takes up to `chunkSize` tokens, and then cuts back to the last sentence-ending punctuation mark if that keeps at least `minChunkSizeChars` characters.

| Builder method | Default | Meaning |
|----------------|---------|---------|
| `withChunkSize(int)` | 800 | Target maximum tokens per chunk |
| `withMinChunkSizeChars(int)` | 350 | Only cut back to punctuation if the chunk keeps at least this many characters |
| `withMinChunkLengthToEmbed(int)` | 5 | Drop chunks shorter than this many characters |
| `withMaxNumChunks(int)` | 10000 | Upper bound of chunks per document |
| `withKeepSeparator(boolean)` | true | Keep line separators in chunk text |
| `withPunctuationMarks(List<Character>)` | `. ? ! \n` | Where a chunk may end |

> [!WARNING]
> **Deprecated in 2.0.1:** all public `TokenTextSplitter` constructors, including `new TokenTextSplitter()`, are deprecated for removal. Use `TokenTextSplitter.builder()...build()`.

## Why It Matters

One vector cannot represent a 40-page manual: the meaning of every section is averaged into one point, and the model's context window could not hold the whole manual anyway. Chunks that are too small lose context ("After 14 days, refunds are not available" — refunds of what?); chunks that are too large dilute similarity and waste prompt tokens. Chunking is one of the biggest levers on RAG quality.

## How It Works

```text
Document (text + metadata)
  └─ encode to tokens
  └─ repeat: take chunkSize tokens → decode → cut back to last . ? ! or newline
              (only if the cut keeps ≥ minChunkSizeChars) → trim → keep if ≥ minChunkLengthToEmbed
  └─ each chunk = new Document(text, copy of metadata + chunk_index, total_chunks, parent_document_id)
```

- There is **no overlap** between consecutive chunks; the next chunk starts where the previous one ended.
- Metadata is copied to every chunk, which is what filtering and citations rely on.
- Splitting is purely lexical — it does not know about headings or tables. Use a structure-aware reader first (Markdown sections, PDF pages) so chunks rarely cross topics ([Ingestion Pipeline](../document-ingestion-pipeline/content.md)).

Choosing a size:

| Chunk size | Good for | Risk |
|------------|----------|------|
| Small (≈100–300 tokens) | FAQs, precise facts, many short answers | Facts separated from their conditions |
| Medium (≈300–800 tokens) | Most documentation | — |
| Large (800+ tokens) | Narrative text where context matters | Diluted vectors, fewer chunks fit the prompt, higher cost |

These ranges are starting points; measure with your own questions ([Retrieval Quality](../retrieval-quality/content.md)).

## Example

A short refund policy split with the default settings and with a deliberately small chunk size:

```java
import java.util.List;
import java.util.Map;

import org.springframework.ai.document.Document;
import org.springframework.ai.tokenizer.JTokkitTokenCountEstimator;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;

public class ChunkingDemo {

    static final String POLICY = """
            Refund policy. Learners can request a full refund within 14 days of purchase if they have \
            completed less than 20 percent of the course. After 14 days, refunds are not available, but the \
            course can be transferred to another learner once. Corporate licences follow the contract terms \
            instead of this policy. Refunds are paid to the original payment method within 10 working days. \
            Certificates already issued are revoked when a refund is paid.""";

    static void show(String label, TokenTextSplitter splitter, Document document) {
        var tokens = new JTokkitTokenCountEstimator();
        List<Document> chunks = splitter.apply(List.of(document));
        System.out.println(label + ": " + chunks.size() + " chunks");
        for (Document chunk : chunks) {
            System.out.printf("  [%s] %2d tokens | %s%n", chunk.getMetadata().get("chunk_index"),
                    tokens.estimate(chunk.getText()), chunk.getText());
        }
    }

    public static void main(String[] args) {
        Document policy = new Document(POLICY, Map.of("source", "refund-policy.md", "version", "2026-09"));
        System.out.println("Whole document: " + new JTokkitTokenCountEstimator().estimate(POLICY) + " tokens");

        show("Default splitter (800 tokens)", TokenTextSplitter.builder().build(), policy);

        show("chunkSize 30, minChunkSizeChars 60", TokenTextSplitter.builder()
                .withChunkSize(30)
                .withMinChunkSizeChars(60)
                .build(), policy);

        Document first = TokenTextSplitter.builder().withChunkSize(30).withMinChunkSizeChars(60).build()
                .apply(List.of(policy)).get(0);
        System.out.println("Metadata of chunk 0: " + new java.util.TreeMap<>(first.getMetadata()).keySet());
    }
}
```

**Output:**

```text
Whole document: 89 tokens
Default splitter (800 tokens): 1 chunks
  [0] 89 tokens | Refund policy. Learners can request a full refund within 14 days of purchase if they have completed less than 20 percent of the course. After 14 days, refunds are not available, but the course can be transferred to another learner once. Corporate licences follow the contract terms instead of this policy. Refunds are paid to the original payment method within 10 working days. Certificates already issued are revoked when a refund is paid.
chunkSize 30, minChunkSizeChars 60: 4 chunks
  [0] 30 tokens | Refund policy. Learners can request a full refund within 14 days of purchase if they have completed less than 20 percent of the course.
  [1] 21 tokens | After 14 days, refunds are not available, but the course can be transferred to another learner once.
  [2] 26 tokens | Corporate licences follow the contract terms instead of this policy. Refunds are paid to the original payment method within 10 working days.
  [3] 11 tokens | Certificates already issued are revoked when a refund is paid.
Metadata of chunk 0: [chunk_index, parent_document_id, source, total_chunks, version]
```

### Code walkthrough

- With the default 800-token size, the 89-token policy stayed one chunk.
- With 30 tokens, every chunk ended at a full stop because the cut-back kept more than 60 characters.
- Chunk 1 says "After 14 days, refunds are not available" without the word "learners" or the 20% rule — retrieved alone, it can mislead. Chunk 2 mixes two topics (corporate licences and payment timing). Both are classic small-chunk problems.
- Every chunk kept `source` and `version` and gained `chunk_index`, `total_chunks` and `parent_document_id`.

## Common Mistakes and Troubleshooting

- **Using `new TokenTextSplitter()`.** Deprecated for removal in 2.0.1; use the builder.
- **Chunks cut mid-table or mid-code.** Split by structure first (Markdown sections, PDF pages, code blocks as separate documents), then by tokens.
- **Facts separated from conditions.** Increase the chunk size, keep sections together, or add the section title to each chunk's text or metadata.
- **Chunk size above the embedding model's input limit.** The provider rejects or truncates the input; keep chunks well below the limit.
- **Changing the splitter without re-ingesting.** Old and new chunks mix; re-ingest everything into a new index.

## Production Considerations

- Prompt budget: `topK × chunk size` tokens are added to every request — 5 chunks × 800 tokens = 4,000 input tokens before the question.
- Test 2–3 chunk sizes against a labelled question set and pick by hit rate and answer quality, not intuition.
- Store the splitter settings with each index, like the embedding model.
- Custom splitting (by heading, by paragraph, semantic splitting) is a `DocumentTransformer` you can write yourself — extend `TextSplitter` and implement `splitText`.

## Common Interview Traps

- **"Smaller chunks are always more precise."** They lose context and can retrieve misleading fragments.
- **"`TokenTextSplitter` overlaps chunks."** It does not; overlap needs a custom splitter.
- **"Chunk size is in characters."** `chunkSize` is in tokens; `minChunkSizeChars` is in characters.

## Key Takeaways

- Split to make vectors specific and prompts affordable — but keep meaning together.
- `TokenTextSplitter.builder()`: chunkSize 800 tokens, cut back to `. ? ! \n`, no overlap, metadata copied.
- Split by structure first, tokens second.
- Choose chunk size by measuring retrieval on real questions.

## Official References

- [ETL Pipeline: TokenTextSplitter](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html)
- Related: [The Document Ingestion Pipeline](../document-ingestion-pipeline/content.md) · [Retrieval Quality](../retrieval-quality/content.md) · [Token Usage and Cost Control](../../spring-ai-production/token-usage-and-cost-control/content.md)
