# When Not to Use an LLM

**Module:** Spring AI: Advanced · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Recognise tasks where deterministic code, search or rules beat a language model.
- Apply a "deterministic first" design: code for what is exact, the model for what is genuinely fuzzy.
- Weigh accuracy, cost, latency, auditability and failure modes when proposing an AI feature.
- Explain these trade-offs convincingly in interviews and design reviews.

## Definition

An LLM is a probabilistic text generator: excellent at language understanding, summarising, rephrasing, classifying fuzzy input and drafting; unreliable at exact calculation, guaranteed rule enforcement, up-to-date facts without retrieval, and anything needing a provable, repeatable answer. **Not using an LLM** — or using it only for the fuzzy part of a task — is often the better engineering decision.

| Task | Better tool | Why |
|------|-------------|-----|
| Arithmetic, dates, totals, tax | Java code | Exact and testable |
| Validation (formats, ranges, permissions) | Code, Bean Validation, Spring Security | Must be guaranteed |
| Looking up a record by id | Database query | Exact, fast, cheap |
| Keyword or filter search | SQL/full-text search | Predictable and explainable |
| Stable business rules | Rules in code or a rules engine | Auditable, versionable |
| High-volume classification with fixed labels and data | A trained classifier or rules | Cheaper, faster, measurable |
| Explaining, summarising, drafting, fuzzy intent | LLM | What it is good at |

## Why It Matters

AI features fail most often not because the model is weak, but because it was used for work that code does better: wrong totals, invented policy details, inconsistent decisions, slow and expensive endpoints. Interviewers increasingly ask "would you even use an LLM here?" — the best answers combine both: deterministic systems for facts and rules, models for language.

## How It Works

Questions to ask before reaching for a model:

1. **Is there a correct answer computable from data?** Compute it.
2. **Must the result be identical every time and auditable?** Use code or rules.
3. **Does a wrong answer cause harm (money, health, legal, access)?** Keep the model out of the decision, or put a human and checks after it.
4. **Is the input free-form language with many variations?** A model helps — perhaps only to *classify* it, with code doing the rest.
5. **What are the latency and cost budgets per request?** A 2-second, metered call inside a hot path is often unacceptable.

Hybrid designs:

- **Model for intent, code for action:** classify "how many days until my exam?" then compute the days in Java.
- **Model for language, code for facts:** fetch the data with tools/queries; let the model phrase the answer.
- **Code first, model as fallback:** answer known questions deterministically; send only the rest to the model.

## Example

A deterministic-first router answers questions that map to exact computations in code and sends only open-ended questions to the model:

```java
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;

public class DeterministicFirstDemo {

    static final LocalDate TODAY = LocalDate.of(2026, 10, 12);
    static final Map<String, LocalDate> EXAM_DATES = Map.of("java-101", LocalDate.of(2026, 11, 3));
    static final Map<String, Integer> SCORES = Map.of("quiz-1", 18, "quiz-2", 14, "quiz-3", 20);

    static final Pattern DAYS_UNTIL = Pattern.compile("how many days until (?:the )?([a-z]+-\\d{3}) exam", Pattern.CASE_INSENSITIVE);
    static final Pattern AVERAGE = Pattern.compile("what is my average quiz score", Pattern.CASE_INSENSITIVE);

    /** Exact answers from code when the question maps to a known computation. */
    static Optional<String> deterministic(String question) {
        Matcher m = DAYS_UNTIL.matcher(question);
        if (m.find() && EXAM_DATES.containsKey(m.group(1).toLowerCase())) {
            long days = ChronoUnit.DAYS.between(TODAY, EXAM_DATES.get(m.group(1).toLowerCase()));
            return Optional.of(days + " days until the " + m.group(1) + " exam.");
        }
        if (AVERAGE.matcher(question).find()) {
            double avg = SCORES.values().stream().mapToInt(Integer::intValue).average().orElse(0);
            return Optional.of(String.format("Your average quiz score is %.2f out of 20.", avg));
        }
        return Optional.empty();
    }

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("Recursion works like nested boxes: each call opens a smaller box until the base case.");
        ChatClient client = ChatClient.create(model);

        for (String q : List.of("How many days until the java-101 exam?", "What is my average quiz score?",
                "Can you explain recursion with an analogy?")) {
            String answer = deterministic(q).map(a -> "[code] " + a)
                    .orElseGet(() -> "[llm]  " + client.prompt().user(q).call().content());
            System.out.println(q + "\n  " + answer);
        }
        System.out.println("model calls: " + model.prompts().size());
    }
}
```

**Output:**

```text
How many days until the java-101 exam?
  [code] 22 days until the java-101 exam.
What is my average quiz score?
  [code] Your average quiz score is 17.33 out of 20.
Can you explain recursion with an analogy?
  [llm]  Recursion works like nested boxes: each call opens a smaller box until the base case.
model calls: 1
```

### Code walkthrough

- Two of three questions were answered by code: exact (12 October → 3 November is 22 days; (18 + 14 + 20) ÷ 3 = 17.33), instant, free and testable.
- Only the explanation request — a genuinely language-shaped task — reached the model.
- Regular expressions are the simplest router; in practice a cheap model can *classify* the intent into an enum, and code still does the calculation (model for intent, code for action).
- With tools, the same principle applies: a `daysUntilExam(courseId)` tool computes in Java, and the model only phrases the result.

## Common Mistakes and Troubleshooting

- **Asking the model to calculate** totals, dates or grades. It may be right most of the time — "most of the time" is a bug.
- **Using the model as a database.** It doesn't know your current data; query it.
- **Letting the model make policy decisions** (eligibility, pricing, access). Encode the policy; let the model explain it.
- **Replacing search with chat** where users want a list of exact matches.
- **No baseline.** Before building an AI feature, measure how well a simple rule or search performs; the model must beat it on quality, cost or user experience.

## Production Considerations

- Every model call adds latency, cost, a failure mode and a privacy question; every deterministic path removes them.
- Deterministic parts are covered by unit tests; model parts by evaluations — keep the model part small.
- Log which path answered (code vs model) to see where AI adds value.
- Revisit: as requirements stabilise, frequent model answers can be replaced by rules or cached content.

## Common Interview Traps

- **"LLMs can do everything, so use them everywhere."** They are one tool; combine them with code, data and search.
- **"Temperature 0 makes the model deterministic and correct."** Lower variance is not correctness, and outputs can still change with model updates.
- **"An AI feature must be all-AI."** The strongest designs are hybrids.

## Key Takeaways

- Use code for exact, rule-bound, auditable and high-stakes parts; use the model for language.
- Deterministic first, model as fallback; model for intent, code for action; model for phrasing, code for facts.
- Measure a non-AI baseline before building an AI feature.
- Fewer model calls = less cost, latency, risk and testing effort.

## Official References

- [Spring AI Reference](https://docs.spring.io/spring-ai/reference/)
- [Anthropic: Building effective agents (when not to use agents)](https://www.anthropic.com/engineering/building-effective-agents)
- Related: [Traditional vs LLM-Powered Applications](../../spring-ai-foundations/llm-apps-vs-traditional-apps/content.md) · [Agentic Workflows](../agentic-workflows/content.md) · [RAG vs Memory vs Tools vs Fine-Tuning](../../spring-ai-rag/rag-vs-memory-vs-fine-tuning/content.md)
