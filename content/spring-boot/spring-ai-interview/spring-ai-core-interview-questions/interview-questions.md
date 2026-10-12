# Spring AI Core Interview Questions — Interview Questions

## Beginner

### Q1. What is Spring AI, and what problem does it solve?

**Style:** Direct

<details>
<summary>Answer</summary>

Spring AI is a Spring project that gives Java applications portable abstractions for AI models: chat, embeddings, images, audio and moderation. It also provides vector stores, tool calling, chat memory, RAG advisors, observability and Boot auto-configuration.

It solves integration, not intelligence. You call providers through Spring-style APIs and swap them with configuration, while the model's quality and behaviour stay provider-specific.

</details>

### Q2. `ChatModel` vs `ChatClient`?

**Style:** Compare

<details>
<summary>Answer</summary>

- **`ChatModel`** is the low-level, provider-implemented interface: `call(Prompt)` → `ChatResponse`, and `stream(Prompt)`.
- **`ChatClient`** is the fluent API on top. It adds system and user templates, default options, advisors (memory, RAG, logging), tools, and conversion to entities.

Application code normally uses `ChatClient`, built from the auto-configured `ChatClient.Builder`.

</details>

### Q3. What are message roles?

**Style:** Direct

<details>
<summary>Answer</summary>

- **System:** instructions and persona.
- **User:** the request.
- **Assistant:** model replies, including tool-call requests.
- **Tool:** tool results sent back to the model.

The model sees the whole list on every call; it has no state between calls.

</details>

### Q4. How do you return a Java object from the model?

**Style:** How

<details>
<summary>Answer</summary>

Use `.call().entity(MyRecord.class)`, or a `ParameterizedTypeReference` for lists. Spring AI adds format instructions with a JSON schema and converts the reply.

Parsing is not validation: check invariants in code, such as allowed values and ranges. Use the provider's native structured output where it is supported.

</details>

### Q5. Is the model stateful? How does a chatbot remember?

**Style:** Concept

<details>
<summary>Answer</summary>

No, every call is independent. Memory is application state: a `ChatMemory` such as `MessageWindowChatMemory` (default 20 messages) stores turns per conversation id. `MessageChatMemoryAdvisor` adds them to each request and saves the new exchange.

</details>

## Intermediate

### Q6. How do default options and request options combine?

**Style:** Behaviour

<details>
<summary>Answer</summary>

Checked in 2.0.1: `.options(...)` on a request **replaces** the `defaultOptions` set on the `ChatClient` builder. Any values left unset are then filled from the `ChatModel`'s own default options (from properties).

So if the builder sets temperature 0.2 and a request sets only `maxTokens`, the request does not keep the builder's 0.2. Repeat any default you still need in the request.

</details>

### Q7. Walk through the tool-calling loop.

**Style:** Process

<details>
<summary>Answer</summary>

1. Tool definitions (name, description, JSON schema) are sent with the prompt.
2. The model replies with a tool call instead of text.
3. `ToolCallingAdvisor` (order `HIGHEST_PRECEDENCE + 300`) executes it through the `ToolCallingManager`, appends the assistant tool-call message and the tool result, and calls the model again.
4. The loop repeats until the model returns text, or until a `returnDirect` tool ends it.

Your application, not the model, executes the code.

</details>

### Q8. Where does an advisor's order put it relative to the tool loop?

**Style:** Trap

<details>
<summary>Answer</summary>

- **Inside the loop.** Advisors with an order greater than `HIGHEST_PRECEDENCE + 300`, which includes ordinary values such as 0 or 100, run inside the tool loop, once per model call.
- **Outside the loop.** Advisors with a smaller order run once per user request.

Checked in 2.0.1:

- `QuestionAnswerAdvisor` at its default order 0 searched the vector store twice for one tool round.
- A `SafeGuardAdvisor` at order 0 let `MessageChatMemoryAdvisor` (+200) store a blocked exchange.

</details>

### Q9. How do you secure a tool?

**Style:** Design

<details>
<summary>Answer</summary>

Treat the model's arguments as untrusted input:

- **Validate.** Check every argument.
- **Identity.** Take the user's identity from `ToolContext`, filled from Spring Security, never from a parameter.
- **Authorise.** Check access inside the tool or the service it calls.
- **Expose little.** Offer only the tools the feature needs.
- **Writes.** Make write actions idempotent and audited.
- **Approval.** Require human approval for irreversible actions.

</details>

### Q10. What is prompt injection, and how do you limit it?

**Style:** Concept

<details>
<summary>Answer</summary>

Prompt injection is text from a user, a document or a tool result that tries to override your instructions. No prompt fully prevents it, so limit what a successful injection can do:

- Use least-privilege tools with authorisation in code.
- Delimit untrusted content, and say in the system prompt that it is data.
- Validate the output.
- Keep secrets out of prompts.
- Require approval for sensitive actions.

</details>

## Advanced

### Q11. What does `CallAdvisor` vs `StreamAdvisor` mean in practice?

**Style:** Trap

<details>
<summary>Answer</summary>

`.call()` runs only `CallAdvisor`s, and `.stream()` runs only `StreamAdvisor`s. A custom advisor implementing only `CallAdvisor` was silently skipped for streaming in the lesson's test.

In streaming, `BaseAdvisor.after` runs for the chunks that carry a finish reason, not for every chunk. Implement both interfaces (or extend `BaseAdvisor`) for logic that must apply to both.

</details>

### Q12. How would you unit-test a ChatClient-based service?

**Style:** How

<details>
<summary>Answer</summary>

Build the client from a stub `ChatModel` that returns scripted replies (including tool calls) and records the prompts. Then assert on:

- the prompts sent;
- the parsing and fallbacks;
- the tool execution;
- the advisor effects.

No key or network is needed. Keep real-model checks in a separate evaluation suite.

</details>

### Q13. What changed from Spring AI 1.x to 2.0 that affects existing code?

**Style:** Experience

<details>
<summary>Answer</summary>

These are the changes covered in the lessons:

- **Baseline.** Spring Boot 4 / Spring Framework 7 and Jakarta EE 11.
- **Properties.** Model properties are flattened (`spring.ai.openai.chat.model` instead of `.options.model`; the old form is deprecated).
- **Module names.** Some modules were renamed, for example `spring-ai-vector-store-advisor`.
- **Deprecations.** `TokenTextSplitter` constructors are deprecated for removal in favour of the builder.
- **MCP.** Built on the MCP Java SDK 2.0, with SSE transport properties deprecated in favour of streamable HTTP.

Read the upgrade notes and run the tests ([Versions and Compatibility](../../spring-ai-foundations/spring-ai-versions-and-compatibility/content.md)).

</details>

### Q14. Design the AI layer of a Spring Boot app so the provider can be swapped.

**Style:** Design

<details>
<summary>Answer</summary>

- **Isolate AI access.** Put it in services that depend on `ChatClient`/`ChatModel` interfaces.
- **Configure the provider.** Choose it and the model name in properties.
- **Prompts.** Keep them in versioned resources.
- **Portable features.** Use structured output and tools through Spring AI APIs, not provider SDKs.
- **Provider features.** Isolate provider-specific options behind a small adapter.
- **Evaluation.** Keep a set that compares providers before switching.

Portability of the API does not mean portable quality, so re-evaluate after any switch.

</details>
