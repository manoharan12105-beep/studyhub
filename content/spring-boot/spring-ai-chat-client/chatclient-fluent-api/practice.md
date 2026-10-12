# ChatClient and Its Fluent API — Practice

### P1. Which terminal method?

**Difficulty:** Easy · **Type:** MCQ

You need the answer text **and** the number of tokens used. Which terminal method fits best?

- A) `content()`
- B) `chatResponse()`
- C) `stream()`
- D) `prompt()`

<details>
<summary>Answer</summary>

**Answer:** B) `chatResponse()`

**Explanation:** It returns the text in the generation plus metadata with `getUsage()`. `stream()` is not a terminal method and `prompt()` starts a request.

</details>

### P2. Count the calls

**Difficulty:** Easy · **Type:** Behavior

```java
// Illustrative fragment
var spec = chatClient.prompt().user("Explain streams").call();
String a = spec.content();
String b = spec.content();
```

How many requests reach the model?

<details>
<summary>Answer</summary>

Two. Each terminal call executes the request again. Store the first result instead of calling `content()` twice.

</details>

### P3. Predict the roles

**Difficulty:** Medium · **Type:** Behavior

A client has `defaultSystem("Be brief.")`. What roles are sent, in order, for this request?

```java
// Illustrative fragment
chatClient.prompt()
        .messages(new UserMessage("Hi"), new AssistantMessage("Hello!"))
        .user("What is a lambda?")
        .call().content();
```

<details>
<summary>Answer</summary>

`[SYSTEM, USER, ASSISTANT, USER]` — the default system message, then the explicit history, then the new user message.

</details>

### P4. Per-request options

**Difficulty:** Medium · **Type:** Coding

Write a request that uses temperature `0` and at most 150 tokens for this call only, using portable options.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
String answer = chatClient.prompt()
        .user("Classify this ticket: " + ticket)
        .options(ChatOptions.builder().temperature(0.0).maxTokens(150))
        .call()
        .content();
```

The builder is merged over the `ChatModel`'s default options for this request only; if the client had `defaultOptions`, they are replaced, so repeat any you still need. (Some providers and reasoning models use a different output-limit field; with OpenAI's newer models you would use `OpenAiChatOptions.builder().maxCompletionTokens(150)`.)

</details>

### P5. Debug the null

**Difficulty:** Hard · **Type:** Debugging

`content()` returns an empty string for some requests. The client has tools, and the team recently set `spring.ai.chat.client.tool-calling.enabled=false`. Explain what is happening and how to confirm it.

<details>
<summary>Answer</summary>

With auto-registration of `ToolCallingAdvisor` disabled, tool definitions are still sent to the model, but tool calls in the response are not executed. When the model decides to call a tool, its reply is an `AssistantMessage` with tool calls and no text, so `content()` is empty. Confirm with `chatResponse().hasToolCalls()` or by logging `getResult().getOutput().getToolCalls()`. Either re-enable the property or drive the tool loop yourself.

</details>
