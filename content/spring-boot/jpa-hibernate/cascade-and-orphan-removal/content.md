# Cascade and orphanRemoval

**Module:** Spring Data JPA and Hibernate · **Interview priority:** Frequently asked

## Definition

- **Cascade** propagates an `EntityManager` operation from a parent entity to its associated entities: with `cascade = CascadeType.PERSIST`, persisting an order also persists its lines. Types: `PERSIST`, `MERGE`, `REMOVE`, `REFRESH`, `DETACH`, and `ALL` (all of them).
- **`orphanRemoval = true`** (on `@OneToMany`/`@OneToOne`) deletes a child entity when it is **removed from the parent's collection** (or replaced in a one-to-one) — the child became an "orphan".

## Why It Matters

- Cascades decide whether saving an aggregate saves its parts, and whether deleting it deletes them.
- Wrong cascades delete shared data (`CascadeType.REMOVE` on `@ManyToMany` or `@ManyToOne`) — a destructive production bug.
- "Cascade REMOVE vs orphanRemoval" is a common interview comparison.

## Cascade

| Type | Propagates | Typical use |
|------|-----------|-------------|
| `PERSIST` | `persist()` | Save new children together with a new parent |
| `MERGE` | `merge()` | Merge a detached graph (Spring Data `save` on a non-new parent) |
| `REMOVE` | `remove()` | Delete children when the parent is deleted |
| `REFRESH` | `refresh()` | Reload children with the parent |
| `DETACH` | `detach()` | Evict children with the parent |
| `ALL` | All of the above | Parent **owns** the children's lifecycle (composition) |

Cascade is about **operations on the parent**, not about foreign keys. It is set on the side from which you call the operation — usually the parent's `@OneToMany`.

Rule of thumb: cascade **only from an aggregate root to the parts it exclusively owns** — `Order → OrderLine`, `Post → Comment` — never towards shared or independent entities (`OrderLine → Product`, `Student ↔ Course`, `Order → Customer`).

## orphanRemoval

With `orphanRemoval = true`, removing a child from the parent's collection is enough to delete it — no repository call for the child:

```java
order.removeLine(line);        // collection.remove(line); line.setOrder(null);
// at flush: DELETE FROM order_line WHERE id = ?
```

Without it, removing from the inverse-side collection does nothing in the database (and clearing the owning side only sets the foreign key to `NULL`, if the column allows it).

> [!WARNING]
> With `orphanRemoval = true`, never replace the collection object (`order.setLines(new ArrayList<>(newLines))`). Hibernate tracks its own collection instance; replacing it raises "A collection with cascade=all-delete-orphan was no longer referenced by the owning entity instance". Use `lines.clear(); lines.addAll(newLines);`.

## How It Works

```java
package com.example.demo;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@SpringBootApplication
public class CascadeOrphanDemo {

    @Entity
    @Table(name = "purchase_order")
    public static class PurchaseOrder {
        @Id
        @GeneratedValue
        private Long id;

        @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
        private List<OrderLine> lines = new ArrayList<>();

        List<OrderLine> getLines() {
            return lines;
        }

        void addLine(OrderLine line) {
            lines.add(line);
            line.order = this;
        }

        void removeLine(OrderLine line) {
            lines.remove(line);
            line.order = null;
        }
    }

    @Entity
    @Table(name = "order_line")
    public static class OrderLine {
        @Id
        @GeneratedValue
        private Long id;
        private String sku;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "order_id")
        private PurchaseOrder order;

        protected OrderLine() {
        }

        OrderLine(String sku) {
            this.sku = sku;
        }
    }

    public static class SqlPrinter implements StatementInspector {
        @Override
        public String inspect(String sql) {
            if (!sql.startsWith("select")) {               // show only writes
                System.out.println("    SQL> " + sql);
            }
            return sql;
        }
    }

    @Service
    public static class OrderService {
        @PersistenceContext
        private EntityManager em;

        @Transactional
        public Long create() {
            PurchaseOrder order = new PurchaseOrder();
            order.addLine(new OrderLine("KEYBOARD"));
            order.addLine(new OrderLine("MOUSE"));
            order.addLine(new OrderLine("MONITOR"));
            em.persist(order);                                // cascade PERSIST → lines inserted too
            return order.id;
        }

        @Transactional
        public void removeOneLine(Long orderId) {
            PurchaseOrder order = em.find(PurchaseOrder.class, orderId);
            order.removeLine(order.getLines().get(0));        // orphanRemoval → DELETE the line
        }

        @Transactional
        public void deleteOrder(Long orderId) {
            em.remove(em.find(PurchaseOrder.class, orderId)); // cascade REMOVE → lines deleted first
        }
    }

    public static void main(String[] args) {
        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(CascadeOrphanDemo.class)
                .web(WebApplicationType.NONE)
                .properties("spring.main.banner-mode=off", "logging.level.root=error",
                        "spring.datasource.url=jdbc:h2:mem:cascade",
                        "spring.jpa.hibernate.ddl-auto=create-drop",
                        "spring.jpa.properties.hibernate.session_factory.statement_inspector="
                                + SqlPrinter.class.getName())
                .run(args)) {
            OrderService service = context.getBean(OrderService.class);
            System.out.println("1. persist order with 3 lines (cascade PERSIST)");
            Long id = service.create();
            System.out.println("2. remove one line from the collection (orphanRemoval)");
            service.removeOneLine(id);
            System.out.println("3. remove the order (cascade REMOVE)");
            service.deleteOrder(id);
        }
    }
}
```

**Output:**

```text
1. persist order with 3 lines (cascade PERSIST)
    SQL> insert into purchase_order (id) values (?)
    SQL> insert into order_line (order_id,sku,id) values (?,?,?)
    SQL> insert into order_line (order_id,sku,id) values (?,?,?)
    SQL> insert into order_line (order_id,sku,id) values (?,?,?)
2. remove one line from the collection (orphanRemoval)
    SQL> delete from order_line where id=?
3. remove the order (cascade REMOVE)
    SQL> delete from order_line where id=?
    SQL> delete from order_line where id=?
    SQL> delete from purchase_order where id=?
```

Note that cascade REMOVE deletes children **one row at a time** after loading them. For large collections, a bulk `DELETE … WHERE order_id = ?` (or `ON DELETE CASCADE` in the database schema) is far cheaper.

## Comparison: Cascade vs orphanRemoval

| Aspect | `CascadeType.REMOVE` | `orphanRemoval = true` |
|--------|----------------------|------------------------|
| Trigger | Parent is removed (`em.remove(parent)`) | Child is **disassociated** from the parent (removed from collection / replaced) — also when the parent is removed |
| Deletes | All children of the removed parent | The removed child |
| Available on | Any association | `@OneToMany`, `@OneToOne` only |
| Models | "Children die with the parent" | "Children cannot exist without a parent" |
| Typical combo | `cascade = CascadeType.ALL, orphanRemoval = true` for compositions | |

## Internal Behavior

- Cascades are applied while Hibernate processes the operation: `persist(order)` walks the `lines` collection and persists each line before the flush.
- Orphans are detected at flush by comparing the collection with its snapshot; removed elements are scheduled for deletion (the `OrphanRemovalAction` runs first in the action queue).
- `CascadeType.MERGE` on a large graph merges every child — Spring Data's `save()` on a detached parent can trigger many SELECTs for this reason.

## Common Mistakes

- `cascade = CascadeType.ALL` on `@ManyToOne` (e.g. `OrderLine.product`) — deleting a line deletes the product used by other orders (or fails with a constraint violation).
- `CascadeType.REMOVE` on `@ManyToMany`.
- Expecting `orphanRemoval` to work when only the owning side is cleared but the child stays in the collection, or vice versa — use helper methods that do both.
- Replacing an `orphanRemoval` collection instance.
- Deleting huge child collections with cascade REMOVE row by row.

## Common Interview Traps

- **"Cascade REMOVE and orphanRemoval are the same."** REMOVE reacts to the parent's deletion; orphanRemoval also reacts to removing a child from the collection.
- **"Cascade creates database ON DELETE CASCADE."** JPA cascades are performed by Hibernate in memory; database `ON DELETE CASCADE` is a separate schema feature.
- **"`CascadeType.ALL` is a safe default."** Only for owned parts of an aggregate.

## Key Takeaways

- Cascade = propagate EntityManager operations from parent to children; use `ALL` only for owned children.
- `orphanRemoval` = delete a child once it leaves the parent's collection.
- Never cascade to shared entities (`@ManyToOne`, `@ManyToMany`).
