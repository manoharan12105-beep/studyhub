# Entity Lifecycle and the Persistence Context

**Module:** Spring Data JPA and Hibernate · **Interview priority:** Core

## Definition

- The **persistence context** is the set of entity instances an `EntityManager` currently manages — a unit of work and a first-level cache. Within one persistence context, each database row is represented by **at most one** Java object.
- The **`EntityManager`** is the JPA interface used to interact with a persistence context: `persist`, `find`, `merge`, `remove`, `detach`, `flush`, `createQuery`.
- An **entity's lifecycle state** describes its relationship to a persistence context: **transient** (new), **managed**, **detached** or **removed**.

## Why It Matters

- Almost every JPA "mystery" — updates without `save()`, `LazyInitializationException`, stale data, unexpected SELECTs on `merge` — is explained by the persistence context and entity states.
- Interviewers use "Explain the entity lifecycle" to separate people who use Spring Data from people who understand it.

## Persistence Context

```text
                 ┌──────────────── Persistence context (one per transaction in Spring) ────────────────┐
 em.find(42) ──► │ identity map:  Product#42 → object A     Order#7 → object B                         │
                 │ snapshots:     original state of A, B (for dirty checking)                           │
                 │ action queue:  pending INSERT / UPDATE / DELETE, executed at flush                   │
                 └──────────────────────────────────────────────────────────────────────────────────────┘
```

- **Identity guarantee:** `find(Product.class, 42)` twice returns the **same object**; only the first call hits the database.
- **Write-behind:** changes are queued and sent at **flush** (before commit, before certain queries, or on `flush()`).
- **Automatic dirty checking:** at flush, Hibernate compares managed entities with their snapshots and issues UPDATEs for changes (see [Dirty Checking and Flush](../dirty-checking-and-flush/content.md)).

In Spring, the persistence context is **transaction-scoped**: `JpaTransactionManager` opens an `EntityManager` when a `@Transactional` method starts and closes it at commit/rollback. The `EntityManager` you inject with `@PersistenceContext` (or that repositories use) is a **shared proxy** that delegates to the current transaction's real `EntityManager`, so it is safe to inject into singletons.

## EntityManager

| Method | Effect |
|--------|--------|
| `persist(e)` | transient → managed; INSERT at flush (immediately with `IDENTITY`) |
| `find(Class, id)` | Returns the managed instance (from the context or a SELECT), or `null` |
| `getReference(Class, id)` | Returns an uninitialised **proxy** without a SELECT; fails later if the row does not exist |
| `merge(e)` | Copies a detached (or new) object's state onto a **managed** instance and returns that instance |
| `remove(e)` | managed → removed; DELETE at flush |
| `detach(e)` / `clear()` | managed → detached (one / all); pending changes to them are not flushed |
| `contains(e)` | Is this exact instance managed? |
| `flush()` | Execute pending SQL now (still inside the transaction) |
| `refresh(e)` | Reload state from the database, overwriting changes |
| `createQuery(jpql)` | JPQL query; results are managed entities |

## Entity Lifecycle

```text
               new Product()
                    │
                    ▼
             ┌─────────────┐     persist()       ┌─────────────┐      remove()      ┌─────────────┐
             │  TRANSIENT  │ ──────────────────► │   MANAGED   │ ─────────────────► │   REMOVED   │
             │  (new)      │                     │             │ ◄───────────────── │             │
             └─────────────┘   find()/query ───► └─────────────┘     persist()      └─────────────┘
                                                   │       ▲                               │
                          detach() / clear() /     │       │  merge() returns a            │ flush/commit
                          close() / tx ends        ▼       │  managed copy                 ▼
                                                 ┌─────────────┐                     row DELETED
                                                 │  DETACHED   │
                                                 └─────────────┘
```

## Transient Entity

Created with `new`, never persisted, no persistence context knows it, usually no id. Garbage-collected if never persisted.

## Managed Entity

Associated with an open persistence context. Changes to its fields are **tracked** and written at flush; lazy associations can be loaded. Obtained by `persist`, `find`, `getReference`, queries, or `merge`'s return value.

## Detached Entity

Has an id and represents a row, but the persistence context that managed it is closed or it was evicted. Changes are **not tracked**; touching an uninitialised lazy association throws `LazyInitializationException`. Every entity returned from a `@Transactional` service method is detached once the method returns (unless Open Session in View is on). To write changes back, `merge` it in a new transaction — or better, load and modify in the same transaction.

## Removed Entity

Scheduled for deletion; the DELETE runs at flush. Calling `persist` again before flush makes it managed again.

## How It Works

Each service method below is one transaction (one persistence context). The program prints the SQL Hibernate actually executes.

```java
package com.example.demo;

import jakarta.persistence.Entity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Table;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@SpringBootApplication
public class EntityLifecycleDemo {

    @Entity
    @Table(name = "product")
    public static class Product {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;
        private String name;
        private int price;

        protected Product() {
        }

        Product(String name, int price) {
            this.name = name;
            this.price = price;
        }

        Long getId() {
            return id;
        }

        void setPrice(int price) {
            this.price = price;
        }
    }

    /** Prints every SQL statement Hibernate sends to the database. */
    public static class SqlPrinter implements StatementInspector {
        @Override
        public String inspect(String sql) {
            System.out.println("    SQL> " + sql);
            return sql;
        }
    }

    @Service
    public static class ProductService {
        @PersistenceContext
        private EntityManager em;

        @Transactional
        public Long create() {
            Product p = new Product("Keyboard", 1500);
            System.out.println("  new object, managed? " + em.contains(p));
            em.persist(p);
            System.out.println("  after persist, managed? " + em.contains(p) + ", id = " + p.getId());
            return p.getId();
        }

        @Transactional(readOnly = true)
        public Product findTwice(Long id) {
            Product first = em.find(Product.class, id);
            Product second = em.find(Product.class, id);
            System.out.println("  same instance from both finds? " + (first == second));
            return first;
        }

        @Transactional
        public void merge(Product detached) {
            detached.setPrice(1200);
            Product managed = em.merge(detached);
            System.out.println("  merge returned the same object? " + (managed == detached)
                    + "; detached object managed? " + em.contains(detached));
        }

        @Transactional
        public void delete(Long id) {
            Product p = em.find(Product.class, id);
            em.remove(p);
            System.out.println("  after remove, managed? " + em.contains(p));
        }
    }

    public static void main(String[] args) {
        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(EntityLifecycleDemo.class)
                .web(WebApplicationType.NONE)
                .properties("spring.main.banner-mode=off", "logging.level.root=error",
                        "spring.datasource.url=jdbc:h2:mem:lifecycle",
                        "spring.jpa.hibernate.ddl-auto=create-drop",
                        "spring.jpa.properties.hibernate.session_factory.statement_inspector="
                                + SqlPrinter.class.getName())
                .run(args)) {
            ProductService service = context.getBean(ProductService.class);

            System.out.println("1. persist (transient -> managed)");
            Long id = service.create();
            System.out.println("2. find twice in one transaction (first-level cache)");
            Product detached = service.findTwice(id);
            System.out.println("3. transaction ended -> entity is detached; merge it in a new transaction");
            service.merge(detached);
            System.out.println("4. remove (managed -> removed)");
            service.delete(id);
            System.out.println("done");
        }
    }
}
```

**Output:**

```text
1. persist (transient -> managed)
  new object, managed? false
    SQL> insert into product (name,price,id) values (?,?,default)
  after persist, managed? true, id = 1
2. find twice in one transaction (first-level cache)
    SQL> select p1_0.id,p1_0.name,p1_0.price from product p1_0 where p1_0.id=?
  same instance from both finds? true
3. transaction ended -> entity is detached; merge it in a new transaction
    SQL> select p1_0.id,p1_0.name,p1_0.price from product p1_0 where p1_0.id=?
  merge returned the same object? false; detached object managed? false
    SQL> update product set name=?,price=? where id=?
4. remove (managed -> removed)
    SQL> select p1_0.id,p1_0.name,p1_0.price from product p1_0 where p1_0.id=?
  after remove, managed? false
    SQL> delete from product where id=?
done
```

What the output proves:

- `IDENTITY` → the INSERT runs **at `persist()`**, not at commit, because the id is needed.
- The second `find` produced **no SQL** — first-level cache.
- `merge` **selected** the row, copied the detached state onto a new managed instance, and issued the UPDATE **at commit**. The detached object itself stays detached.
- `remove` queued a DELETE that ran at commit.

## First-Level Cache

The persistence context itself — always on, cannot be disabled, scoped to one `EntityManager` (one transaction in Spring). It avoids repeated SELECTs by id and guarantees one object per row. It is **not** shared between transactions or users, so it does not reduce database load across requests.

JPQL queries still go to the database (a query cannot know which rows match without running), but returned rows that are already in the context are resolved to the **existing** instances.

## Second-Level Cache Awareness

An optional, **shared** cache across persistence contexts (per `EntityManagerFactory`), provided by Hibernate with a cache provider (Ehcache, Caffeine via JCache, Infinispan, Hazelcast). Enable per entity with `@Cacheable` (JPA) / `@Cache` (Hibernate) and `jakarta.persistence.sharedCache.mode`. Suitable for read-mostly reference data (countries, categories); risky for frequently updated data and in multi-instance deployments without a distributed cache. Separate from Spring's `@Cacheable` method cache (see [Cache Abstraction](../../advanced/spring-cache-abstraction/content.md)).

| | First-level cache | Second-level cache |
|--|-------------------|--------------------|
| Scope | One persistence context (transaction) | `EntityManagerFactory` (application-wide) |
| Enabled | Always | Opt-in, per entity |
| Shared across requests | No | Yes |
| Provider | Built into Hibernate | External (JCache/Ehcache/Infinispan…) |

## Internal Behavior

- Hibernate keys the identity map by entity type + id (`EntityKey`) and stores a **snapshot** of each loaded entity's state for dirty checking — memory grows with every managed entity, which is why bulk jobs `flush()` and `clear()` periodically.
- Spring's shared `EntityManager` proxy looks up the transaction-bound `EntityManager` via `TransactionSynchronizationManager`; outside a transaction, each call gets a short-lived `EntityManager`, so entities are detached immediately.
- `merge` on a **new** object (null id) behaves like persist but returns a different instance — the reason Spring Data's `save()` returns an entity you should use instead of the argument.

## Common Mistakes

- Using the argument of `save(entity)`/`merge(entity)` after the call instead of the **returned** instance.
- Modifying detached entities and expecting changes to be saved.
- Long-running batch jobs that never `clear()` the persistence context — memory and dirty-checking time grow linearly.
- Expecting the first-level cache to speed up repeated requests from different users.

## Common Interview Traps

- **"`persist` always inserts at commit."** With `IDENTITY` the INSERT runs immediately.
- **"`merge` attaches the object you pass."** It returns a *different*, managed instance; the argument stays detached.
- **"The first-level cache can be disabled."** It is inherent to the persistence context.

## Key Takeaways

- Persistence context = identity map + snapshots + action queue, one per transaction in Spring.
- States: transient → (persist) managed → (tx ends/detach) detached → (merge) managed copy; managed → (remove) removed.
- First-level cache: per transaction, automatic. Second-level cache: shared, opt-in, for read-mostly data.
