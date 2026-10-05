# Functional Dependencies — Practice

### P1. Which FD does not follow?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Armstrong's axioms

Given `F = { A → B, B → C }`, which dependency is **not** implied?

- A) `A → C`
- B) `AB → C`
- C) `C → A`
- D) `A → BC`

<details>
<summary>Answer</summary>

**Answer:** C)

**Explanation:** A by transitivity; B by augmentation of `B → C` (or from A); D by union of `A → B` and `A → C`. Nothing lets `C` determine `A` — dependencies do not reverse.

</details>

### P2. Compute a closure

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** attribute closure

`R(A, B, C, D, E, F)`, `F = { A → B, C → D, AB → E, E → F }`. Compute `{A}⁺`, `{C}⁺` and `{A, C}⁺`. What is the candidate key?

<details>
<summary>Hint</summary>

Which attributes never appear on a right-hand side?

</details>

<details>
<summary>Answer</summary>

- `{A}⁺`: A → +B (A → B) → +E (AB → E) → +F (E → F) = `{A, B, E, F}`.
- `{C}⁺`: C → +D = `{C, D}`.
- `{A, C}⁺` = `{A, B, C, D, E, F}` — all attributes.

`A` and `C` appear on no right-hand side, so both must be in every key; `{A, C}` is a superkey and minimal, hence the **only** candidate key.

</details>

### P3. Find all candidate keys

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** candidate keys, prime attributes

`R(A, B, C, D)`, `F = { AB → C, C → D, D → A }`. Find all candidate keys and the prime attributes.

<details>
<summary>Hint</summary>

`B` is never on a right-hand side. Try `B` together with each other attribute.

</details>

<details>
<summary>Answer</summary>

`B` must be in every key; `{B}⁺ = {B}`.

- `{A, B}⁺`: AB → C, C → D → `{A, B, C, D}` ✓
- `{B, C}⁺`: C → D, D → A → `{A, B, C, D}` ✓
- `{B, D}⁺`: D → A, AB → C → `{A, B, C, D}` ✓

Each is minimal (`{B}` alone is not a key), so the candidate keys are `{A, B}`, `{B, C}` and `{B, D}`. Every attribute is prime. (This relation is in 3NF but not BCNF — see [Database Normalization](../database-normalization/content.md).)

</details>

### P4. Find violations in data

**Difficulty:** Medium · **Type:** Query · **Concepts:** testing an FD with SQL

The business rule is `pincode → city`.

**Schema and data:**

```sql
CREATE TABLE addresses_raw (id int, pincode text, city text);
INSERT INTO addresses_raw VALUES
    (1, '600001', 'Chennai'), (2, '600001', 'Chennai'), (3, '400001', 'Mumbai'),
    (4, '400001', 'Bombay'),  (5, '560001', 'Bengaluru'), (6, '400001', 'Mumbai');
```

List each pincode that violates the rule with the distinct cities found.

**Expected output:**

```text
 pincode |     cities
---------+----------------
 400001  | Bombay, Mumbai
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT pincode, string_agg(DISTINCT city, ', ' ORDER BY city) AS cities
FROM addresses_raw
GROUP BY pincode
HAVING count(DISTINCT city) > 1;
```

**Explanation:** Storing the city in every address lets copies disagree; a `pincodes (pincode PRIMARY KEY, city)` table referenced by addresses would enforce the rule.

</details>

### P5. Classify the dependencies

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** partial and transitive dependencies

`OrderLines(order_id, product_id, qty, product_name, customer_id, customer_city)`, key `(order_id, product_id)`. Business rules: an order belongs to one customer; a customer has one city; a product has one name; quantity is per order line. List the FDs and classify each as full, partial or transitive.

<details>
<summary>Answer</summary>

- `(order_id, product_id) → qty` — full.
- `product_id → product_name` — partial (depends on part of the key).
- `order_id → customer_id` — partial.
- `order_id → customer_city` — partial, and transitive through `customer_id → customer_city`.
- `customer_id → customer_city` — a dependency between non-key attributes (the source of the transitivity).

Normalization splits this into `order_lines(order_id, product_id, qty)`, `products(product_id, product_name)`, `orders(order_id, customer_id)` and `customers(customer_id, customer_city)`.

</details>
