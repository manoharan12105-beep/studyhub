# Agentic Workflows and Agents

**Module:** Spring AI: Advanced · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Distinguish workflows (code-controlled LLM steps) from agents (model-controlled loops).
- Apply the common patterns: chaining, routing, parallelisation, orchestrator–workers, evaluator–optimizer.
- Implement a bounded evaluator–optimizer loop with `ChatClient` and structured output.
- Add the controls agents need in production: limits, budgets, state, approvals and observability.

## Definition

An **agentic system** uses a model to decide or perform several steps toward a goal. Two kinds are useful to separate:

| | Workflow | Agent |
|-|----------|-------|
| Who decides the next step | Your Java code | The model (via tool calls in a loop) |
| Predictability | High | Lower |
| Cost and latency | Bounded by design | Variable; must be capped |
| Best for | Known, decomposable tasks | Open-ended tasks where steps can't be known in advance |

In Spring AI a workflow is ordinary code calling one or more `ChatClient`s; an agent is typically a `ChatClient` with tools, where the tool-calling loop ([The Tool-Calling Loop](../../spring-ai-tools-and-advisors/tool-calling-loop/content.md)) lets the model choose actions until it answers.

## Why It Matters

"Agent" is the most over-used word in AI engineering. Most business problems are better served by a workflow: cheaper, testable, explainable. Knowing the patterns — and when an autonomous agent is justified — is a common senior-level interview topic, and the controls around agents are what keep them from looping, overspending or acting wrongly.

## How It Works

| Pattern | Shape | Example |
|---------|-------|---------|
| Prompt chaining | step 1 → check → step 2 → … | Outline → validate → write lesson |
| Routing | classify → choose a specialised prompt/model | Billing vs technical vs course question |
| Parallelisation | independent calls at once, then combine | Review code for security, style and tests in parallel |
| Orchestrator–workers | a model plans subtasks; workers execute; results merged | Research a topic across several sources |
| Evaluator–optimizer | generate → critique → revise, bounded | Quiz questions that must be unambiguous |
| Autonomous agent | model loops over tools toward a goal | "Find and fix the failing test" with read/run tools |

Controls every agentic system needs:

- **Bounds:** maximum rounds, tool calls (`spring.ai.tools.limits.*`), tokens and wall time.
- **Structured hand-offs:** steps exchange records via structured output, not free text.
- **Deterministic checks between steps** (validation, tests) — not only model judgement.
- **State and resumability:** persist progress for long tasks; make tools idempotent.
- **Human approval** for irreversible actions ([Human Approval for Tools](../human-approval-for-tools/content.md)).
- **Observability:** trace every step and tool call ([Observability](../../spring-ai-production/spring-ai-observability/content.md)).

## Example

An evaluator–optimizer workflow: one client writes a quiz question, another checks it and returns a structured verdict; Java code decides whether to revise, accept or stop:

```java
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;

public class AgenticWorkflowDemo {

    enum Verdict { PASS, NEEDS_IMPROVEMENT }

    record Evaluation(Verdict verdict, String feedback) {
    }

    record Result(String question, int attempts, boolean accepted) {
    }

    /** Evaluator–optimizer: generate, critique, revise — with a hard limit on rounds. */
    static class QuizWorkflow {
        private final ChatClient generator;
        private final ChatClient evaluator;
        private final int maxAttempts;

        QuizWorkflow(ChatClient generator, ChatClient evaluator, int maxAttempts) {
            this.generator = generator;
            this.evaluator = evaluator;
            this.maxAttempts = maxAttempts;
        }

        Result run(String topic) {
            String feedback = "none yet";
            String draft = null;
            for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                String previousFeedback = feedback;
                draft = generator.prompt()
                        .user(u -> u.text("Write one multiple-choice question about {topic}. Previous feedback: {feedback}")
                                .param("topic", topic).param("feedback", previousFeedback))
                        .call().content();
                String candidate = draft;
                Evaluation evaluation = evaluator.prompt()
                        .user(u -> u.text("Check this question: one correct answer, plausible distractors, no ambiguity.\n{q}")
                                .param("q", candidate))
                        .call().entity(Evaluation.class);
                System.out.println("attempt " + attempt + ": " + evaluation.verdict() + " - " + evaluation.feedback());
                if (evaluation.verdict() == Verdict.PASS) {
                    return new Result(draft, attempt, true);
                }
                feedback = evaluation.feedback();
            }
            return new Result(draft, maxAttempts, false);          // stop: hand over to a human
        }
    }

    public static void main(String[] args) {
        ScriptedChatModel generatorModel = new ScriptedChatModel()
                .reply("Which collection keeps insertion order? A) HashMap B) LinkedHashMap C) HashSet D) Both B and C")
                .reply("Which collection keeps insertion order? A) HashMap B) LinkedHashMap C) HashSet D) TreeSet");
        ScriptedChatModel evaluatorModel = new ScriptedChatModel()
                .reply("{\"verdict\": \"NEEDS_IMPROVEMENT\", \"feedback\": \"Option D makes two answers arguable; HashSet has no order.\"}")
                .reply("{\"verdict\": \"PASS\", \"feedback\": \"Exactly one correct answer.\"}");

        var workflow = new QuizWorkflow(ChatClient.create(generatorModel), ChatClient.create(evaluatorModel), 3);
        Result result = workflow.run("Java collections");
        System.out.println("accepted=" + result.accepted() + " after " + result.attempts() + " attempts: " + result.question());
        System.out.println("feedback passed to attempt 2: "
                + generatorModel.prompts().get(1).getUserMessage().getText().replaceAll(".*Previous feedback: ", ""));
        System.out.println("model calls: generator=" + generatorModel.prompts().size() + ", evaluator=" + evaluatorModel.prompts().size());
    }
}
```

**Output:**

```text
attempt 1: NEEDS_IMPROVEMENT - Option D makes two answers arguable; HashSet has no order.
attempt 2: PASS - Exactly one correct answer.
accepted=true after 2 attempts: Which collection keeps insertion order? A) HashMap B) LinkedHashMap C) HashSet D) TreeSet
feedback passed to attempt 2: Option D makes two answers arguable; HashSet has no order.
model calls: generator=2, evaluator=2
```

Both models are scripted, so the run is reproducible; the control flow, structured verdicts and prompts are real.

### Code walkthrough

- The **workflow is Java**: the loop, the stop condition and the hand-over to a human are code, not model decisions — cost is bounded at `maxAttempts × 2` model calls.
- The evaluator returns an `Evaluation` record (structured output), so the code branches on an enum instead of parsing prose.
- The critique became input to the next attempt — the "optimizer" half of the pattern.
- If no draft passes within the limit, the result is marked `accepted=false` for review instead of looping on.
- Generator and evaluator can use different models (or providers) — a cheaper generator with a stricter evaluator is a common split.

### When an agent is justified

```java
// Illustrative fragment — an agent is a tool loop with a goal, tools and hard limits
String report = agentClient.prompt()
        .system("You fix failing unit tests. Use the tools to read files and run tests. Stop when tests pass or after 10 steps.")
        .user("Make OrderServiceTest pass.")
        .tools(readFileTool, runTestsTool, proposePatchTool)       // proposePatch only drafts a change
        .call().content();
```

The model chooses which tool to call next; `spring.ai.tools.limits.max-total-tool-calls` caps the loop, and `proposePatch` produces a patch for human review rather than writing to the repository.

## Common Mistakes and Troubleshooting

- **An agent where a workflow would do.** If you can write the steps down, write them in code.
- **Unbounded loops.** Without round/tool/token limits an agent can spin on a failing tool and burn budget.
- **Free-text hand-offs.** Parsing prose between steps is fragile; use records.
- **Self-evaluation only.** A model approving its own output misses errors; add deterministic checks (compile, test, validate) where possible.
- **No state.** Long tasks fail halfway and restart from zero, repeating side effects.

## Production Considerations

- Log and trace each step with inputs (redacted), outputs, model, tokens and duration; agent debugging is impossible without it.
- Budget per task and per user; alert on unusually long runs.
- Run long workflows asynchronously with persisted state; expose progress to users.
- Evaluate workflows end to end on representative tasks; measure success rate, cost and time per task.
- Start with a workflow; promote steps to agentic behaviour only where evaluation shows it helps.

## Common Interview Traps

- **"Agents are always better than workflows."** They trade predictability and cost for flexibility.
- **"The model will stop when it's done."** Always enforce limits in code and configuration.
- **"Multi-agent systems are needed for complex tasks."** Most benefit comes from one well-designed workflow with good tools and checks.

## Key Takeaways

- Workflows: code controls the steps; agents: the model controls the next step via tools.
- Patterns: chaining, routing, parallelisation, orchestrator–workers, evaluator–optimizer.
- Bound everything: rounds, tool calls, tokens, time; hand off to humans when limits are hit.
- Structured hand-offs, deterministic checks, state, approvals and tracing make agentic systems production-ready.

## Official References

- [Spring AI: Agentic patterns (Building Effective Agents with Spring AI)](https://spring.io/blog/2025/01/21/spring-ai-agentic-patterns)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Spring AI Tool Calling](https://docs.spring.io/spring-ai/reference/api/tools.html)
- Related: [The Tool-Calling Loop](../../spring-ai-tools-and-advisors/tool-calling-loop/content.md) · [Human Approval for Tools](../human-approval-for-tools/content.md) · [When Not to Use an LLM](../when-not-to-use-an-llm/content.md)
