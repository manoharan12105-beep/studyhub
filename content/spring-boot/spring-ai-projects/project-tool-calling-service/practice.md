# Project 3: Tool-Calling Enrolment Service — Practice

### P1. Identity

**Difficulty:** Easy · **Type:** MCQ

How should `enrol` learn which learner to enrol?

- A) A `learnerId` tool parameter that the model fills in
- B) The system prompt says "the learner is s-42"
- C) `ToolContext`, filled from the authenticated principal
- D) The conversation history

<details>
<summary>Answer</summary>

**Answer:** C) `ToolContext`, filled from the authenticated principal

</details>

### P2. What memory keeps

**Difficulty:** Medium · **Type:** Behavior

After the lesson's three questions, the learner asks "what did the enrol tool return the first time?". Is the tool result in memory?

<details>
<summary>Answer</summary>

No. `MessageChatMemoryAdvisor` (order +200) runs outside the tool loop (`ToolCallingAdvisor` at +300). It stores each turn's user message and final answer, which is 6 messages. The model only sees its own earlier answer, "Done, you are enrolled in java-101".

</details>

### P3. Add unenrol safely

**Difficulty:** Medium · **Type:** Coding

Add an `unenrol` tool. Unenrolling loses progress, so the learner must confirm.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
@Tool(description = "Request removal of the current learner from a course. Returns a confirmation code; "
        + "the learner must confirm in the app before anything changes.")
String requestUnenrol(@ToolParam(description = "Course id such as java-101") String courseId, ToolContext ctx) {
    return service.requestUnenrol(learner(ctx), courseId);   // stores a PENDING request, no change yet
}
```

A separate confirmation endpoint, protected by Spring Security, performs the change exactly once ([Human Approval](../../spring-ai-advanced/human-approval-for-tools/content.md)).

</details>

### P4. Duplicate enrolment

**Difficulty:** Medium · **Type:** Debugging

A provider retry sometimes resends the whole request, and learners are charged twice for paid courses. What do you change?

<details>
<summary>Answer</summary>

- **Idempotent action.** Make the action idempotent in the service: use a unique constraint on (learner, course), or an idempotency key per request.
- **Charge once.** Charge only on the transition from not-enrolled to enrolled.
- **Audit.** Record each attempt in the audit log.
- **Placement.** Do not rely on the model, or on retries, to avoid duplicates.

</details>
