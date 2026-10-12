# Validating AI Output: DTOs, Constraints and Business Rules — Practice

### P1. Which layer?

**Difficulty:** Easy · **Type:** MCQ

"The extracted order id must belong to the logged-in customer." Which layer enforces this?

- A) JSON Schema
- B) `@Pattern` on the field
- C) Business rule in Java code
- D) The system prompt

<details>
<summary>Answer</summary>

**Answer:** C) Business rule in Java code

**Explanation:** Only code with access to the database and the current principal can check ownership.

</details>

### P2. Bound the retries

**Difficulty:** Easy · **Type:** MCQ

Why cap re-asking after a validation failure?

- A) Spring AI forbids more than two calls
- B) Each retry is a full paid call that adds latency, and a model can keep failing
- C) Validation messages expire
- D) Retries disable structured output

<details>
<summary>Answer</summary>

**Answer:** B) Each retry is a full paid call that adds latency, and a model can keep failing

</details>

### P3. Add constraints

**Difficulty:** Medium · **Type:** Coding

Annotate this record so that `title` is required and at most 80 characters, `tags` has 1–5 non-blank entries, and `minutes` is between 5 and 120.

```java
// Illustrative fragment
record LessonOutline(String title, List<String> tags, int minutes) {}
```

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
record LessonOutline(
        @NotBlank @Size(max = 80) String title,
        @Size(min = 1, max = 5) List<@NotBlank String> tags,
        @Min(5) @Max(120) int minutes) {}
```

</details>

### P4. Missing validation

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
@PostMapping("/summaries")
Summary summarise(@Valid @RequestBody SummaryRequest request) {
    Summary s = chatClient.prompt().user(request.text()).call().entity(Summary.class);
    return summaryRepository.save(s);
}
```

What is validated and what is not?

<details>
<summary>Answer</summary>

The request is validated by `@Valid`. The model's `Summary` is not validated at all before it is saved — it could be empty, too long or contain invalid values. Validate `s` (injected `Validator`, business rules) before `save`, and handle failures.

</details>

### P5. Design a fallback

**Difficulty:** Hard · **Type:** Design

A course platform generates five quiz questions per lesson with AI. Sometimes one question fails validation twice. Design what the platform should do so learners never see a broken quiz.

<details>
<summary>Answer</summary>

Validate each question independently. Keep valid ones; for a question that fails twice, drop it and either draw a replacement from a reviewed question bank for that lesson or show four questions instead of five. Record the failure with the prompt version for review. Never show unvalidated questions; optionally queue generated questions for teacher review before publishing.

</details>
