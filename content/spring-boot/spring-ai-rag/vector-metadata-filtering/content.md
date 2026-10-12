# Metadata Filtering in Vector Search

**Module:** Spring AI: Embeddings and RAG · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Restrict similarity search with metadata filter expressions.
- Write filters as text and with `FilterExpressionBuilder`.
- Use filters for multi-tenancy, permissions, versions and deletion.
- Prevent filter injection when filters depend on request data.

## Definition

A **metadata filter** limits a vector search to documents whose metadata matches a condition, in addition to vector similarity. Spring AI defines a portable filter language and converts it into each store's native syntax (SQL `WHERE` for pgvector, query DSL for Elasticsearch, and so on).

| Operator | Example |
|----------|---------|
| `==`, `!=` | `tenant == 'acme'` |
| `<`, `<=`, `>`, `>=` | `year >= 2025` |
| `in`, `nin` | `level in ['beginner', 'intermediate']` |
| `&&` / `AND`, `\|\|` / `OR`, `NOT`, parentheses | `tenant == 'acme' && (level == 'beginner' \|\| year >= 2025)` |

Filters are accepted by `SearchRequest.builder().filterExpression(...)`, by `VectorStore.delete(...)`, by `VectorStoreDocumentRetriever`, and per request by `QuestionAnswerAdvisor.FILTER_EXPRESSION` and `VectorStoreDocumentRetriever.FILTER_EXPRESSION` (advisor context keys).

## Why It Matters

Similarity alone does not know who is asking. Without filters, tenant A's question can retrieve tenant B's documents, a learner can retrieve teacher-only answer keys, and old policy versions compete with current ones. Filters are the access-control and scoping layer of RAG — and, when built from strings, a new injection surface.

## How It Works

```text
similaritySearch(query, topK, threshold, filter)
   └─ store restricts candidates to documents matching the filter
   └─ ranks the remaining ones by similarity
```

- Metadata keys must exist on the stored documents (added at ingestion) — filters on keys you never stored match nothing.
- Some stores need filterable fields declared up front (for example Redis metadata fields or Elasticsearch mappings); pgvector filters the JSON `metadata` column.
- Not every store supports every operator; unsupported expressions fail at conversion time.

## Example

Three documents from two tenants; the same search with different filters, a builder-made filter, an injection attempt and a filtered delete:

```java
import java.util.List;
import java.util.Map;

import com.example.studyai.lab.KeywordEmbeddingModel;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;

public class FilterDemo {

    static List<String> search(VectorStore store, String filter) {
        return store.similaritySearch(SearchRequest.builder().query("sql query index")
                        .topK(10).filterExpression(filter).build())
                .stream().map(Document::getId).sorted().toList();
    }

    static List<String> search(VectorStore store, Filter.Expression filter) {
        return store.similaritySearch(SearchRequest.builder().query("sql query index")
                        .topK(10).filterExpression(filter).build())
                .stream().map(Document::getId).sorted().toList();
    }

    public static void main(String[] args) {
        SimpleVectorStore store = SimpleVectorStore.builder(new KeywordEmbeddingModel()).build();
        store.add(List.of(
                new Document("acme-1", "Add an index to the orders table.", Map.of("tenant", "acme", "level", "beginner", "year", 2026)),
                new Document("acme-2", "Read the SQL query plan.", Map.of("tenant", "acme", "level", "advanced", "year", 2024)),
                new Document("globex-1", "Globex internal SQL query guide.", Map.of("tenant", "globex", "level", "beginner", "year", 2026))));

        System.out.println("No filter:            " + search(store, (String) null));
        System.out.println("tenant == 'acme':     " + search(store, "tenant == 'acme'"));
        System.out.println("acme, year >= 2025:   " + search(store, "tenant == 'acme' && year >= 2025"));
        System.out.println("level in [...]:       " + search(store, "level in ['beginner', 'intermediate']"));

        var b = new FilterExpressionBuilder();
        Filter.Expression built = b.and(b.eq("tenant", "acme"), b.eq("level", "advanced")).build();
        System.out.println("Builder:              " + search(store, built) + "  <- " + built);

        // A filter string built from user input is an injection risk
        String userInput = "acme' || tenant == 'globex";
        System.out.println("Injected:             " + search(store, "tenant == '" + userInput + "'"));
        System.out.println("Builder, same input:  " + search(store, b.eq("tenant", userInput).build()));

        store.delete("tenant == 'globex'");
        System.out.println("After delete globex:  " + search(store, (String) null));
    }
}
```

**Output:**

```text
No filter:            [acme-1, acme-2, globex-1]
tenant == 'acme':     [acme-1, acme-2]
acme, year >= 2025:   [acme-1]
level in [...]:       [acme-1, globex-1]
Builder:              [acme-2]  <- Expression[type=AND, left=Expression[type=EQ, left=Key[key=tenant], right=Value[value=acme]], right=Expression[type=EQ, left=Key[key=level], right=Value[value=advanced]]]
Injected:             [acme-1, acme-2, globex-1]
Builder, same input:  []
After delete globex:  [acme-1, acme-2]
```

### Code walkthrough

- Without a filter, the Globex document appears in an Acme user's results — exactly the multi-tenant leak filters prevent.
- Numeric metadata (`year`) supports range comparisons; `in` matches any listed value.
- `FilterExpressionBuilder` produced a typed `Filter.Expression` tree — no string parsing involved.
- **Injection:** concatenating `acme' || tenant == 'globex` into a filter string closed the quote and added a second condition, returning the other tenant's document. The builder treated the same input as one literal value, so nothing matched.
- `delete("tenant == 'globex'")` removed every Globex chunk — the basis for per-source updates and tenant offboarding.

### Per-request filters with advisors

```java
// Illustrative fragment
String tenant = currentUser.tenantId();          // from the authenticated principal, never from the prompt
Filter.Expression scope = new FilterExpressionBuilder().eq("tenant", tenant).build();

String answer = chatClient.prompt()
        .user(question)
        .advisors(a -> a.param(VectorStoreDocumentRetriever.FILTER_EXPRESSION, scope))
        .call().content();
```

## Common Mistakes and Troubleshooting

- **String concatenation with request data.** Use `FilterExpressionBuilder`, or strictly validate the value first.
- **Tenant id taken from the question or a request parameter.** Take it from the authenticated principal.
- **Filtering on a key that was never stored.** The filter silently matches nothing.
- **Type mismatches.** `year == '2026'` against an integer `year` threw `IllegalArgumentException: Cannot compare values of incompatible types java.lang.Integer and java.lang.String` in `SimpleVectorStore`; other stores may convert or silently match nothing. Store and query metadata with consistent types.
- **Relying on the system prompt for access control.** Filters decide what the model can see; prompts cannot.
- **One shared index without any tenant key.** Re-ingest with tenant metadata, or use one index/collection per tenant.

## Production Considerations

- Index the metadata fields you filter on (for pgvector, consider an expression index on the JSON key) — filters on large tables can dominate latency.
- Approximate (HNSW) search with a very selective filter can return fewer than `topK` results; test recall with realistic filters.
- Add tests asserting that a user of tenant A can never retrieve tenant B's documents.
- Combine with version metadata (`version == 'current'`) to keep superseded documents out of answers.

## Common Interview Traps

- **"Filters are applied by the LLM."** They are applied by the vector store before the model sees anything.
- **"Filter strings are safe because they're not SQL."** They are parsed expressions; concatenating user input allows injection, as shown.
- **"Filtering after retrieval is equivalent."** Post-filtering top-K results can leave nothing; filter inside the search.

## Key Takeaways

- Filters restrict similarity search by metadata: `==`, `!=`, comparisons, `in`/`nin`, `&&`, `||`, `NOT`.
- Use `FilterExpressionBuilder` (or validation) for anything derived from a request.
- Tenancy, permissions and versions are filters built from server-side identity.
- Filters also drive deletion and updates by source or tenant.

## Official References

- [Vector Databases: Metadata Filters](https://docs.spring.io/spring-ai/reference/api/vectordbs.html)
- [Retrieval Augmented Generation: VectorStoreDocumentRetriever](https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html)
- Related: [The Document Ingestion Pipeline](../document-ingestion-pipeline/content.md) · [QuestionAnswerAdvisor](../../spring-ai-tools-and-advisors/question-answer-advisor/content.md) · [Conversation IDs and Isolation](../../spring-ai-prompts-and-memory/conversation-ids-and-isolation/content.md)
