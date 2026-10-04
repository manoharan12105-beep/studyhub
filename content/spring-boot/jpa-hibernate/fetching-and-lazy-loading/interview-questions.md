# Fetch Types, Lazy Loading and Proxies — Interview Questions

## Beginner

### Q1. What is the difference between `FetchType.LAZY` and `FetchType.EAGER`?

<details>
<summary>Answer</summary>

LAZY loads an association only when it is first accessed; EAGER loads it together with the owning entity every time. `@ManyToOne` and `@OneToOne` default to EAGER, `@OneToMany` and `@ManyToMany` to LAZY. Best practice is LAZY everywhere and explicit fetching per query.

</details>

### Q2. What is `LazyInitializationException` and why does it occur?

<details>
<summary>Answer</summary>

Hibernate throws it when code accesses an uninitialised lazy association (a proxy or collection) of a detached entity — the persistence context that could load it has closed, typically because the `@Transactional` service method returned and the controller or JSON serialisation then touched the association.

</details>

### Q3. How do you fix a `LazyInitializationException`?

<details>
<summary>Answer</summary>

Load the needed data while the transaction is open: use `JOIN FETCH` or `@EntityGraph` in the repository query, or map to DTOs/projections inside the service. Avoid switching to EAGER, enabling `enable_lazy_load_no_trans`, or relying on Open Session in View.

</details>

## Intermediate

### Q4. What is a Hibernate proxy?

<details>
<summary>Answer</summary>

A runtime-generated subclass of an entity that stands in for a lazily loaded `@ManyToOne`/`@OneToOne` association or a `getReference` result. It holds the identifier and loads the real state on the first call to a non-identifier method. Consequences: entity classes must not be final, `getClass()` returns the proxy class, and `equals` should use `instanceof`.

</details>

### Q5. Why is EAGER fetching considered harmful?

<details>
<summary>Answer</summary>

It cannot be turned off per query, so every load of the owner pays for the association whether it is used or not; chains of EAGER associations load large graphs; and when entities are loaded through JPQL, Hibernate satisfies EAGER associations with additional SELECTs per row — an N+1 problem that looks like "we used EAGER to avoid lazy loading".

</details>

### Q6. What is Open Session in View, and should you keep it enabled?

<details>
<summary>Answer</summary>

A Spring interceptor (`spring.jpa.open-in-view`, enabled by default in Boot web apps) that keeps the `EntityManager` open for the entire request, so lazy loading works in controllers and during serialisation. It hides missing fetch plans, causes lazy queries outside transactions (often N+1 during JSON rendering) and can hold database connections longer. Disable it and fetch data explicitly in services.

</details>

## Advanced

### Q7. Does calling `getId()` on a lazy proxy trigger a database query?

<details>
<summary>Answer</summary>

Normally no — the proxy already holds the identifier, and Hibernate returns it without initialising the proxy. That makes `book.getAuthor().getId()` cheap, and `getReferenceById` useful for setting foreign keys without loading the target.

</details>

### Q8. A developer fixed `LazyInitializationException` with `spring.jpa.properties.hibernate.enable_lazy_load_no_trans=true`. What is wrong with that?

<details>
<summary>Answer</summary>

Each lazy access outside a transaction then opens a temporary session and connection to load that single association. It silently creates N+1 query patterns, each load reads in its own transaction (inconsistent data), and connection usage spikes. It hides the design issue instead of loading data deliberately within the service transaction.

</details>

### Q9. How do you make a lazy `@Lob` field (e.g. a large description) really lazy?

<details>
<summary>Answer</summary>

Basic attribute laziness requires Hibernate bytecode enhancement (build plugin with lazy initialisation enabled); without it, `@Basic(fetch = LAZY)` is ignored and the column is always loaded. Alternatives: move the large content into a separate entity with a lazy `@OneToOne` (owning side) or select only the needed columns with projections.

</details>
