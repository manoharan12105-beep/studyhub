# RAG Architecture with RetrievalAugmentationAdvisor — Practice

### P1. Count model calls

**Difficulty:** Easy · **Type:** Behavior

A client uses `RetrievalAugmentationAdvisor` with one `CompressionQueryTransformer` and no expander. How many chat-model calls does one question cost?

<details>
<summary>Answer</summary>

Two: one for query compression, one for the answer (more if tools are called).

</details>

### P2. Required component

**Difficulty:** Easy · **Type:** MCQ

Which component must `RetrievalAugmentationAdvisor.builder()` receive?

- A) A `QueryTransformer`
- B) A `QueryExpander`
- C) A `DocumentRetriever`
- D) A `DocumentPostProcessor`

<details>
<summary>Answer</summary>

**Answer:** C) A `DocumentRetriever`

</details>

### P3. Build the pipeline

**Difficulty:** Medium · **Type:** Coding

Build a `RetrievalAugmentationAdvisor` that searches `vectorStore` with topK 4 and threshold 0.65, allows empty context, and uses a provided `taskExecutor`.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
RetrievalAugmentationAdvisor rag = RetrievalAugmentationAdvisor.builder()
        .documentRetriever(VectorStoreDocumentRetriever.builder()
                .vectorStore(vectorStore)
                .topK(4)
                .similarityThreshold(0.65)
                .build())
        .queryAugmenter(ContextualQueryAugmenter.builder().allowEmptyContext(true).build())
        .taskExecutor(taskExecutor)
        .build();
```

With empty context allowed, off-topic questions reach the model unchanged — make sure that is intended.

</details>

### P4. Process never exits

**Difficulty:** Medium · **Type:** Debugging

A command-line ingestion-and-test tool using `RetrievalAugmentationAdvisor` prints its results but the JVM never exits. Why?

<details>
<summary>Answer</summary>

Without `.taskExecutor(...)`, the advisor creates its own `ThreadPoolTaskExecutor` whose non-daemon worker threads stay alive and are never shut down outside a Spring context. Pass a managed executor (or a virtual-thread `SimpleAsyncTaskExecutor`), or shut the pool down explicitly.

</details>

### P5. Unexpected general knowledge

**Difficulty:** Hard · **Type:** Scenario

A RAG assistant for company policies answers "What is the capital of France?" with "Paris". Product wants it to answer only from policies. What configuration and checks do you review?

<details>
<summary>Answer</summary>

Check whether `allowEmptyContext` was set to true (then the original question goes to the model without context), whether the similarity threshold is so low that irrelevant chunks always pass (so the context is never empty), and the system prompt. Restore the default refusal or short-circuit when `DOCUMENT_CONTEXT` is empty, calibrate the threshold on the test set, and add off-topic questions to the evaluation set to keep this from regressing.

</details>
