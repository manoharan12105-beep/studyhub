# Few-Shot Prompting and Output Formats — Practice

### P1. Message roles for examples

**Difficulty:** Easy · **Type:** MCQ

How should an example's expected output be sent?

- A) As a `SystemMessage`
- B) As a `UserMessage`
- C) As an `AssistantMessage`
- D) As a `ToolResponseMessage`

<details>
<summary>Answer</summary>

**Answer:** C) As an `AssistantMessage`

</details>

### P2. Count the messages

**Difficulty:** Easy · **Type:** Behavior

A request has a system message, four example pairs and the real question. How many messages reach the model?

<details>
<summary>Answer</summary>

10: 1 system + 8 example messages + 1 user question.

</details>

### P3. Biased examples

**Difficulty:** Medium · **Type:** Debugging

A sentiment classifier uses five examples: four POSITIVE and one NEGATIVE. In production it labels many neutral reviews as POSITIVE. Explain and fix.

<details>
<summary>Answer</summary>

The examples are unbalanced and there is no NEUTRAL example, so the model leans toward the most frequent label. Add a balanced set with at least one example per label (including NEUTRAL and a mixed review), vary their order, and evaluate on a labelled set.

</details>

### P4. Combine techniques

**Difficulty:** Medium · **Type:** Coding

Write a request that returns a typed `Classification(Label label, String reason)` using structured output with schema validation, plus the `EXAMPLES` messages from the lesson.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
Classification c = chatClient.prompt()
        .system("Classify Java interview questions as CORE, ADVANCED or OFF_TOPIC with a short reason.")
        .messages(EXAMPLES)
        .user(question)
        .call()
        .entity(Classification.class, spec -> spec.validateSchema());
```

The example assistant messages should then be JSON matching `Classification`, so they show the same format the schema asks for.

</details>

### P5. Cost estimate

**Difficulty:** Hard · **Type:** Scenario

Your few-shot block is 450 tokens and the endpoint handles 80,000 requests a day. Estimate the daily tokens spent on examples and give two ways to reduce it.

<details>
<summary>Answer</summary>

450 × 80,000 = 36,000,000 input tokens per day. Reduce it by trimming to the few most informative examples, retrieving only the 2–3 examples most similar to each input, switching to structured output with enum descriptions where examples are not needed, or using provider prompt caching for the stable prefix where available.

</details>
