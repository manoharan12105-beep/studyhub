# Project-Based Spring Boot Questions

**Module:** Interview Preparation · **Interview priority:** Core

## Definition

Project-based questions connect Spring Boot concepts to a **real system** — usually your own project or a familiar domain such as e-commerce: "How did you structure it?", "How did you secure login?", "How would you stop duplicate orders?". This topic provides a reference design for an e-commerce backend that the questions build on.

## Why It Matters

Interviewers spend a large part of fresher and junior interviews on the candidate's project. Answers that tie decisions to concrete Spring mechanisms (transactions, locking, DTOs, security filter chain) and trade-offs are far stronger than feature lists.

## Reference Design: E-Commerce Backend

```text
                       ┌──────────── Spring Boot application (modular monolith) ────────────┐
Browser / mobile ─HTTPS─► SecurityFilterChain (JWT filter, CORS) ─► DispatcherServlet         │
                       │   auth/        catalog/        cart/        order/        payment/   │
                       │   controller   controller      controller   controller    webhook    │
                       │   service      service         service      service       service    │
                       │   repository   repository      repository   repository    repository │
                       │        └─── events (OrderPlaced, PaymentConfirmed) ───┘              │
                       └──────┬────────────┬───────────────┬────────────────┬─────────────────┘
                              ▼            ▼               ▼                ▼
                        PostgreSQL      Redis          Object storage    Payment gateway
                     (Flyway, Hikari) (cache, rate     (product images,   (idempotency keys,
                                       limits)          signed URLs)       webhooks)
```

Package by feature; each module has controller (DTOs, validation), service (`@Transactional`, business rules), repository (Spring Data JPA) and its own exceptions mapped by one `@RestControllerAdvice`.

### Key decisions

| Concern | Decision |
|---------|----------|
| API contract | Request/response DTOs (records), Bean Validation, ProblemDetail errors, OpenAPI docs |
| Authentication | Login → `AuthenticationManager` → 15-min JWT + rotating refresh token (HttpOnly cookie); BCrypt |
| Authorization | Roles for admin/customer; ownership checks in queries (`findByIdAndCustomerId`) |
| Catalogue reads | Projections, pagination with max size, Redis cache for product details, CDN for images |
| Orders | One transaction per placement; atomic stock decrement; idempotency key on `POST /orders` |
| Payments | Gateway called outside DB transactions; order states PENDING → PAID/FAILED; idempotent webhook handling |
| Side effects | `@TransactionalEventListener(AFTER_COMMIT)` + async for emails; outbox for external messages |
| Operations | Docker image, env-based config, Actuator probes, JSON logs, Prometheus metrics, graceful shutdown |

The questions in the companion file walk through these decisions.

## Key Takeaways

- Explain your project as decisions + mechanisms + trade-offs, not a list of technologies.
- Prepare concrete stories: a bug you fixed (N+1, LazyInitializationException), a design choice (DTOs, JWT), a concurrency issue (stock, duplicate orders).
