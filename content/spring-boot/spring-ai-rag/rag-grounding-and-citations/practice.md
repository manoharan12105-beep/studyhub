# Grounding and Citations — Practice

### P1. Valid citations?

**Difficulty:** Easy · **Type:** Behavior

Retrieved ids: `pol-3`, `pol-4`. Answer: "Access tokens expire after 15 minutes [pol-4] and can be revoked at any time [pol-9]." What does an id check report?

<details>
<summary>Answer</summary>

`pol-9` is unsupported — it was never provided — so the answer is rejected (or the sentence removed).

</details>

### P2. Where do links come from?

**Difficulty:** Easy · **Type:** MCQ

Where should the UI get source links for an answer?

- A) From URLs the model writes in the answer
- B) From the retrieved documents' metadata, matched by cited id
- C) From a web search
- D) From the system prompt

<details>
<summary>Answer</summary>

**Answer:** B) From the retrieved documents' metadata, matched by cited id

</details>

### P3. Write a formatter

**Difficulty:** Medium · **Type:** Coding

Write a `documentFormatter` that numbers passages `[1]`, `[2]`, … and includes the `source` metadata, and explain how you map numbers back to documents.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
Function<List<Document>, String> numbered = documents -> IntStream.range(0, documents.size())
        .mapToObj(i -> "[" + (i + 1) + "] (" + documents.get(i).getMetadata().get("source") + ") "
                + documents.get(i).getText())
        .collect(Collectors.joining("\n"));

ContextualQueryAugmenter augmenter = ContextualQueryAugmenter.builder().documentFormatter(numbered).build();
```

Citation `[n]` maps to `DOCUMENT_CONTEXT.get(n - 1)` — the same list, in the same order, that the formatter received. Numbers outside 1..size are invalid.

</details>

### P4. Fabricated links

**Difficulty:** Medium · **Type:** Debugging

Users click "source" links in answers and get 404s. The links are part of the model's text. What is happening and what do you change?

<details>
<summary>Answer</summary>

The model is generating URLs, sometimes inventing plausible but non-existent ones. Stop asking for URLs: have the model cite ids only, validate them against the retrieved documents, and render links from each document's stored metadata (for example `url` added at ingestion).

</details>

### P5. Over-refusal

**Difficulty:** Hard · **Type:** Scenario

After adding "If you are not completely sure, say you don't know", unsupported claims dropped, but users complain that simple questions are refused even when the answer is in the sources. How do you find the right balance?

<details>
<summary>Answer</summary>

Measure both error types on a labelled set: unsupported claims and false refusals (answerable questions refused). Check retrieval first — refusals may come from missing context. Make the instruction precise ("answer when the sources contain the answer; otherwise say you don't know") instead of demanding certainty, add citation validation as the enforcement layer, and tune until both rates meet targets.

</details>
