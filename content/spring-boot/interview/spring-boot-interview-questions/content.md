# Spring Boot Interview Questions

**Module:** Interview Preparation · **Interview priority:** Core

## Definition

Questions about **Spring Boot itself**: auto-configuration, starters, `@SpringBootApplication`, startup, embedded servers, externalized configuration, profiles, Actuator and production setup — organised by level (Beginner/Intermediate/Advanced) and tagged by **Style**.

## Why It Matters

"Why Spring Boot?" is easy; "Why does Spring Boot use auto-configuration, and how does it decide what to configure?" separates candidates. Interviewers expect you to describe Boot as conditional configuration on top of the same Spring container.

## How to Answer

- Frame Boot features as **automation of Spring Framework setup**: starters (dependencies), auto-configuration (conditional beans), embedded server (packaging), externalized config (environment), Actuator (operations).
- Show you can **override** defaults: define your own bean, set a property, exclude an auto-configuration.
- Mention **debugging tools**: `--debug` condition report, `/actuator/conditions`, `/actuator/env`.

Lessons: [What Is Spring Boot?](../../spring-boot-core/spring-boot-introduction/content.md), [Auto-Configuration](../../spring-boot-core/auto-configuration/content.md), [Startup](../../spring-boot-core/spring-boot-application-and-startup/content.md), [Externalized Configuration](../../spring-boot-core/externalized-configuration/content.md), [Profiles](../../spring-boot-core/spring-profiles/content.md), [Actuator](../../production/actuator-and-monitoring/content.md).

## Key Takeaways

- Boot = starters + auto-configuration + embedded server + externalized config + Actuator, on top of Spring.
- Every default backs off or can be overridden — say how.
