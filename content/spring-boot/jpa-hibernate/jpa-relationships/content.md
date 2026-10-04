# Entity Relationships, Owning Side and mappedBy

**Module:** Spring Data JPA and Hibernate · **Interview priority:** Core

## Definition

JPA maps associations between entities with four annotations — **`@OneToOne`**, **`@OneToMany`**, **`@ManyToOne`** and **`@ManyToMany`** — either **unidirectional** (only one entity references the other) or **bidirectional** (both do). In a bidirectional relationship, exactly one side is the **owning side**: the side whose field controls the foreign key (or join table). The other side is the **inverse side**, declared with **`mappedBy`**, and JPA **ignores** it when writing to the database.

## Why It Matters

- "What is the owning side?" and "What does `mappedBy` do?" are standard JPA questions.
- Updating only the inverse side is a common bug: the object graph looks right in memory but the foreign key is never written.
- Relationship mapping choices drive fetch behaviour, N+1 problems, cascade behaviour and SQL efficiency.

## Relationships

| Annotation | Example | Foreign key lives in | Default fetch |
|------------|---------|---------------------|---------------|
| `@ManyToOne` | Many `OrderItem`s → one `Order` | The "many" table (`order_item.order_id`) | **EAGER** |
| `@OneToMany` | One `Order` → many `OrderItem`s | The "many" table (with `mappedBy`) | LAZY |
| `@OneToOne` | `User` ↔ `UserProfile` | One of the two tables (or shared primary key) | **EAGER** |
| `@ManyToMany` | `Student` ↔ `Course` | A **join table** (`student_course`) | LAZY |

## @ManyToOne

The most common and most efficient mapping: a plain foreign-key column.

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)     // override the EAGER default
@JoinColumn(name = "order_id", nullable = false)
private Order order;
```

## @OneToMany

Usually the inverse side of a `@ManyToOne`:

```java
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
private List<OrderItem> items = new ArrayList<>();
```

A **unidirectional** `@OneToMany` without `mappedBy` makes Hibernate use a join table (or, with `@JoinColumn`, extra UPDATE statements to set the foreign key after inserting children) — less efficient. Prefer bidirectional `@OneToMany(mappedBy)` + `@ManyToOne`, or just the `@ManyToOne` side.

## @OneToOne

```java
@Entity
class UserProfile {
    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId                                  // shares the primary key with User: profile.id = user.id
    @JoinColumn(name = "id")
    private User user;
}
```

`@MapsId` (shared primary key) is the most efficient one-to-one mapping. On the inverse side (`@OneToOne(mappedBy = "user")` in `User`), Hibernate often cannot make the association lazy because it must query to know whether the related row exists — so map one-to-one from the child side only when possible.

## @ManyToMany

```java
@ManyToMany
@JoinTable(name = "student_course",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id"))
private Set<Course> courses = new HashSet<>();                  // owning side

// in Course:
@ManyToMany(mappedBy = "courses")
private Set<Student> students = new HashSet<>();                // inverse side
```

- Use `Set`, not `List` — removing from a `List`-mapped many-to-many makes Hibernate delete all join rows and re-insert the rest.
- Never `CascadeType.REMOVE`/`ALL` on many-to-many (removing a student would delete shared courses).
- When the link needs its own data (enrolment date, grade), replace `@ManyToMany` with a **join entity** (`Enrollment`) and two `@ManyToOne`s.

## Owning Side

The owning side is the one **without** `mappedBy`:

- In `@OneToMany`/`@ManyToOne` pairs, it is **always the `@ManyToOne`** side (the table with the foreign key).
- In `@OneToOne`, it is the side with the `@JoinColumn`.
- In `@ManyToMany`, it is the side with the `@JoinTable` (you choose).

Hibernate writes the foreign key / join table **only from the owning side's field**.

## mappedBy

`mappedBy = "order"` says: "this collection is the inverse of the `order` field in `OrderItem`; don't write anything for me." Without it, a bidirectional mapping becomes **two independent unidirectional mappings** (an extra join table or duplicate updates).

### Keep both sides in sync

Because only the owning side is persisted, but your code reads both sides in memory, write **helper methods** on the parent:

```java
public void addItem(OrderItem item) {
    items.add(item);
    item.setOrder(this);
}

public void removeItem(OrderItem item) {
    items.remove(item);
    item.setOrder(null);
}
```

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
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@SpringBootApplication
public class OwningSideDemo {

    @Entity
    @Table(name = "department")
    public static class Department {
        @Id
        @GeneratedValue
        private Long id;
        private String name;

        @OneToMany(mappedBy = "department", cascade = CascadeType.PERSIST)   // inverse side
        private List<Employee> employees = new ArrayList<>();

        protected Department() {
        }

        Department(String name) {
            this.name = name;
        }

        List<Employee> getEmployees() {
            return employees;
        }

        void addEmployee(Employee e) {          // keeps BOTH sides in sync
            employees.add(e);
            e.setDepartment(this);
        }
    }

    @Entity
    @Table(name = "employee")
    public static class Employee {
        @Id
        @GeneratedValue
        private Long id;
        private String name;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "department_id")                                 // owning side: has the FK
        private Department department;

        protected Employee() {
        }

        Employee(String name) {
            this.name = name;
        }

        void setDepartment(Department department) {
            this.department = department;
        }
    }

    @Service
    public static class HrService {
        @PersistenceContext
        private EntityManager em;

        @Transactional
        public void onlyInverseSide() {
            Department d = new Department("Sales");
            d.getEmployees().add(new Employee("Asha"));       // employee.department NOT set
            em.persist(d);
        }

        @Transactional
        public void bothSides() {
            Department d = new Department("Support");
            d.addEmployee(new Employee("Ravi"));
            em.persist(d);
        }

        @Transactional(readOnly = true)
        public void printForeignKeys() {
            List<?> rows = em.createNativeQuery("select name, department_id from employee order by name")
                    .getResultList();
            for (Object row : rows) {
                Object[] cols = (Object[]) row;
                System.out.println("  employee " + cols[0] + " -> department_id = " + cols[1]);
            }
        }
    }

    public static void main(String[] args) {
        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(OwningSideDemo.class)
                .web(WebApplicationType.NONE)
                .properties("spring.main.banner-mode=off", "logging.level.root=error",
                        "spring.datasource.url=jdbc:h2:mem:owning",
                        "spring.jpa.hibernate.ddl-auto=create-drop")
                .run(args)) {
            HrService hr = context.getBean(HrService.class);
            hr.onlyInverseSide();
            hr.bothSides();
            hr.printForeignKeys();
        }
    }
}
```

**Output:**

```text
  employee Asha -> department_id = null
  employee Ravi -> department_id = 2
```

Asha was cascaded and inserted (the collection had her), but her `department` field — the owning side — was `null`, so the foreign key is `null`. Ravi was added through the helper, which set both sides.

## Internal Behavior

- Hibernate maps each association to SQL through the owning side's `@JoinColumn`/`@JoinTable`; the inverse collection is a read-only view populated when loading.
- Collections are replaced with Hibernate's own implementations (`PersistentBag`, `PersistentSet`) that track changes and lazy-load. Never replace a mapped collection with a new `ArrayList`; modify it.
- `List` without `@OrderColumn` is a "bag" (unordered, duplicates allowed); fetching two bags in one query fails with `MultipleBagFetchException`.

## Comparison

| | Unidirectional `@ManyToOne` | Bidirectional `@OneToMany(mappedBy)` + `@ManyToOne` | Unidirectional `@OneToMany` |
|--|----|----|----|
| SQL efficiency | Best | Same as left (FK on child) | Extra join table or UPDATEs |
| Navigate parent → children | Query needed | Yes | Yes |
| Consistency work | None | Keep both sides in sync | None |
| Recommendation | Default | When the parent really needs the collection | Avoid |

## Common Mistakes

- Setting only the inverse side (`order.getItems().add(item)`) → foreign key `null`.
- Forgetting `mappedBy` → an unexpected join table appears.
- Leaving `@ManyToOne`/`@OneToOne` EAGER (the default) → extra joins/queries everywhere.
- `CascadeType.ALL` on `@ManyToOne` (deleting a child deletes the shared parent!).
- `toString`/`equals`/JSON serialisation traversing both directions → infinite recursion.
- Huge `@OneToMany` collections (a customer's 100 000 orders) — query them with paging instead of mapping the collection.

## Common Interview Traps

- **"The `@OneToMany` side owns the relationship because it 'has' the children."** The table with the foreign key — the `@ManyToOne` side — owns it.
- **"`mappedBy` creates the foreign key."** `mappedBy` marks the side that does **not** control it.
- **"`@ManyToMany` is the natural way to model links."** Only when the link carries no data; otherwise use a join entity.

## Key Takeaways

- Four association types; `@ManyToOne` and `@OneToOne` default to EAGER, collections to LAZY — make everything LAZY explicitly.
- Owning side = side without `mappedBy` = side whose field writes the FK/join table.
- Keep both sides in sync with helper methods; prefer `Set` for many-to-many; use a join entity when the link has attributes.
