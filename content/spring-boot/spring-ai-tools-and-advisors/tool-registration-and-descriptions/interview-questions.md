# Registering Tools: Per-Call, Defaults, Beans and Functions — Interview Questions

## Beginner

### Q1. What is the difference between `.tools(...)` and `.defaultTools(...)`?

**Style:** Compare

<details>
<summary>Answer</summary>

`.defaultTools(...)` on the builder offers tools on every request from that `ChatClient`; `.tools(...)` on a request adds tools for that request only. The model receives the union of both.

</details>

### Q2. Name three ways to define a tool in Spring AI.

**Style:** Direct

<details>
<summary>Answer</summary>

`@Tool`-annotated methods; `FunctionToolCallback` around a `Function`/`Supplier`/`Consumer`/`BiFunction` with an input type; `MethodToolCallback` built from a reflected `Method`. All produce `ToolCallback`s; tool sources such as MCP provide them through `ToolCallbackProvider`.

</details>

## Intermediate

### Q3. Your 1.x code used `.toolNames("currentWeather")` with a `Function` bean. How do you migrate to 2.0?

**Style:** How

<details>
<summary>Answer</summary>

`toolNames(...)` and the bean-name resolver were removed. Define the tool as a `ToolCallback` bean (for example `FunctionToolCallback.builder("currentWeather", service::getWeather).description(...).inputType(WeatherRequest.class).build()`), inject it, and pass it with `.tools(currentWeather)`.

</details>

### Q4. What does `spring.ai.tools.resolution.fallback.enabled` do and why is it off by default?

**Style:** Why

<details>
<summary>Answer</summary>

When true, a tool the model names that is not attached to the request can be looked up by name in the `ToolCallbackResolver` (all `ToolCallback` beans) and executed. It is off because it would let the model trigger any registered tool — including destructive ones — regardless of what the request offered.

</details>

## Advanced

### Q5. How would you organise tools for an application with a tutor chat, a quiz generator and an admin assistant?

**Style:** Design

<details>
<summary>Answer</summary>

One `ChatClient` per feature, each with only its tools: the tutor gets read-only catalogue and progress tools as defaults; the quiz generator gets no tools (structured output only); the admin assistant gets admin tools attached per request after a role check, with confirmation for writes. Identity goes through `ToolContext`. Resolution fallback stays off. Tool definitions are tested and their token cost measured; if one feature needs dozens of tools, consider `ToolSearchToolCallingAdvisor`.

</details>
