# QuestionAnswerAdvisor: RAG in One Advisor — Interview Questions

## Beginner

### Q1. What does `QuestionAnswerAdvisor` do on each call?

**Style:** Direct

<details>
<summary>Answer</summary>

It runs a similarity search on its `VectorStore` with the user's question, inserts the matching documents into the user message using a template ("Context information is below…"), calls the model, and puts the retrieved documents in the response context under `RETRIEVED_DOCUMENTS`.

</details>

### Q2. What are the default `topK` and similarity threshold?

**Style:** Direct

<details>
<summary>Answer</summary>

`topK` 4 and threshold 0.0, which accepts every result — so by default the four nearest documents are always sent, however weak the match.

</details>

## Intermediate

### Q3. How do you restrict retrieval to the current user's tenant?

**Style:** How

<details>
<summary>Answer</summary>

Store a `tenantId` in each document's metadata at ingestion and pass a filter on every request: `.advisors(a -> a.param(QuestionAnswerAdvisor.FILTER_EXPRESSION, "tenantId == 'acme'"))`, with the tenant taken from the authenticated user and validated (or built with `FilterExpressionBuilder`) — never from the prompt.

</details>

### Q4. The vector store returns nothing. What does the user get?

**Style:** Scenario

<details>
<summary>Answer</summary>

The model is still called with an empty context block and the instruction to say it cannot answer. Most models comply, but some answer from prior knowledge anyway. If the feature must not answer without sources, check `RETRIEVED_DOCUMENTS` (or use `RetrievalAugmentationAdvisor`, whose `ContextualQueryAugmenter` refuses empty contexts unless `allowEmptyContext(true)` is set) and return a fixed message.

</details>

## Advanced

### Q5. When would you replace `QuestionAnswerAdvisor` with `RetrievalAugmentationAdvisor`?

**Style:** Compare

<details>
<summary>Answer</summary>

When retrieval needs more than "search with the raw question": rewriting or compressing follow-up questions using conversation history, translating queries, expanding into multiple queries, searching several sources, joining and post-processing documents, or controlling empty-context behaviour. `RetrievalAugmentationAdvisor` (module `spring-ai-rag`) composes these steps from pluggable components; `QuestionAnswerAdvisor` is the simpler fixed pipeline.

</details>
