# Retrieval Quality: Measuring and Improving Search — Practice

### P1. Compute MRR

**Difficulty:** Easy · **Type:** Conceptual

For four questions, the first relevant chunk was at ranks 1, 2, not found, and 4. Compute the hit rate and MRR.

<details>
<summary>Answer</summary>

Hit rate = 3/4. MRR = (1/1 + 1/2 + 0 + 1/4) ÷ 4 = 1.75 ÷ 4 = 0.4375 ≈ 0.44.

</details>

### P2. Pick the setting

**Difficulty:** Easy · **Type:** Behavior

Setting A: hit rate 5/6, 3.0 chunks per question. Setting B: hit rate 5/6, 1.5 chunks per question. Which do you choose and why?

<details>
<summary>Answer</summary>

B — same recall with half the context: fewer tokens, lower cost, less noise for the model. Confirm with answer-quality checks.

</details>

### P3. Joiner behaviour

**Difficulty:** Medium · **Type:** MCQ

`MultiQueryExpander` produces three queries; two of them retrieve the same chunk `c-7`. What does `ConcatenationDocumentJoiner` do?

- A) Keeps both copies
- B) Keeps one copy and sorts the merged list by score
- C) Throws an exception
- D) Keeps only documents found by all queries

<details>
<summary>Answer</summary>

**Answer:** B) Keeps one copy and sorts the merged list by score

</details>

### P4. Write a re-ranking hook

**Difficulty:** Medium · **Type:** Coding

Write a `DocumentPostProcessor` that keeps the three highest-scoring documents whose metadata `version` equals `"current"`.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
DocumentPostProcessor currentTop3 = (query, documents) -> documents.stream()
        .filter(d -> "current".equals(d.getMetadata().get("version")))
        .sorted(Comparator.comparing(Document::getScore, Comparator.nullsLast(Comparator.reverseOrder())))
        .limit(3)
        .toList();
```

Filtering by version is better done as a metadata filter in the search itself; post-processing is the fallback when the store cannot filter on it.

</details>

### P5. Identifiers

**Difficulty:** Hard · **Type:** Scenario

Support questions like "What does error ORD-4471 mean?" rarely retrieve the right runbook page, although the page contains "ORD-4471". Explain and propose a fix.

<details>
<summary>Answer</summary>

Embeddings capture meaning, not exact rare tokens; "ORD-4471" may be split into sub-tokens with little semantic signal, so similar-looking codes score alike. Add keyword search (full-text index on chunk text, or a code → page lookup table) and merge it with vector results (hybrid search), or extract error codes into metadata at ingestion and filter on them when the question contains a code. Measure with a labelled set of code questions.

</details>
