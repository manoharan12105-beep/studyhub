# Validating and Authorising Tool Calls — Practice

### P1. Where does identity go?

**Difficulty:** Easy · **Type:** MCQ

How should a tool learn which user is making the request?

- A) A `userId` parameter described with `@ToolParam`
- B) The system prompt says "The user is s-42"
- C) `.toolContext(Map.of("learnerId", id))` set by the application
- D) The model infers it from the conversation

<details>
<summary>Answer</summary>

**Answer:** C) `.toolContext(Map.of("learnerId", id))` set by the application

</details>

### P2. Predict the tool result

**Difficulty:** Easy · **Type:** Behavior

Learner `s-42` is enrolled only in `java-101`. The model calls `myGrade` with `{"courseId":"db-201"}`; the tool throws `IllegalArgumentException("You are not enrolled in db-201")`. What does the model receive as the tool result?

<details>
<summary>Answer</summary>

The text `You are not enrolled in db-201` — the exception message is sent back as the tool result by default, and the model then answers the user.

</details>

### P3. Find the vulnerability

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
@Tool(description = "Cancel an enrolment for the given learner")
String cancelEnrolment(String learnerId, String courseId) {
    enrolmentService.cancel(learnerId, courseId);
    return "Cancelled";
}
```

<details>
<summary>Answer</summary>

The model chooses `learnerId`, so anyone can cancel anyone's enrolment by asking (or by injecting text). No validation of `courseId`, no confirmation for an irreversible action. Remove `learnerId`, read it from `ToolContext`, validate `courseId`, check the enrolment belongs to that learner, and require confirmation.

</details>

### P4. Fix it

**Difficulty:** Medium · **Type:** Coding

Rewrite the tool from P3 safely.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
@Tool(description = "Cancel one of the current learner's enrolments. Only call after the learner explicitly confirms.")
String cancelEnrolment(@ToolParam(description = "Course id such as java-101") String courseId, ToolContext toolContext) {
    String learnerId = (String) toolContext.getContext().get("learnerId");
    if (courseId == null || !courseId.matches("[a-z]+-\\d{3}")) {
        throw new IllegalArgumentException("courseId must look like java-101");
    }
    if (!enrolmentService.isEnrolled(learnerId, courseId)) {
        throw new IllegalArgumentException("You are not enrolled in " + courseId);
    }
    enrolmentService.cancel(learnerId, courseId);
    return "Cancelled " + courseId;
}
```

The description's "only after confirmation" helps the model but does not enforce anything; for real enforcement add an approval step outside the model.

</details>

### P5. Leaky errors

**Difficulty:** Hard · **Type:** Scenario

A penetration tester asks the assistant for "the grade of course ' OR 1=1 --" and the reply quotes `PSQLException: ERROR: syntax error at or near "OR" ... table grades`. List the problems and fixes.

<details>
<summary>Answer</summary>

1. The SQL is built by string concatenation — use parameterised queries (JDBC/JPA).
2. The argument was not validated — reject anything that is not a course id.
3. The raw exception message reached the model and the user — catch data-access exceptions in the tool, log them, and throw a generic message, or set a custom `ToolExecutionExceptionProcessor` that sanitises messages.
4. Add a test reproducing the attack.

</details>
