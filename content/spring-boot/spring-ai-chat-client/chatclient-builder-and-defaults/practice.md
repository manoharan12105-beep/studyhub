# ChatClient.Builder, Auto-Configuration and Defaults — Practice

### P1. Scope of the builder

**Difficulty:** Easy · **Type:** MCQ

What is the scope of the auto-configured `ChatClient.Builder` bean?

- A) Singleton
- B) Prototype
- C) Request
- D) Session

<details>
<summary>Answer</summary>

**Answer:** B) Prototype

</details>

### P2. Override or fill?

**Difficulty:** Easy · **Type:** Behavior

The client was built with `defaultSystem("Answer in {lang}.")`. What system text is sent for each request?

```java
// Illustrative fragment
client.prompt().system(s -> s.param("lang", "Tamil")).user("Hi").call().content();   // (a)
client.prompt().system("Answer in English.").user("Hi").call().content();             // (b)
client.prompt().user("Hi").call().content();                                           // (c)
```

<details>
<summary>Answer</summary>

(a) `Answer in Tamil.` (b) `Answer in English.` — the default is replaced. (c) `Answer in {lang}.` — with no parameters at all, the template is not rendered and the placeholder is sent literally, which is a bug to avoid.

</details>

### P3. Two clients

**Difficulty:** Medium · **Type:** Coding

Declare two beans, `quizClient` (temperature 0.7, system "Write exam questions.") and `graderClient` (temperature 0.0, system "Grade answers strictly."), from the auto-configured builder.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
@Configuration
class StudyClients {

    @Bean
    ChatClient quizClient(ChatClient.Builder builder) {
        return builder.defaultSystem("Write exam questions.")
                .defaultOptions(ChatOptions.builder().temperature(0.7))
                .build();
    }

    @Bean
    ChatClient graderClient(ChatClient.Builder builder) {
        return builder.defaultSystem("Grade answers strictly.")
                .defaultOptions(ChatOptions.builder().temperature(0.0))
                .build();
    }
}
```

Inject with `@Qualifier("quizClient")` / `@Qualifier("graderClient")`.

</details>

### P4. Lost metrics

**Difficulty:** Medium · **Type:** Debugging

After a refactor, `spring.ai.chat.client` observations disappeared for one feature. The new code is `ChatClient.create(openAiChatModel)` inside a service constructor. Why, and what is the fix?

<details>
<summary>Answer</summary>

`ChatClient.create(model)` builds a client without the auto-configured observation registry and customizers. Inject the auto-configured `ChatClient.Builder` (single model) or build via `ChatClientBuilderConfigurer` (several models).

</details>

### P5. Shared behaviour

**Difficulty:** Hard · **Type:** Design

Every `ChatClient` in a company's services must (1) carry a safety advisor, (2) log requests in development only, and (3) let each feature choose its own system prompt. Design the configuration.

<details>
<summary>Answer</summary>

- A shared library contributes a `ChatClientBuilderCustomizer` bean that adds the safety advisor to every builder.
- A `@Profile("dev")` customizer adds `SimpleLoggerAdvisor`; DEBUG logging for `org.springframework.ai.chat.client.advisor` is enabled only in the dev profile.
- Each feature declares its own `ChatClient` bean from the injected prototype builder with its own `defaultSystem` and options; customizers have already been applied to that builder, so features cannot forget the safety advisor.

</details>
