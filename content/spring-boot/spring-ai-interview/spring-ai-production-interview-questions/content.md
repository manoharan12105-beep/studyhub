# Spring AI Production Interview Questions

**Module:** Spring AI: Interview Preparation · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

> [!NOTE]
> **Reference topic.** The questions are in the Interview Questions tab. This page lists what they cover.

## Learning Objectives

- Answer questions on resilience, cost, observability, testing, evaluation, security, deployment, MCP and agents.
- Describe production incidents and their fixes in a structured way.

## Definition

This bank covers Modules F and G:

| Area | Lessons to revise |
|------|-------------------|
| Reliability and cost | [Resilience](../../spring-ai-production/ai-resilience-and-provider-errors/content.md), [Tokens and Cost](../../spring-ai-production/token-usage-and-cost-control/content.md), [Caching and Streaming](../../spring-ai-production/ai-caching-latency-streaming/content.md) |
| Operations | [Observability](../../spring-ai-production/spring-ai-observability/content.md), [Deployment](../../spring-ai-production/spring-ai-deployment/content.md), [Safe Logging](../../spring-ai-production/ai-logging-and-sensitive-data/content.md) |
| Quality and security | [Testing](../../spring-ai-production/testing-ai-services/content.md), [Evaluation](../../spring-ai-production/ai-evaluation-and-regression/content.md), [Security](../../spring-ai-production/ai-application-security/content.md) |
| Advanced | [MCP](../../spring-ai-advanced/mcp-with-spring-ai/content.md), [Agentic Workflows](../../spring-ai-advanced/agentic-workflows/content.md), [Human Approval](../../spring-ai-advanced/human-approval-for-tools/content.md) |

## How It Works

Answer incident questions in four steps:

1. **Symptom.**
2. **How you confirmed it.** Metric, trace or log.
3. **Root cause.**
4. **Fix and prevention.** For example, a test, an alert or a limit.

Production answers are judged on whether you measured before you changed anything.

## Key Takeaways

- Retries multiply across layers.
- Every call resends the context.
- Content logging is off by default.
- Test with stub models and evaluate with real ones.
- Keep the model out of authorisation decisions.

## Official References

- [Spring AI Observability](https://docs.spring.io/spring-ai/reference/observability/index.html)
- Related: [Core Interview Questions](../spring-ai-core-interview-questions/content.md) · [RAG Interview Questions](../spring-ai-rag-interview-questions/content.md) · [Final Assessment](../spring-ai-final-assessment/content.md)
