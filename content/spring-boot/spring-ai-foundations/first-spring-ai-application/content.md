# Your First Spring AI Application

**Module:** Spring AI: Foundations · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Build a working endpoint, `POST /api/explain`, that asks a model to explain a Java concept.
- Wire `ChatClient.Builder` → service → controller with a validated request DTO.
- Run it against a real provider and offline against the Practice Lab's scripted model.
- Recognise the first errors you are likely to hit and fix them.

## Definition

A first Spring AI application is a Spring Boot web application with one model starter, a service that owns a `ChatClient`, and a controller that exposes the service over HTTP. Everything else in this course — templates, structured output, memory, tools, RAG — is added to this skeleton.

## Why It Matters

Seeing the whole path once — configuration, bean creation, request, model call, response — makes every later topic a small change to something you already understand. It also shows the shape interviewers expect: the controller stays thin, the AI call lives in a service, and input is validated before it costs tokens.

## How It Works

```text
curl POST /api/explain {"topic":"..."} ─► ExplainController (validates ExplainRequest)
                                               │
                                               ▼
                                  StudyAssistantService.explain(topic)
                                               │  chatClient.prompt().user(...).call().content()
                                               ▼
                                  ChatClient ─► OpenAiChatModel ─► OpenAI API
                                               │
◄──────────── 200 {"topic":"...","explanation":"..."} ◄──────────┘
```

1. The OpenAI starter auto-configures `OpenAiChatModel` from `spring.ai.openai.*` and a prototype-scoped `ChatClient.Builder`.
2. The service builds its own `ChatClient` once, with a default system instruction.
3. The controller validates the request body (Bean Validation) and delegates.

## Step 1: Project and Configuration

Use the project from [Project Setup](../spring-ai-project-setup/content.md) (web, validation and OpenAI starters). Configure:

```properties
spring.application.name=studyai
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.model=gpt-5-mini
spring.ai.model.image=none
spring.ai.model.audio.speech=none
spring.ai.model.audio.transcription=none
spring.ai.model.moderation=none
```

Set `OPENAI_API_KEY` in your shell or IDE ([Configuration and Secrets](../spring-ai-configuration-and-secrets/content.md)).

## Step 2: The Service

```java
package com.example.studyai.explain;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class StudyAssistantService {

    private final ChatClient chatClient;

    public StudyAssistantService(ChatClient.Builder builder) {
        this.chatClient = builder
                .defaultSystem("""
                        You are a patient Java tutor for interview preparation.
                        Explain the requested topic in at most 4 sentences,
                        then give one short Java example in a code block.""")
                .build();
    }

    public String explain(String topic) {
        return chatClient.prompt()
                .user("Explain this topic: " + topic)
                .call()
                .content();
    }
}
```

## Step 3: Request, Response and Controller

```java
package com.example.studyai.explain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExplainRequest(@NotBlank @Size(max = 200) String topic) {
}
```

```java
package com.example.studyai.explain;

public record ExplainResponse(String topic, String explanation) {
}
```

```java
package com.example.studyai.explain;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/explain")
public class ExplainController {

    private final StudyAssistantService assistant;

    public ExplainController(StudyAssistantService assistant) {
        this.assistant = assistant;
    }

    @PostMapping
    public ExplainResponse explain(@Valid @RequestBody ExplainRequest request) {
        return new ExplainResponse(request.topic(), assistant.explain(request.topic()));
    }
}
```

### Code walkthrough

- `ChatClient.Builder` is prototype-scoped: each injection point gets a fresh builder, so the defaults set here do not leak into other services.
- `defaultSystem(...)` is sent with every request from this client; per-request text goes in `user(...)`.
- `@Valid` with `@NotBlank @Size(max = 200)` rejects empty or oversized input with `400 Bad Request` **before** any tokens are spent ([Bean Validation](../../validation/bean-validation/content.md)).
- The controller is thin: it maps HTTP to the service and back. Error mapping is added in [Designing the REST Endpoint](../../spring-ai-chat-client/spring-ai-rest-service-design/content.md).

## Step 4: Run It Against a Real Model

```bash
./mvnw spring-boot:run
curl -s -X POST http://localhost:8080/api/explain \
     -H "Content-Type: application/json" \
     -d '{"topic":"the difference between == and equals() in Java"}'
```

**Expected behaviour:** a `200` response shaped like `{"topic":"the difference between == and equals() in Java","explanation":"..."}` where the explanation is a few sentences comparing reference identity with logical equality, followed by a short code example. The wording changes on every call. An empty topic returns `400` without calling the model.

## Step 5: Run It Offline with the Practice Lab

The service only needs a `ChatClient.Builder`, so a plain program can feed it one built on the scripted model:

```java
import com.example.studyai.explain.StudyAssistantService;
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;

public class FirstAppOffline {

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("== compares references; equals() compares values when a class overrides it.");

        StudyAssistantService service = new StudyAssistantService(ChatClient.builder(model));
        String answer = service.explain("== vs equals()");

        System.out.println("Answer: " + answer);
        model.lastPrompt().getInstructions().forEach(message ->
                System.out.println(message.getMessageType() + ": " + message.getText().lines().findFirst().orElse("")));
    }
}
```

**Output:**

```text
Answer: == compares references; equals() compares values when a class overrides it.
SYSTEM: You are a patient Java tutor for interview preparation.
USER: Explain this topic: == vs equals()
```

The second part of the output proves what the service sent: the default system message and the user message, in that order.

## Common Mistakes and Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Startup fails: `At least one credential source must be specified…` | `OPENAI_API_KEY` not set for this run | Set it in the shell or IDE run configuration |
| `No qualifying bean of type 'org.springframework.ai.chat.client.ChatClient$Builder'` | No model starter, or `spring.ai.model.chat=none`, or `spring.ai.chat.client.enabled=false` | Add a model starter and select it |
| `401` on the first request | Invalid or revoked key | Create a new key |
| `429` errors | Provider rate limit or no remaining credit | Check the provider account; see [Resilience](../../spring-ai-production/ai-resilience-and-provider-errors/content.md) |
| `400` from your API with an empty topic | Bean Validation working as intended | Send a non-blank topic |
| Requests take several seconds | Normal model latency | Consider streaming for long answers ([call vs stream](../../spring-ai-chat-client/spring-ai-call-vs-stream/content.md)) |

## Production Considerations

- Even the first endpoint needs an input-size limit, an output limit (`spring.ai.openai.chat.max-completion-tokens`), authentication and rate limiting, because every call costs money.
- Do not return raw provider errors to clients; map them to clear HTTP responses.
- Add Actuator to see request latency and token usage from day one.

## Common Interview Traps

- **"Inject `ChatClient` directly."** Spring AI auto-configures a `ChatClient.Builder`, not a `ChatClient`; you build the client (or declare your own `ChatClient` bean).
- **"Validation is unnecessary because the model can handle anything."** Validation protects cost, latency and abuse; it runs before the model call.
- **"The controller should build the prompt."** Prompt logic belongs in the service so it can be tested and reused.

## Key Takeaways

- Starter + key + `ChatClient.Builder` → service → thin controller is the whole skeleton.
- Validate input before the model call; set output limits.
- The same service runs offline with a scripted model, which is how you test it.

## Official References

- [ChatClient: using an auto-configured ChatClient.Builder](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [OpenAI chat auto-configuration](https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html)
- [Getting started](https://docs.spring.io/spring-ai/reference/getting-started.html)
