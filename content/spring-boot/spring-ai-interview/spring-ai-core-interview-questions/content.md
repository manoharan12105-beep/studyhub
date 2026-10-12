# Spring AI Core Interview Questions

**Module:** Spring AI: Interview Preparation · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

> [!NOTE]
> **Reference topic.** The questions are in the Interview Questions tab. This page lists what they cover and how to answer well.

## Learning Objectives

- Answer the core Spring AI questions: abstractions, ChatClient, prompts, structured output, memory, tools and advisors.
- Give answers that separate Spring AI behaviour from provider behaviour.
- Back each answer with a short example from the lessons.

## Definition

This bank covers Modules A to D:

| Area | Lessons to revise |
|------|-------------------|
| Abstractions and setup | [Spring AI Architecture](../../spring-ai-foundations/spring-ai-architecture/content.md), [Versions and Compatibility](../../spring-ai-foundations/spring-ai-versions-and-compatibility/content.md) |
| ChatClient and output | [ChatClient Builder and Defaults](../../spring-ai-chat-client/chatclient-builder-and-defaults/content.md), [Structured Output](../../spring-ai-chat-client/spring-ai-structured-output/content.md) |
| Prompts and memory | [Chat Memory](../../spring-ai-prompts-and-memory/spring-ai-chat-memory/content.md), [Prompt Injection](../../spring-ai-prompts-and-memory/prompt-injection-and-untrusted-input/content.md) |
| Tools and advisors | [Tool-Calling Loop](../../spring-ai-tools-and-advisors/tool-calling-loop/content.md), [Advisor Ordering](../../spring-ai-tools-and-advisors/advisor-ordering-and-transformations/content.md) |

## How It Works

A strong answer has three parts:

1. **What it is.** One sentence.
2. **How Spring AI does it.** Name the type, the method or property, and the default.
3. **A trade-off or pitfall.** Something you observed, such as "request options replace the client's default options" or "an advisor at order 0 is inside the tool loop".

Say which parts are provider-specific, for example native structured output, token limits or tool support.

## Key Takeaways

- Know the core types: `ChatModel`, `ChatClient`, `Prompt`, `Message`, `ChatResponse`, `Advisor`, `ToolCallback`, `ChatMemory`.
- Know the defaults and orders: the tool-calling advisor at `HIGHEST_PRECEDENCE + 300`, the memory advisors at `+200`, and `MessageWindowChatMemory` keeping 20 messages.
- Use concrete examples from the lessons in your answers.

## Official References

- [Spring AI Reference](https://docs.spring.io/spring-ai/reference/)
- Related: [RAG Interview Questions](../spring-ai-rag-interview-questions/content.md) · [Production Interview Questions](../spring-ai-production-interview-questions/content.md) · [Final Assessment](../spring-ai-final-assessment/content.md)
