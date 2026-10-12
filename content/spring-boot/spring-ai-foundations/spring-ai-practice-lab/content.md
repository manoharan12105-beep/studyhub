# Spring AI Practice Lab (Offline Models)

**Module:** Spring AI: Foundations · **Interview priority:** Awareness · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

> [!NOTE]
> **Reference topic.** This page sets up the project that every runnable example in the Spring AI lessons assumes. Read it once, keep the project open, and come back when a lesson says "run it in the Practice Lab".

## Learning Objectives

- Create the `studyai` practice project with Spring Boot 4.1.1, Spring AI 2.0.1 and JDK 21.
- Add two small support classes that replace real models with deterministic stand-ins.
- Run lesson examples offline, free and repeatably; switch to a real provider when you want to see real answers.

## Definition

The **Practice Lab** is a normal Spring Boot project (`studyai`, package `com.example.studyai`) plus two classes in `com.example.studyai.lab`:

- `ScriptedChatModel` — a `ChatModel` that returns replies you queue in advance (plain text or tool-call requests) and records every `Prompt` it receives.
- `KeywordEmbeddingModel` — a toy `EmbeddingModel` that maps text onto seven topic dimensions so vector search works without a provider.

They implement the real Spring AI interfaces, so `ChatClient`, advisors, chat memory, the tool-calling loop, `SimpleVectorStore` and the RAG advisors run exactly as they do with a hosted model. Only the model's "intelligence" is scripted.

## Why It Matters

- **Repeatable output.** Every `**Output:**` block in these lessons was produced by running the lesson's program against these classes. You get the same output.
- **No key, no cost, no network.** You can study tool calling, memory and RAG without an account.
- **Real test technique.** The same idea — replace the model with a deterministic collaborator — is how you unit-test AI services ([Testing AI Services](../../spring-ai-production/testing-ai-services/content.md)).

The lab cannot show answer *quality*: a scripted model says only what you scripted. Lessons that need a real model say **Expected behaviour** and describe it instead of showing invented output.

## Setup

1. Create the project with the `pom.xml` from [Project Setup](../spring-ai-project-setup/content.md) (Spring Boot 4.1.1 parent, `spring-ai.version` 2.0.1, `spring-ai-starter-model-openai`). Add these modules, which later lessons use:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-vector-store-advisor</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-rag</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-markdown-document-reader</artifactId>
</dependency>
```

2. Use this layout:

```text
studyai/
├── pom.xml
└── src/
    ├── main/java/com/example/studyai/
    │   ├── StudyAiApplication.java      (the @SpringBootApplication class)
    │   └── lab/
    │       ├── ScriptedChatModel.java
    │       └── KeywordEmbeddingModel.java
    ├── main/resources/application.properties
    └── test/java/com/example/studyai/   (lesson programs and tests)
```

3. Lesson programs are plain classes with a `main` method and no `package` line. Put them in `src/test/java` (default package) or add your own package line, and run them from the IDE. They do not start Spring Boot, so they need no API key.

4. Running a `main` program prints Logback lines (INFO/DEBUG from Spring AI classes) around the program's own output. The `**Output:**` blocks in the lessons show only what the program itself prints.

## ScriptedChatModel

```java
package com.example.studyai.lab;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;

import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.metadata.ChatResponseMetadata;
import org.springframework.ai.chat.metadata.DefaultUsage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.model.tool.ToolCallingChatOptions;
import org.springframework.ai.tokenizer.JTokkitTokenCountEstimator;
import org.springframework.ai.tokenizer.TokenCountEstimator;

import reactor.core.publisher.Flux;

/**
 * A ChatModel that returns replies you script in advance and records every prompt it receives.
 * It never contacts a provider, so demos and tests are free, fast and deterministic.
 */
public class ScriptedChatModel implements ChatModel {

    private final Deque<AssistantMessage> replies = new ArrayDeque<>();
    private final List<Prompt> prompts = new ArrayList<>();
    private final TokenCountEstimator tokens = new JTokkitTokenCountEstimator();

    /** Queue a plain text reply. */
    public ScriptedChatModel reply(String text) {
        replies.add(new AssistantMessage(text));
        return this;
    }

    /** Queue a reply in which the "model" asks the application to run a tool. */
    public ScriptedChatModel replyWithToolCall(String toolName, String jsonArguments) {
        var call = new AssistantMessage.ToolCall("call-" + (replies.size() + 1), "function", toolName, jsonArguments);
        replies.add(AssistantMessage.builder().content("").toolCalls(List.of(call)).build());
        return this;
    }

    public List<Prompt> prompts() {
        return prompts;
    }

    public Prompt lastPrompt() {
        return prompts.get(prompts.size() - 1);
    }

    @Override
    public ChatOptions getOptions() {
        // Tool-calling options let ChatClient attach @Tool definitions to requests.
        return ToolCallingChatOptions.builder().model("scripted-model").build();
    }

    @Override
    public ChatResponse call(Prompt prompt) {
        prompts.add(prompt);
        AssistantMessage next = replies.poll();
        if (next == null) {
            throw new IllegalStateException("No scripted reply left for: " + prompt.getContents());
        }
        int promptTokens = tokens.estimate(prompt.getContents());
        int completionTokens = tokens.estimate(next.getText() == null ? "" : next.getText());
        var metadata = ChatResponseMetadata.builder()
                .model("scripted-model")
                .usage(new DefaultUsage(promptTokens, completionTokens))
                .build();
        return new ChatResponse(List.of(new Generation(next)), metadata);
    }

    @Override
    public Flux<ChatResponse> stream(Prompt prompt) {
        // Emit the next scripted reply word by word, like a provider streaming tokens.
        String text = call(prompt).getResult().getOutput().getText();
        List<String> pieces = Arrays.stream(text.split("(?<= )")).toList();
        return Flux.fromIterable(pieces)
                .map(piece -> new ChatResponse(List.of(new Generation(new AssistantMessage(piece)))));
    }
}
```

### Code walkthrough

- `reply(...)` and `replyWithToolCall(...)` queue the next answers; each `call(...)` consumes one. Running out of replies throws, which makes a test fail loudly when your code calls the model more often than you expected.
- `prompts()` and `lastPrompt()` let you inspect exactly what reached the model layer — the system message, memory, retrieved context, format instructions and tool results that `ChatClient` and its advisors added.
- `getOptions()` returns `ToolCallingChatOptions`, so `ChatClient` can attach `@Tool` definitions; with plain `ChatOptions` the tool loop would have nowhere to put them.
- Token usage is estimated with `JTokkitTokenCountEstimator`, so usage metadata, budgets and observability code have realistic numbers to work with.
- `stream(...)` splits the reply into words to imitate a streaming provider.

## KeywordEmbeddingModel

```java
package com.example.studyai.lab;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;

/**
 * A toy EmbeddingModel for offline demos. Six dimensions count words that belong to one topic;
 * the seventh ("other") is set only when no topic word appears, so no vector is ever all zeros.
 * The vector is then normalised to length 1. Real embedding models learn hundreds or thousands of
 * dimensions from data; this one only shows the mechanics.
 */
public class KeywordEmbeddingModel implements EmbeddingModel {

    private static final List<String> TOPICS =
            List.of("java", "database", "security", "ai", "testing", "cooking", "other");

    private static final Map<String, Integer> WORDS = Map.ofEntries(
            Map.entry("java", 0), Map.entry("jvm", 0), Map.entry("spring", 0), Map.entry("bean", 0),
            Map.entry("sql", 1), Map.entry("postgresql", 1), Map.entry("database", 1), Map.entry("index", 1),
            Map.entry("table", 1), Map.entry("query", 1),
            Map.entry("password", 2), Map.entry("token", 2), Map.entry("jwt", 2), Map.entry("security", 2),
            Map.entry("model", 3), Map.entry("prompt", 3), Map.entry("llm", 3), Map.entry("embedding", 3),
            Map.entry("vector", 3),
            Map.entry("test", 4), Map.entry("junit", 4), Map.entry("mock", 4), Map.entry("assert", 4),
            Map.entry("recipe", 5), Map.entry("pasta", 5), Map.entry("oven", 5), Map.entry("bake", 5));

    public static List<String> topics() {
        return TOPICS;
    }

    @Override
    public EmbeddingResponse call(EmbeddingRequest request) {
        List<Embedding> embeddings = new ArrayList<>();
        List<String> texts = request.getInstructions();
        for (int i = 0; i < texts.size(); i++) {
            embeddings.add(new Embedding(vectorFor(texts.get(i)), i));
        }
        return new EmbeddingResponse(embeddings);
    }

    @Override
    public float[] embed(Document document) {
        return vectorFor(document.getText());
    }

    @Override
    public int dimensions() {
        return TOPICS.size();
    }

    private static float[] vectorFor(String text) {
        float[] vector = new float[TOPICS.size()];
        boolean matched = false;
        for (String word : text.toLowerCase(Locale.ROOT).split("[^a-z]+")) {
            String singular = word.endsWith("s") ? word.substring(0, word.length() - 1) : word;
            Integer dimension = WORDS.containsKey(word) ? WORDS.get(word) : WORDS.get(singular);
            if (dimension != null) {
                vector[dimension]++;
                matched = true;
            }
        }
        if (!matched) {
            vector[TOPICS.size() - 1] = 1;     // "other": unrelated to every topic above
        }
        double length = 0;
        for (float v : vector) {
            length += v * v;
        }
        for (int i = 0; i < vector.length; i++) {
            vector[i] = (float) (vector[i] / Math.sqrt(length));
        }
        return vector;
    }
}
```

### Code walkthrough

- Dimensions are topics: `java`, `database`, `security`, `ai`, `testing`, `cooking` and `other`. "PostgreSQL index" lands near "database"; "pasta recipe" lands near "cooking".
- Vectors are normalised to length 1, as many real embedding models' vectors are, so cosine similarity and dot product agree.
- The `other` dimension prevents an all-zero vector (vector stores cannot compute similarity for a zero vector).
- Unlike a real model it knows nothing about synonyms: "auth" and "login" share no dimension. That limitation is useful in the retrieval-quality lessons.

## Check the Lab

```java
import java.util.List;
import java.util.Map;

import com.example.studyai.lab.KeywordEmbeddingModel;
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.SimpleVectorStore;

public class LabCheck {

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel().reply("The lab is ready.");
        String reply = ChatClient.create(model).prompt().user("Is the lab ready?").call().content();
        System.out.println("Chat reply:     " + reply);
        System.out.println("Prompts seen:   " + model.prompts().size());

        var embeddings = new KeywordEmbeddingModel();
        System.out.println("Dimensions:     " + embeddings.dimensions() + " " + KeywordEmbeddingModel.topics());

        var store = SimpleVectorStore.builder(embeddings).build();
        store.add(List.of(
                new Document("Create an index to speed up a SQL query.", Map.of("source", "dbms")),
                new Document("Bake the pasta in the oven.", Map.of("source", "cooking"))));
        Document best = store.similaritySearch(SearchRequest.builder().query("database index").topK(1).build()).get(0);
        System.out.println("Best match:     " + best.getMetadata().get("source"));
    }
}
```

**Output:**

```text
Chat reply:     The lab is ready.
Prompts seen:   1
Dimensions:     7 [java, database, security, ai, testing, cooking, other]
Best match:     dbms
```

## Switching to a Real Model

When a lesson's **Expected behaviour** makes you curious, run the same service against a provider:

```properties
# src/main/resources/application.properties
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.model=gpt-5-mini
spring.ai.openai.embedding.model=text-embedding-3-small
```

Or, free and local, with [Ollama](https://ollama.com) installed and `spring-ai-starter-model-ollama` added:

```properties
spring.ai.model.chat=ollama
spring.ai.model.embedding=ollama
spring.ai.ollama.chat.model=llama3.2
spring.ai.ollama.embedding.model=nomic-embed-text
```

Inject `ChatClient.Builder` in a Spring bean instead of building `ChatClient.create(model)` by hand ([Your First Spring AI Application](../first-spring-ai-application/content.md)). Real answers vary from run to run.

## Common Mistakes and Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `IllegalStateException: No scripted reply left for: …` | Code called the model more times than replies were queued (for example a retry, a tool loop iteration or a query-rewriting step) | Queue one reply per model call; read `prompts()` to see the extra call |
| Tool methods are never called | Replies queued with `reply(...)` only | Queue `replyWithToolCall(...)` before the final text reply |
| `IllegalArgumentException: Vectors cannot have zero norm` | A custom embedding returned all zeros | Use the lab model as published (its `other` dimension prevents this) |
| A `main` program never exits after using `RetrievalAugmentationAdvisor` | The advisor's default task executor keeps non-daemon threads alive | In plain `main` programs pass `.taskExecutor(new SyncTaskExecutor())` to the advisor builder; inside Spring Boot no change is needed |
| Startup asks for an API key while running a lesson program | The program started Spring Boot | Lesson programs build `ChatClient.create(model)` directly; only Boot applications need keys |

## Key Takeaways

- The lab replaces only the model; the rest of Spring AI runs for real.
- Scripted replies make outputs repeatable and tests deterministic; inspect `prompts()` to learn what advisors send.
- Switch to a real provider to judge quality — never to make tests pass.

## Official References

- [Chat Model API](https://docs.spring.io/spring-ai/reference/api/chatmodel.html)
- [Embeddings API](https://docs.spring.io/spring-ai/reference/api/embeddings.html)
- [Vector databases: SimpleVectorStore](https://docs.spring.io/spring-ai/reference/api/vectordbs.html)
