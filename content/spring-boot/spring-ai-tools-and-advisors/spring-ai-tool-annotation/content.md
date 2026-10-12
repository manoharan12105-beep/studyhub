# Defining Tools with @Tool and @ToolParam

**Module:** Spring AI: Tools and Advisors · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Turn Java methods into tools with `@Tool` and describe parameters with `@ToolParam`.
- Read the JSON Schema Spring AI generates from a method signature.
- Use `returnDirect`, custom names, optional parameters and `ToolContext` correctly.
- Avoid the unsupported parameter and return types.

## Definition

`@Tool` (package `org.springframework.ai.tool.annotation`) marks a method — public, package-private or private, static or instance — as a tool. Spring AI builds a `MethodToolCallback` whose **definition** comes from the annotation and the method signature: `name` (defaults to the method name), `description`, and an input **JSON Schema** generated from the parameters. `@ToolParam(description, required)` describes each parameter.

| `@Tool` attribute | Meaning | Default |
|-------------------|---------|---------|
| `name` | Tool name the model uses; unique within one request's tools | Method name |
| `description` | What the tool does and **when** to use it | Empty (always set it) |
| `returnDirect` | Return the result to the caller instead of the model | `false` |
| `resultConverter` | `ToolCallResultConverter` that turns the result into text | Jackson JSON serialisation |

## Why It Matters

The model chooses tools only from their names, descriptions and schemas. A vague description means the tool is never called or called at the wrong time; a wrong `required` flag makes the model invent values. Interviewers often ask how the schema is produced and how to pass data the model must not see.

## How It Works

1. `ToolCallbacks.from(toolObject)` (or `.tools(toolObject)` on `ChatClient`) scans the object for `@Tool` methods.
2. For each method it generates a JSON Schema: one property per parameter, Java types mapped to JSON types (enums become `enum` lists), descriptions from `@ToolParam`, and every parameter **required** unless `@ToolParam(required = false)` or `@Nullable`.
3. Parameters of type `ToolContext` are **excluded** from the schema; Spring AI fills them at call time.
4. When the model calls the tool, the JSON arguments are converted to the parameter types and the method is invoked; the return value is converted to a string for the `TOOL` message.

> [!NOTE]
> Parameter names in the schema come from the compiled method. Spring Boot's Maven and Gradle plugins compile with `-parameters`; without it, names may be lost. For GraalVM native images, the class with `@Tool` methods must be a Spring bean or registered for reflection.

### Unsupported types for method tools

`Optional` (use `required = false`), asynchronous types (`CompletableFuture`, `Future`), reactive types (`Mono`, `Flux`, `Flow`) and functional types (`Function`, `Supplier`, `Consumer`) cannot be parameters or return types of method tools.

## Example

The program prints the definitions the model would receive:

```java
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.support.ToolCallbacks;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

public class ToolDefinitionDemo {

    enum Level { BEGINNER, INTERMEDIATE, ADVANCED }

    static class CourseTools {

        @Tool(description = "Search the course catalog. Use it when the learner asks which courses exist for a topic.")
        List<String> searchCourses(
                @ToolParam(description = "Topic to search for, for example 'collections'") String topic,
                @ToolParam(description = "Difficulty filter; omit to include all levels", required = false) Level level) {
            return List.of("java-101", "java-collections");
        }

        @Tool(name = "scheduleRevision", description = "Schedule a revision session for the current learner",
              returnDirect = true)
        String schedule(@ToolParam(description = "Course id") String courseId,
                        @ToolParam(description = "Date in ISO-8601 format, for example 2026-11-02") LocalDate date,
                        ToolContext toolContext) {
            return "Scheduled " + courseId + " on " + date + " for " + toolContext.getContext().get("learnerId");
        }
    }

    public static void main(String[] args) {
        ToolCallback[] callbacks = ToolCallbacks.from(new CourseTools());
        // Reflection does not guarantee method order, so sort by tool name for stable output
        Arrays.sort(callbacks, Comparator.comparing(callback -> callback.getToolDefinition().name()));
        for (ToolCallback callback : callbacks) {
            var definition = callback.getToolDefinition();
            System.out.println("name: " + definition.name());
            System.out.println("description: " + definition.description());
            System.out.println("returnDirect: " + callback.getToolMetadata().returnDirect());
            System.out.println("inputSchema: " + definition.inputSchema().replaceAll("\\s+", " "));
            System.out.println();
        }
    }
}
```

**Output:**

```text
name: scheduleRevision
description: Schedule a revision session for the current learner
returnDirect: true
inputSchema: { "$schema" : "https://json-schema.org/draft/2020-12/schema", "type" : "object", "properties" : { "courseId" : { "type" : "string", "description" : "Course id" }, "date" : { "type" : "string", "description" : "Date in ISO-8601 format, for example 2026-11-02" } }, "required" : [ "courseId", "date" ], "additionalProperties" : false }

name: searchCourses
description: Search the course catalog. Use it when the learner asks which courses exist for a topic.
returnDirect: false
inputSchema: { "$schema" : "https://json-schema.org/draft/2020-12/schema", "type" : "object", "properties" : { "topic" : { "type" : "string", "description" : "Topic to search for, for example 'collections'" }, "level" : { "type" : "string", "enum" : [ "BEGINNER", "INTERMEDIATE", "ADVANCED" ], "description" : "Difficulty filter; omit to include all levels" } }, "required" : [ "topic" ], "additionalProperties" : false }
```

### Code walkthrough

- `name = "scheduleRevision"` overrides the method name `schedule`; `searchCourses` keeps its method name.
- The `Level` enum became a JSON `enum` — the model can only pick valid values, which is far better than a free-text string.
- `level` is missing from `required` because of `required = false`; everything else is required.
- `ToolContext` does **not** appear in the schema: the learner id is supplied by the application at call time and never shown to the model.
- `LocalDate` became a plain `string`; the description tells the model the expected format, and Spring AI converts the argument back to `LocalDate` before calling the method.

## Writing Good Tool Descriptions

- Say **what** the tool does and **when** to use it ("Use it when the learner asks which courses exist").
- State formats and units in parameter descriptions (ISO-8601 dates, cents vs euros).
- Mark a parameter optional only if the tool works without it; mark it required only if the model can know the value — otherwise it will invent one.
- Prefer enums and small records to free-form strings.
- Keep names verb-first and unambiguous (`searchCourses`, not `courses`).

## Common Mistakes and Troubleshooting

- **The tool is never called.** Missing or vague `description`, or the class was never passed to `.tools(...)`.
- **Model invents a value** for a parameter it cannot know (for example the user id). Remove the parameter and use `ToolContext` instead.
- **Duplicate tool names** across tool objects in one request fail with `IllegalArgumentException: Multiple tools with the same name (find) found in sources: ...`; give each a unique `name`.
- **`Optional<T>` parameter.** Not supported; use `@ToolParam(required = false)`.
- **`returnDirect` output looks like JSON.** The result is converted with the result converter (JSON by default), so a `String` comes back quoted ([The Tool-Calling Loop](../tool-calling-loop/content.md)).

## Production Considerations

- Tool classes are usually Spring beans (`@Component`) with injected repositories; the tool method is thin and delegates to a service that enforces rules.
- Treat descriptions as prompt text: review and test them, and version them with the code.
- Keep results small; large results are input tokens on the next model call.

## Common Interview Traps

- **"The model sees `ToolContext`."** It does not; it is excluded from the schema and the request.
- **"Parameters are optional by default."** They are required by default.
- **"Only public methods can be tools."** Any visibility works.

## Key Takeaways

- `@Tool` + `@ToolParam` produce a name, description and JSON Schema for the model.
- Enums and required flags shape what the model can send.
- `ToolContext` carries application data the model must not see or control.
- `returnDirect` and `resultConverter` control what happens to the result.

## Official References

- [Tool Calling: Declarative @Tool and JSON Schema](https://docs.spring.io/spring-ai/reference/api/tools.html)
- Related: [Tool Calling Fundamentals](../tool-calling-fundamentals/content.md) · [Registering Tools](../tool-registration-and-descriptions/content.md) · [Tool Validation and Authorization](../tool-validation-and-authorization/content.md)
