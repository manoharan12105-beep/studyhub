# ChatClient and Its Fluent API

**Module:** Spring AI: ChatClient · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Build requests with `prompt()`, `system()`, `user()`, `messages()`, `options()`, `advisors()`, `tools()` and `toolContext()`.
- Choose a terminal method: `content()`, `chatResponse()`, `chatClientResponse()`, `entity(...)`, `responseEntity(...)` — or the `stream()` equivalents.
- Explain when the model is actually called.
- Override defaults per request without affecting other requests.

## Definition

`ChatClient` is Spring AI's **fluent API** for chat models. A call has three parts: **start** a request (`prompt()`), **describe** it (messages, options, advisors, tools), and **finish** it with a call style (`call()` or `stream()`) followed by a **terminal method** that executes the request and returns the result in the shape you need.

## Why It Matters

`ChatClient` is the API you will write most often. Knowing its full surface lets you keep services short, override behaviour per request safely, and pick the cheapest correct return type — for example `chatResponse()` when you need token usage, or `entity(...)` when you need a record.

## How It Works

```text
chatClient.prompt()                      ← start (or prompt("text"), prompt(promptObject))
          .system(...)                   ← describe: system text (template + params)
          .user(...)                     ←           user text, params, media, metadata
          .messages(...)                 ←           extra messages (e.g. earlier turns)
          .options(builder)              ←           per-request model options (merged over the model's defaults)
          .advisors(...)                 ←           per-request advisors and advisor params
          .tools(...) / .toolContext(...) ←          tools for this request + private context
          .call()  | .stream()           ← choose blocking or streaming
          .content() | .chatResponse() | .entity(...) …   ← execute and convert
```

The request is **lazy**: nothing is sent until a terminal method runs. `call()` and `stream()` only choose the mode. Each `prompt()` creates a new, independent request spec, so per-request settings never leak into other requests.

## Starting a Request

| Method | Use when |
|--------|----------|
| `prompt()` | Build everything with the fluent methods (most common) |
| `prompt(String)` | Quick call with only user text |
| `prompt(Prompt)` | You already have a `Prompt` object, for example built by other code |

## Describing the Request

| Method | Notes |
|--------|-------|
| `system(String)` / `system(Resource)` / `system(s -> s.text(..).param(..))` | Overrides the builder's default system text for this request |
| `user(String)` / `user(Resource)` / `user(u -> u.text(..).param(..).media(..).metadata(..))` | Template variables use `{name}` by default ([Prompt Templates](../spring-ai-prompt-templates/content.md)) |
| `messages(Message...)` / `messages(List<Message>)` | Adds messages such as earlier conversation turns |
| `options(B builder)` | A **builder** in 2.0, e.g. `ChatOptions.builder().temperature(0.1)` or `OpenAiChatOptions.builder()…`; only fields you set override the `ChatModel`'s defaults — the client's `defaultOptions` are replaced, not merged ([ChatClient Builder and Defaults](../chatclient-builder-and-defaults/content.md)) |
| `advisors(Advisor...)` / `advisors(a -> a.param(k, v))` | Adds advisors and advisor parameters such as `ChatMemory.CONVERSATION_ID` |
| `tools(Object...)` | `@Tool` objects, `ToolCallback`s or providers; **appended** to default tools |
| `toolContext(Map)` | Data passed to tools but never sent to the model |
| `templateRenderer(TemplateRenderer)` | Different template syntax for this request |

## Terminal Methods

After `call()`:

| Method | Returns | Use for |
|--------|---------|---------|
| `content()` | `String` | Just the text |
| `chatResponse()` | `ChatResponse` | Text plus metadata: token usage, model, finish reason |
| `chatClientResponse()` | `ChatClientResponse` | `ChatResponse` plus the advisor context (e.g. retrieved documents in RAG) |
| `entity(Class<T>)` / `entity(ParameterizedTypeReference<T>)` / `entity(converter)` | `T` | Structured output ([Structured Output](../spring-ai-structured-output/content.md)) |
| `responseEntity(...)` | `ResponseEntity<ChatResponse, T>` | Entity and metadata together |

After `stream()`: `content()` → `Flux<String>`, `chatResponse()` → `Flux<ChatResponse>`, `chatClientResponse()` → `Flux<ChatClientResponse>`. There is no streaming `entity(...)`; see [call() vs stream()](../spring-ai-call-vs-stream/content.md).

## Example

A tour of the API against the scripted model from the [Practice Lab](../../spring-ai-foundations/spring-ai-practice-lab/content.md). The program prints what actually reached the model.

```java
import java.util.List;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;

public class FluentApiTour {

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("Records are concise, immutable data carriers.")
                .reply("Use them for DTOs and value objects.")
                .reply("var lets the compiler infer a local variable's type.");

        ChatClient client = ChatClient.builder(model)
                .defaultSystem("You are a concise Java tutor.")
                .build();

        // 1. Template parameter + per-request options merged over the model defaults
        String first = client.prompt()
                .user(u -> u.text("Explain {feature} in one sentence.").param("feature", "records"))
                .options(ChatOptions.builder().temperature(0.1))
                .call()
                .content();
        Prompt sent = model.lastPrompt();
        System.out.println("1 reply:        " + first);
        System.out.println("1 user text:    " + sent.getUserMessage().getText());
        System.out.println("1 temperature:  " + sent.getOptions().getTemperature());
        System.out.println("1 model:        " + sent.getOptions().getModel());

        // 2. Earlier turns passed explicitly with messages(...)
        String second = client.prompt()
                .messages(new UserMessage("Explain records in one sentence."),
                        new AssistantMessage(first))
                .user("When should I use them?")
                .call()
                .content();
        System.out.println("2 reply:        " + second);
        System.out.println("2 roles sent:   " + model.lastPrompt().getInstructions().stream()
                .map(m -> m.getMessageType().name()).toList());
        System.out.println("2 temperature:  " + model.lastPrompt().getOptions().getTemperature());

        // 3. Lazy execution: nothing is sent until the terminal method
        var pending = client.prompt("Explain var in one sentence.").call();
        System.out.println("3 calls before: " + model.prompts().size());
        String third = pending.content();
        System.out.println("3 calls after:  " + model.prompts().size() + " -> " + third);
    }
}
```

**Output:**

```text
1 reply:        Records are concise, immutable data carriers.
1 user text:    Explain records in one sentence.
1 temperature:  0.1
1 model:        scripted-model
2 reply:        Use them for DTOs and value objects.
2 roles sent:   [SYSTEM, USER, ASSISTANT, USER]
2 temperature:  null
3 calls before: 2
3 calls after:  3 -> var lets the compiler infer a local variable's type.
```

### Code walkthrough

- **Request 1:** `{feature}` is replaced from `param(...)` before sending. The per-request `temperature(0.1)` was merged with the model's default options, so the model name (`scripted-model`) survived.
- **Request 2:** `messages(...)` inserted an earlier user/assistant pair after the system message and before the new user message. The temperature is `null` again: per-request options apply to one request only.
- **Request 3:** `call()` returned a spec without contacting the model; `content()` sent the request.

## Common Mistakes and Troubleshooting

- **Passing a built `ChatOptions` to `options(...)`.** Does not compile in 2.0; pass the builder.
- **Template braces in user text.** Text containing `{` and `}` (JSON, code) is treated as a template only when you use template parameters; if you pass params, literal braces must be escaped or you switch delimiters ([Prompt Templates](../spring-ai-prompt-templates/content.md)).
- **Calling `content()` twice on the same spec.** Each terminal call sends a new request and costs tokens again; keep the result in a variable.
- **Expecting `messages(...)` to persist history.** It only adds messages to this request; persistent history needs chat memory ([Chat Memory](../../spring-ai-prompts-and-memory/spring-ai-chat-memory/content.md)).
- **`content()` returns `null` or an empty string.** The model may have returned only a tool call (with tools disabled from the loop) or been stopped by a content filter; inspect `chatResponse()` and its finish reason.

## Production Considerations

- Prefer `chatResponse()` or `responseEntity(...)` where you record token usage per user or tenant.
- Keep per-request overrides small and explicit; put stable behaviour in builder defaults.
- Never concatenate untrusted input into the system message; keep it in the user message and treat it as data ([Prompt Injection](../../spring-ai-prompts-and-memory/prompt-injection-and-untrusted-input/content.md)).

## Common Interview Traps

- **"`call()` sends the request."** The terminal method (`content()`, `entity()`, …) does.
- **"`tools(...)` replaces the default tools."** Per-request tools are appended to `defaultTools(...)`.
- **"Options set in `options(...)` change the client permanently."** They apply to that request only.

## Key Takeaways

- Start with `prompt()`, describe with fluent methods, finish with `call()`/`stream()` and a terminal method.
- The request is lazy and independent per `prompt()`.
- In 2.0, `options(...)` takes a builder; it is merged over the `ChatModel`'s defaults and replaces the client's `defaultOptions` for that request.

## Official References

- [ChatClient API](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [Upgrade notes: ChatClient options now require a builder](https://docs.spring.io/spring-ai/reference/upgrade-notes.html)
