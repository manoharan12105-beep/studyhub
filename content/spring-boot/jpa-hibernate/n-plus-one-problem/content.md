# The N+1 Problem: Fetch Join and EntityGraph

**Module:** Spring Data JPA and Hibernate · **Interview priority:** Core

## Definition

The **N+1 query problem** occurs when code runs **one** query to load N parent entities and then **one additional query per parent** to load an association — N+1 queries where one or two would do. In JPA it comes from lazy associations accessed in a loop (or from EAGER associations loaded by JPQL). The main fixes are a **fetch join** (`JOIN FETCH`), an **`@EntityGraph`**, **batch fetching**, or a **DTO projection**.

## Why It Matters

- It is the most common JPA performance problem: an endpoint that runs 1 query in development (5 rows) runs 501 in production (500 rows).
- "Why does N+1 happen even though the application uses JPA?" is a standard Level-3 interview question; good answers explain detection *and* the trade-offs of each fix.

## N+1 Query Problem

```java
@Transactional(readOnly = true)
public List<AuthorDto> authorsWithBookCounts() {
    return authorRepository.findAll().stream()                                   // 1 query: authors
            .map(a -> new AuthorDto(a.getName(), a.getBooks().size()))           // +1 query per author
            .toList();
}
```

```text
select a.id, a.name from author a                                  ← 1
select b.* from book b where b.author_id = 1                       ← +1
select b.* from book b where b.author_id = 2                       ← +1
...                                                                 ← +1 × N
```

Why JPA does this: `books` is LAZY (correctly), so `findAll()` loads only authors; each `getBooks()` call initialises one collection with its own SELECT. JPA cannot know the loop will touch every collection.

Where it hides:

- Loops in services and mappers (entity → DTO).
- **JSON serialisation** of entities (Jackson calls every getter) — especially with Open Session in View.
- `toString()`/logging of entities.
- **EAGER** `@ManyToOne` associations loaded through JPQL queries: Hibernate fetches them with one extra SELECT per distinct referenced entity.

## How It Works

```java
package com.example.demo;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;
import org.hibernate.Session;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@SpringBootApplication
@EnableJpaRepositories(considerNestedRepositories = true)
public class NPlusOneDemo {

    @Entity(name = "Author")
    @Table(name = "author")
    public static class Author {
        @Id
        @GeneratedValue
        private Long id;
        private String name;

        @OneToMany(mappedBy = "author", cascade = CascadeType.PERSIST)
        private List<Book> books = new ArrayList<>();

        protected Author() {
        }

        Author(String name) {
            this.name = name;
        }

        List<Book> getBooks() {
            return books;
        }
    }

    @Entity(name = "Book")
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
            author.getBooks().add(this);
        }
    }

    public interface AuthorRepository extends JpaRepository<Author, Long> {

        @Query("select distinct a from Author a join fetch a.books")
        List<Author> findAllWithBooksFetchJoin();

        @EntityGraph(attributePaths = "books")
        @Query("select a from Author a")
        List<Author> findAllWithBooksEntityGraph();
    }

    /** Counts SQL statements instead of printing them. */
    public static class SqlCounter implements StatementInspector {
        static final AtomicInteger COUNT = new AtomicInteger();

        @Override
        public String inspect(String sql) {
            COUNT.incrementAndGet();
            return sql;
        }
    }

    @Service
    public static class LibraryService {
        private final AuthorRepository authors;

        @PersistenceContext
        private EntityManager em;

        LibraryService(AuthorRepository authors) {
            this.authors = authors;
        }

        @Transactional
        public void setUp() {
            for (int a = 1; a <= 10; a++) {
                Author author = new Author("Author " + a);
                new Book("Book " + a + "-1", author);
                new Book("Book " + a + "-2", author);
                authors.save(author);                       // books cascaded
            }
        }

        @Transactional(readOnly = true)
        public int lazyLoop() {
            return authors.findAll().stream().mapToInt(a -> a.getBooks().size()).sum();
        }

        @Transactional(readOnly = true)
        public int fetchJoin() {
            return authors.findAllWithBooksFetchJoin().stream().mapToInt(a -> a.getBooks().size()).sum();
        }

        @Transactional(readOnly = true)
        public int entityGraph() {
            return authors.findAllWithBooksEntityGraph().stream().mapToInt(a -> a.getBooks().size()).sum();
        }

        @Transactional(readOnly = true)
        public int batchFetching() {
            em.unwrap(Session.class).setFetchBatchSize(25);   // like hibernate.default_batch_fetch_size=25
            return authors.findAll().stream().mapToInt(a -> a.getBooks().size()).sum();
        }
    }

    static void measure(String label, Supplier<Integer> work) {
        SqlCounter.COUNT.set(0);
        int books = work.get();
        System.out.printf("%-26s books=%d  SQL statements=%d%n", label, books, SqlCounter.COUNT.get());
    }

    public static void main(String[] args) {
        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(NPlusOneDemo.class)
                .web(WebApplicationType.NONE)
                .properties("spring.main.banner-mode=off", "logging.level.root=error",
                        "spring.datasource.url=jdbc:h2:mem:nplusone",
                        "spring.jpa.hibernate.ddl-auto=create-drop",
                        "spring.jpa.properties.hibernate.session_factory.statement_inspector="
                                + SqlCounter.class.getName())
                .run(args)) {
            LibraryService library = context.getBean(LibraryService.class);
            library.setUp();
            measure("lazy loading in a loop:", library::lazyLoop);
            measure("JOIN FETCH:", library::fetchJoin);
            measure("@EntityGraph:", library::entityGraph);
            measure("batch fetching (25):", library::batchFetching);
        }
    }
}
```

**Output:**

```text
lazy loading in a loop:    books=20  SQL statements=11
JOIN FETCH:                books=20  SQL statements=1
@EntityGraph:              books=20  SQL statements=1
batch fetching (25):       books=20  SQL statements=2
```

Ten authors: the naive loop needs 1 + 10 queries; each fix loads the same data in one or two.

## Fetch Join

```sql
select distinct a from Author a join fetch a.books where a.country = :country
```

`JOIN FETCH` tells Hibernate to load the association **in the same SQL query** (an SQL join) and initialise it. Rules and pitfalls:

- Duplicated parents: joining a collection repeats the parent row per child. Hibernate 6+ de-duplicates entity results automatically; `distinct` is still commonly written and harmless.
- **Pagination + collection fetch join** → Hibernate cannot apply `LIMIT` in SQL and paginates **in memory** after loading everything, logging `HHH90003004: firstResult/maxResults specified with collection fetch; applying in memory`. Set `hibernate.query.fail_on_pagination_over_collection_fetch=true` to make it an error. Fix: page the parent ids first, then fetch collections for those ids.
- **Two collection fetch joins of type `List` (bags)** → `MultipleBagFetchException`. Use `Set`, fetch one collection per query, or use batch fetching for the others.
- Fetching several collections in one query creates a **Cartesian product** (rows = children₁ × children₂), which can be worse than N+1.
- `join fetch` of `@ManyToOne` associations is cheap and has none of these problems.

## EntityGraph

An entity graph declares **which associations to load** for a query, without writing the join in JPQL:

```java
public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"customer", "items", "items.product"})
    Optional<Order> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = "customer")               // works with derived queries and paging
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
}
```

- Applied as a **fetch graph** by default in Spring Data (`EntityGraphType.FETCH`: listed attributes eager, others as mapped); `LOAD` keeps mapped EAGER settings for unlisted attributes.
- Reusable named graphs: `@NamedEntityGraph(name = "Order.details", attributeNodes = …)` on the entity, referenced by name.
- Same underlying SQL as a fetch join, so the same collection + pagination caveat applies.
- Good for derived query methods, where you cannot write `join fetch`.

## Batch Fetching

Instead of joining, Hibernate loads lazy associations for **many parents at once** with an `IN` list when the first one is accessed:

```text
select b.* from book b where b.author_id in (?, ?, ?, … up to 25)
```

- Global: `spring.jpa.properties.hibernate.default_batch_fetch_size=50` (recommended in most projects).
- Per association: `@BatchSize(size = 50)` on the collection or entity class (Hibernate-specific).
- Per session: `session.setFetchBatchSize(n)` as in the demo.
- Turns N+1 into 1 + ⌈N / batch size⌉ queries, **works with pagination**, and avoids Cartesian products — the best general-purpose safety net.

## DTO Projections

When the use case only reads data, select exactly what it needs:

```sql
select new com.example.AuthorBookCount(a.name, count(b)) from Author a left join a.books b group by a.name
```

One query, no entities, no lazy loading. Often the best fix for list/report endpoints. See [Projections](../projections-pagination-specifications/content.md).

## Detecting N+1

| Technique | How |
|-----------|-----|
| SQL logging | `logging.level.org.hibernate.SQL=DEBUG` (and `org.hibernate.orm.jdbc.bind=TRACE` for parameters) — repeated identical SELECTs are the signature |
| Hibernate statistics | `spring.jpa.properties.hibernate.generate_statistics=true` → per-session statement counts in logs |
| Tests asserting query counts | Count statements (e.g. a `StatementInspector` or a datasource proxy) in repository/service tests |
| APM / tracing | Spans per SQL statement (Micrometer tracing, APM agents) show hundreds of DB calls per request |
| Database monitoring | `pg_stat_statements`: very high call counts for a simple primary-key or foreign-key query |

## Comparison

| Fix | Queries | Works with pagination | Several collections | Effort |
|-----|---------|-----------------------|---------------------|--------|
| `JOIN FETCH` | 1 | Not for collections (in-memory paging) | Cartesian product / bag exception | Write JPQL |
| `@EntityGraph` | 1 | Same as fetch join | Same | Annotation |
| Batch fetching | 1 + N/size | **Yes** | Yes | One property |
| DTO projection | 1 | Yes | Use aggregates or separate queries | Write query + DTO |
| EAGER mapping | Still N+1 with JPQL | — | — | **Not a fix** |

## Common Mistakes

- "Fixing" N+1 by making associations EAGER.
- Fetch-joining two `List` collections (`MultipleBagFetchException`) or several collections (Cartesian explosion).
- Collection fetch joins with `Pageable`.
- Returning entities to Jackson with OSIV enabled — N+1 during serialisation, invisible in service code.
- Never looking at the generated SQL during development.

## Common Interview Traps

- **"We use JPA, so the ORM optimises queries for us."** JPA loads exactly what the mapping and query say; lazy access in loops always means one query per access.
- **"EAGER prevents N+1."** For JPQL queries, EAGER associations are loaded with additional SELECTs per row — N+1 again.
- **"Fetch join is always the answer."** Not with pagination over collections or with multiple collections; batch fetching or projections are often better.

## Key Takeaways

- N+1 = 1 query for parents + 1 per parent for a lazy association accessed in a loop.
- Fix with `JOIN FETCH`/`@EntityGraph` (one query), batch fetching (few queries, pagination-friendly) or DTO projections.
- Detect by logging SQL, enabling statistics and asserting query counts in tests.
- Set `hibernate.default_batch_fetch_size` as a safety net and disable Open Session in View.
