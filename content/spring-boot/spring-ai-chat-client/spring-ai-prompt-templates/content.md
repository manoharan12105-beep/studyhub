# Prompt Templates and Dynamic Inputs

**Module:** Spring AI: ChatClient · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Fill prompts with runtime values through `{placeholders}` and `param(...)`.
- Use `PromptTemplate` directly and through `ChatClient`.
- Keep reusable prompts in versioned resource files.
- Handle templates that contain JSON or code with custom delimiters, and understand validation errors.

## Definition

A **prompt template** is prompt text with named placeholders that are replaced at runtime. Spring AI's `PromptTemplate` renders templates through a `TemplateRenderer`; the default `StTemplateRenderer` uses the StringTemplate engine with `{name}` placeholders. `ChatClient` uses the same mechanism when you call `user(u -> u.text("...{name}...").param("name", value))` or `system(s -> ...)`.

## Why It Matters

Hard-coded string concatenation makes prompts hard to read, review, test and reuse. Templates separate the fixed instruction from the variable data, let you store prompts as files under version control, and make it obvious which inputs reach the model.

## How It Works

1. You supply the template text (a `String` or a `Resource`) and variables (`param(k, v)`, `params(map)` or `variables(map)`).
2. The renderer replaces each `{name}` with `String.valueOf(value)`.
3. Validation (default mode `THROW`) checks that every placeholder has a value; a missing one fails with `IllegalStateException: Not all variables were replaced in the template. Missing variable names are: [...]`.
4. The rendered text becomes the message content.

Two edge cases matter in practice (observed in Spring AI 2.0.1):

- If a `ChatClient` request passes **no** parameters, the text is sent as-is — even if it contains `{placeholders}`. Literal braces are therefore harmless in plain text, but an intended placeholder silently stays unfilled.
- If you pass parameters **and** the text contains literal braces, such as JSON, the StringTemplate parser fails with `IllegalArgumentException: The template string is not valid.` Switch delimiters (below) or move the JSON into a parameter value. Parameter **values** may contain any characters; only the template text is parsed.

## Using Templates

### With ChatClient

```java
// Illustrative fragment
String quiz = chatClient.prompt()
        .system(s -> s.text("You write {count} multiple-choice questions for {level} learners.")
                .param("count", 3)
                .param("level", "beginner"))
        .user(u -> u.text("Topic: {topic}").param("topic", topic))
        .call()
        .content();
```

### With PromptTemplate directly

`PromptTemplate` is useful outside `ChatClient` — in advisors, evaluators, or to unit-test prompt text:

```java
// Illustrative fragment
PromptTemplate template = PromptTemplate.builder()
        .template("Explain {concept} to a {audience} in {sentences} sentences.")
        .variables(Map.of("concept", "garbage collection", "audience", "beginner", "sentences", 2))
        .build();
String text = template.render();
Prompt prompt = template.create();   // a Prompt containing one UserMessage
```

`SystemPromptTemplate` works the same way but creates a `SystemMessage`.

## Reusable Prompt Files

Keep important prompts in `src/main/resources/prompts/` — one file per prompt, named with a version:

```text
src/main/resources/prompts/
├── tutor-system-v2.st
└── quiz-user-v1.st
```

```text
You are a patient Java tutor for interview preparation.
Answer in at most {sentences} sentences, then give one short example.
If the question is not about Java, say that you only answer Java questions.
```

```java
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
class TutorService {

    private final ChatClient chatClient;

    TutorService(ChatClient.Builder builder,
                 @Value("classpath:/prompts/tutor-system-v2.st") Resource systemPrompt) {
        this.chatClient = builder.defaultSystem(systemPrompt).build();
    }

    String answer(String question) {
        return chatClient.prompt()
                .system(s -> s.param("sentences", 4))
                .user(question)
                .call()
                .content();
    }
}
```

Benefits: prompts are reviewed in pull requests like code, diffs show behaviour changes, a version suffix lets you roll back or compare versions in evaluations, and the service code stays short. Record the prompt version in logs or metrics with each response.

## Templates That Contain JSON

When a template must contain literal braces (a JSON example, Java code), switch the delimiters so `{` and `}` are ordinary characters:

```java
// Illustrative fragment
String answer = chatClient.prompt()
        .user(u -> u.text("""
                Return only JSON shaped like {"term": "...", "definition": "..."}
                for the term <term>.""")
                .param("term", "polymorphism"))
        .templateRenderer(StTemplateRenderer.builder()
                .startDelimiterToken('<')
                .endDelimiterToken('>')
                .build())
        .call()
        .content();
```

## Example

```java
import java.util.Map;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.template.st.StTemplateRenderer;

public class TemplateDemo {

    public static void main(String[] args) {
        // 1. Render a template directly
        PromptTemplate explain = PromptTemplate.builder()
                .template("Explain {concept} to a {audience} in {sentences} sentences.")
                .variables(Map.of("concept", "garbage collection", "audience", "beginner", "sentences", 2))
                .build();
        System.out.println("1 " + explain.render());

        // 2. A missing variable fails fast
        try {
            PromptTemplate.builder().template("Explain {concept} to a {audience}.")
                    .variables(Map.of("concept", "streams")).build().render();
        } catch (IllegalStateException e) {
            System.out.println("2 " + e.getMessage());
        }

        // 3. Values may contain braces; only the template text is parsed
        System.out.println("3 " + PromptTemplate.builder().template("Fix this code: {code}")
                .variables(Map.of("code", "if (x) { return; }")).build().render());

        // 4. JSON inside the template text needs different delimiters
        ScriptedChatModel model = new ScriptedChatModel().reply("{\"term\":\"polymorphism\",\"definition\":\"...\"}");
        ChatClient.create(model).prompt()
                .user(u -> u.text("Return JSON like {\"term\": \"...\"} for <term>.").param("term", "polymorphism"))
                .templateRenderer(StTemplateRenderer.builder().startDelimiterToken('<').endDelimiterToken('>').build())
                .call()
                .content();
        System.out.println("4 " + model.lastPrompt().getUserMessage().getText());
    }
}
```

**Output:**

```text
1 Explain garbage collection to a beginner in 2 sentences.
2 Not all variables were replaced in the template. Missing variable names are: [audience].
3 Fix this code: if (x) { return; }
4 Return JSON like {"term": "..."} for polymorphism.
```

### Code walkthrough

- **1:** `render()` substitutes the variables; numbers are converted with `String.valueOf`.
- **2:** validation names the missing variable — catch these in unit tests of your prompt builders, not in production.
- **3:** braces inside a *value* are safe; this is the easiest way to pass user code or JSON.
- **4:** with `<` `>` delimiters, the JSON braces in the template text are left alone and `<term>` is replaced.

## Common Mistakes and Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Not all variables were replaced in the template…` | A placeholder has no value | Pass every variable; unit-test the prompt builder |
| `The template string is not valid.` | Literal `{`/`}` in the template text while parameters are used | Use custom delimiters or pass the JSON as a value |
| The model receives `{topic}` literally | Request passed no parameters, so the template was not rendered | Add the `param(...)` call |
| `FileNotFoundException` for a prompt resource | Wrong path in `@Value("classpath:/prompts/…")` | Check the file is under `src/main/resources/prompts/` and the name matches |
| Custom renderer has no effect on RAG prompts | `templateRenderer(...)` applies only to text set in the `ChatClient` chain | Advisors such as `QuestionAnswerAdvisor` take their own `PromptTemplate` |

## Production Considerations

- Treat prompt files as code: review, version, test and roll back.
- Never put user input into the *template text*; pass it as a *value*, so it cannot change the template's structure.
- Keep templates short; every word is sent (and billed) on every request.

## Common Interview Traps

- **"Templates protect against prompt injection."** They separate structure from values in your code, but the model still reads the value text; injection defences are a separate concern.
- **"`templateRenderer(...)` changes every prompt in the request."** It applies to the `ChatClient`'s own system/user text, not to advisor templates.
- **"A missing variable is replaced by an empty string."** With the default validation mode it throws.

## Key Takeaways

- `{placeholders}` + `param(...)` (or `PromptTemplate.variables`) build prompts from fixed text and runtime values.
- Store important prompts as versioned resource files and inject them as `Resource`.
- Use custom delimiters or values for JSON and code; validation errors tell you exactly which variable is missing.

## Official References

- [Prompts and PromptTemplate](https://docs.spring.io/spring-ai/reference/api/prompt.html)
- [ChatClient: prompt templates and custom delimiters](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
