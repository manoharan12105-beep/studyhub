# Designing the Controller, Service and REST Endpoint

**Module:** Spring AI: ChatClient · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Split an AI feature into controller, application service and AI gateway, each with one job.
- Validate requests, limit cost and map failures to HTTP status codes.
- Avoid holding database transactions and platform threads during slow model calls.
- Test the HTTP contract offline with `MockMvc` and a scripted model.

## Definition

An AI endpoint is an ordinary REST endpoint whose use case includes a model call. A clean design has three layers: a **thin controller** (HTTP mapping and request validation), an **application service** (the use case: authorization, limits, persistence, fallbacks) and an **AI gateway** (the only class that knows prompts, `ChatClient`, options and provider exceptions). The REST conventions from [REST API Best Practices](../../rest/rest-api-best-practices/content.md) and [DTO Pattern](../../rest/dto-pattern/content.md) apply unchanged.

## Why It Matters

AI calls are slow, paid, probabilistic and can fail in new ways. Without clear layers, prompt strings end up in controllers, provider exceptions leak to clients, model calls run inside database transactions, and nothing can be tested without a network. Interviewers often ask you to sketch exactly this design.

## How It Works

```text
HTTP ──► AskController          @Valid AskRequest → AskResponse; no AI code
            │
            ▼
         AskService             use case: who may ask, budgets, save Q&A, fallbacks
            │                   (transactions only around DB work, not around the model call)
            ▼
         TutorGateway           prompt + ChatClient + options; translates provider errors
            │
            ▼
         ChatClient ─► ChatModel ─► provider
```

| Layer | Owns | Must not contain |
|-------|------|------------------|
| Controller | URL, HTTP method, DTOs, `@Valid`, status codes | Prompts, `ChatClient`, business rules |
| Service | Use-case flow, authorization, budgets, persistence, fallback | Provider-specific exceptions, prompt wording |
| AI gateway | Prompt templates, options, `ChatClient` call, output parsing, error translation | HTTP concerns, database access |

### Request and response design

- **Request DTO** with Bean Validation: required fields and **length limits** (input tokens cost money and fill the context window).
- **Response DTO** that you control (`answer`, `sources`, `truncated`, `promptVersion`) — never return a raw `ChatResponse`.
- **Status codes:** `400` for invalid input, `429` when your own per-user limit is hit, `503` when the provider is unavailable, `504` on timeout, `200` with a clear flag when an answer is truncated.

### Slow calls and resources

- Do **not** call the model inside `@Transactional` methods: the database connection would be held for seconds ([Transactional Pitfalls](../../transactions/transactional-pitfalls/content.md)). Read what you need, commit, call the model, then save the result in a new short transaction.
- Model calls block the calling thread. With Java 21 and Spring Boot, `spring.threads.virtual.enabled=true` lets request handling run on virtual threads, so many concurrent slow calls do not exhaust the servlet thread pool. Concurrency must still be limited by provider rate limits and budgets.
- Long answers can stream instead ([call() vs stream()](../spring-ai-call-vs-stream/content.md)).

## Example

```java
package com.example.studyai.ask;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AskRequest(@NotBlank @Size(max = 1000) String question) {
}
```

```java
package com.example.studyai.ask;

public record AskResponse(String answer, boolean truncated) {
}
```

```java
package com.example.studyai.ask;

public class TutorUnavailableException extends RuntimeException {

    public TutorUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

```java
package com.example.studyai.ask;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.stereotype.Component;

@Component
public class TutorGateway {

    private final ChatClient chatClient;

    public TutorGateway(ChatClient.Builder builder) {
        this.chatClient = builder
                .defaultSystem("You are a Java interview tutor. Answer in at most 5 sentences.")
                .build();
    }

    public AskResponse ask(String question) {
        try {
            ChatResponse response = chatClient.prompt()
                    .user(u -> u.text("Question:\n<<<\n{q}\n>>>").param("q", question))
                    .call()
                    .chatResponse();
            String text = response.getResult().getOutput().getText();
            String finish = response.getResult().getMetadata().getFinishReason();
            if (text == null || text.isBlank()) {
                throw new TutorUnavailableException("Empty answer from model", null);
            }
            return new AskResponse(text, "length".equalsIgnoreCase(finish));
        } catch (TutorUnavailableException e) {
            throw e;
        } catch (RuntimeException e) {
            // Provider-specific exceptions stop here; callers only see TutorUnavailableException.
            throw new TutorUnavailableException("Model call failed", e);
        }
    }
}
```

```java
package com.example.studyai.ask;

import org.springframework.stereotype.Service;

@Service
public class AskService {

    private final TutorGateway tutor;

    public AskService(TutorGateway tutor) {
        this.tutor = tutor;
    }

    public AskResponse ask(String question) {
        // Use-case logic lives here: per-user limits, saving history, fallbacks.
        return tutor.ask(question.strip());
    }
}
```

```java
package com.example.studyai.ask;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ask")
public class AskController {

    private final AskService service;

    public AskController(AskService service) {
        this.service = service;
    }

    @PostMapping
    public AskResponse ask(@Valid @RequestBody AskRequest request) {
        return service.ask(request.question());
    }

    @ExceptionHandler(TutorUnavailableException.class)
    ProblemDetail unavailable(TutorUnavailableException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE,
                "The tutor is temporarily unavailable. Please try again.");
    }
}
```

Now test the HTTP contract offline: standalone `MockMvc` drives the real controller, service and gateway, with the gateway's `ChatClient.Builder` built on the scripted model ([Practice Lab](../../spring-ai-foundations/spring-ai-practice-lab/content.md)).

```java
import com.example.studyai.ask.AskController;
import com.example.studyai.ask.AskService;
import com.example.studyai.ask.TutorGateway;
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

public class AskEndpointCheck {

    public static void main(String[] args) throws Exception {
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("A HashMap stores key-value pairs in buckets chosen by hashCode().");
        AskController controller = new AskController(new AskService(new TutorGateway(ChatClient.builder(model))));
        MockMvc mvc = MockMvcBuilders.standaloneSetup(controller).build();

        print(mvc, "{\"question\":\"How does HashMap work?\"}");
        print(mvc, "{\"question\":\"   \"}");
        print(mvc, "{\"question\":\"And TreeMap?\"}");   // no scripted reply left: the model call fails
        System.out.println("model calls: " + model.prompts().size());
    }

    static void print(MockMvc mvc, String body) throws Exception {
        MvcResult result = mvc.perform(post("/api/ask").contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn();
        String content = result.getResponse().getContentAsString();
        System.out.println(result.getResponse().getStatus() + " " + (content.isEmpty() ? "(no body)" : content));
    }
}
```

**Output:**

```text
200 {"answer":"A HashMap stores key-value pairs in buckets chosen by hashCode().","truncated":false}
400 (no body)
503 {"detail":"The tutor is temporarily unavailable. Please try again.","instance":"/api/ask","status":503,"title":"Service Unavailable"}
model calls: 2
```

### Code walkthrough

- **Controller:** only `@Valid`, delegation and the exception mapping. The blank question is rejected with `400` and the model is never called. (The body is empty in a standalone test; a running Spring Boot application returns its standard error body.)
- **Gateway:** owns the prompt, puts user input in a delimited template *value*, checks the finish reason and empty text, and turns every model failure into `TutorUnavailableException`.
- **503 path:** the scripted model ran out of replies and threw. That is exactly how a provider outage reaches the gateway, so the test proves clients get a stable `ProblemDetail` instead of a stack trace.
- **model calls: 2** — the successful request and the failing one; the invalid request cost nothing.

## Common Mistakes and Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Database connection pool exhausted under load | Model called inside `@Transactional` | Call the model outside transactions |
| Servlet threads all busy, requests queue | Many slow blocking model calls on platform threads | Virtual threads, streaming, request limits |
| Clients receive provider error JSON or stack traces | Exceptions not translated | Translate in the gateway; map with `@ExceptionHandler`/`@RestControllerAdvice` |
| Costs spike from huge inputs | No size limit on request fields | `@Size(max = …)` and token budgets |
| Untestable service | `ChatClient.create(...)` inside methods, static clients | Inject `ChatClient.Builder` into a gateway; use a scripted model in tests |

## Production Considerations

- Authenticate the endpoint and apply per-user rate limits and token budgets before calling the model ([Rate Limiting](../../../system-design/communication/rate-limiting/content.md)).
- Make write endpoints idempotent when the client may retry after a timeout, so one question is not charged or saved twice.
- Return a `truncated` flag and, for RAG endpoints, the sources used; clients can then display honest results.

## Common Interview Traps

- **"Put the prompt in the controller for simplicity."** It mixes HTTP with AI logic and makes both hard to test and change.
- **"Wrap the whole use case in `@Transactional`."** Holding a DB connection during a multi-second model call starves the pool.
- **"Return the provider's error message so the client knows what happened."** Map to your own stable error contract.

## Key Takeaways

- Controller (HTTP) → service (use case) → AI gateway (prompt, `ChatClient`, error translation).
- Validate and limit input before calling the model; translate failures into stable HTTP errors.
- Keep model calls outside transactions; test the endpoint offline with `MockMvc` and a scripted model.

## Official References

- [ChatClient API](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [Spring MVC: error responses (ProblemDetail)](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html)
- [Spring Boot: virtual threads](https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html)
