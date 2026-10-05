# Database Normalization — Practice

### P1. Which normal form is violated?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** 2NF

`order_lines(order_id, product_id, qty, product_name)`, key `(order_id, product_id)`, with `product_id → product_name`. The highest normal form it satisfies is:

- A) Not even 1NF
- B) 1NF
- C) 2NF
- D) 3NF

<details>
<summary>Answer</summary>

**Answer:** B) 1NF

**Explanation:** Values are atomic (1NF), but `product_name` depends on part of the composite key (`product_id`) — a partial dependency, so 2NF fails.

</details>

### P2. Highest normal form

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** 3NF vs BCNF

For each relation, give the highest normal form (up to BCNF):

1. `R1(emp_id, dept_id, dept_name)`, FDs `emp_id → dept_id`, `dept_id → dept_name`.
2. `R2(A, B, C, D)`, FDs `AB → C`, `C → D`, `D → A` (candidate keys `AB`, `BC`, `BD`).
3. `R3(isbn, title, publisher)`, FD `isbn → title, publisher`.

<details>
<summary>Answer</summary>

1. **2NF.** The key `emp_id` is a single column (so 2NF), but `dept_name` depends transitively via the non-key `dept_id` → violates 3NF.
2. **3NF, not BCNF.** All attributes are prime, so `C → D` and `D → A` satisfy 3NF (right sides prime), but `C` and `D` are not superkeys.
3. **BCNF.** The only determinant, `isbn`, is the key.

</details>

### P3. Normalize an order report

**Difficulty:** Medium · **Type:** Query · **Concepts:** decomposition into 3NF

**Schema and data:**

```sql
CREATE TABLE order_report (
    order_id      int,
    order_date    date,
    customer_id   int,
    customer_name text,
    product_id    int,
    product_name  text,
    qty           int,
    PRIMARY KEY (order_id, product_id)
);
INSERT INTO order_report VALUES
    (1, '2026-03-01', 10, 'Anil',   100, 'Laptop', 1),
    (1, '2026-03-01', 10, 'Anil',   101, 'Mouse',  2),
    (2, '2026-03-02', 11, 'Bhavna', 101, 'Mouse',  1),
    (3, '2026-03-05', 10, 'Anil',   102, 'Desk',   1);
```

Decompose it into 3NF tables with keys and foreign keys, then show that rejoining produces no missing or spurious rows.

**Expected output:**

```text
 missing | spurious
---------+----------
       0 |        0
(1 row)
```

<details>
<summary>Hint</summary>

FDs: `order_id → order_date, customer_id`; `customer_id → customer_name`; `product_id → product_name`; `(order_id, product_id) → qty`.

</details>

<details>
<summary>Solution</summary>

```sql
CREATE TABLE r_customers AS SELECT DISTINCT customer_id, customer_name FROM order_report;
CREATE TABLE r_products  AS SELECT DISTINCT product_id, product_name FROM order_report;
CREATE TABLE r_orders    AS SELECT DISTINCT order_id, order_date, customer_id FROM order_report;
CREATE TABLE r_lines     AS SELECT order_id, product_id, qty FROM order_report;

ALTER TABLE r_customers ADD PRIMARY KEY (customer_id);
ALTER TABLE r_products  ADD PRIMARY KEY (product_id);
ALTER TABLE r_orders    ADD PRIMARY KEY (order_id),
                        ADD FOREIGN KEY (customer_id) REFERENCES r_customers;
ALTER TABLE r_lines     ADD PRIMARY KEY (order_id, product_id),
                        ADD FOREIGN KEY (order_id) REFERENCES r_orders,
                        ADD FOREIGN KEY (product_id) REFERENCES r_products;

WITH rejoined AS (
    SELECT o.order_id, o.order_date, c.customer_id, c.customer_name, p.product_id, p.product_name, l.qty
    FROM r_lines l
    JOIN r_orders o    ON o.order_id = l.order_id
    JOIN r_customers c ON c.customer_id = o.customer_id
    JOIN r_products p  ON p.product_id = l.product_id
)
SELECT (SELECT count(*) FROM (SELECT * FROM order_report EXCEPT SELECT * FROM rejoined) a) AS missing,
       (SELECT count(*) FROM (SELECT * FROM rejoined EXCEPT SELECT * FROM order_report) b) AS spurious;
```

**Explanation:** `r_orders` removes the partial dependency of `order_date`/`customer_id` on `order_id` and, with `r_customers`, the transitive `order_id → customer_id → customer_name`; `r_products` removes the partial dependency on `product_id`. Every split is on a determinant that is the key of the new table, so the join is lossless.

</details>

### P4. Spot the spurious rows

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** lossy decomposition

A developer split an order table into `(order_id, customer_name)` and `(customer_name, product_id, qty)`. Joining them back finds rows that were never in the original:

**Schema and data:**

```sql
CREATE TABLE order_report (order_id int, customer_name text, product_id int, qty int);
INSERT INTO order_report VALUES (1, 'Anil', 100, 1), (1, 'Anil', 101, 2), (2, 'Bhavna', 101, 1), (3, 'Anil', 102, 1);
CREATE TABLE part_a AS SELECT DISTINCT order_id, customer_name FROM order_report;
CREATE TABLE part_b AS SELECT DISTINCT customer_name, product_id, qty FROM order_report;
```

```sql
SELECT a.order_id, b.product_id, b.qty
FROM part_a a JOIN part_b b ON b.customer_name = a.customer_name
EXCEPT
SELECT order_id, product_id, qty FROM order_report
ORDER BY 1, 2;
```

**Output:**

```text
 order_id | product_id | qty
----------+------------+-----
        1 |        102 |   1
        3 |        100 |   1
        3 |        101 |   2
(3 rows)
```

Why do these rows appear?

<details>
<summary>Answer</summary>

The common attribute `customer_name` is not a key of either piece: Anil has several orders, so every Anil order joins with every Anil product line. The decomposition is lossy. Split on determinants instead (`order_id` → order header; `(order_id, product_id)` → line).

</details>
