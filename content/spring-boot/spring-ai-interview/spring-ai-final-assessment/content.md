# Spring AI Final Assessment and Project Checklist

**Module:** Spring AI: Interview Preparation · **Interview priority:** Self-check · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

> [!NOTE]
> **Reference topic.** The assessment questions are in the Practice tab. This page gives the scoring rubric and a checklist for any Spring AI project you build or review.

## Learning Objectives

- Check your readiness across all eight Spring AI modules.
- Score yourself with a rubric, and find which lessons to revisit.
- Review any Spring AI project against a production checklist.

## Definition

The assessment has 20 questions: 12 multiple choice and 8 open questions (behaviour, debugging and design). Answer them without notes, then compare with the answers.

| Score | Meaning | Next step |
|-------|---------|-----------|
| 18–20 | Interview-ready | Build or extend one of the three projects |
| 14–17 | Solid, with gaps | Revisit the lessons linked from the missed questions |
| 10–13 | Partial | Redo the 30-minute revision paths, then retry |
| Below 10 | Not yet | Work through Modules A–E in order |

For an open question, award 1 point only if your answer names the mechanism (the type, setting or order) **and** a consequence or fix.

## How It Works

Questions map to modules:

| Questions | Modules |
|-----------|---------|
| P1–P4 | A Foundations, B ChatClient |
| P5–P7 | C Prompts and memory |
| P8–P11 | D Tools and advisors |
| P12–P15 | E Embeddings and RAG |
| P16–P18 | F Production |
| P19–P20 | G Advanced |

## Project Checklist

Use this checklist for any Spring AI feature before release.

**Setup**

- [ ] The Spring AI BOM version matches the Spring Boot line (2.x ↔ Boot 4).
- [ ] The model name is pinned in properties; flat 2.0 property names are used.
- [ ] API keys come from the environment or a secrets manager; none are in the repository.

**Design**

- [ ] AI access sits behind services; controllers do not build prompts.
- [ ] Deterministic parts (calculations, rules, lookups) are in code ([When Not to Use an LLM](../../spring-ai-advanced/when-not-to-use-an-llm/content.md)).
- [ ] Prompts are versioned; untrusted input is delimited.
- [ ] Structured output is validated after parsing.

**Memory, tools and RAG**

- [ ] Conversation ids come from the authenticated user; memory has retention.
- [ ] Tools are thin, validated and authorised, with identity from `ToolContext`; write tools are idempotent.
- [ ] Irreversible actions require approval.
- [ ] Advisor orders are deliberate, inside or outside the tool loop.
- [ ] RAG has a tuned threshold, metadata filters, verified sources and a deliberate empty-context behaviour.

**Operations**

- [ ] Timeouts, a single retry layer, fallbacks and output token limits are set.
- [ ] Observations are exported; content logging is off in production.
- [ ] Unit tests use a stub model; an evaluation set runs before releases.
- [ ] Rate limits, budgets and a kill switch are in place.

## Key Takeaways

- Score honestly, fix the weakest module first, and retake the assessment after revising.
- The checklist is also a strong structure for answering "how would you put this in production?".

## Official References

- [Spring AI Reference](https://docs.spring.io/spring-ai/reference/)
- Related: [Project 1: Study Assistant](../../spring-ai-projects/project-study-assistant/content.md) · [Project 2: Document Q&A](../../spring-ai-projects/project-document-qa/content.md) · [Project 3: Tool-Calling Service](../../spring-ai-projects/project-tool-calling-service/content.md)
