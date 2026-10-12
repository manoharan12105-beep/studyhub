# Defining Tools with @Tool and @ToolParam — Interview Questions

## Beginner

### Q1. How do you turn a Java method into a Spring AI tool?

**Style:** How

<details>
<summary>Answer</summary>

Annotate it with `@Tool(description = "...")`, describe parameters with `@ToolParam`, and pass an instance of the class to `ChatClient` with `.tools(obj)` or `.defaultTools(obj)`. Spring AI generates the tool definition (name, description, JSON Schema) and a `MethodToolCallback` that invokes the method.

</details>

### Q2. Why is the tool description so important?

**Style:** Why

<details>
<summary>Answer</summary>

The model decides whether and when to call a tool only from its name, description and schema. A clear description that says what the tool does and when to use it improves selection; a missing one means the model has no guidance.

</details>

## Intermediate

### Q3. Are tool parameters required or optional by default? Why does it matter?

**Style:** Trap

<details>
<summary>Answer</summary>

Required by default. Use `@ToolParam(required = false)` or `@Nullable` for optional ones. If a parameter is required but the model cannot know its value, the model makes one up — a common hallucination source.

</details>

### Q4. How do you pass the current user's id to a tool without the model seeing or controlling it?

**Style:** How

<details>
<summary>Answer</summary>

Add a `ToolContext` parameter to the tool method and pass `.toolContext(Map.of("userId", id))` on the request. `ToolContext` is excluded from the JSON Schema and never sent to the model; Spring AI hands it to the method at execution time.

</details>

### Q5. What does `returnDirect = true` do?

**Style:** Direct

<details>
<summary>Answer</summary>

The tool result is returned to the caller as the final response, skipping the model round trip. It saves latency when the tool output is already the answer. It applies only if every tool called in that round is `returnDirect`, and the result is the converted (by default JSON-serialised) value.

</details>

## Advanced

### Q6. A tool takes `Optional<String> filter` and returns `CompletableFuture<List<Course>>`. Review it.

**Style:** Code review

<details>
<summary>Answer</summary>

Neither type is supported for method tools: replace `Optional` with a plain parameter marked `@ToolParam(required = false)`, and return the result synchronously (`List<Course>` or a small record). Also check the description says when to use the tool, the filter's allowed values (an enum is better than free text), and that the result is small enough to send back to the model.

</details>
