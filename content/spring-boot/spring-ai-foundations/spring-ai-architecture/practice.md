# Spring AI Architecture and Core Abstractions — Practice

### P1. Layer order

**Difficulty:** Easy · **Type:** MCQ

In which order does a `ChatClient` request pass through the layers?

- A) ChatModel → advisors → ChatClient → provider API
- B) ChatClient → advisors → ChatModel → provider API
- C) Advisors → provider API → ChatModel → ChatClient
- D) ChatClient → provider API → advisors → ChatModel

<details>
<summary>Answer</summary>

**Answer:** B) ChatClient → advisors → ChatModel → provider API

</details>

### P2. Which interface?

**Difficulty:** Easy · **Type:** MCQ

You need vectors for 500 product descriptions. Which interface do you use?

- A) `ChatModel`
- B) `ImageModel`
- C) `EmbeddingModel`
- D) `ModerationModel`

<details>
<summary>Answer</summary>

**Answer:** C) `EmbeddingModel`

</details>

### P3. Read the response

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
ChatResponse response = chatModel.call(prompt);
String text = response.getResult().getOutput().getText();
Integer tokens = response.getMetadata().getUsage().getTotalTokens();
```

What does each line return, and in which situation could `text` be empty even though the call succeeded?

<details>
<summary>Answer</summary>

Line 1 sends the prompt and returns the full `ChatResponse`. Line 2 takes the first generation's `AssistantMessage` text. Line 3 reads total tokens from the usage metadata. `text` can be empty when the model answered with a **tool call** instead of text: the `AssistantMessage` then carries `getToolCalls()`, and with plain `ChatModel` in 2.0 nobody executes the tool unless you drive the loop.

</details>

### P4. Options in 2.0

**Difficulty:** Medium · **Type:** Debugging

This line compiles in 1.x tutorials but not in a Spring AI 2.0 project. Why, and how do you fix it?

```java
// Illustrative fragment
ChatOptions options = OpenAiChatOptions.builder().temperature(0.2).build();
String reply = chatClient.prompt("Hi").options(options).call().content();
```

<details>
<summary>Answer</summary>

In 2.0, `ChatClient.options(...)` accepts an options **builder**, not a built instance, so the call no longer compiles. Pass the builder: `.options(OpenAiChatOptions.builder().temperature(0.2))`. Only the fields you set override the model defaults. (A built `ChatOptions` is still what you put inside a `Prompt` for `ChatModel.call`.)

</details>

### P5. Choose the level

**Difficulty:** Medium · **Type:** Design

For each requirement say whether you would use `ChatClient` or `ChatModel`: (a) a REST endpoint that answers questions with conversation memory; (b) a custom loop that pauses before each tool execution and asks a human; (c) a batch job that summarises 1,000 articles into records.

<details>
<summary>Answer</summary>

(a) `ChatClient` with a memory advisor. (b) Either: `ChatClient` with tool-calling auto-registration disabled for the call, or `ChatModel` with `ToolCallingManager`, because you own each iteration. (c) `ChatClient` with `.entity(Summary.class)`, so you get structured output and observability without hand-written parsing.

</details>
