# Proxy — Interview Questions

## Conceptual

### Q1. What is the Proxy pattern? Name its types.

<details>
<summary>Answer</summary>

A structural pattern where a surrogate object with the same interface as the real object controls access to it. Types: virtual proxy (lazy creation of an expensive object), protection proxy (permission checks), remote proxy (local stand-in for a remote object), caching proxy (reuses results), and smart-reference/logging proxy (bookkeeping such as counting, auditing or metrics).

</details>

### Q2. Proxy vs Decorator?

<details>
<summary>Answer</summary>

Same structure — both implement the subject's interface and delegate to a wrapped object. The intent differs: a proxy controls access (whether, when, where the call reaches the subject) and usually manages the subject's creation, often invisibly to the client; a decorator adds behaviour, is composed explicitly by the client, and is commonly stacked several layers deep.

</details>

### Q3. How does Spring use proxies?

<details>
<summary>Answer</summary>

For beans with cross-cutting annotations (`@Transactional`, `@Cacheable`, `@Async`, method security), Spring injects a proxy instead of the raw bean. The proxy starts/commits transactions, checks caches or permissions, then delegates to the real bean. It uses JDK dynamic proxies when proxying interfaces and generated subclasses for classes. A consequence: calling one annotated method from another method of the same bean (self-invocation) bypasses the proxy, so the annotation has no effect.

</details>

### Q4. What is a dynamic proxy in Java?

<details>
<summary>Answer</summary>

An object created at runtime with `java.lang.reflect.Proxy.newProxyInstance`, implementing one or more interfaces and routing every method call to an `InvocationHandler`. It lets you write one handler (for logging, timing, transactions) that works for any interface, instead of writing a proxy class per interface.

</details>

### Q5. What is a virtual proxy and where have you seen one?

<details>
<summary>Answer</summary>

A proxy that postpones creating or loading an expensive object until it is first used. ORM lazy loading is the common example: an entity's association is a proxy that queries the database only when accessed — which is also why accessing it after the session/transaction closes can fail.

</details>

## Applied

### Q6. You need to add rate limiting to calls into a third-party geocoding client used across the codebase. Which pattern, and how?

<details>
<summary>Answer</summary>

A proxy (protection/smart proxy): define `GeocodingService` (your interface), keep the real client adapter behind it, and add `RateLimitedGeocodingService implements GeocodingService` that checks a token bucket before delegating and rejects or delays calls over the limit. Wire the proxy where the service is injected; callers are unchanged.

</details>
