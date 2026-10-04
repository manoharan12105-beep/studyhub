# Entities and ID Generation — Practice

### P1. Valid entity?

**Difficulty:** Easy · **Type:** MCQ

Which of these can be a JPA entity?

- A) `public record Product(Long id, String name) {}` with `@Entity`
- B) `public final class Product` with `@Entity`, `@Id`, and a no-arg constructor
- C) `public class Product` with `@Entity`, `@Id Long id`, and a protected no-arg constructor
- D) `public interface Product` with `@Entity`

<details>
<summary>Answer</summary>

**Answer:** C) `public class Product` with `@Entity`, `@Id Long id`, and a protected no-arg constructor

**Explanation:** Records and final classes cannot be proxied or mutated by Hibernate; interfaces cannot be instantiated.

</details>

### P2. Enum corruption

**Difficulty:** Medium · **Type:** Debugging

`OrderStatus { PLACED, SHIPPED, DELIVERED }` is mapped with `@Enumerated` (no type). A developer inserts `PACKED` between `PLACED` and `SHIPPED`. What happens to existing orders?

<details>
<summary>Answer</summary>

The default is `ORDINAL`: existing rows store 0, 1, 2. After the change, 1 now means `PACKED` and 2 means `SHIPPED`, so every shipped order appears packed and every delivered order appears shipped — silent data corruption. Use `EnumType.STRING` and migrate data deliberately.

</details>

### P3. Bulk insert performance

**Difficulty:** Medium · **Type:** Scenario

Importing 100 000 products into PostgreSQL with `saveAll` takes minutes, and logs show one INSERT round trip per row although `hibernate.jdbc.batch_size=50` is set. Ids use `GenerationType.IDENTITY`. Explain and fix.

<details>
<summary>Answer</summary>

`IDENTITY` forces Hibernate to execute each INSERT immediately to obtain the generated key, which disables JDBC batching. Switch to `SEQUENCE` with `allocationSize = 50` (and a sequence created with `INCREMENT BY 50`), enable `hibernate.order_inserts=true`, and flush/clear the persistence context every few thousand rows to keep memory flat.

</details>

### P4. Map a value object

**Difficulty:** Medium · **Type:** Coding

Map a customer's address (line, city, pincode) as a value object stored in the `customers` table.

<details>
<summary>Answer</summary>

```java
import jakarta.persistence.Embeddable;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Embeddable
class Address {
    private String line;
    private String city;
    private String pincode;

    protected Address() {
    }

    Address(String line, String city, String pincode) {
        this.line = line;
        this.city = city;
        this.pincode = pincode;
    }
}

@Entity
@Table(name = "customers")
class Customer {
    @Id
    @GeneratedValue
    private Long id;

    @Embedded
    private Address address;            // columns line, city, pincode in the customers table
}
```

</details>
