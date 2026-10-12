# Retrieval Quality: Measuring and Improving Search

**Module:** Spring AI: Embeddings and RAG · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Measure retrieval with a labelled question set using hit rate and mean reciprocal rank (MRR).
- Tune `topK` and the similarity threshold with numbers instead of guesses.
- Apply Spring AI's pre- and post-retrieval tools: query transformation, query expansion, document joining and post-processing.
- Know when to reach for hybrid search and re-ranking.

## Definition

**Retrieval quality** is how often the documents needed to answer a question are among those sent to the model, and how high they rank. It is measured separately from answer quality, because a perfect model cannot answer from missing context.

| Metric | Meaning | Formula |
|--------|---------|---------|
| Hit rate (recall@k) | Share of questions where at least one relevant chunk is in the top k | hits ÷ questions |
| MRR | How high the first relevant chunk ranks | average of 1 ÷ rank of first relevant chunk (0 if none) |
| Context size | How many chunks/tokens are sent | average chunks per question |

## Why It Matters

"The answers are bad" is usually "the right chunk wasn't retrieved". Without a test set, every change — chunk size, threshold, embedding model, query rewriting — is a guess that might help one question and break ten others. A small labelled set (30–100 realistic questions) turns tuning into engineering.

## How It Works

```text
question ─▶ [pre-retrieval]  QueryTransformer (rewrite, compress, translate), QueryExpander (multi-query)
         ─▶ [retrieval]      DocumentRetriever (vector search + filter), DocumentJoiner (merge, dedupe)
         ─▶ [post-retrieval] DocumentPostProcessor (re-rank, dedupe, trim, compress)
         ─▶ prompt
```

Spring AI building blocks (module `spring-ai-rag`):

| Stage | Component | What it does |
|-------|-----------|--------------|
| Pre-retrieval | `RewriteQueryTransformer` | Asks a chat model to rewrite a verbose or vague query for search |
| Pre-retrieval | `CompressionQueryTransformer` | Turns a follow-up plus history into a standalone query |
| Pre-retrieval | `TranslationQueryTransformer` | Translates the query into the documents' language |
| Pre-retrieval | `MultiQueryExpander` | Generates query variants (default 3, plus the original) |
| Retrieval | `VectorStoreDocumentRetriever` | Similarity search with topK, threshold and filter |
| Retrieval | `ConcatenationDocumentJoiner` | Merges results of several queries, removes duplicate ids, sorts by score |
| Post-retrieval | `DocumentPostProcessor` | Your hook: re-rank, filter, deduplicate, cap tokens |

Every pre-retrieval transformer and expander is an extra chat-model call per request — measure whether it pays off.

Beyond Spring AI's built-ins:

- **Hybrid search** combines keyword (BM25/full-text) and vector results; strong for product codes, error messages and names that embeddings handle poorly. Many stores (Elasticsearch, OpenSearch, PostgreSQL full-text + pgvector) support it natively or via two queries joined by your own code.
- **Re-ranking** retrieves more candidates (for example 20) and re-orders them with a cross-encoder or LLM before keeping the best few — implement it as a `DocumentPostProcessor`.

## Example

Six chunks, six labelled questions and three retrieval settings:

```java
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.example.studyai.lab.KeywordEmbeddingModel;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;

public class RetrievalQualityDemo {

    /** One labelled example: a realistic question and the chunk ids that answer it. */
    record Case(String question, Set<String> relevant) {
    }

    static void evaluate(VectorStore store, List<Case> cases, int topK, double threshold) {
        int hits = 0;
        double reciprocalRankSum = 0;
        int retrievedTotal = 0;
        for (Case c : cases) {
            List<String> ids = store.similaritySearch(SearchRequest.builder().query(c.question())
                    .topK(topK).similarityThreshold(threshold).build()).stream().map(Document::getId).toList();
            retrievedTotal += ids.size();
            for (int rank = 0; rank < ids.size(); rank++) {
                if (c.relevant().contains(ids.get(rank))) {
                    hits++;
                    reciprocalRankSum += 1.0 / (rank + 1);
                    break;
                }
            }
        }
        System.out.printf("topK=%d threshold=%.1f  hit rate=%d/%d  MRR=%.2f  avg chunks sent=%.1f%n",
                topK, threshold, hits, cases.size(), reciprocalRankSum / cases.size(), (double) retrievedTotal / cases.size());
    }

    public static void main(String[] args) {
        SimpleVectorStore store = SimpleVectorStore.builder(new KeywordEmbeddingModel()).build();
        store.add(List.of(
                new Document("idx", "An index speeds up a query that filters a large table.", Map.of()),
                new Document("plan", "EXPLAIN shows the plan PostgreSQL chose for a SQL query.", Map.of()),
                new Document("jwt", "A JWT access token should expire within minutes.", Map.of()),
                new Document("hash", "Store each password as a bcrypt hash.", Map.of()),
                new Document("mock", "A mock replaces a dependency in a JUnit test.", Map.of()),
                new Document("bean", "A Spring bean is an object managed by the container.", Map.of())));

        List<Case> cases = List.of(
                new Case("Why is my query on a big table slow?", Set.of("idx", "plan")),
                new Case("How do I see which plan the database used for my SQL?", Set.of("plan")),
                new Case("How long should a token live?", Set.of("jwt")),
                new Case("How should I store a password?", Set.of("hash")),
                new Case("How do I test a service without its repository?", Set.of("mock")),
                new Case("What does the container do with my objects?", Set.of("bean")));

        evaluate(store, cases, 1, 0.0);
        evaluate(store, cases, 3, 0.0);
        evaluate(store, cases, 3, 0.5);
    }
}
```

**Output:**

```text
topK=1 threshold=0.0  hit rate=3/6  MRR=0.50  avg chunks sent=1.0
topK=3 threshold=0.0  hit rate=5/6  MRR=0.67  avg chunks sent=3.0
topK=3 threshold=0.5  hit rate=5/6  MRR=0.67  avg chunks sent=1.5
```

### Code walkthrough

- **topK 1** missed half the questions. The toy model scores both database chunks (and both security chunks) 1.00, so the relevant one sometimes ranked second — the same situation as two passages that look equally relevant to a real model, where a re-ranker helps.
- **topK 3** found 5 of 6, but sent 3 chunks every time, including irrelevant ones scoring 0.
- **Threshold 0.5** kept the hit rate and halved the context — the best setting of the three: cheaper prompts and less noise for the model.
- The remaining miss — "What does the container do with my objects?" — shares no vocabulary with "A Spring bean is an object managed by the container" in this toy model. Real embedding models handle many such paraphrases, but jargon gaps remain; query rewriting, hybrid search or adding synonyms to the chunk text address them.

### Post-processing hook

```java
// Illustrative fragment — keep at most two chunks per source document
DocumentPostProcessor twoPerSource = (query, documents) -> {
    Map<Object, Integer> perSource = new HashMap<>();
    return documents.stream()
            .filter(d -> perSource.merge(d.getMetadata().get("source"), 1, Integer::sum) <= 2)
            .toList();
};

RetrievalAugmentationAdvisor rag = RetrievalAugmentationAdvisor.builder()
        .queryExpander(MultiQueryExpander.builder().chatClientBuilder(chatClientBuilder).numberOfQueries(2).build())
        .documentRetriever(VectorStoreDocumentRetriever.builder().vectorStore(vectorStore).topK(8).similarityThreshold(0.6).build())
        .documentPostProcessors(twoPerSource)
        .build();
```

## Common Mistakes and Troubleshooting

- **Tuning by trying three questions in the UI.** Build a labelled set from real user questions and track metrics per change.
- **High topK "to be safe".** More chunks cost tokens and add distractors; models answer worse with noisy context.
- **One global threshold across embedding models.** Recalibrate whenever the model changes.
- **Query rewriting everywhere.** It adds latency and cost and can change meaning; enable it where follow-ups or vague queries are common, and measure.
- **Evaluating only answers.** When an answer is wrong, check retrieval first — it tells you where to fix.

## Production Considerations

- Log retrieved ids and scores per request (not full text) to analyse failures.
- Re-run the retrieval test set in CI when ingestion, splitter, embedding model or retrieval settings change ([AI Evaluation and Regression](../../spring-ai-production/ai-evaluation-and-regression/content.md)).
- Use the user's actual questions (with consent) to grow the test set.
- Latency budget: embedding + search + each transformer/expander call + re-ranking.

## Common Interview Traps

- **"Increase topK until it works."** It hides retrieval problems and raises cost and noise.
- **"Better LLM = better RAG."** Missing context cannot be fixed by the generator.
- **"Vector search handles exact identifiers."** Codes and names often need keyword or hybrid search.

## Key Takeaways

- Measure retrieval separately: hit rate, MRR, context size, on a labelled set.
- Tune topK and threshold together; thresholds are model-specific.
- Spring AI offers query transformers, a multi-query expander, a joiner and a post-processor hook.
- Hybrid search and re-ranking address vocabulary gaps and ties.

## Official References

- [Retrieval Augmented Generation: Modules](https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html)
- Related: [RAG Architecture](../rag-architecture/content.md) · [Text Splitting and Chunking](../text-splitting-and-chunking/content.md) · [RAG Evaluation and Failures](../rag-evaluation-and-failures/content.md)
