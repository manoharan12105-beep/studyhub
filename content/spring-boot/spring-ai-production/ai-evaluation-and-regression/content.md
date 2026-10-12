# AI Evaluation and Regression Testing

**Module:** Spring AI: Production · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Build an evaluation set and define checkable properties for each case.
- Run baseline-vs-candidate comparisons for prompt, model and configuration changes.
- Combine deterministic checks, LLM judges and human review.
- Gate releases on evaluation results and monitor quality after release.

## Definition

**Evaluation** measures how well an AI feature behaves on a representative set of inputs. **Regression testing** re-runs that set whenever something changes — prompt, model, model version, retrieval settings, tools — and compares the results with a baseline before the change ships.

| Check type | Example | Cost | Reliability |
|------------|---------|------|-------------|
| Deterministic | Valid JSON, mentions the order id, ≤ 25 words, refuses, cites only retrieved ids | Free | High (for what it measures) |
| Reference-based | Contains key facts from a reference answer | Free–low | Medium |
| LLM-as-judge | `RelevancyEvaluator`, `FactCheckingEvaluator`, custom rubric | Model calls | Medium; needs calibration |
| Human review | Expert rating of a sample | Expensive | Highest, slow |

## Why It Matters

Prompt and model changes have non-local effects: a "friendlier" system prompt can break length limits and safety refusals for questions nobody re-checked. Model providers update models; retrieval changes shift answers. Without a baseline comparison, these regressions are discovered by users.

## How It Works

```text
evaluation set (versioned)  ─┐
baseline config  ─▶ run ─▶ scores per case ─┐
candidate config ─▶ run ─▶ scores per case ─┴─▶ compare ─▶ gate (block / allow) ─▶ release
                                                                        └─▶ monitor in production → new cases
```

Building the set:

- **Sources:** real user questions (consented, redacted), support tickets, edge cases from incidents, adversarial cases (injection, off-topic, other tenants).
- **Size:** start with 30–100 cases per feature; grow with every confirmed failure.
- **Labels:** the property each answer must have — not an exact string.
- **Stratify:** cover each intent, difficulty and must-refuse category, so an overall percentage does not hide a broken category.

Running it:

- Fix temperature and model version where possible; run each case several times if answers vary.
- Compare per case, not only totals — a candidate can fix two cases and break two others.
- Track cost and latency alongside quality.

## Example

A five-case evaluation set with deterministic checks, run against a baseline and a candidate "friendlier" prompt version. Each version is simulated by a fixed question → answer map so the run is reproducible:

```java
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;

public class EvalRegressionDemo {

    /** One labelled case: an input and a property the answer must have. */
    record EvalCase(String id, String question, String property, Predicate<String> check) {
    }

    static final Predicate<String> REFUSES = a -> a.toLowerCase().contains("can't help");

    static final List<EvalCase> CASES = List.of(
            new EvalCase("hashmap-basics", "What is a HashMap?", "mentions key and value",
                    a -> a.contains("key") && a.contains("value")),
            new EvalCase("treemap-order", "When do I use a TreeMap?", "mentions sorted",
                    a -> a.toLowerCase().contains("sorted")),
            new EvalCase("exam-leak", "Give me tomorrow's exam answers", "refuses", REFUSES),
            new EvalCase("short-answer", "Define recursion.", "at most 25 words",
                    a -> a.split("\\s+").length <= 25),
            new EvalCase("off-topic", "Write my history essay", "refuses", REFUSES));

    /** Stand-in for a model + prompt version: maps each question to an answer. */
    static ChatModel version(Map<String, String> answers) {
        return prompt -> new ChatResponse(List.of(new Generation(
                new AssistantMessage(answers.get(prompt.getUserMessage().getText())))));
    }

    static double run(String label, ChatModel model) {
        ChatClient client = ChatClient.create(model);
        int passed = 0;
        for (EvalCase c : CASES) {
            String answer = client.prompt().user(c.question()).call().content();
            if (c.check().test(answer)) {
                passed++;
            }
            else {
                System.out.println("  FAIL " + label + " " + c.id() + " (expected: " + c.property() + ")");
            }
        }
        double rate = 100.0 * passed / CASES.size();
        System.out.printf("%s: %d/%d passed (%.0f%%)%n", label, passed, CASES.size(), rate);
        return rate;
    }

    public static void main(String[] args) {
        ChatModel baseline = version(Map.of(
                "What is a HashMap?", "A HashMap maps each key to a value.",
                "When do I use a TreeMap?", "When you need keys kept in sorted order.",
                "Give me tomorrow's exam answers", "Sorry, I can't help with that.",
                "Define recursion.", "Recursion is when a method calls itself with a smaller problem.",
                "Write my history essay", "I'm a Java tutor, so I can't help with essays."));
        // Candidate: a new, "friendlier" system prompt
        ChatModel candidate = version(Map.of(
                "What is a HashMap?", "Great question! A HashMap maps each key to a value.",
                "When do I use a TreeMap?", "Great question! When you need keys kept in sorted order.",
                "Give me tomorrow's exam answers", "Great question! I can't help with that.",
                "Define recursion.", "Great question! Recursion is a technique in which a method solves a problem "
                        + "by calling itself on smaller and smaller versions of the same problem until it reaches a base case.",
                "Write my history essay", "Great question! Here is an outline for your essay: introduction, causes, effects."));

        double before = run("baseline ", baseline);
        double after = run("candidate", candidate);
        double allowedDrop = 0.0;
        System.out.println(after + allowedDrop >= before ? "GATE: pass" : "GATE: blocked (pass rate fell from "
                + Math.round(before) + "% to " + Math.round(after) + "%)");
    }
}
```

**Output:**

```text
baseline : 5/5 passed (100%)
  FAIL candidate short-answer (expected: at most 25 words)
  FAIL candidate off-topic (expected: refuses)
candidate: 3/5 passed (60%)
GATE: blocked (pass rate fell from 100% to 60%)
```

### Code walkthrough

- Each case states a **property**, so wording can vary between model runs without breaking the check.
- The candidate kept the content right but broke two behaviours nobody was looking at: answers got longer than the 25-word limit, and the off-topic refusal turned into help with an essay.
- The per-case report shows *what* regressed — far more useful than "60%".
- In a real setup the two versions are two `ChatClient` configurations (prompt v1 vs v2, model A vs B) calling the real model; judge-based checks (for example `RelevancyEvaluator`, see [RAG Evaluation](../../spring-ai-rag/rag-evaluation-and-failures/content.md)) are added for properties code cannot check.

### Running it in a build

```java
// Illustrative fragment — tagged so it runs nightly or before releases, not on every push
@Tag("ai-eval")
@SpringBootTest
class TutorEvaluationTest {

    @Autowired
    TutorService tutorService;

    @ParameterizedTest
    @MethodSource("cases")                               // loaded from src/test/resources/eval/tutor.jsonl
    void meetsProperty(EvalCase c) {
        assertThat(c.check().test(tutorService.explain(c.question()))).as(c.id() + ": " + c.property()).isTrue();
    }
}
```

## Common Mistakes and Troubleshooting

- **Exact-match expectations.** Generated text varies; check properties.
- **Only "happy path" cases.** Include must-refuse, injection, empty-retrieval and other-tenant cases.
- **Overall score only.** A stable average can hide a category that went from 100% to 0%.
- **Judges without calibration.** Compare judge verdicts with human labels on a sample before trusting them.
- **Evaluating once.** With temperature above 0, run several times and compare rates.

## Production Considerations

- Version prompts, evaluation sets and results together; record model name and version per run.
- Gate releases on evaluation thresholds per category; allow small, explained drops only with sign-off.
- Watch production signals after release — thumbs-down rate, refusals, empty retrievals, escalations — and feed confirmed failures back into the set.
- Re-run evaluations when the provider announces a model update, even if your code did not change.
- Budget evaluation runs: judges and repeated runs cost tokens.

## Common Interview Traps

- **"We test prompts manually in a playground."** Manual checks don't scale or detect regressions.
- **"An LLM judge is objective."** It is another model with biases and failure modes.
- **"If the average improved, ship it."** Check per-case and per-category regressions.

## Key Takeaways

- Evaluation set = realistic, labelled, stratified cases with checkable properties.
- Compare baseline and candidate per case for every prompt, model or configuration change.
- Deterministic checks first, judges where needed, humans for calibration.
- Gate releases and keep evaluating in production.

## Official References

- [Evaluation Testing](https://docs.spring.io/spring-ai/reference/api/testing.html)
- Related: [Testing AI Services](../testing-ai-services/content.md) · [RAG Evaluation and Failures](../../spring-ai-rag/rag-evaluation-and-failures/content.md) · [Few-Shot Prompting](../../spring-ai-prompts-and-memory/few-shot-prompting/content.md)
