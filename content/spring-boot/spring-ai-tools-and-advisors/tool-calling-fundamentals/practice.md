# Tool Calling Fundamentals — Practice

### P1. Who executes?

**Difficulty:** Easy · **Type:** MCQ

In Spring AI 2.0 with `ChatClient`, which component executes a tool the model asked for?

- A) The model provider
- B) `ChatModel.call(...)`
- C) `ToolCallingAdvisor`, using `ToolCallingManager`
- D) `MessageChatMemoryAdvisor`

<details>
<summary>Answer</summary>

**Answer:** C) `ToolCallingAdvisor`, using `ToolCallingManager`

</details>

### P2. Message sequence

**Difficulty:** Easy · **Type:** Behavior

List the message types in the second request of a single-tool round trip.

<details>
<summary>Answer</summary>

`USER` (the question), `ASSISTANT` (the tool-call request), `TOOL` (the tool result). Plus any system message and memory if configured.

</details>

### P3. Tool or not?

**Difficulty:** Medium · **Type:** Conceptual

For each need, choose tool, RAG or plain code: (a) today's timetable for the signed-in learner, (b) explaining the course's grading policy from the handbook, (c) converting a percentage to a letter grade with fixed rules.

<details>
<summary>Answer</summary>

(a) Tool — live, user-specific data. (b) RAG — document knowledge. (c) Plain code — deterministic rules need no model.

</details>

### P4. Why does nothing happen?

**Difficulty:** Medium · **Type:** Debugging

```java
// Illustrative fragment
var options = ToolCallingChatOptions.builder().toolCallbacks(ToolCallbacks.from(new StudyTools())).build();
ChatResponse response = chatModel.call(new Prompt("How far am I in Java 101?", options));
System.out.println(response.getResult().getOutput().getText());   // no answer text
```

<details>
<summary>Answer</summary>

In Spring AI 2.0 `ChatModel` does not execute tools: the response contains a tool-call request (`response.hasToolCalls()` is true) instead of an answer. Either use `ChatClient`, whose `ToolCallingAdvisor` runs the loop, or drive the loop yourself with `ToolCallingManager.executeToolCalls(...)`.

</details>

### P5. Design the tools

**Difficulty:** Hard · **Type:** Design

A learning platform wants an assistant that can show a learner's progress, recommend the next lesson and enrol them in a course. Design the tools and the safety rules.

<details>
<summary>Answer</summary>

Three narrow tools: `courseProgress(courseId)` (read-only), `recommendNextLesson(courseId)` (read-only), `enrol(courseId)` (action). The learner id comes from `ToolContext`, set by the service from Spring Security, never from arguments. Validate `courseId` format and existence; authorise access in each tool. `enrol` requires an explicit confirmation step (or returns a pending enrolment the UI confirms) and is idempotent. Offer `enrol` only on the enrolment flow, not as a default tool everywhere; log tool calls and rely on per-turn call limits.

</details>
