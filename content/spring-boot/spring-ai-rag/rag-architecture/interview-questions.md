# RAG Architecture with RetrievalAugmentationAdvisor — Interview Questions

## Beginner

### Q1. Explain RAG in two sentences.

**Style:** Direct

<details>
<summary>Answer</summary>

Retrieval-augmented generation retrieves passages relevant to the user's question from your own data (usually by vector search) and adds them to the prompt. The model then answers from that context instead of only from what it learned in training, so answers can be current, private and citable.

</details>

### Q2. What are the components of `RetrievalAugmentationAdvisor`?

**Style:** Direct

<details>
<summary>Answer</summary>

Optional query transformers (rewrite, compress, translate), an optional query expander (multi-query), a required document retriever (for example `VectorStoreDocumentRetriever`), a document joiner (default concatenation with de-duplication), optional document post-processors, and a query augmenter (default `ContextualQueryAugmenter`) that builds the final prompt.

</details>

## Intermediate

### Q3. What happens by default when retrieval finds nothing?

**Style:** Behavior

<details>
<summary>Answer</summary>

`ContextualQueryAugmenter` has `allowEmptyContext=false`, so it replaces the user message with an instruction saying the query is outside the knowledge base and the model should politely decline. The model is still called. With `allowEmptyContext(true)` the original query is sent unchanged, without context.

</details>

### Q4. How does Spring AI handle a follow-up like "and the other one?"

**Style:** How

<details>
<summary>Answer</summary>

A `CompressionQueryTransformer` uses the conversation history in the query to produce a standalone query for retrieval (an extra model call). The compressed query is used to search; the final augmented prompt still contains the original wording, and chat memory supplies the history so the model can resolve the reference. Both memory and compression are needed.

</details>

## Advanced

### Q5. Design a production RAG pipeline for an internal knowledge assistant.

**Style:** Design

<details>
<summary>Answer</summary>

Ingestion: scheduled ETL with structure-aware readers, token splitting, metadata (source, department, version, permissions), idempotent replace-by-source, embedding model recorded. Query time: memory advisor (+200); `RetrievalAugmentationAdvisor` at +250 with a compression transformer on a cheap model, `VectorStoreDocumentRetriever` with topK/threshold from evaluation and a per-request permission filter from the authenticated user, a re-ranking post-processor, a citation-friendly document formatter, empty context refused, a managed task executor. Observability: retrieved ids, scores, model calls, tokens. Quality: labelled retrieval set and answer evaluations in CI; feedback loop from user ratings.

</details>
