# Spring AI Architecture and Core Abstractions

**Module:** Spring AI: Foundations · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Draw the layers of a Spring AI call: application code, `ChatClient`, advisors, `ChatModel`, provider client.
- Explain the generic `Model` / `ModelRequest` / `ModelResponse` design shared by all model types.
- Read a `Prompt` (messages + options) and a `ChatResponse` (generations + metadata).
- Decide when to use `ChatModel` directly and when to use `ChatClient`.

## Definition

Spring AI is organised as **portable model interfaces** at the bottom, **provider implementations** that speak each vendor's API, and a **high-level client** (`ChatClient`) with an **advisor chain** on top. Every model type follows the same shape: a request object carrying instructions plus options goes in, a response object carrying results plus metadata comes out.

## Why It Matters

Knowing the layers tells you where to plug things in: options and HTTP settings belong to the model, prompts and per-request behaviour to `ChatClient`, cross-cutting behaviour (memory, RAG, logging, safety) to advisors. It also answers a classic interview question: *ChatModel or ChatClient?*

## How It Works

```text
 Your code
    │  chatClient.prompt().system(..).user(..).advisors(..).tools(..).call().entity(..)
    ▼
 ChatClient ── builds ChatClientRequest (Prompt + advisor context)
    │
    ▼
 Advisor chain (ordered)    memory · retrieval · logging · ToolCallingAdvisor · your advisors
    │
    ▼
 ChatModel.call(Prompt)     portable interface
    │
    ▼
 OpenAiChatModel / AnthropicChatModel / OllamaChatModel …   provider implementation
    │
    ▼
 Provider HTTP API ──► ChatResponse (generations + metadata) back up the same path
```

Each layer has one job:

| Layer | Responsibility | Typical customisation |
|-------|----------------|-----------------------|
| `ChatClient` | Fluent request building, defaults, response conversion | `defaultSystem`, `defaultOptions`, `defaultAdvisors`, `entity(...)` |
| Advisors | Intercept and transform request and response | Memory, RAG, logging, guards |
| `ChatModel` | Portable contract: `call(Prompt)` and `stream(Prompt)` | Model options, provider choice |
| Provider implementation | Convert to and from the vendor API, auth, HTTP | API key, base URL, timeouts, retries |

## The Generic Model Contract

All model types share three small interfaces in `org.springframework.ai.model`:

```text
Model<TReq extends ModelRequest<?>, TRes extends ModelResponse<?>>
    TRes call(TReq request)

ModelRequest<T>      T getInstructions()      ModelOptions getOptions()
ModelResponse<R>     R getResult()            List<R> getResults()      ResponseMetadata getMetadata()
```

| Model type | Interface | Request | Response |
|------------|-----------|---------|----------|
| Chat | `ChatModel` (also `StreamingChatModel`) | `Prompt` (list of `Message`) | `ChatResponse` (list of `Generation`) |
| Embedding | `EmbeddingModel` | `EmbeddingRequest` (texts) | `EmbeddingResponse` (`float[]` vectors) |
| Image | `ImageModel` | `ImagePrompt` | `ImageResponse` |
| Transcription | `TranscriptionModel` | `AudioTranscriptionPrompt` | `AudioTranscriptionResponse` |
| Text to speech | `TextToSpeechModel` | `TextToSpeechPrompt` | `TextToSpeechResponse` |
| Moderation | `ModerationModel` | `ModerationPrompt` | `ModerationResponse` |

Learning one shape teaches you all of them.

## Prompt, Messages and Options

A `Prompt` is a list of **messages** plus optional **options**:

- **Messages** carry a role (`MessageType.SYSTEM`, `USER`, `ASSISTANT`, `TOOL`) and content. See [System, User, Assistant and Tool Messages](../../spring-ai-chat-client/spring-ai-messages-and-roles/content.md).
- **Options** (`ChatOptions`) carry portable settings — `model`, `temperature`, `topP`, `topK`, `maxTokens`, `stopSequences`, `frequencyPenalty`, `presencePenalty`. Provider classes such as `OpenAiChatOptions` add vendor-specific fields. Options are immutable in 2.0; use `mutate()` to derive a changed copy.

## ChatResponse and Metadata

A `ChatResponse` holds one or more `Generation`s (usually one). Each generation's output is an `AssistantMessage` (text and possibly tool calls). `ChatResponseMetadata` holds the model id, token `Usage` (prompt, completion, total), rate-limit information when the provider sends it, and extra keys added by advisors.

## ChatModel vs ChatClient

| | `ChatModel` | `ChatClient` |
|--|------------|--------------|
| Level | Low-level, one method per call style | High-level fluent API |
| You build | The `Prompt` and messages yourself | Messages via `system()`, `user()`, templates |
| Advisors (memory, RAG, logging) | Not available | Yes |
| Tool-calling loop | Not run automatically in 2.0 — you drive it | Run by the auto-registered `ToolCallingAdvisor` |
| Structured output | Use a converter manually | `.entity(Type.class)` |
| Use it for | Framework code, unusual control, implementing models | Almost all application code |

In 2.0 the per-model internal tool-execution loop of 1.x was removed: calling `ChatModel` with tools returns the model's tool-call request without executing it.

## Example

The program below makes the same request twice — once through `ChatModel`, once through `ChatClient` — against the scripted model from the [Practice Lab](../spring-ai-practice-lab/content.md), so it runs offline.

```java
import java.util.List;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;

public class LayersDemo {

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("A bean is an object created and managed by the Spring container.")
                .reply("A bean is an object created and managed by the Spring container.");

        // Low level: build the Prompt yourself and call the ChatModel.
        Prompt prompt = new Prompt(
                List.of(new SystemMessage("Answer in one sentence."), new UserMessage("What is a Spring bean?")),
                ChatOptions.builder().temperature(0.2).build());
        ChatResponse response = model.call(prompt);
        System.out.println("ChatModel text:  " + response.getResult().getOutput().getText());
        System.out.println("Model id:        " + response.getMetadata().getModel());
        System.out.println("Generations:     " + response.getResults().size());

        // High level: ChatClient builds an equivalent Prompt for you.
        ChatClient client = ChatClient.create(model);
        String text = client.prompt()
                .system("Answer in one sentence.")
                .user("What is a Spring bean?")
                .call()
                .content();
        System.out.println("ChatClient text: " + text);
        System.out.println("Roles sent:      " + model.lastPrompt().getInstructions().stream()
                .map(m -> m.getMessageType().name()).toList());
    }
}
```

**Output:**

```text
ChatModel text:  A bean is an object created and managed by the Spring container.
Model id:        scripted-model
Generations:     1
ChatClient text: A bean is an object created and managed by the Spring container.
Roles sent:      [SYSTEM, USER]
```

### Code walkthrough

- `new Prompt(messages, options)` is the low-level request; `model.call(prompt)` returns a `ChatResponse`, and `getResult().getOutput().getText()` digs out the text.
- `ChatClient.create(model)` wraps the same model. `system(...)` and `user(...)` create the same two messages, and `content()` does the digging for you.
- `model.lastPrompt()` shows what reached the model layer: a system message followed by a user message. In a real application, the provider implementation turns that list into the vendor's JSON.

## Common Mistakes and Troubleshooting

- **Using `ChatModel` for application features, then rebuilding memory, RAG and tool loops by hand.** Prefer `ChatClient` unless you need low-level control.
- **Expecting `ChatModel.call` to run tools in 2.0.** It no longer does; use `ChatClient` (which auto-registers `ToolCallingAdvisor`) or drive the loop with `ToolCallingManager`.
- **Passing a built `ChatOptions` to `ChatClient.options(...)`.** In 2.0 `ChatClient.options(...)` takes a **builder** (`OpenAiChatOptions.builder().temperature(0.2)`); `ChatModel.call` takes a fully built options object in the `Prompt`.
- **Mutating options.** Options are immutable in 2.0; `copy()` and setters were removed — call `mutate()` and build a new instance.

## Production Considerations

- Configure transport concerns (API key, base URL, timeouts, retries) on the model; configure behaviour (system text, advisors, tools) on `ChatClient` beans.
- Several `ChatClient` beans can share one `ChatModel` bean with different defaults ([ChatClient.Builder and Defaults](../../spring-ai-chat-client/chatclient-builder-and-defaults/content.md)).
- Observability exists on every layer: `spring.ai.chat.client` and `spring.ai.advisor` observations above, `gen_ai.client.operation` at the model ([Observability](../../spring-ai-production/spring-ai-observability/content.md)).

## Common Interview Traps

- **"ChatClient replaces ChatModel."** `ChatClient` is built on top of a `ChatModel`; every call ends in `ChatModel.call` or `stream`.
- **"A ChatResponse is a String."** It contains generations, an `AssistantMessage` (which may hold tool calls instead of text) and metadata such as usage.
- **"Options set on the model can't be overridden."** Per-request options passed through `ChatClient.options(...)` are merged over the model's defaults.

## Key Takeaways

- Layers: `ChatClient` → advisors → `ChatModel` → provider implementation → HTTP.
- All model types share the request/options in, results/metadata out shape.
- Use `ChatClient` for application code; drop to `ChatModel` for low-level control.

## Official References

- [Chat Model API](https://docs.spring.io/spring-ai/reference/api/chatmodel.html)
- [ChatClient API](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [Prompts](https://docs.spring.io/spring-ai/reference/api/prompt.html)
- [Upgrade notes: options immutability](https://docs.spring.io/spring-ai/reference/upgrade-notes.html)
