# Spring AI RAG Interview Questions — Interview Questions

## Beginner

### Q1. What is RAG, and why use it?

**Style:** Direct

<details>
<summary>Answer</summary>

Retrieval-augmented generation retrieves relevant passages from your own data and puts them in the prompt, so the model answers from them.

Use it when:

- answers depend on private or changing data;
- you need citations;
- you want to update knowledge without retraining.

</details>

### Q2. What is an embedding?

**Style:** Concept

<details>
<summary>Answer</summary>

An embedding is a vector of numbers that represents the meaning of a text; similar meanings give nearby vectors. `EmbeddingModel` creates embeddings, and a `VectorStore` stores them and searches by similarity (for example, cosine).

The same embedding model must be used for ingestion and for queries.

</details>

### Q3. Why split documents into chunks?

**Style:** Concept

<details>
<summary>Answer</summary>

- Embedding models have input limits.
- Smaller chunks give more precise matches.
- The prompt has limited room.

`TokenTextSplitter` (chunk size 800 tokens by default, no overlap; build it with the builder) splits at sentence punctuation where it can.

</details>

## Intermediate

### Q4. `QuestionAnswerAdvisor` vs `RetrievalAugmentationAdvisor`?

**Style:** Compare

<details>
<summary>Answer</summary>

- **`QuestionAnswerAdvisor`** (module `spring-ai-vector-store-advisor`) is a simple vector search plus a template with `{query}` and `{question_answer_context}`.
- **`RetrievalAugmentationAdvisor`** (module `spring-ai-rag`) is modular. It combines query transformers, expanders, a `DocumentRetriever`, a joiner, post-processors and a `QueryAugmenter`.

Both default to order 0, which is inside the tool loop.

</details>

### Q5. A question unrelated to your documents still gets a confident answer. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

The default similarity threshold is 0.0, so the top-K chunks are always returned even when they are irrelevant. Set a threshold tuned on real questions.

With `ContextualQueryAugmenter`, decide on empty-context behaviour. By default (`allowEmptyContext` false), the query is replaced with an "outside your knowledge base" instruction.

</details>

### Q6. How do you restrict retrieval to one tenant or course?

**Style:** How

<details>
<summary>Answer</summary>

Store metadata on each chunk (for example `tenantId`) and pass a filter:

- **Per search:** `SearchRequest.builder().filterExpression(...)`.
- **Per request:** the `VectorStoreDocumentRetriever.FILTER_EXPRESSION` context key.

Build the filter with `FilterExpressionBuilder`. Concatenating user input into a filter string allows filter injection, as the lesson demonstrated.

</details>

### Q7. How do you show citations you can trust?

**Style:** Design

<details>
<summary>Answer</summary>

- Label each retrieved chunk with its id in the context.
- Instruct the model to cite ids.
- Check every cited id against the retrieved documents (`DOCUMENT_CONTEXT` in the response context).
- Reject or flag answers that cite unknown ids.
- Show only verified sources.

</details>

## Advanced

### Q8. How do you evaluate a RAG system?

**Style:** Process

<details>
<summary>Answer</summary>

Build a fixed set of questions with expected sources and answers, and measure:

- **Retrieval:** whether the right chunk is in the top-K (hit rate, precision).
- **Answer quality:** groundedness and relevance, using `RelevancyEvaluator` / `FactCheckingEvaluator` or a judge model.
- **Refusals:** behaviour on out-of-scope questions.

Run the set whenever chunking, the threshold, the embedding model or the prompt changes.

Note: Spring AI's evaluators pass only when the judge replies exactly "yes" (case-insensitive). "Yes." failed in testing.

</details>

### Q9. Retrieval returns good chunks, but answers are still wrong. What do you check?

**Style:** Debugging

<details>
<summary>Answer</summary>

- **What was sent:** print the actual prompt. Was the context included? A custom QA template missing `{query}` silently drops the question.
- **Context noise:** chunk order and too many chunks.
- **System prompt conflicts:** instructions that contradict the context.
- **Memory:** history that contradicts the context.
- **Output token limit:** answers cut short.
- **The model itself:** compare with a stronger model on the evaluation set.

</details>

### Q10. RAG vs fine-tuning vs memory vs tools?

**Style:** Compare

<details>
<summary>Answer</summary>

| Approach | Use it for |
|----------|------------|
| RAG | Knowledge that changes or must be cited |
| Tools | Live, exact data and actions |
| Memory | Conversation continuity for one user |
| Fine-tuning | Style, format or domain behaviour; not frequently changing facts |

They combine. A support bot can use RAG for policies, tools for order status and memory for the conversation.

</details>

### Q11. What does pgvector need in production?

**Style:** Experience

<details>
<summary>Answer</summary>

- **Extensions:** `vector` (plus `hstore` and `uuid-ossp`, which the Spring AI schema uses), created by a migration. Keep `initialize-schema=false` (the default) in production.
- **Dimensions:** must match the embedding model.
- **Index and distance:** an HNSW index with the matching distance (the default is cosine).
- **Tenancy:** metadata filters for tenants.
- **Changing the embedding model:** a re-embedding plan.

Check the defaults against your version's documentation.

</details>
