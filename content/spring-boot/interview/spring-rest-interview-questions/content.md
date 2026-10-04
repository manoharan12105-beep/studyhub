# REST API Interview Questions

**Module:** Interview Preparation · **Interview priority:** Core

## Definition

Questions on **designing and implementing REST APIs with Spring MVC**: resources and methods, status codes, request binding, DTOs, validation, error handling, pagination, versioning and the request lifecycle — grouped by level and tagged by **Style**.

## Why It Matters

Backend interviews almost always include "design an endpoint for…" and "what status would you return when…". Good answers combine HTTP semantics with Spring specifics (`@RestController`, `ResponseEntity`, `@Valid`, `@RestControllerAdvice`, `Pageable`).

## How to Answer

- Start from **resources and HTTP semantics**, then map to Spring annotations.
- Always mention **validation, error format and status codes** for each endpoint you design.
- Say what you would **not** expose (entities, internal ids, stack traces).

Lessons: [REST Principles](../../rest/rest-principles/content.md), [HTTP Methods](../../rest/rest-http-methods/content.md), [Status Codes](../../rest/rest-http-status-codes/content.md), [Request Data](../../rest/request-data-binding/content.md), [DTOs](../../rest/dto-pattern/content.md), [Pagination](../../rest/pagination-sorting-filtering/content.md), [Best Practices](../../rest/rest-api-best-practices/content.md), [Request Lifecycle](../../spring-mvc/spring-mvc-request-lifecycle/content.md).

## Key Takeaways

- Resource nouns + correct methods + precise status codes + DTOs + validation + one error format.
- Know which Spring component produces each error (400/401/403/404/405/406/415).
