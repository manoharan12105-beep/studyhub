# ChatClient.Builder, Auto-Configuration and Defaults

**Module:** Spring AI: ChatClient · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain what the auto-configured `ChatClient.Builder` is and why it is prototype-scoped.
- Set defaults: system text (with parameters), options, advisors, tools and tool context.
- Declare several `ChatClient` beans — for one model with different behaviours, and for different models.
- Customise every builder in the application with a `ChatClientBuilderCustomizer`, and derive clients with `mutate()`.

## Definition

`ChatClient.Builder` creates `ChatClient` instances with **defaults** that apply to every request made through that client. Spring AI's `ChatClientAutoConfiguration` registers a **prototype-scoped** builder bean for the auto-configured `ChatModel`, already wired with observability, the tool-calling advisor builder and any customizer beans. Per-request methods (`system()`, `options()`, `advisors()`, `tools()`) override or add to the defaults for one request.

## Why It Matters

Defaults keep services short and consistent: the tutor service always has its tutor instruction and output limits; the summariser always has its own. Getting bean definitions right matters in production too — creating clients the wrong way silently loses observability and customizers.

## How It Works

| Builder method | Default for every request | Overridden or extended per request by |
|----------------|---------------------------|---------------------------------------|
| `defaultSystem(String / Resource / s -> s.text(..).param(..))` | System message (template allowed) | `system(...)` replaces it; `system(s -> s.param(..))` fills its parameters |
| `defaultUser(...)` | User text | `user(...)` |
| `defaultOptions(ChatOptions.Builder)` | Model options | `options(builder)` **replaces** the client's default options for that request; unset fields fall back to the `ChatModel`'s own defaults, not to `defaultOptions` (see the note below) |
| `defaultAdvisors(...)` | Advisors | `advisors(...)` adds more |
| `defaultTools(...)` | Tools | `tools(...)` appends |
| `defaultToolContext(Map)` | Tool context | `toolContext(Map)` — merged, request values win |
| `defaultTemplateRenderer(...)` | Template syntax | `templateRenderer(...)` |

`ChatClient.mutate()` returns a new builder pre-filled with a client's defaults, so you can derive a variant without repeating everything.

> [!WARNING]
> **Checked in 2.0.1:** with `defaultOptions(ChatOptions.builder().model("large-model").temperature(0.3))`, a request with `.options(ChatOptions.builder().maxTokens(50))` reached the model with `maxTokens=50`, but the model name and temperature came from the `ChatModel`'s own defaults — the client's `temperature(0.3)` was gone. If a request sets any options, repeat the client defaults it still needs (or derive a separate client with `mutate()`).

### Why the builder is a prototype

Every injection point receives a **new** builder. If it were a singleton, one service's `defaultSystem(...)` would leak into the next service that builds from the same object. The builders still share the singleton `ChatModel`, so there is one HTTP client and one connection pool.

## Declaring ChatClient Beans

### One model, several behaviours

```java
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class ChatClientConfig {

    @Bean
    ChatClient tutorClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem("You are a patient Java tutor. Answer in at most {sentences} sentences.")
                .defaultOptions(ChatOptions.builder().temperature(0.3))
                .build();
    }

    @Bean
    ChatClient summaryClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem("Summarise the text as five bullet points.")
                .defaultOptions(ChatOptions.builder().temperature(0.0))
                .build();
    }
}
```

Inject them by name: `ChatClientConsumer(@Qualifier("tutorClient") ChatClient tutor)`. The `{sentences}` placeholder must be filled on each request with `.system(s -> s.param("sentences", 3))`.

### Different models

When two `ChatModel` beans exist (for example `OpenAiChatModel` and `AnthropicChatModel`), the auto-configured builder cannot choose one. Build each client with `ChatClient.builder(model, …)` and pass it through the auto-configured `ChatClientBuilderConfigurer`, which applies customizers and observability exactly like auto-configuration does. The official [ChatClient documentation](https://docs.spring.io/spring-ai/reference/api/chatclient.html) shows the complete bean method; mark one client `@Primary` if other beans inject an unqualified `ChatClient`. Calling `ChatClient.create(model)` instead **bypasses** observability and customizers — acceptable in tests, not in production code.

### Customising every builder

```java
import org.springframework.ai.chat.client.ChatClientBuilderCustomizer;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("dev")
class DevChatClientCustomization {

    @Bean
    ChatClientBuilderCustomizer logEveryRequest() {
        return builder -> builder.defaultAdvisors(new SimpleLoggerAdvisor());
    }
}
```

Every auto-configured builder in the `dev` profile now logs requests and responses at DEBUG (`logging.level.org.springframework.ai.chat.client.advisor=DEBUG`). `ChatClientCustomizer` from older versions still works but is deprecated in 2.0; use `ChatClientBuilderCustomizer`.

## Example

Defaults, a parameterised default system message and `mutate()` against the [Practice Lab](../../spring-ai-foundations/spring-ai-practice-lab/content.md) model:

```java
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.ChatOptions;

public class DefaultsDemo {

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel().reply("one").reply("two").reply("three");

        ChatClient tutor = ChatClient.builder(model)
                .defaultSystem("You are a Java tutor. Answer in at most {sentences} sentences.")
                .defaultOptions(ChatOptions.builder().temperature(0.3))
                .build();

        tutor.prompt()
                .system(s -> s.param("sentences", 2))
                .user("What is a record?")
                .call().content();
        System.out.println("system:      " + model.lastPrompt().getSystemMessage().getText());
        System.out.println("temperature: " + model.lastPrompt().getOptions().getTemperature());

        tutor.prompt()
                .system("Reply with a single word.")
                .user("Name a Java keyword.")
                .call().content();
        System.out.println("override:    " + model.lastPrompt().getSystemMessage().getText());

        ChatClient strictTutor = tutor.mutate()
                .defaultOptions(ChatOptions.builder().temperature(0.0))
                .build();
        strictTutor.prompt()
                .system(s -> s.param("sentences", 1))
                .user("What is a sealed class?")
                .call().content();
        System.out.println("mutated:     " + model.lastPrompt().getSystemMessage().getText());
        System.out.println("temperature: " + model.lastPrompt().getOptions().getTemperature());
    }
}
```

**Output:**

```text
system:      You are a Java tutor. Answer in at most 2 sentences.
temperature: 0.3
override:    Reply with a single word.
mutated:     You are a Java tutor. Answer in at most 1 sentences.
temperature: 0.0
```

### Code walkthrough

- `defaultSystem` with `{sentences}` is a template; `.system(s -> s.param(...))` fills it per request without replacing the default text.
- `.system("…")` with text **replaces** the default system message for that request.
- `mutate()` copied the default system text and changed only the temperature — a cheap way to create a stricter variant. (The output's "1 sentences" also shows that templates do no grammar; write the template so every value reads naturally.)

## Common Mistakes and Troubleshooting

- **`NoUniqueBeanDefinitionException` for `ChatClient`.** You declared several `ChatClient` beans; inject with `@Qualifier` or mark one `@Primary`.
- **`No qualifying bean of type 'ChatClient$Builder'` with two providers.** Two `ChatModel` beans make the auto-configured builder ambiguous; select one provider (`spring.ai.model.chat`) or build clients per model with `ChatClientBuilderConfigurer`.
- **Missing template value.** If a request passes *some* system parameters but not `sentences`, rendering fails with `IllegalStateException: Not all variables were replaced in the template. Missing variable names are: [sentences].` If it passes *no* parameters at all, the template is not rendered and the literal text `{sentences}` reaches the model — a silent bug. Provide the value on every request (or a fallback in a wrapper method).
- **Lost traces and metrics.** Clients built with `ChatClient.create(model)` in production code skip observability and customizers.
- **Default tools that are too powerful.** Every request from that client can use them; add risky tools per request after authorization.

## Production Considerations

- Treat each `ChatClient` bean as a product feature with its own system prompt, options and limits; name beans after the feature.
- Keep cross-cutting behaviour (logging in dev, safety advisors, tracing conventions) in a `ChatClientBuilderCustomizer` so every feature gets it.
- Version important system prompts (resource files) and review changes like code ([Prompt Templates](../spring-ai-prompt-templates/content.md)).

## Common Interview Traps

- **"The ChatClient.Builder bean is a singleton."** It is prototype-scoped so defaults do not leak between consumers.
- **"`system(...)` per request adds to the default system message."** Passing text replaces it; passing only `param(...)` fills the default's placeholders.
- **"`ChatClient.create(model)` and the auto-configured builder are equivalent."** `create` skips customizers and observability wiring.

## Key Takeaways

- Defaults on the builder, overrides per request; `mutate()` derives variants.
- The auto-configured builder is prototype-scoped and fully wired; prefer it (or `ChatClientBuilderConfigurer`) over `ChatClient.create`.
- Use `ChatClientBuilderCustomizer` for behaviour every client should have.

## Official References

- [ChatClient: creating clients, multiple models, defaults, mutate](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [Advisors: SimpleLoggerAdvisor](https://docs.spring.io/spring-ai/reference/api/advisors.html)
