# Chain of Responsibility — Interview Questions

## Conceptual

### Q1. What is the Chain of Responsibility pattern?

<details>
<summary>Answer</summary>

A behavioral pattern in which a request is passed along a chain of handler objects; each handler either handles it or forwards it to the next. The sender does not know which object will handle the request, and the chain's members and order can be configured. Example: expense claims routed through team lead, manager and director by amount.

</details>

### Q2. Where is Chain of Responsibility used in Java frameworks?

<details>
<summary>Answer</summary>

Servlet filters (each filter calls `chain.doFilter` to continue or stops the request), Spring Security's filter chain, logging handler hierarchies, and middleware/interceptor chains in web frameworks. Java's exception propagation up the call stack until a matching `catch` is found follows the same idea.

</details>

### Q3. Chain of Responsibility vs Decorator?

<details>
<summary>Answer</summary>

Both link objects with a common interface. A decorator always delegates to the wrapped object and adds behaviour around the call. A handler in a chain decides whether to handle the request itself and stop, or pass it on; only one handler may act (classic form), or each may process and choose to continue (pipeline form).

</details>

### Q4. What are the risks of this pattern?

<details>
<summary>Answer</summary>

A request may reach the end unhandled unless a terminal handler exists; misconfigured chains (wrong order, cycles, a handler forgetting to forward) cause subtle bugs; and it is harder to trace which handler acted.

</details>

## Applied

### Q5. Design request validation for an API: authentication, rate limiting, input validation, then the business handler. How would you structure it?

<details>
<summary>Answer</summary>

As a pipeline chain: `interface RequestHandler { Response handle(Request r); }` with `AuthenticationHandler`, `RateLimitHandler`, `ValidationHandler` each holding the next handler; each either returns an error response (stopping the chain) or calls `next.handle(r)`. The last element is the business handler. The chain is assembled in configuration, so steps can be added (logging, metrics) or reordered without touching others.

</details>
