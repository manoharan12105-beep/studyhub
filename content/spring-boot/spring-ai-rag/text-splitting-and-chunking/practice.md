# Text Splitting and Chunking — Practice

### P1. Units

**Difficulty:** Easy · **Type:** MCQ

In `TokenTextSplitter`, `chunkSize` is measured in:

- A) Characters
- B) Words
- C) Tokens
- D) Sentences

<details>
<summary>Answer</summary>

**Answer:** C) Tokens

</details>

### P2. Prompt budget

**Difficulty:** Easy · **Type:** Conceptual

Chunks are about 600 tokens and retrieval uses `topK(6)`. Roughly how many tokens does retrieved context add to each request?

<details>
<summary>Answer</summary>

About 6 × 600 = 3,600 tokens, plus the template text — on every request, before the question and history.

</details>

### P3. Replace the deprecated call

**Difficulty:** Easy · **Type:** Coding

Rewrite `new TokenTextSplitter(500, 200, 10, 5000, true, List.of('.', '\n'))` for Spring AI 2.0.1 without deprecated constructors.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
TokenTextSplitter splitter = TokenTextSplitter.builder()
        .withChunkSize(500)
        .withMinChunkSizeChars(200)
        .withMinChunkLengthToEmbed(10)
        .withMaxNumChunks(5000)
        .withKeepSeparator(true)
        .withPunctuationMarks(List.of('.', '\n'))
        .build();
```

</details>

### P4. Misleading fragment

**Difficulty:** Medium · **Type:** Debugging

A learner on a corporate licence asks "Can I get a refund after three weeks?" The assistant answers "No, refunds are not available", but the policy says corporate licences follow their contract terms instead. Retrieval returned only the chunk "After 14 days, refunds are not available, but the course can be transferred to another learner once." What is the chunking problem and how do you fix it?

<details>
<summary>Answer</summary>

The policy's conditions were split across chunks, and the retrieved fragment lacks the corporate exception, so the model answered from a partial rule. Keep a policy section together (larger chunks or section-based splitting), add the section title to chunk text, retrieve more than one chunk with a threshold, and evaluate with questions that depend on exceptions.

</details>

### P5. Choose sizes

**Difficulty:** Hard · **Type:** Design

You have two sources: an FAQ with 300 short question/answer pairs and a 120-page architecture handbook. How would you chunk each?

<details>
<summary>Answer</summary>

FAQ: one document per question/answer pair, no further splitting — each pair is a natural, self-contained chunk, with the question in the text. Handbook: split by headings first, then `TokenTextSplitter` at a medium size (for example 400–800 tokens) for long sections, with the heading path in metadata and in the chunk text. Evaluate both with a labelled question set; settings can differ per source type.

</details>
