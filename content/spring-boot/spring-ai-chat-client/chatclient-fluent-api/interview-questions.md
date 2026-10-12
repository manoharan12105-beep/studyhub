# ChatClient and Its Fluent API — Interview Questions

## Beginner

### Q1. What are the three parts of a `ChatClient` call?

**Style:** Direct

<details>
<summary>Answer</summary>

Start a request with `prompt()` (or `prompt(String)` / `prompt(Prompt)`); describe it with methods such as `system()`, `user()`, `messages()`, `options()`, `advisors()` and `tools()`; finish with `call()` or `stream()` plus a terminal method such as `content()`, `chatResponse()` or `entity(...)`.

</details>

### Q2. What is the difference between `content()` and `chatResponse()`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`content()` returns only the generated text as a `String`. `chatResponse()` returns the full `ChatResponse`: generations, the `AssistantMessage`, and metadata such as model id, token usage and finish reason. Use `chatResponse()` when you need usage for cost tracking or need to inspect why generation stopped.

</details>

## Intermediate

### Q3. When exactly is the model invoked?

**Style:** What happens internally

<details>
<summary>Answer</summary>

When a terminal method runs — `content()`, `chatResponse()`, `chatClientResponse()`, `entity(...)` or `responseEntity(...)` after `call()`, or when a subscriber subscribes to the `Flux` returned after `stream()`. `call()` and `stream()` only select the execution mode. Calling a terminal method twice sends two requests.

</details>

### Q4. How do per-request options interact with the model's default options in 2.0?

**Style:** How

<details>
<summary>Answer</summary>

`options(...)` accepts an options builder. Before the advisor chain runs, the builder is merged with the model's default options, so only the fields you set (for example temperature) override the defaults; others such as the model name are kept. The override applies only to that request.

</details>

### Q5. What does `chatClientResponse()` give you that `chatResponse()` does not?

**Style:** Comparison

<details>
<summary>Answer</summary>

The advisor context of the execution in addition to the `ChatResponse`. Advisors store data there — for example `QuestionAnswerAdvisor` stores the retrieved documents — so you can return sources to the user or log what was retrieved.

</details>

### Q6. Do `tools(...)` on a request replace the tools configured with `defaultTools(...)`?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Per-request tools are appended to the default tools; the model sees the union. That is why risky tools should be added per request (after authorization) rather than as defaults.

</details>

## Advanced

### Q7. A teammate builds the system message with string concatenation including user input. What is wrong, and what do you suggest?

**Style:** Scenario

<details>
<summary>Answer</summary>

The system message carries the highest-priority instructions; mixing untrusted input into it makes prompt injection easier and blurs instructions and data. Keep the system message fixed (or parameterised only with trusted values), put user input in the user message — ideally inside clear delimiters — and validate it. Also, building prompts with templates and parameters is easier to test and review than ad-hoc concatenation.

</details>
