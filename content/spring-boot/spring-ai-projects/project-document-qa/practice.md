# Project 2: Document Q&A with RAG — Practice

### P1. Off-topic answers

**Difficulty:** Easy · **Type:** MCQ

Users report that "What is a good pasta recipe?" gets an answer made from the security handbook. What is the most likely cause?

- A) The chunk size is too large
- B) The similarity threshold is 0.0, so something is always retrieved
- C) `topK` is 3
- D) The system prompt is too short

<details>
<summary>Answer</summary>

**Answer:** B) The similarity threshold is 0.0, so something is always retrieved

</details>

### P2. Empty context

**Difficulty:** Medium · **Type:** Behavior

The lesson's service is changed to `ContextualQueryAugmenter.builder().build()` (the default). An off-topic question retrieves nothing. What happens?

<details>
<summary>Answer</summary>

`allowEmptyContext` defaults to `false`, so the augmenter replaces the user query with Spring AI's own instruction to say the query is outside the knowledge base. The model is still called. The reply wording now comes from that built-in instruction rather than your system prompt's "I don't know based on the documents."

</details>

### P3. Delete a document

**Difficulty:** Medium · **Type:** Coding

Add `remove(String docId)` to `IngestionService`.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
void remove(String docId) {
    var b = new FilterExpressionBuilder();
    store.delete(b.eq("docId", docId).build());
}
```

Build the filter with `FilterExpressionBuilder`, not by concatenating strings. A crafted `docId` could otherwise widen the filter and delete other documents.

</details>

### P4. Wrong source cited

**Difficulty:** Hard · **Type:** Debugging

Answers are correct, but the sources list often includes an unrelated handbook. Suggest two fixes and how you would verify them.

<details>
<summary>Answer</summary>

Fixes:

- Raise the similarity threshold, or lower `topK`.
- Return as sources only the documents the answer actually cites, using the citation check from [Grounding and Citations](../../spring-ai-rag/rag-grounding-and-citations/content.md).

To verify, run the evaluation set of question → expected source before and after the change. Compare source precision as well as answer correctness.

</details>
