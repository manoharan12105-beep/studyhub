# When Not to Use an LLM — Practice

### P1. Code or model?

**Difficulty:** Easy · **Type:** MCQ

Which task should use the model?

- A) Sum the prices in a shopping cart
- B) Check that a course id matches `[a-z]+-\d{3}`
- C) Rewrite a dense paragraph for a beginner
- D) Find all orders placed yesterday

<details>
<summary>Answer</summary>

**Answer:** C) Rewrite a dense paragraph for a beginner

</details>

### P2. Count the calls

**Difficulty:** Easy · **Type:** Behavior

With the lesson's router, a learner asks "How many days until the db-201 exam?" and `EXAM_DATES` contains only `java-101`. Which path answers?

<details>
<summary>Answer</summary>

The model path: the regex matches, but `db-201` is not in `EXAM_DATES`, so `deterministic` returns empty and the question goes to the model — which should be handled better (for example "I don't have an exam date for db-201") rather than letting the model guess a date.

</details>

### P3. Hybrid design

**Difficulty:** Medium · **Type:** Coding

Write a tool that returns the days until a course's exam, so the model never calculates dates itself.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
@Tool(description = "Days from today until the exam of a course; use for any question about exam timing")
String daysUntilExam(@ToolParam(description = "Course id such as java-101") String courseId) {
    return examService.examDate(courseId)
            .map(date -> ChronoUnit.DAYS.between(LocalDate.now(clock), date) + " days")
            .orElse("No exam date is scheduled for " + courseId);
}
```

</details>

### P4. Hallucinated policy

**Difficulty:** Medium · **Type:** Debugging

The assistant tells a learner that refunds are possible within 30 days; the policy says 14. The policy is in the system prompt as a long paragraph. What do you change?

<details>
<summary>Answer</summary>

Make the decision deterministic: an eligibility method in code returns the outcome and the relevant rule; the assistant calls it as a tool and explains the result. Keep the policy text in RAG with citations for explanations, and add evaluation cases for policy questions. The model should never be the source of truth for numbers in a policy.

</details>

### P5. Challenge the proposal

**Difficulty:** Hard · **Type:** Scenario

A team proposes replacing the course search page with a chat assistant "because AI is the future". Search is used 50,000 times a day with filters for level, language and duration. How do you respond?

<details>
<summary>Answer</summary>

Keep the search page: filtered search is exact, fast, cheap and what users need for browsing. Measure where users struggle (zero-result queries, vague descriptions) and add AI there — query understanding that maps free text to filters, or a "describe what you want" box that fills the filters — while results still come from the search engine. Compare conversion and cost with an A/B test before expanding.

</details>
