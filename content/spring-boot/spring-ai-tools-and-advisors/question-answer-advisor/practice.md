# QuestionAnswerAdvisor: RAG in One Advisor — Practice

### P1. Where does the context go?

**Difficulty:** Easy · **Type:** MCQ

With the default template, where does `QuestionAnswerAdvisor` put the retrieved documents?

- A) In a new system message
- B) Appended to the user message
- C) In `ToolContext`
- D) In the response context only

<details>
<summary>Answer</summary>

**Answer:** B) Appended to the user message

</details>

### P2. Threshold and topK

**Difficulty:** Easy · **Type:** Behavior

`topK(2)`, `similarityThreshold(0.5)`. Three documents score 0.81, 0.32 and 0.10 for a question. How many are sent to the model?

<details>
<summary>Answer</summary>

One — only the document scoring 0.81 passes the threshold; `topK` is an upper bound, not a guarantee.

</details>

### P3. Filter per request

**Difficulty:** Medium · **Type:** Coding

Write the request that limits retrieval to documents whose metadata `course` equals the course the learner is viewing (`courseId`, already validated against `[a-z]+-\d{3}`).

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
String answer = chatClient.prompt()
        .user(question)
        .advisors(a -> a.param(QuestionAnswerAdvisor.FILTER_EXPRESSION, "course == '" + courseId + "'"))
        .call().content();
```

Concatenation is acceptable only because `courseId` is validated against a strict pattern; otherwise build the expression with `FilterExpressionBuilder`.

</details>

### P4. Broken template

**Difficulty:** Medium · **Type:** Debugging

A team set a custom `promptTemplate` reading "Answer using only these notes: {question_answer_context}". Answers are now generic summaries of the notes, ignoring the question. Why?

<details>
<summary>Answer</summary>

The template replaces the user message, and it has no `{query}` placeholder, so the question never reaches the model. Add `{query}` to the template.

</details>

### P5. Follow-up questions

**Difficulty:** Hard · **Type:** Scenario

With chat memory and `QuestionAnswerAdvisor`, the first question "What is a JWT?" works, but the follow-up "How long should it live?" retrieves nothing useful. Explain and fix.

<details>
<summary>Answer</summary>

`QuestionAnswerAdvisor` searches with the raw latest user message; "it" carries no topic, so similarity search misses the JWT documents even though memory gives the model the history. Rewrite the query using history before retrieval: `RetrievalAugmentationAdvisor` with a `CompressionQueryTransformer` (or `RewriteQueryTransformer`) turns it into "How long should a JWT token live?" before searching.

</details>
