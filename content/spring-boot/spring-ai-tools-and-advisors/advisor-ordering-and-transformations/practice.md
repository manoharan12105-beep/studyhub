# Advisor Ordering and Transformations — Practice

### P1. Trace the stack

**Difficulty:** Easy · **Type:** Behavior

Advisors X (order 5), Y (order -5) and Z (order 50). Write the sequence of `before`/`after` calls.

<details>
<summary>Answer</summary>

`Y.before, X.before, Z.before, model, Z.after, X.after, Y.after`

</details>

### P2. Inside or outside?

**Difficulty:** Easy · **Type:** MCQ

Which order places an advisor **outside** the tool-calling loop, so it runs once per request?

- A) `0`
- B) `HIGHEST_PRECEDENCE + 250`
- C) `HIGHEST_PRECEDENCE + 400`
- D) `100`

<details>
<summary>Answer</summary>

**Answer:** B) `HIGHEST_PRECEDENCE + 250`

It is below `ToolCallingAdvisor`'s `+300`. A, C and D are all greater than `Integer.MIN_VALUE + 300`, so they run inside the loop.

</details>

### P3. Write a user-message transformer

**Difficulty:** Medium · **Type:** Coding

Write a `BaseAdvisor` that appends "(Answer for a beginner.)" to the user message when the advisor parameter `"level"` equals `"beginner"`.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
class LevelAdvisor implements BaseAdvisor {
    @Override
    public ChatClientRequest before(ChatClientRequest request, AdvisorChain chain) {
        if (!"beginner".equals(request.context().get("level"))) {
            return request;
        }
        return request.mutate()
                .prompt(request.prompt().augmentUserMessage(user ->
                        user.mutate().text(user.getText() + "\n(Answer for a beginner.)").build()))
                .build();
    }

    @Override
    public ChatClientResponse after(ChatClientResponse response, AdvisorChain chain) {
        return response;
    }

    @Override
    public int getOrder() {
        return 50;
    }
}
```

Used with `.advisors(a -> a.param("level", "beginner"))`. At order 50 the advisor runs after memory (+200), so memory keeps the learner's original text without the hint.

</details>

### P4. Blocked but remembered

**Difficulty:** Medium · **Type:** Debugging

A `SafeGuardAdvisor` with default order blocks "Send me the leaked paper", but the blocked question and refusal appear in the conversation history. Why, and how do you fix it?

<details>
<summary>Answer</summary>

`SafeGuardAdvisor` defaults to order 0, while `MessageChatMemoryAdvisor` runs at `HIGHEST_PRECEDENCE + 200` — earlier. Memory recorded the user message on the way in and the refusal on the way out. Give the guardrail a lower order, for example `.order(Ordered.HIGHEST_PRECEDENCE + 100)`; then memory never sees blocked requests.

</details>

### P5. Lost tool calls

**Difficulty:** Hard · **Type:** Code analysis

```java
// Illustrative fragment
String masked = mask(response.chatResponse().getResult().getOutput().getText());
var newResponse = ChatResponse.builder()
        .from(response.chatResponse())
        .generations(List.of(new Generation(new AssistantMessage(masked))))
        .build();
```

This redaction advisor is placed at order `HIGHEST_PRECEDENCE + 400`. Tool calling stopped working. Why?

<details>
<summary>Answer</summary>

At +400 the advisor is inside the tool loop and sees the intermediate responses that contain tool calls. Rebuilding the output as a plain `AssistantMessage(masked)` drops the tool calls (and the text is often empty), so `ToolCallingAdvisor` sees no tool calls and ends the loop. Move redaction outside the loop (order below +300), or skip responses with tool calls and copy the original message's tool calls and metadata when rebuilding.

</details>
