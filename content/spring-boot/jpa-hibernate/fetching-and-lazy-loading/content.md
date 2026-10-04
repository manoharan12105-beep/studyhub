# Fetch Types, Lazy Loading and Proxies

**Module:** Spring Data JPA and Hibernate · **Interview priority:** Core

## Definition

- The **fetch type** of an association decides **when** related entities are loaded: **`FetchType.EAGER`** loads them together with the owner; **`FetchType.LAZY`** postpones loading until the association is first accessed.
- Hibernate implements lazy `@ManyToOne`/`@OneToOne` associations with **proxies** — generated subclasses that load the real data on first access — and lazy collections with its own collection classes (`PersistentBag`, `PersistentSet`).
- A **`LazyInitializationException`** is thrown when an uninitialised proxy or collection is accessed **after its persistence context has closed** (the entity is detached).

## Why It Matters

- Fetch strategy is the biggest single factor in JPA performance: EAGER loads too much, LAZY used carelessly produces N+1 queries or `LazyInitializationException`.
- "LAZY vs EAGER", "What is a Hibernate proxy?" and "How do you fix LazyInitializationException?" are core interview questions.

## FetchType.LAZY

The association is loaded on demand. Inside a transaction this is transparent: accessing `book.getAuthor().getName()` triggers a SELECT. It keeps queries small and lets each use case decide what to load (with fetch joins, entity graphs or projections).

## FetchType.EAGER

The association is always loaded — by a join or an extra query — whenever the owner is loaded, **even if never used**, and it cannot be switched off per query (a JPQL query will still issue extra SELECTs to satisfy EAGER associations, causing N+1). Defaults:

| Association | Default |
|-------------|---------|
| `@ManyToOne`, `@OneToOne` | **EAGER** |
| `@OneToMany`, `@ManyToMany`, `@ElementCollection` | LAZY |

Recommended: **make every association LAZY** (`@ManyToOne(fetch = FetchType.LAZY)`) and fetch eagerly *per query* when needed.

## LAZY vs EAGER

| Aspect | LAZY | EAGER |
|--------|------|-------|
| Loaded | On first access | Always, with the owner |
| Unused data | Not loaded | Loaded anyway |
| Per-use-case control | Yes (fetch join, entity graph) | No — cannot be made lazy per query |
| Risks | N+1 (in loops), `LazyInitializationException` (outside a session) | Huge object graphs, extra joins/queries, N+1 with JPQL queries |
| Recommendation | Default for all associations | Avoid in mappings; fetch eagerly per query |

## Hibernate Proxies

For a lazy `@ManyToOne`, Hibernate sets the field to a **proxy**: a runtime subclass of the entity (generated with ByteBuddy) holding only the id. Calling a non-id getter initialises it with a SELECT.

Consequences:

- `getId()` on a proxy normally does **not** trigger loading.
- `proxy.getClass()` is not `Author.class` — `equals` methods using `getClass() != o.getClass()` fail for proxies; use `instanceof` or `Hibernate.getClass(o)`.
- Entity classes and their methods must not be `final` (cannot subclass).
- `Hibernate.isInitialized(x)` checks state; `Hibernate.initialize(x)` forces loading inside a session.
- `entityManager.getReference(…)` / `repository.getReferenceById(…)` returns a proxy without any query.

## LazyInitializationException

```text
could not initialize proxy [com.example.demo.LazyLoadingDemo$Author#1] - no session
failed to lazily initialize a collection of role: ...Order.items: could not initialize proxy - no Session
```

Cause: the entity was loaded in a transaction that has ended (service method returned), and code — often the controller or Jackson serialising an entity — touches an uninitialised lazy association.

Fixes, best first:

1. **Fetch what the use case needs in the query**: `JOIN FETCH`, `@EntityGraph` (see [The N+1 Problem](../n-plus-one-problem/content.md)).
2. **Return DTOs / projections** built inside the transaction — the controller never sees entities.
3. **Access the association inside the `@Transactional` service method** (or `Hibernate.initialize`) — acceptable for small cases, but beware N+1 in loops.

Anti-fixes:

- Switching the mapping to EAGER — hides the error but loads too much everywhere.
- `hibernate.enable_lazy_load_no_trans=true` — opens a new session and connection for each lazy access outside a transaction; an N+1 machine with inconsistent reads.
- Relying on Open Session in View (below).

### Open Session in View (OSIV)

Spring Boot enables `spring.jpa.open-in-view=true` by default for web applications (and logs a warning at startup). An interceptor keeps the `EntityManager` open for the **whole HTTP request**, so lazy loading works in controllers and during JSON serialisation — `LazyInitializationException` disappears.

Costs: lazy loading happens **outside transactions**, during view rendering, invisible in the service code; it often produces N+1 queries in serialisation; and the database connection may be held for the whole request. Recommended: set `spring.jpa.open-in-view=false` and load data explicitly in services.

## How It Works

```java
package com.example.demo;

import jakarta.persistence.Entity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Table;
import org.hibernate.Hibernate;
import org.hibernate.LazyInitializationException;
import org.hibernate.proxy.HibernateProxy;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@SpringBootApplication
public class LazyLoadingDemo {

    @Entity
    @Table(name = "author")
    public static class Author {
        @Id
        @GeneratedValue
        private Long id;
        private String name;

        protected Author() {
        }

        Author(String name) {
            this.name = name;
        }

        public Long getId() {
            return id;
        }

        public String getName() {
            return name;
        }
    }

    @Entity
    @Table(name = "book")
    public static class Book {
        @Id
        @GeneratedValue
        private Long id;
        private String title;

        @ManyToOne(fetch = FetchType.LAZY)
        private Author author;

        protected Book() {
        }

        Book(String title, Author author) {
            this.title = title;
            this.author = author;
        }

        public Long getId() {
            return id;
        }

        public Author getAuthor() {
            return author;
        }
    }

    public static class SqlPrinter implements StatementInspector {
        @Override
        public String inspect(String sql) {
            if (sql.startsWith("select b") || sql.startsWith("select a")) {   // show only entity queries
                System.out.println("    SQL> " + sql);
            }
            return sql;
        }
    }

    @Service
    public static class BookService {
        @PersistenceContext
        private EntityManager em;

        @Transactional
        public Long setUp() {
            Author author = new Author("R. K. Narayan");
            em.persist(author);
            Book book = new Book("Malgudi Days", author);
            em.persist(book);
            return book.getId();
        }

        @Transactional(readOnly = true)
        public void loadInsideTransaction(Long id) {
            Book book = em.find(Book.class, id);
            Author author = book.getAuthor();
            System.out.println("  author is a proxy? " + (author instanceof HibernateProxy)
                    + ", initialized? " + Hibernate.isInitialized(author));
            System.out.println("  author id = " + author.getId() + " (no SQL needed for the id)");
            System.out.println("  author name = " + author.getName());
        }

        @Transactional(readOnly = true)
        public Book loadWithoutTouchingAuthor(Long id) {
            return em.find(Book.class, id);
        }
    }

    public static void main(String[] args) {
        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(LazyLoadingDemo.class)
                .web(WebApplicationType.NONE)
                .properties("spring.main.banner-mode=off", "logging.level.root=error",
                        "spring.datasource.url=jdbc:h2:mem:lazy",
                        "spring.jpa.hibernate.ddl-auto=create-drop",
                        "spring.jpa.properties.hibernate.session_factory.statement_inspector="
                                + SqlPrinter.class.getName())
                .run(args)) {
            BookService service = context.getBean(BookService.class);
            Long id = service.setUp();

            System.out.println("1. Accessing the lazy author inside the transaction");
            service.loadInsideTransaction(id);

            System.out.println("2. Accessing it after the transaction has ended");
            Book detached = service.loadWithoutTouchingAuthor(id);
            try {
                System.out.println(detached.getAuthor().getName());
            } catch (LazyInitializationException e) {
                String message = e.getMessage();
                System.out.println("  " + e.getClass().getSimpleName() + ": ..."
                        + message.substring(message.lastIndexOf(" - ")));
            }
        }
    }
}
```

**Output:**

```text
1. Accessing the lazy author inside the transaction
    SQL> select b1_0.id,b1_0.author_id,b1_0.title from book b1_0 where b1_0.id=?
  author is a proxy? true, initialized? false
  author id = 1 (no SQL needed for the id)
    SQL> select a1_0.id,a1_0.name from author a1_0 where a1_0.id=?
  author name = R. K. Narayan
2. Accessing it after the transaction has ended
    SQL> select b1_0.id,b1_0.author_id,b1_0.title from book b1_0 where b1_0.id=?
  LazyInitializationException: ... - no session
```

## Internal Behavior

- Lazy collections are wrapped in `PersistentCollection` implementations that hold a reference to the session; on first access they call the session to load. If the session is closed, they throw.
- The proxy's interceptor (`ByteBuddyInterceptor`) delegates to the real entity after loading it into the persistence context.
- Lazy loading of **basic** attributes (e.g. a large `@Lob`) requires bytecode enhancement; without it, `@Basic(fetch = LAZY)` is ignored.
- With Spring Boot's OSIV, `OpenEntityManagerInViewInterceptor` binds an `EntityManager` to the request thread; transactions started by services reuse it.

## Common Mistakes

- Leaving `@ManyToOne` EAGER by default.
- Returning entities to controllers and letting Jackson trigger lazy loading (N+1 or `LazyInitializationException`).
- "Fixing" `LazyInitializationException` with EAGER or `enable_lazy_load_no_trans`.
- `equals` based on `getClass()` failing for proxies.
- Calling `toString()` that prints lazy associations, triggering queries in logs.

## Common Interview Traps

- **"LAZY is always better."** LAZY is the better *mapping default*, but if a use case always needs the association, fetch it eagerly in that query — loading it lazily in a loop is N+1.
- **"EAGER means a join."** Hibernate may load EAGER associations with separate SELECTs, especially for JPQL queries — causing N+1.
- **"LazyInitializationException is a Hibernate bug."** It signals that data access happens outside the transaction that should have loaded it.

## Key Takeaways

- Map all associations LAZY; fetch eagerly per use case (fetch join, entity graph, projection).
- Lazy `@ManyToOne` = proxy holding the id; accessing other fields triggers a SELECT; `getId()` does not.
- `LazyInitializationException` = access after the session closed; fix by loading in the query or returning DTOs, not by EAGER or OSIV.
- Set `spring.jpa.open-in-view=false`.
