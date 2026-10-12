# Instruction Design and Context Management

**Module:** Spring AI: Prompts and Conversations · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Write system instructions with a clear role, task, constraints, refusal rule and output format.
- Separate instructions from data with delimiters.
- Select and order context to fit a token budget instead of sending everything.
- Treat prompts as versioned, testable artefacts.

## Definition

**Instruction design** is writing the text that tells the model what to do: its role, the task, the rules, what to do when it cannot comply, and the shape of the answer. **Context management** is deciding which supporting information — user data, history, retrieved documents, tool results — goes into the request, in what order, within the token budget. Together they decide answer quality more than almost any other setting.

## Why It Matters

Models follow what they read. Vague instructions give vague answers; missing context forces guessing (hallucination); too much context costs money, adds latency and buries the facts that matter. In a Spring application the prompt is code that changes behaviour, so it needs the same care as code: clear structure, review, tests and versions.

## How It Works

A well-structured instruction has five parts:

| Part | Example for a Java tutor |
|------|--------------------------|
| Role and audience | "You are a Java interview tutor for final-year students." |
| Task | "Explain the concept the student asks about." |
| Constraints | "At most 5 sentences. Use Java 21 syntax. No external links." |
| Refusal / uncertainty rule | "If the question is not about Java, or you are not sure, say so instead of guessing." |
| Output format | "Start with a one-line definition, then a short Java code example." |

Then the **context** — the data the model needs for this request — is added, clearly separated:

```text
SYSTEM: role, task, constraints, refusal rule, output format     (stable, versioned)
USER:   Context:
        <<<
        ...selected course notes, the student's previous mistake...
        >>>
        Question: How does HashMap handle collisions?               (per request)
```

### Principles

1. **Be specific and positive.** "Answer in at most 5 sentences" works better than "don't be too long".
2. **Delimit data.** Put user input and documents inside markers (`<<< >>>`, XML-like tags or Markdown headings) and say that it is data, not instructions.
3. **Give the model a way out.** An explicit "say you don't know" rule reduces invented answers.
4. **Put the important things first and last.** Long contexts dilute attention; keep the instruction at the start and restate the question at the end.
5. **Ask for a checkable format.** Use structured output for anything code will process ([Structured Output](../../spring-ai-chat-client/spring-ai-structured-output/content.md)).
6. **One prompt, one job.** Split "classify, then answer, then translate" into separate calls or a workflow ([Agentic Workflows](../../spring-ai-advanced/agentic-workflows/content.md)).

### Context selection

Send the **minimum sufficient context**: the snippets most relevant to this question, the last few turns rather than the whole conversation, and summaries instead of raw logs. Budget tokens for each slot — instructions, history, documents, question and the answer — and drop or summarise the lowest-value items first ([Long Conversations](../long-conversation-management/content.md)).

## Example

A small context builder that keeps the most relevant notes within a token budget, using the same token estimator that Spring AI uses internally:

```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.ai.tokenizer.JTokkitTokenCountEstimator;
import org.springframework.ai.tokenizer.TokenCountEstimator;

public class ContextBudgetDemo {

    record Note(String title, String text, double relevance) {}

    static final TokenCountEstimator TOKENS = new JTokkitTokenCountEstimator();

    static List<Note> select(List<Note> notes, int budgetTokens) {
        List<Note> chosen = new ArrayList<>();
        int used = 0;
        for (Note note : notes.stream().sorted(Comparator.comparingDouble(Note::relevance).reversed()).toList()) {
            int cost = TOKENS.estimate(note.text());
            if (used + cost <= budgetTokens) {
                chosen.add(note);
                used += cost;
            }
        }
        System.out.println("Used " + used + " of " + budgetTokens + " context tokens");
        return chosen;
    }

    public static void main(String[] args) {
        String system = """
                You are a Java interview tutor for final-year students.
                Explain the concept the student asks about in at most 5 sentences.
                Use only the notes between <<< and >>>; if they do not answer the question, say so.
                Start with a one-line definition, then give one short Java example.""";
        System.out.println("System instruction: " + TOKENS.estimate(system) + " tokens");

        List<Note> notes = List.of(
                new Note("HashMap buckets", "HashMap stores entries in buckets chosen from the key's hashCode(). "
                        + "Keys that land in the same bucket form a linked list, and since Java 8 a long list "
                        + "becomes a balanced tree.", 0.92),
                new Note("equals and hashCode", "Equal objects must have equal hash codes; otherwise HashMap "
                        + "lookups fail.", 0.81),
                new Note("TreeMap", "TreeMap keeps keys sorted using compareTo or a Comparator and offers "
                        + "O(log n) operations.", 0.35),
                new Note("History of collections", "The collections framework arrived in Java 1.2 and replaced "
                        + "Vector and Hashtable for most uses. ".repeat(6), 0.20));

        for (Note n : select(notes, 60)) {
            System.out.println("  kept: " + n.title() + " (" + TOKENS.estimate(n.text()) + " tokens)");
        }
    }
}
```

**Output:**

```text
System instruction: 60 tokens
Used 51 of 60 context tokens
  kept: HashMap buckets (37 tokens)
  kept: equals and hashCode (14 tokens)
```

### Code walkthrough

- The instruction contains all five parts in four lines — 60 tokens, sent with every request, so every word should earn its place.
- `select(...)` sorts notes by relevance (in a real app, the similarity score from the vector store) and adds them while they fit.
- `TreeMap` (18 tokens) would push the total to 69, over the 60-token budget, so it is dropped; the long, low-relevance history note is skipped too. The model gets less text, but the right text.

## Common Mistakes and Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Answers ignore the format | Format described vaguely or only in the user message | State it in the system message; use structured output |
| Model invents facts | No context for the question and no permission to say "I don't know" | Add the refusal rule; supply context (RAG, tools) |
| Answers drift off-topic | Role and scope unclear | State what the assistant does *and does not* do |
| Costs high, answers no better | Whole documents or full history sent | Budget and select context |
| Instruction followed inconsistently | Contradictory rules accumulated over time | Review the prompt as a whole; remove conflicts; test on an evaluation set |

## Production Considerations

- Store prompts in versioned resource files, review changes and record the prompt version with each response ([Prompt Templates](../../spring-ai-chat-client/spring-ai-prompt-templates/content.md)).
- Evaluate prompt changes on a fixed dataset before deploying; small wording changes can have large effects ([Evaluation and Regression](../../spring-ai-production/ai-evaluation-and-regression/content.md)).
- Keep secrets and other users' data out of every prompt.

## Common Interview Traps

- **"A longer prompt is a better prompt."** Clarity beats length; long prompts cost more and dilute key rules.
- **"More context always helps."** Irrelevant context distracts the model and increases cost.
- **"Prompt engineering replaces validation."** Good instructions reduce errors; code still checks results.

## Key Takeaways

- Instruction = role + task + constraints + refusal rule + output format.
- Delimit data; give the model permission to say "I don't know".
- Select and budget context; version and evaluate prompts like code.

## Official References

- [Prompt engineering patterns (Spring AI)](https://docs.spring.io/spring-ai/reference/api/chat/prompt-engineering-patterns.html)
- [Prompts](https://docs.spring.io/spring-ai/reference/api/prompt.html)
