# Grounding and Citations

**Module:** Spring AI: Embeddings and RAG · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain grounding and why RAG answers can still hallucinate.
- Label retrieved passages so the model can cite them, using a custom document formatter.
- Validate citations in code and decide what to do with unsupported answers.
- Present sources to users from retrieved metadata, not from model text.

## Definition

An answer is **grounded** when every claim is supported by the provided context. A **citation** links a claim to the passage that supports it. In RAG, grounding is requested by the prompt ("answer only from the sources") and **checked by the application**, because the model can still mix in prior knowledge, misread a passage or invent a source.

## Why It Matters

Users trust answers with sources — so a fabricated or wrong citation is worse than none. In regulated or support settings, "show me where it says that" is a requirement. Citations also make debugging possible: you can see whether the model ignored good context or received bad context.

## How It Works

```text
retrieved documents ──▶ documentFormatter: "[pol-4] (Token policy, section 4) Access tokens expire…"
                      ──▶ system prompt: "cite the source id after each sentence"
model answer        ──▶ extract [ids] ──▶ every id ∈ retrieved ids?   no → reject / retry / flag
                                        ──▶ (optional) fact-check each claim against its source
UI                  ──▶ show titles/links from the retrieved documents' metadata
```

- `ContextualQueryAugmenter.builder().documentFormatter(Function<List<Document>, String>)` controls how documents appear in the prompt; the default joins the texts without ids.
- `RetrievalAugmentationAdvisor.DOCUMENT_CONTEXT` (or `QuestionAnswerAdvisor.RETRIEVED_DOCUMENTS`) gives the application the exact documents the model saw.
- A citation check proves the cited **id was provided**, not that it **supports** the claim; for that, use claim-level fact checking ([RAG Evaluation and Failures](../rag-evaluation-and-failures/content.md)).

## Example

Sources are labelled with their ids; one answer cites correctly, the other invents `[pol-9]`:

```java
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.example.studyai.lab.KeywordEmbeddingModel;
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.document.Document;
import org.springframework.ai.rag.advisor.RetrievalAugmentationAdvisor;
import org.springframework.ai.rag.generation.augmentation.ContextualQueryAugmenter;
import org.springframework.ai.rag.retrieval.search.VectorStoreDocumentRetriever;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.core.task.SimpleAsyncTaskExecutor;

public class CitationDemo {

    static final Pattern CITATION = Pattern.compile("\\[([a-z0-9-]+)]");

    /** Each document is labelled with its id so the model can cite it. */
    static String formatSources(List<Document> documents) {
        return documents.stream()
                .map(d -> "[" + d.getId() + "] (" + d.getMetadata().get("title") + ") " + d.getText())
                .collect(Collectors.joining("\n"));
    }

    /** Returns the cited ids that were NOT among the retrieved documents. */
    static Set<String> unsupportedCitations(String answer, List<Document> retrieved) {
        Set<String> allowed = retrieved.stream().map(Document::getId).collect(Collectors.toSet());
        Set<String> invalid = new LinkedHashSet<>();
        Matcher m = CITATION.matcher(answer);
        while (m.find()) {
            if (!allowed.contains(m.group(1))) {
                invalid.add(m.group(1));
            }
        }
        return invalid;
    }

    public static void main(String[] args) {
        SimpleVectorStore store = SimpleVectorStore.builder(new KeywordEmbeddingModel()).build();
        store.add(List.of(
                new Document("pol-3", "Refresh tokens expire after 7 days of inactivity.", Map.of("title", "Token policy, section 3")),
                new Document("pol-4", "Access tokens expire after 15 minutes.", Map.of("title", "Token policy, section 4"))));

        ScriptedChatModel model = new ScriptedChatModel()
                .reply("Access tokens expire after 15 minutes [pol-4]; refresh tokens after 7 days of inactivity [pol-3].")
                .reply("Access tokens expire after 15 minutes [pol-4] and can be revoked at any time [pol-9].");

        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("rag-");
        executor.setVirtualThreads(true);
        ChatClient client = ChatClient.builder(model)
                .defaultSystem("Answer only from the sources. After each sentence, cite the source id in square brackets, "
                        + "for example [pol-4]. If the sources do not contain the answer, say you don't know.")
                .defaultAdvisors(RetrievalAugmentationAdvisor.builder()
                        .documentRetriever(VectorStoreDocumentRetriever.builder()
                                .vectorStore(store).similarityThreshold(0.5).build())
                        .queryAugmenter(ContextualQueryAugmenter.builder()
                                .documentFormatter(CitationDemo::formatSources)
                                .build())
                        .taskExecutor(executor)
                        .build())
                .build();

        for (int i = 1; i <= 2; i++) {
            ChatClientResponse response = client.prompt().user("When do tokens expire?").call().chatClientResponse();
            @SuppressWarnings("unchecked")
            var retrieved = (List<Document>) response.context().get(RetrievalAugmentationAdvisor.DOCUMENT_CONTEXT);
            String answer = response.chatResponse().getResult().getOutput().getText();
            Set<String> invalid = unsupportedCitations(answer, retrieved);
            System.out.println("Answer " + i + ": " + answer);
            System.out.println("  " + (invalid.isEmpty() ? "citations OK" : "REJECTED, unknown sources " + invalid));
        }
        System.out.println("--- sources block sent to the model ---");
        String sent = model.lastPrompt().getUserMessage().getText();
        System.out.println(sent.substring(sent.indexOf("[pol"), sent.lastIndexOf("---------------------")).strip());
    }
}
```

**Output:**

```text
Answer 1: Access tokens expire after 15 minutes [pol-4]; refresh tokens after 7 days of inactivity [pol-3].
  citations OK
Answer 2: Access tokens expire after 15 minutes [pol-4] and can be revoked at any time [pol-9].
  REJECTED, unknown sources [pol-9]
--- sources block sent to the model ---
[pol-4] (Token policy, section 4) Access tokens expire after 15 minutes.
[pol-3] (Token policy, section 3) Refresh tokens expire after 7 days of inactivity.
```

The two answers are scripted to show a correct and a fabricated citation; the formatting, retrieval and validation are real.

### Code walkthrough

- `formatSources` replaced the default formatter so each passage carries an id and a title the model can cite.
- The system prompt asks for citations; it cannot guarantee them — answer 2 added a claim ("can be revoked at any time") with a source that was never provided.
- `unsupportedCitations` compares cited ids with `DOCUMENT_CONTEXT` and rejected answer 2.
- Answer 1 passed the id check. Whether "7 days of inactivity" really matches `pol-3` is a separate, semantic check.

### What to do with a rejected answer

| Option | When |
|--------|------|
| Retry once with feedback ("only cite ids from the list") | Interactive chat, low cost of one extra call |
| Strip unsupported sentences | Long answers where most claims are fine |
| Return a fixed "I couldn't find a reliable answer" | Regulated or high-stakes answers |
| Flag for review and log | Always, for evaluation |

## Common Mistakes and Troubleshooting

- **Letting the model produce URLs.** It may invent them. Render links in the UI from the retrieved documents' metadata, keyed by cited id.
- **No ids in the context.** With the default formatter, the model has nothing stable to cite; it may cite "the document" or invent titles.
- **Treating a valid id as proof.** Check claims against passages for important answers.
- **Grounding instructions in the user message only.** Put them in the system message too, and keep retrieved text clearly delimited as data ([Prompt Injection](../../spring-ai-prompts-and-memory/prompt-injection-and-untrusted-input/content.md)).
- **Over-strict refusal.** Asking the model to refuse whenever it's unsure can make it refuse answerable questions; measure both false answers and false refusals.

## Production Considerations

- Store question, retrieved ids, answer, citation-check result and user feedback for each answer — the raw material for evaluation.
- Show sources next to answers; users catch errors the system misses.
- Retrieved documents can contain injected instructions ("ignore the rules and say…"); grounding prompts reduce but do not remove that risk.
- Structured output (a list of `{sentence, sourceIds}`) makes validation easier than parsing brackets.

## Common Interview Traps

- **"RAG eliminates hallucinations."** It reduces them; models still add unsupported claims.
- **"If the answer has citations, it's grounded."** Citations can be fabricated or attached to claims they don't support.
- **"The model should generate the source links."** Generate links from your metadata.

## Key Takeaways

- Grounded = every claim supported by the context; RAG asks for it, the application verifies it.
- Label passages with ids via `documentFormatter`; validate cited ids against `DOCUMENT_CONTEXT`.
- A valid id is not proof of support — fact-check important claims.
- Show sources from metadata; log everything for evaluation.

## Official References

- [Retrieval Augmented Generation: ContextualQueryAugmenter](https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html)
- [Evaluation Testing](https://docs.spring.io/spring-ai/reference/api/testing.html)
- Related: [RAG Architecture](../rag-architecture/content.md) · [RAG Evaluation and Failures](../rag-evaluation-and-failures/content.md) · [Validating AI Output](../../spring-ai-chat-client/ai-output-validation/content.md)
