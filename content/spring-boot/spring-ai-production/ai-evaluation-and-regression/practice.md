# AI Evaluation and Regression Testing — Practice

### P1. Property or exact text?

**Difficulty:** Easy · **Type:** MCQ

Which check is most robust for "the answer explains that a HashMap stores key-value pairs"?

- A) `answer.equals("A HashMap stores key-value pairs.")`
- B) `answer.contains("key") && answer.contains("value")`
- C) `answer.length() == 33`
- D) `answer.startsWith("A HashMap")`

<details>
<summary>Answer</summary>

**Answer:** B) `answer.contains("key") && answer.contains("value")`

</details>

### P2. Per-case comparison

**Difficulty:** Easy · **Type:** Behavior

Baseline passes cases 1–8 of 10; the candidate passes cases 3–10. Both score 80%. Is the candidate equivalent?

<details>
<summary>Answer</summary>

No. It fixed cases 9 and 10 but broke cases 1 and 2. Inspect what those cases represent (perhaps safety refusals) before deciding.

</details>

### P3. Write a check

**Difficulty:** Medium · **Type:** Coding

Write a `Predicate<String>` that passes only when the answer is valid JSON with a non-empty `"question"` field, using Jackson.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment — Jackson 3 (tools.jackson.databind), the default in Spring Boot 4
JsonMapper mapper = JsonMapper.builder().build();
Predicate<String> validQuiz = answer -> {
    try {
        JsonNode node = mapper.readTree(answer);
        return node.hasNonNull("question") && !node.get("question").asText().isBlank();
    }
    catch (Exception e) {
        return false;
    }
};
```

</details>

### P4. Missing coverage

**Difficulty:** Medium · **Type:** Scenario

An evaluation set has 60 cases, all ordinary Java questions. A new prompt passes 60/60, ships, and starts writing essays for students. What was missing?

<details>
<summary>Answer</summary>

Must-refuse and off-topic cases (and adversarial ones such as "ignore your rules"). The set only measured helpfulness, so the regression in scope control was invisible. Add stratified categories with per-category thresholds.

</details>

### P5. Evaluation budget

**Difficulty:** Hard · **Type:** Design

Your nightly evaluation uses 400 cases × 3 runs × (1 answer + 2 judge calls). Average 1,500 tokens per call. Estimate tokens per night and propose ways to cut cost without losing signal.

<details>
<summary>Answer</summary>

400 × 3 × 3 = 3,600 calls × 1,500 ≈ 5.4 million tokens per night. Reduce by: deterministic checks first and judges only for cases needing them; 3 runs only for cases with known variance; a cheaper calibrated judge model; running the full set before releases and a stratified sample nightly; caching answers when only judge settings change; and shorter judge prompts.

</details>
