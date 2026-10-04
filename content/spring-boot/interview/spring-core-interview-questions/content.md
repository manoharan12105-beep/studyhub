# Spring Core Interview Questions

**Module:** Interview Preparation · **Interview priority:** Core

## Definition

A question bank on **Spring basics and the core container**: IoC/DI, beans, lifecycle, scopes, configuration and bean resolution. Questions are grouped by level — **Beginner** (definitions), **Intermediate** (understanding and "why"), **Advanced** (internals and scenarios) — and tagged with a **Style** (Direct, Why, How, Comparison, Scenario, Debugging, Behavior).

## Why It Matters

Core questions open almost every Spring interview, and follow-ups quickly test whether you understand the container or only the annotations. Strong answers here make Boot, JPA and security questions easier, because those features are built on the same container and proxies.

## How to Answer

1. **Lead with the answer** in one sentence.
2. **Explain the mechanism** (what the container does).
3. **Give a project example** or a consequence ("that's why field injection is null in the constructor").
4. **Mention the trade-off or trap** when relevant.

Study the lessons first: [What Is Spring?](../../fundamentals/spring-introduction/content.md), [Spring Container](../../fundamentals/spring-container/content.md), [Bean Lifecycle](../../fundamentals/spring-bean-lifecycle/content.md), [Bean Scopes](../../fundamentals/spring-bean-scopes/content.md), [IoC and DI](../../dependency-injection/spring-ioc-and-di/content.md), [@Autowired, @Qualifier and @Primary](../../dependency-injection/autowiring-and-bean-resolution/content.md).

## Key Takeaways

- Everything in Spring is a bean created by the container; behaviour is added by post-processors and proxies.
- Answer at three depths: definition → why → what happens internally.
