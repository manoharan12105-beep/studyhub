# Registering Tools: Per-Call, Defaults, Beans and Functions — Practice

### P1. Union or replace?

**Difficulty:** Easy · **Type:** Behavior

A client has `.defaultTools(new CatalogTools())` (tool `listCourses`). A request adds `.tools(enrolTool)` (tool `enrol`). Which tools does the model receive?

<details>
<summary>Answer</summary>

Both: `enrol` and `listCourses`.

</details>

### P2. Removed API

**Difficulty:** Easy · **Type:** MCQ

Which tool registration API was removed in Spring AI 2.0?

- A) `.tools(Object...)`
- B) `.defaultTools(Object...)`
- C) `.toolNames(String...)`
- D) `FunctionToolCallback.builder(...)`

<details>
<summary>Answer</summary>

**Answer:** C) `.toolNames(String...)`

</details>

### P3. Build a function tool

**Difficulty:** Medium · **Type:** Coding

Write a `FunctionToolCallback` named `convertGrade` that takes a record `GradeRequest(int percentage)` and returns a letter grade (A ≥ 90, B ≥ 75, C ≥ 60, otherwise F).

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
record GradeRequest(@ToolParam(description = "Score from 0 to 100") int percentage) {
}

ToolCallback convertGrade = FunctionToolCallback.builder("convertGrade", (GradeRequest r) ->
                r.percentage() >= 90 ? "A" : r.percentage() >= 75 ? "B" : r.percentage() >= 60 ? "C" : "F")
        .description("Convert a percentage score to a letter grade")
        .inputType(GradeRequest.class)
        .build();
```

(For a fixed rule like this, also ask whether the model needs to be involved at all.)

</details>

### P4. Review the configuration

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
@Bean
ChatClient assistant(ChatClient.Builder builder, CatalogTools catalog, PaymentTools payments, AdminTools admin) {
    return builder.defaultTools(catalog, payments, admin).build();
}
```

The same client serves anonymous visitors and admins. What is wrong?

<details>
<summary>Answer</summary>

Every request — including anonymous ones — offers payment and admin tools, so a prompt injection or a confused model can trigger them, and every call pays the token cost of all definitions. Keep only low-risk tools as defaults, attach payment and admin tools per request after authorisation, or use separate clients per feature. Tools must also authorise the real user themselves.

</details>

### P5. Startup to runtime

**Difficulty:** Hard · **Type:** Scenario

After an upgrade, the model sometimes asks for `cancelSubscription`, which was not attached to the request, and the call fails with `IllegalStateException: No ToolCallback found for tool name: cancelSubscription`. A teammate proposes setting `spring.ai.tools.resolution.fallback.enabled=true`. What do you recommend?

<details>
<summary>Answer</summary>

Do not enable fallback: it would let the model execute any `ToolCallback` bean by name, including `cancelSubscription`, on requests that never offered it. Find out why the model names an unoffered tool (stale descriptions in the system prompt, conversation memory mentioning it, or a feature that genuinely needs it). If the feature needs it, attach it to that request after an authorisation check and require confirmation.

</details>
