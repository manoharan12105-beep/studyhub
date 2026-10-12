# QuestionAnswerAdvisor: RAG in One Advisor

**Module:** Spring AI: Tools and Advisors · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Add retrieval-augmented generation to a `ChatClient` with `QuestionAnswerAdvisor`.
- Read exactly what the advisor sends to the model and which documents it retrieved.
- Tune `topK`, `similarityThreshold` and per-request filter expressions.
- Recognise the advisor's limits and when to move to `RetrievalAugmentationAdvisor`.

## Definition

`QuestionAnswerAdvisor` (package `org.springframework.ai.chat.client.advisor.vectorstore`, module `spring-ai-vector-store-advisor`) is a `BaseAdvisor` that, before each call, searches a `VectorStore` with the user's question and appends the matching documents to the user message using a prompt template. After the call it puts the retrieved documents into the response context under `QuestionAnswerAdvisor.RETRIEVED_DOCUMENTS`.

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-vector-store-advisor</artifactId>
</dependency>
```

## Why It Matters

It is the shortest path from "we have documents in a vector store" to "the assistant answers from them" — one line of configuration. Interviewers like it because it makes the RAG pipeline visible: query → similarity search → prompt augmentation → generation. Knowing its defaults and its exact prompt explains most "why did it answer that?" questions.

## How It Works

```text
user question ──▶ VectorStore.similaritySearch(question, topK, threshold, filter)
                         │ documents
                         ▼
user message = template(query = question, question_answer_context = joined document texts)
                         ▼
                     ChatModel ──▶ answer  (+ RETRIEVED_DOCUMENTS in the response context)
```

| Setting | Default | How to change |
|---------|---------|---------------|
| `topK` | 4 | `.searchRequest(SearchRequest.builder().topK(n).build())` |
| `similarityThreshold` | 0.0 (accept all) | `SearchRequest.builder().similarityThreshold(0.7)` |
| Filter | none | `SearchRequest.builder().filterExpression(...)` for every request, or per request: `.advisors(a -> a.param(QuestionAnswerAdvisor.FILTER_EXPRESSION, "course == 'db-201'"))` |
| Prompt template | Built-in (shown in the example output) | `.promptTemplate(...)` — must contain `{query}` and `{question_answer_context}` |
| Order | 0 | `.order(...)` |

The search uses the **raw user question**. There is no query rewriting, no re-ranking and no handling of an empty result — those belong to the modular `RetrievalAugmentationAdvisor` covered in [RAG Architecture](../../spring-ai-rag/rag-architecture/content.md).

## Example

Three documents with course metadata; one normal question and one question filtered to a course that has no matching documents:

```java
import java.util.List;
import java.util.Map;

import com.example.studyai.lab.KeywordEmbeddingModel;
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.SimpleVectorStore;

public class QuestionAnswerDemo {

    public static void main(String[] args) {
        SimpleVectorStore store = SimpleVectorStore.builder(new KeywordEmbeddingModel()).build();
        store.add(List.of(
                new Document("jwt-1", "A JWT access token should expire within minutes; refresh tokens last longer.",
                        Map.of("course", "security-201")),
                new Document("sql-1", "A database index speeds up a query that filters on the indexed column of a table.",
                        Map.of("course", "db-201")),
                new Document("bake-1", "Bake the pasta in the oven for 20 minutes.", Map.of("course", "cooking-101"))));

        ScriptedChatModel model = new ScriptedChatModel()
                .reply("Access tokens should expire within minutes.")
                .reply("I don't know.");
        ChatClient client = ChatClient.builder(model)
                .defaultAdvisors(QuestionAnswerAdvisor.builder(store)
                        .searchRequest(SearchRequest.builder().topK(2).similarityThreshold(0.5).build())
                        .build())
                .build();

        ChatClientResponse response = client.prompt()
                .user("How long should a JWT token live?")
                .call().chatClientResponse();
        @SuppressWarnings("unchecked")
        var retrieved = (List<Document>) response.context().get(QuestionAnswerAdvisor.RETRIEVED_DOCUMENTS);
        System.out.println("Retrieved: " + retrieved.stream().map(Document::getId).toList());
        System.out.println("--- user message sent to the model ---");
        System.out.println(model.lastPrompt().getUserMessage().getText());
        System.out.println("--- answer ---");
        System.out.println(response.chatResponse().getResult().getOutput().getText());

        ChatClientResponse filtered = client.prompt()
                .user("How long should a JWT token live?")
                .advisors(a -> a.param(QuestionAnswerAdvisor.FILTER_EXPRESSION, "course == 'db-201'"))
                .call().chatClientResponse();
        @SuppressWarnings("unchecked")
        var none = (List<Document>) filtered.context().get(QuestionAnswerAdvisor.RETRIEVED_DOCUMENTS);
        System.out.println("With filter course == 'db-201': retrieved " + none.size() + " documents, model calls so far: "
                + model.prompts().size() + ", answer: " + filtered.chatResponse().getResult().getOutput().getText());
        System.out.println("Context block sent: " + model.lastPrompt().getUserMessage().getText()
                .lines().filter(l -> !l.isBlank()).skip(2).limit(2).toList());
    }
}
```

**Output:**

```text
Retrieved: [jwt-1]
--- user message sent to the model ---
How long should a JWT token live?

Context information is below, surrounded by ---------------------

---------------------
A JWT access token should expire within minutes; refresh tokens last longer.
---------------------

Given the context and provided history information and not prior knowledge,
reply to the user comment. If the answer is not in the context, inform
the user that you can't answer the question.

--- answer ---
Access tokens should expire within minutes.
With filter course == 'db-201': retrieved 0 documents, model calls so far: 2, answer: I don't know.
Context block sent: [---------------------, ---------------------]
```

`KeywordEmbeddingModel` is the course's offline embedding model (word overlap), so the similarity scores are illustrative; the advisor's behaviour is the real 2.0.1 behaviour.

### Code walkthrough

- `topK(2)` allowed two documents, but only `jwt-1` passed `similarityThreshold(0.5)`; the baking and SQL documents were dropped.
- The whole template went into the **user message**; the system message is untouched.
- With the filter `course == 'db-201'`, the only candidate (`sql-1`) was not similar enough, so nothing was retrieved — yet **the model was still called** with an empty context block. The instruction "inform the user that you can't answer" is all that stands between that and a made-up answer.
- `RETRIEVED_DOCUMENTS` is the hook for citations and logging: show users which documents were used ([Grounding and Citations](../../spring-ai-rag/rag-grounding-and-citations/content.md)).

## Common Mistakes and Troubleshooting

- **Leaving the threshold at 0.0.** Every one of the top-K documents is sent, however irrelevant. Set a threshold measured on your data and embedding model.
- **Building filter strings from user input** (`"course == '" + param + "'"`). Treat it like SQL: validate the value, or build a `Filter.Expression` with `FilterExpressionBuilder`.
- **Forgetting the tenant filter.** Without a filter, every user searches every document. Apply tenant/permission filters on every request.
- **A custom template without `{query}` or `{question_answer_context}`.** Nothing fails: in a check with a template lacking `{query}`, the model received only "Answer using only these notes: …" — the question was silently dropped.
- **Expecting "I don't know" from an empty context.** The model is still called; check `RETRIEVED_DOCUMENTS` and short-circuit if your feature should refuse ([RAG Evaluation and Failures](../../spring-ai-rag/rag-evaluation-and-failures/content.md)).
- **Retrieval repeated on every tool round.** The default order 0 is inside the tool loop (+300), so with tools the advisor searches again before each model call (checked: two searches for one tool round). Set `.order(Ordered.HIGHEST_PRECEDENCE + 250)` to retrieve once per request ([Advisor Ordering](../advisor-ordering-and-transformations/content.md)).
- **Follow-up questions retrieve nothing.** "And for refresh tokens?" is searched as-is. Use query rewriting with memory in `RetrievalAugmentationAdvisor`.

## Production Considerations

- Each request costs one embedding call plus one vector search before the model call.
- Retrieved text is untrusted input: an uploaded document can contain injected instructions. Keep tools authorised and outputs checked.
- Log retrieved document ids and scores (not full text) to debug answers.
- Combining with memory: memory (order +200) and `QuestionAnswerAdvisor` (order 0) both modify the prompt; check the final prompt in a test.

## Common Interview Traps

- **"QuestionAnswerAdvisor rewrites the question for retrieval."** It searches with the raw user text.
- **"If nothing is found, the model is not called."** It is called, with an empty context block.
- **"The context goes in the system prompt."** It is appended to the user message by the default template.

## Key Takeaways

- One advisor = retrieve with the user question, append documents to the user message, call the model.
- Defaults: topK 4, threshold 0.0, no filter — tune all three.
- `FILTER_EXPRESSION` per request for tenants and scopes; `RETRIEVED_DOCUMENTS` for citations.
- Outgrow it with `RetrievalAugmentationAdvisor` when you need query transformation, multiple sources or empty-context handling.

## Official References

- [Retrieval Augmented Generation: QuestionAnswerAdvisor](https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html)
- [Vector Databases: Metadata Filters](https://docs.spring.io/spring-ai/reference/api/vectordbs.html)
- Related: [Vector Metadata Filtering](../../spring-ai-rag/vector-metadata-filtering/content.md) · [RAG Architecture](../../spring-ai-rag/rag-architecture/content.md) · [Chat Memory Advisors](../chat-memory-advisors/content.md)
