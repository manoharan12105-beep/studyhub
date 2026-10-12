# ChatClient.Builder, Auto-Configuration and Defaults — Interview Questions

## Beginner

### Q1. What does Spring AI auto-configure for `ChatClient`?

**Style:** Direct

<details>
<summary>Answer</summary>

A prototype-scoped `ChatClient.Builder` bean (named `chatClientBuilder`) for the auto-configured `ChatModel`, wired with observability, the `ToolCallingAdvisor` builder and any `ChatClientBuilderCustomizer` beans. It does not register a `ChatClient` bean; you build one from the builder.

</details>

### Q2. Which defaults can you set on `ChatClient.Builder`?

**Style:** Direct

<details>
<summary>Answer</summary>

`defaultSystem`, `defaultUser`, `defaultOptions` (an options builder), `defaultAdvisors`, `defaultTools`, `defaultToolContext` and `defaultTemplateRenderer`. Each has a per-request counterpart without the `default` prefix.

</details>

## Intermediate

### Q3. Why is the builder bean prototype-scoped?

**Style:** Why

<details>
<summary>Answer</summary>

Builders are mutable. With a singleton, defaults set by one consumer (system prompt, tools, advisors) would leak into every other client built later. Prototype scope gives each injection point a fresh builder; all of them still share the singleton `ChatModel`.

</details>

### Q4. How do you expose two `ChatClient`s with different system prompts, and how do consumers pick one?

**Style:** How

<details>
<summary>Answer</summary>

Declare two `@Bean` methods in a `@Configuration` class, each taking a `ChatClient.Builder` and setting its own `defaultSystem` and options. Consumers inject with `@Qualifier("beanName")`, or one bean is marked `@Primary` for unqualified injection.

</details>

### Q5. What is the difference between `system("...")` and `system(s -> s.param("k", v))` on a request?

**Style:** Comparison

<details>
<summary>Answer</summary>

`system("...")` replaces the default system text for that request. `system(s -> s.param(...))` keeps the default text and supplies values for its template placeholders. If a request supplies some parameters but not all, rendering fails with "Not all variables were replaced in the template"; if it supplies none, the placeholder is sent literally.

</details>

### Q6. What does `ChatClient.mutate()` do?

**Style:** Direct

<details>
<summary>Answer</summary>

It returns a new `ChatClient.Builder` initialised with the client's defaults, so you can build a variant — say, a stricter temperature or one extra advisor — without repeating the configuration. The original client is unchanged.

</details>

## Advanced

### Q7. Your application has OpenAI and Anthropic chat models. How do you create a client per model without losing observability?

**Style:** Scenario

<details>
<summary>Answer</summary>

Build each client from its concrete model with `ChatClient.builder(model, observationRegistry, …)` and pass the builder through the auto-configured `ChatClientBuilderConfigurer`, which applies customizers and observability the way auto-configuration would. Mark one `@Primary` (or qualify every injection point). Avoid `ChatClient.create(model)` in production code because it skips customizers and observation wiring.

</details>

### Q8. How would you add request/response logging to every ChatClient, but only in development?

**Style:** Design

<details>
<summary>Answer</summary>

Register a `ChatClientBuilderCustomizer` bean in a `@Profile("dev")` configuration that adds `new SimpleLoggerAdvisor()` via `defaultAdvisors`, and set `logging.level.org.springframework.ai.chat.client.advisor=DEBUG` in the dev profile. Production builders are unaffected, so prompts are not logged there.

</details>
