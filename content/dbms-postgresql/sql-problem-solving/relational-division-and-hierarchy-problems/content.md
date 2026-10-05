# Relational Division and Hierarchy Problems

**Module:** SQL Problem Solving · **Interview priority:** Frequently asked

## What Is It?

Two problem types that need more than a simple join:

- **Relational division** — "find X related to **every** Y": customers who ordered every product, students who took all required courses, candidates with all required skills.
- **Hierarchies** — rows that point to a parent row in the same table: employee → manager, category → parent category, folder → parent folder. Questions ask for levels, paths, all subordinates, the chain of command, or totals per subtree.

Examples use the [sample database](../../sql-fundamentals/dbms-sample-database/content.md). The employee hierarchy there is:

```text
Asha (1)
├── Ravi (2)
│   ├── Meena (3)
│   └── Karan (4)
├── Divya (5)
│   ├── Arjun (6)
│   ├── Sneha (7)
│   └── Rahul (12)
├── Vikram (8)
│   └── Pooja (9)
├── Farhan (10)
└── Nisha (11)
```

## Why It Matters

- "Customers who bought all products" is a well-known interview question; most candidates know only one of the two standard solutions.
- Org charts, category trees, comment threads and bill-of-materials are hierarchies in almost every backend.
- Recursive CTEs, `NOT EXISTS` and `HAVING count(DISTINCT …)` are tested together.

## Core Concept

### Relational division: two standard forms

**1. Counting** — X qualifies if the number of distinct required Ys it has equals the number of required Ys:

```sql
-- Illustrative
SELECT x FROM xy
WHERE y IN (SELECT y FROM required)
GROUP BY x
HAVING count(DISTINCT y) = (SELECT count(*) FROM required);
```

**2. Double negation** — X qualifies if there is **no** required Y that X does **not** have:

```sql
-- Illustrative
SELECT x FROM xs
WHERE NOT EXISTS (
    SELECT 1 FROM required r
    WHERE NOT EXISTS (SELECT 1 FROM xy WHERE xy.x = xs.x AND xy.y = r.y)
);
```

| | Counting | Double `NOT EXISTS` |
|---|---|---|
| Readability | Easier for most people | Mirrors the logic "for all" = "not exists … not" |
| Duplicates in `xy` | Needs `count(DISTINCT …)` | Unaffected |
| Empty required set | Returns no one (no groups with matching rows) | Returns **every** X (vacuously true) |
| "Exactly these, nothing more" | Drop the `IN` filter and also compare total distinct count | Add a second `NOT EXISTS` for extras |

### Hierarchies with recursive CTEs

A **recursive CTE** has an anchor (the starting rows) and a recursive part that joins the previous level to the table, repeated until no new rows appear (see [Recursive CTEs](../../ctes/recursive-ctes/content.md)).

| Question | Anchor | Recursive join |
|----------|--------|----------------|
| Whole tree with levels | Root(s): `parent IS NULL` | `child.parent = tree.id` |
| All subordinates of X | `id = X` | `child.parent = tree.id` |
| Chain of command above X | `id = X` | `parent.id = tree.parent` |
| Subtree totals | Every node as its own root | Descend, then `GROUP BY` root |

- Carry a **path** (`ARRAY[id]`, or text joined with `' > '`) to show the route and to order output as a tree.
- Guard against **cycles** with `CYCLE id SET is_cycle USING path` (PostgreSQL 14+) or a manual `NOT id = ANY(path)` check.

### Other hierarchy models (awareness)

| Model | Idea | Trade-off |
|-------|------|-----------|
| Adjacency list (`parent_id`) | Each row stores its parent | Simple writes; reads need recursion |
| Materialised path (`ltree` extension, `'1.2.3'`) | Each row stores its path | Fast subtree queries; moving a subtree rewrites paths |
| Closure table | A row for every ancestor–descendant pair | Fast reads of any depth; more storage and write work |
| Nested sets | Left/right numbers | Fast subtree reads; expensive inserts |

## Syntax

```sql
-- Illustrative
WITH RECURSIVE tree AS (
    SELECT id, parent_id, name, 1 AS level, ARRAY[id] AS path
    FROM nodes WHERE parent_id IS NULL
    UNION ALL
    SELECT n.id, n.parent_id, n.name, t.level + 1, t.path || n.id
    FROM nodes n JOIN tree t ON n.parent_id = t.id
)
SELECT * FROM tree ORDER BY path;
```

## Examples

### E1. Customers who ordered every Furniture product (counting)

```sql
SELECT o.customer_id, c.name
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p     ON p.product_id = oi.product_id
JOIN customers c    ON c.customer_id = o.customer_id
WHERE p.category = 'Furniture'
GROUP BY o.customer_id, c.name
HAVING count(DISTINCT p.product_id) = (SELECT count(*) FROM products WHERE category = 'Furniture')
ORDER BY o.customer_id;
```

**Output:**

```text
 customer_id |  name
-------------+--------
           1 | Anil
           2 | Bhavna
(2 rows)
```

Furniture is the Desk and the Chair. Deepa bought only a Chair. `DISTINCT` matters: a customer who bought the Chair in two different orders, but never the Desk, would otherwise reach a count of 2 and qualify.

### E2. The same with double NOT EXISTS

```sql
SELECT c.customer_id, c.name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM products p
    WHERE p.category = 'Furniture'
      AND NOT EXISTS (
          SELECT 1
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.order_id
          WHERE o.customer_id = c.customer_id
            AND oi.product_id = p.product_id
      )
)
ORDER BY c.customer_id;
```

**Output:**

```text
 customer_id |  name
-------------+--------
           1 | Anil
           2 | Bhavna
(2 rows)
```

Read it as: "customers for whom there is no Furniture product they have not ordered".

### E3. Customers who ordered every product

```sql
SELECT o.customer_id
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY o.customer_id
HAVING count(DISTINCT oi.product_id) = (SELECT count(*) FROM products);
```

**Output:**

```text
 customer_id
-------------
(0 rows)
```

Nobody qualifies: the Notebook was never ordered. Anil comes closest:

```sql
SELECT o.customer_id,
       count(DISTINCT oi.product_id) AS products_bought,
       (SELECT count(*) FROM products) AS products_total
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY o.customer_id
ORDER BY products_bought DESC, o.customer_id;
```

**Output:**

```text
 customer_id | products_bought | products_total
-------------+-----------------+----------------
           1 |               5 |              6
           2 |               4 |              6
           4 |               2 |              6
           3 |               1 |              6
           5 |               1 |              6
(5 rows)
```

### E4. The empty divisor

When the required set is empty, the two forms disagree:

```sql
SELECT 'counting' AS method, count(*) AS customers
FROM (SELECT o.customer_id
      FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
      JOIN products p ON p.product_id = oi.product_id
      WHERE p.category = 'Toys'
      GROUP BY o.customer_id
      HAVING count(DISTINCT p.product_id) = (SELECT count(*) FROM products WHERE category = 'Toys')) t
UNION ALL
SELECT 'not exists', count(*)
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM products p
    WHERE p.category = 'Toys'
      AND NOT EXISTS (SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
                      WHERE o.customer_id = c.customer_id AND oi.product_id = p.product_id));
```

**Output:**

```text
   method   | customers
------------+-----------
 counting   |         0
 not exists |         6
(2 rows)
```

"Bought every Toy" is vacuously true when there are no Toys, so the logical answer is every customer; the counting form returns no one. Decide which behaviour the requirement needs.

### E5. Employee hierarchy with levels and paths

```sql
WITH RECURSIVE org AS (
    SELECT emp_id, name, manager_id, 1 AS level, name::text AS path, ARRAY[emp_id] AS sort_path
    FROM employees
    WHERE manager_id IS NULL
    UNION ALL
    SELECT e.emp_id, e.name, e.manager_id, o.level + 1,
           o.path || ' > ' || e.name, o.sort_path || e.emp_id
    FROM employees e
    JOIN org o ON e.manager_id = o.emp_id
)
SELECT repeat('    ', level - 1) || name AS employee, level, path
FROM org
ORDER BY sort_path;
```

**Output:**

```text
   employee    | level |         path
---------------+-------+-----------------------
 Asha          |     1 | Asha
     Ravi      |     2 | Asha > Ravi
         Meena |     3 | Asha > Ravi > Meena
         Karan |     3 | Asha > Ravi > Karan
     Divya     |     2 | Asha > Divya
         Arjun |     3 | Asha > Divya > Arjun
         Sneha |     3 | Asha > Divya > Sneha
         Rahul |     3 | Asha > Divya > Rahul
     Vikram    |     2 | Asha > Vikram
         Pooja |     3 | Asha > Vikram > Pooja
     Farhan    |     2 | Asha > Farhan
     Nisha     |     2 | Asha > Nisha
(12 rows)
```

Ordering by the id array lists each manager directly above their team.

### E6. All subordinates of a manager (any depth)

```sql
WITH RECURSIVE reports AS (
    SELECT emp_id, name, 0 AS depth
    FROM employees WHERE emp_id = 2
    UNION ALL
    SELECT e.emp_id, e.name, r.depth + 1
    FROM employees e JOIN reports r ON e.manager_id = r.emp_id
)
SELECT emp_id, name, depth FROM reports WHERE depth > 0 ORDER BY emp_id;
```

**Output:**

```text
 emp_id | name  | depth
--------+-------+-------
      3 | Meena |     1
      4 | Karan |     1
(2 rows)
```

### E7. Chain of command upwards

```sql
WITH RECURSIVE chain AS (
    SELECT emp_id, name, manager_id, 0 AS steps
    FROM employees WHERE emp_id = 9
    UNION ALL
    SELECT m.emp_id, m.name, m.manager_id, c.steps + 1
    FROM employees m JOIN chain c ON m.emp_id = c.manager_id
)
SELECT steps, name FROM chain ORDER BY steps;
```

**Output:**

```text
 steps |  name
-------+--------
     0 | Pooja
     1 | Vikram
     2 | Asha
(3 rows)
```

The recursive join is reversed: it follows `manager_id` up instead of down, and stops at Asha because her `manager_id` is `NULL`.

### E8. Team size and payroll under every manager

```sql
WITH RECURSIVE sub AS (
    SELECT emp_id AS manager, emp_id, salary FROM employees
    UNION ALL
    SELECT s.manager, e.emp_id, e.salary
    FROM employees e JOIN sub s ON e.manager_id = s.emp_id
)
SELECT m.name AS manager,
       count(*) - 1 AS team_size,
       sum(s.salary) AS payroll_incl_manager
FROM sub s
JOIN employees m ON m.emp_id = s.manager
GROUP BY m.emp_id, m.name
HAVING count(*) > 1
ORDER BY team_size DESC, manager;
```

**Output:**

```text
 manager | team_size | payroll_incl_manager
---------+-----------+----------------------
 Asha    |        11 |               924000
 Divya   |         3 |               263000
 Ravi    |         2 |               262000
 Vikram  |         1 |               122000
(4 rows)
```

The anchor starts one walk from **every** employee; each walk collects that employee's whole subtree, tagged with the starting `manager`. It visits each ancestor–descendant pair once, which is fine for an org chart but grows with depth on very large trees (consider a closure table there).

### E9. Category hierarchy

```sql
CREATE TABLE categories (
    category_id int PRIMARY KEY,
    name        text NOT NULL,
    parent_id   int REFERENCES categories (category_id)
);
INSERT INTO categories VALUES
    (1, 'All', NULL),
    (2, 'Electronics', 1), (3, 'Computers', 2), (4, 'Laptops', 3), (5, 'Accessories', 2),
    (6, 'Furniture', 1), (7, 'Office Chairs', 6);

CREATE TABLE catalog (item text, category_id int REFERENCES categories (category_id));
INSERT INTO catalog VALUES
    ('Laptop A', 4), ('Laptop B', 4), ('Desktop', 3), ('Mouse', 5),
    ('Keyboard', 5), ('Webcam', 5), ('Chair X', 7), ('Bookshelf', 6);

WITH RECURSIVE subtree AS (
    SELECT category_id AS root, category_id FROM categories
    UNION ALL
    SELECT s.root, c.category_id
    FROM categories c JOIN subtree s ON c.parent_id = s.category_id
)
SELECT r.name AS category, count(ca.item) AS items_including_subcategories
FROM subtree s
JOIN categories r ON r.category_id = s.root
LEFT JOIN catalog ca ON ca.category_id = s.category_id
GROUP BY r.category_id, r.name
ORDER BY r.category_id;
```

**Output:**

```text
   category    | items_including_subcategories
---------------+-------------------------------
 All           |                             8
 Electronics   |                             6
 Computers     |                             3
 Laptops       |                             2
 Accessories   |                             3
 Furniture     |                             2
 Office Chairs |                             1
(7 rows)
```

"Electronics" counts items in Electronics, Computers, Laptops and Accessories. This is how a shop shows "(6)" next to a category that has no products of its own.

### E10. Detecting a cycle

```sql
CREATE TABLE tasks (id int PRIMARY KEY, depends_on int);
INSERT INTO tasks VALUES (1, 2), (2, 3), (3, 1), (4, NULL);

WITH RECURSIVE walk AS (
    SELECT id, depends_on FROM tasks WHERE id = 1
    UNION ALL
    SELECT t.id, t.depends_on FROM tasks t JOIN walk w ON t.id = w.depends_on
) CYCLE id SET is_cycle USING path
SELECT id, depends_on, is_cycle, path FROM walk;
```

**Output:**

```text
 id | depends_on | is_cycle |       path
----+------------+----------+-------------------
  1 |          2 | f        | {(1)}
  2 |          3 | f        | {(1),(2)}
  3 |          1 | f        | {(1),(2),(3)}
  1 |          2 | t        | {(1),(2),(3),(1)}
(4 rows)
```

Without the `CYCLE` clause this query would loop forever (1 → 2 → 3 → 1 …). `CYCLE` stops when an id repeats and marks that row. Bad data such as an employee who is their own indirect manager is caught the same way.

## Comparison

| Problem | Pattern |
|---------|---------|
| X related to all Y | `GROUP BY x HAVING count(DISTINCT y) = (SELECT count(*) …)` |
| Same, NULL/duplicate-safe, logic-first | Double `NOT EXISTS` |
| X related to exactly the set Y | Counting on all of X's Ys, plus equality with the required count |
| Tree with levels/paths | Recursive CTE from roots, carry `level` and `path` |
| Descendants of a node | Recursive CTE from the node, join children |
| Ancestors of a node | Recursive CTE from the node, join parent |
| Totals per subtree | Start a walk at every node, `GROUP BY` the start |
| Cycles | `CYCLE … SET … USING …` or path check |

## Common Mistakes

- `count(product_id)` instead of `count(DISTINCT product_id)` in division — repeat purchases inflate the count.
- Forgetting to restrict the counted rows to the required set (`WHERE category = 'Furniture'`), so other products are counted too.
- Ignoring the empty-divisor case.
- Joining the recursive part in the wrong direction (getting managers instead of reports).
- `UNION` instead of `UNION ALL` in recursion, hiding duplicates and costing a sort/hash at every level (sometimes intended for cycle protection — be explicit).
- No cycle protection on user-maintained hierarchies.
- Ordering a tree by `level` instead of by `path`, which separates children from their parents.

## Revision

- Division ("for all"): `HAVING count(DISTINCT y) = (SELECT count(*) FROM required)` or `NOT EXISTS (required y NOT EXISTS (x has y))`; empty divisor differs.
- Hierarchy: recursive CTE = anchor + `UNION ALL` + recursive join; downward `child.parent = cte.id`, upward `parent.id = cte.parent`.
- Carry `level` and `path` (array) to indent and order as a tree.
- Subtree aggregates: walk from every node, group by the start node.
- Cycles: `CYCLE id SET is_cycle USING path` (PostgreSQL 14+).

## Quick Revision

"Every" means relational division: count distinct matches against the required total, or use double `NOT EXISTS`. Trees mean a recursive CTE: anchor rows, then repeatedly join children (or parents), carrying level and path, with a `CYCLE` guard.
