# The Tool-Calling Loop: Errors, Limits and Direct Returns — Practice

### P1. Count the model calls

**Difficulty:** Easy · **Type:** Behavior

The model asks for `findBook` with a bad ISBN, the tool throws `IllegalArgumentException`, the model retries with a valid ISBN and then answers. Default settings. How many times is the model called, and does `call().content()` throw?

<details>
<summary>Answer</summary>

Three model calls; no exception. The first tool error is sent back to the model as the tool result.

</details>

### P2. Default limit

**Difficulty:** Easy · **Type:** MCQ

What is the default maximum number of calls per tool in one turn?

- A) 5
- B) 10
- C) 40
- D) Unlimited

<details>
<summary>Answer</summary>

**Answer:** C) 40

</details>

### P3. Read the output

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
@Tool(description = "Show the reading list exactly as stored", returnDirect = true)
String readingList() {
    return "1. Effective Java\n2. Java Concurrency in Practice";
}
```

The UI shows `"1. Effective Java\n2. Java Concurrency in Practice"` with quotes and a literal `\n`. Why, and how do you fix it?

<details>
<summary>Answer</summary>

`returnDirect` returns the result converter's output, and the default converter serialises the value to JSON — a JSON string has quotes and escaped newlines. Add a converter that returns plain text:

```java
// Illustrative fragment
public class PlainTextResultConverter implements ToolCallResultConverter {
    @Override
    public String convert(Object result, Type returnType) {
        return String.valueOf(result);
    }
}

@Tool(description = "Show the reading list exactly as stored", returnDirect = true,
        resultConverter = PlainTextResultConverter.class)
String readingList() { ... }
```

</details>

### P4. Debug the limit

**Difficulty:** Medium · **Type:** Debugging

Users occasionally see "Tool call limit (40) exceeded for tool 'search'. No further calls to this tool are allowed in this turn." as the assistant's answer. What is happening and what do you change?

<details>
<summary>Answer</summary>

The model kept calling `search` (often because results were empty or unhelpful) until the limit ended the turn with finish reason `toolCallLimitExceeded`; the code shows the generation text without checking the finish reason. Check `getFinishReason()` and show a friendly message, lower the limit (a search rarely needs 40 calls), and make `search` return useful guidance when nothing matches ("no results; try a broader term") so the model stops retrying.

</details>

### P5. Approval loop

**Difficulty:** Hard · **Type:** Design

A `refundPayment` tool must be approved by a human before it runs; read-only tools run immediately. Outline a design using the user-controlled loop.

<details>
<summary>Answer</summary>

Call `chatModel.call(prompt)` directly with the tool definitions in `ToolCallingChatOptions`. When `response.hasToolCalls()`, inspect the requested tool names: if they are all read-only, run `toolCallingManager.executeToolCalls(prompt, response)` and continue; if `refundPayment` is requested, persist the prompt and the pending call, return "awaiting approval" to the UI, and resume the loop only after an authorised person approves (re-validating the arguments). Keep a round limit and audit every step. See [Human Approval for Tools](../../spring-ai-advanced/human-approval-for-tools/content.md).

</details>
