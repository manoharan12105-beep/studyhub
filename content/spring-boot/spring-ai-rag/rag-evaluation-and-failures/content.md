# RAG Evaluation and Failure Modes

**Module:** Spring AI: Embeddings and RAG · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Classify RAG failures by the stage that caused them.
- Evaluate answers with Spring AI's `RelevancyEvaluator` and `FactCheckingEvaluator`.
- Understand how LLM-as-a-judge evaluators decide pass/fail — and their pitfalls.
- Build an evaluation loop that combines retrieval metrics, answer checks and human review.

## Definition

**RAG evaluation** measures whether the system retrieves the right context and produces grounded, relevant answers. Spring AI provides an `Evaluator` interface and two LLM-as-a-judge implementations in `spring-ai-client-chat`:

| Evaluator | Question it asks the judge model | Input (`EvaluationRequest`) |
|-----------|----------------------------------|-----------------------------|
| `RelevancyEvaluator` | Is the response in line with the query and the context? | user text, context documents, response |
| `FactCheckingEvaluator` | Is the claim supported by the document? | context documents, claim |

Each returns an `EvaluationResponse` with `isPass()`, `getScore()` and feedback.

## Why It Matters

RAG systems fail quietly: the answer is fluent even when retrieval missed, the document is outdated or the model ignored the context. Without evaluation, a chunking change or model upgrade can degrade quality for weeks before anyone notices. Interviews expect a failure taxonomy and a practical evaluation strategy.

## How It Works

Failure taxonomy — diagnose by stage:

| Stage | Symptom | Typical cause | First check |
|-------|---------|---------------|-------------|
| Ingestion | Answer never available | Document missing, parse error, boilerplate, stale version | Is the text in the store? |
| Chunking | Partial or misleading answer | Conditions split from rules, mixed topics | Read the retrieved chunks |
| Retrieval | "I don't know" or off-topic | Vocabulary gap, threshold, topK, wrong filter, follow-up not rewritten | Retrieved ids vs labelled ids |
| Augmentation | Model ignores context | Too much context, poor formatting, conflicting passages | Final prompt |
| Generation | Unsupported claims, wrong synthesis | Prior knowledge, weak instructions, model choice | Fact check per claim |
| Security | Wrong data or behaviour | Missing tenant filter, injected instructions in documents | Filters, retrieved text |

Evaluation layers:

1. **Retrieval metrics** (no LLM needed): hit rate, MRR on a labelled set ([Retrieval Quality](../retrieval-quality/content.md)).
2. **Answer checks** with judges: relevancy and fact checking on the same set.
3. **Deterministic checks**: citation ids, required phrases, refusal on off-topic questions.
4. **Human review** of samples and user feedback — to calibrate the judges.

## Example

Two answers judged for relevancy and one claim fact-checked; the judge is scripted so the program runs offline:

```java
import java.util.List;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.evaluation.FactCheckingEvaluator;
import org.springframework.ai.chat.evaluation.RelevancyEvaluator;
import org.springframework.ai.document.Document;
import org.springframework.ai.evaluation.EvaluationRequest;
import org.springframework.ai.evaluation.EvaluationResponse;

public class RagEvaluationDemo {

    public static void main(String[] args) {
        List<Document> context = List.of(new Document("Access tokens expire after 15 minutes."));
        String question = "When do access tokens expire?";

        // The judge is another model call; here it is scripted
        ScriptedChatModel judge = new ScriptedChatModel()
                .reply("YES")
                .reply("NO")
                .reply("no");

        RelevancyEvaluator relevancy = RelevancyEvaluator.builder()
                .chatClientBuilder(ChatClient.builder(judge))
                .build();
        EvaluationResponse good = relevancy.evaluate(
                new EvaluationRequest(question, context, "They expire after 15 minutes."));
        EvaluationResponse bad = relevancy.evaluate(
                new EvaluationRequest(question, context, "Tokens never expire if the user is active."));
        System.out.println("Relevancy, grounded answer:   pass=" + good.isPass() + " score=" + good.getScore());
        System.out.println("Relevancy, ungrounded answer: pass=" + bad.isPass() + " score=" + bad.getScore());

        FactCheckingEvaluator factCheck = FactCheckingEvaluator.builder(ChatClient.builder(judge)).build();
        EvaluationResponse claim = factCheck.evaluate(
                new EvaluationRequest(context, "Access tokens expire after one hour."));
        System.out.println("Fact check, wrong claim:      pass=" + claim.isPass());

        System.out.println("--- what the relevancy judge received ---");
        System.out.println(judge.prompts().get(0).getUserMessage().getText().strip());
    }
}
```

**Output:**

```text
Relevancy, grounded answer:   pass=true score=1.0
Relevancy, ungrounded answer: pass=false score=0.0
Fact check, wrong claim:      pass=false
--- what the relevancy judge received ---
Your task is to evaluate if the response for the query
	is in line with the context information provided.

	You have two options to answer. Either YES or NO.

	Answer YES, if the response for the query
	is in line with context information otherwise NO.

	Query:
	When do access tokens expire?

	Response:
	They expire after 15 minutes.

	Context:
	Access tokens expire after 15 minutes.

	Answer:
```

The judge's verdicts are scripted; the prompt and the pass/fail logic are the real 2.0.1 evaluators.

### Code walkthrough

- `RelevancyEvaluator` sent the query, response and context to the judge with a YES/NO instruction (the tab indentation is part of the built-in template) and mapped the reply to `pass` and a score of 1.0 or 0.0.
- `FactCheckingEvaluator` takes the context and a single **claim**; split long answers into claims for meaningful checks.
- **Strict verdict parsing.** In a separate check, judge replies of `yes` and ` YES ` passed, but `Yes.` and `YES - it matches` **failed**: the reply must be exactly "yes", ignoring case and surrounding spaces. Use a judge model that follows the format, keep its temperature at 0, and count unparseable replies separately.

### In a test

```java
// Illustrative fragment — runs against a real model, so it belongs in a separate, tagged test suite
@Test
@Tag("ai-eval")
void refundAnswerIsGrounded() {
    ChatClientResponse response = tutorClient.prompt().user("Can I get a refund after 10 days?")
            .call().chatClientResponse();
    @SuppressWarnings("unchecked")
    var docs = (List<Document>) response.context().get(RetrievalAugmentationAdvisor.DOCUMENT_CONTEXT);
    var verdict = relevancyEvaluator.evaluate(new EvaluationRequest("Can I get a refund after 10 days?", docs,
            response.chatResponse().getResult().getOutput().getText()));
    assertThat(verdict.isPass()).as(verdict.getFeedback()).isTrue();
}
```

## Common Mistakes and Troubleshooting

- **Evaluating only answers.** Check retrieval first; a judge cannot tell you *why* an answer failed.
- **Using the same model as generator and judge without calibration.** It tends to approve its own style. Compare judge verdicts with human labels on a sample.
- **One-shot evaluation runs.** Model outputs vary; run several times or use enough cases to see trends, and track rates rather than single results.
- **Judging with a verbose model.** Replies like "Yes." fail the strict parser and look like quality regressions.
- **No off-topic or adversarial cases.** Include questions that must be refused and documents containing injected instructions.

## Production Considerations

- Keep an evaluation set in version control: question, expected source ids, reference answer or key facts, must-refuse flag.
- Run retrieval metrics on every ingestion or configuration change; run judge-based evaluations nightly or before releases — they cost model calls ([AI Evaluation and Regression](../../spring-ai-production/ai-evaluation-and-regression/content.md)).
- Monitor production signals: empty-retrieval rate, refusal rate, citation-check failures, thumbs-down rate.
- Sample real conversations (with consent and redaction) for human review.

## Common Interview Traps

- **"If the judge says pass, the answer is correct."** Judges are models; calibrate and spot-check.
- **"Evaluation means unit tests with exact expected strings."** Generated answers vary; evaluate properties (grounded, relevant, refuses when it should).
- **"Hallucination is a generation problem."** Many apparent hallucinations start with bad retrieval or chunking.

## Key Takeaways

- Diagnose by stage: ingestion, chunking, retrieval, augmentation, generation, security.
- `RelevancyEvaluator` and `FactCheckingEvaluator` are LLM-as-a-judge evaluators returning pass/score/feedback.
- Their verdict parsing is strict — the reply must be exactly "yes".
- Combine retrieval metrics, judge checks, deterministic checks and human review.

## Official References

- [Evaluation Testing](https://docs.spring.io/spring-ai/reference/api/testing.html)
- [Retrieval Augmented Generation](https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html)
- Related: [Retrieval Quality](../retrieval-quality/content.md) · [Grounding and Citations](../rag-grounding-and-citations/content.md) · [Testing AI Services](../../spring-ai-production/testing-ai-services/content.md)
