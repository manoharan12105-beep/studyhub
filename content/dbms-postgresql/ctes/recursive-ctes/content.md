# Recursive CTEs

**Module:** CTEs · **Interview priority:** Frequently asked

## What Is It?

A **recursive CTE** is a CTE that refers to itself. It starts from some rows and repeatedly adds rows derived from the ones found in the previous step, until no new rows appear. It is SQL's tool for **hierarchies and graphs** — org charts, category trees, bills of materials, routes — and for generating sequences.

```sql
-- Illustrative: everyone below Asha in the org chart
WITH RECURSIVE reports AS (
    SELECT emp_id, name, 1 AS level          -- anchor: the starting rows
    FROM employees
    WHERE manager_id = 1
  UNION ALL
    SELECT e.emp_id, e.name, r.level + 1     -- recursive part: one level further
    FROM employees e
    JOIN reports r ON e.manager_id = r.emp_id
)
SELECT * FROM reports;
```

## Why It Matters

- "Find all subordinates of a manager", "show the reporting chain", "print the hierarchy with levels" are classic interview questions, and a self join only reaches a fixed number of levels.
- Understanding how the iteration really works explains termination, infinite loops and the `UNION` vs `UNION ALL` choice.

## Core Concept

### Parts of a recursive CTE

```text
WITH RECURSIVE name (columns) AS (
    anchor query            ← non-recursive term: runs once
  UNION [ALL]
    recursive query         ← references name exactly once
)
main query
```

- `RECURSIVE` is required in PostgreSQL as soon as any CTE in the `WITH` list refers to itself.
- The anchor and recursive parts must produce the same number of columns with compatible types. The anchor determines the column types — cast in the anchor if the recursive part produces wider values (e.g. growing text paths, `::text`).

### How PostgreSQL evaluates it

Despite the name, it is **iteration**, not recursion:

1. Run the anchor. Its rows go to the result and to a **working table**.
2. Run the recursive part, with the self-reference reading **only the working table** (the rows found in the previous step).
3. The new rows go to the result and become the next working table. With `UNION` (not `ALL`), rows already in the result are discarded first.
4. Repeat from step 2 until the working table is empty.

Dry run for the org chart (`manager_id` links):

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

iteration   working table (input)        new rows (output)
anchor      —                            Asha
1           Asha                         Ravi, Divya, Vikram, Farhan, Nisha
2           Ravi, Divya, Vikram, …       Meena, Karan, Arjun, Sneha, Rahul, Pooja
3           Meena, Karan, …, Pooja       (none)  → stop
```

### Termination and cycles

The recursion stops only when an iteration produces no rows. In a tree it always does. In data with a **cycle** (A → B → A) `UNION ALL` loops forever. Defences:

| Defence | How | Limit |
|---------|-----|-------|
| `UNION` instead of `UNION ALL` | Discards rows already produced | Works only if the rows repeat exactly; a growing `level` or `path` column makes every row new |
| Depth limit | `WHERE r.level < 20` in the recursive part | Stops cycles but may truncate a deep legitimate hierarchy |
| Path check | Carry an array of visited ids; `WHERE NOT e.id = ANY (r.path)` | Manual; works everywhere |
| `CYCLE` clause (PostgreSQL 14+, SQL standard) | `CYCLE id SET is_cycle USING path` | Marks the row that closes a cycle and stops following it |

### Ordering the result: SEARCH (PostgreSQL 14+)

The result of a recursive CTE has no defined order. To print a tree:

- `SEARCH DEPTH FIRST BY col SET ordercol` — each node followed by its whole subtree (indented outline).
- `SEARCH BREADTH FIRST BY col SET ordercol` — level by level.
- Then `ORDER BY ordercol` in the main query.

The portable alternative for depth-first order is to build a path (array or string) and sort by it.

### Restrictions

The recursive reference must appear exactly once in the recursive part, and not inside an aggregate, a window function, `DISTINCT`, `GROUP BY`, `ORDER BY`, `LIMIT`, a subquery, or the nullable side of an outer join. PostgreSQL rejects such queries.

## Syntax

```sql
-- Illustrative
WITH RECURSIVE t (cols) AS (
    anchor_select
  UNION [ALL]
    recursive_select_referencing_t
)
[SEARCH {DEPTH | BREADTH} FIRST BY col SET order_col]
[CYCLE col SET is_cycle_col USING path_col]
SELECT … FROM t;
```

## Examples

### Whole hierarchy with levels and paths

```sql
WITH RECURSIVE org AS (
    SELECT emp_id, name, manager_id, 0 AS level, name::text AS path
    FROM employees
    WHERE manager_id IS NULL
  UNION ALL
    SELECT e.emp_id, e.name, e.manager_id, o.level + 1, o.path || ' > ' || e.name
    FROM employees e
    JOIN org o ON e.manager_id = o.emp_id
)
SELECT repeat('    ', level) || name AS org_chart, level, path
FROM org
ORDER BY path;
```

**Output:**

```text
   org_chart   | level |         path
---------------+-------+-----------------------
 Asha          |     0 | Asha
     Divya     |     1 | Asha > Divya
         Arjun |     2 | Asha > Divya > Arjun
         Rahul |     2 | Asha > Divya > Rahul
         Sneha |     2 | Asha > Divya > Sneha
     Farhan    |     1 | Asha > Farhan
     Nisha     |     1 | Asha > Nisha
     Ravi      |     1 | Asha > Ravi
         Karan |     2 | Asha > Ravi > Karan
         Meena |     2 | Asha > Ravi > Meena
     Vikram    |     1 | Asha > Vikram
         Pooja |     2 | Asha > Vikram > Pooja
(12 rows)
```

`name::text` in the anchor fixes the column type; ordering by the path gives a depth-first outline (alphabetical among siblings).

### All subordinates of one manager

Everyone who reports to Divya, directly or indirectly:

```sql
WITH RECURSIVE team AS (
    SELECT emp_id, name, 1 AS depth
    FROM employees
    WHERE manager_id = 5
  UNION ALL
    SELECT e.emp_id, e.name, t.depth + 1
    FROM employees e
    JOIN team t ON e.manager_id = t.emp_id
)
SELECT * FROM team ORDER BY depth, emp_id;
```

**Output:**

```text
 emp_id | name  | depth
--------+-------+-------
      6 | Arjun |     1
      7 | Sneha |     1
     12 | Rahul |     1
(3 rows)
```

### Walking up: the reporting chain

From Pooja up to the top:

```sql
WITH RECURSIVE chain AS (
    SELECT emp_id, name, manager_id, 0 AS steps
    FROM employees
    WHERE name = 'Pooja'
  UNION ALL
    SELECT m.emp_id, m.name, m.manager_id, c.steps + 1
    FROM employees m
    JOIN chain c ON m.emp_id = c.manager_id
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

Downward walks join `e.manager_id = t.emp_id`; upward walks join `m.emp_id = c.manager_id`.

### Team size per manager

```sql
WITH RECURSIVE pairs AS (
    SELECT manager_id AS boss, emp_id
    FROM employees
    WHERE manager_id IS NOT NULL
  UNION ALL
    SELECT e.manager_id, p.emp_id
    FROM pairs p
    JOIN employees e ON e.emp_id = p.boss
    WHERE e.manager_id IS NOT NULL
)
SELECT m.name AS manager, count(*) AS total_reports
FROM pairs p
JOIN employees m ON m.emp_id = p.boss
GROUP BY m.emp_id
ORDER BY total_reports DESC, manager;
```

**Output:**

```text
 manager | total_reports
---------+---------------
 Asha    |            11
 Divya   |             3
 Ravi    |             2
 Vikram  |             1
(4 rows)
```

Each employee is paired with every ancestor (direct manager, manager's manager, …); counting pairs per ancestor gives the size of the whole subtree.

### Generating a sequence

```sql
WITH RECURSIVE n (i) AS (
    SELECT 1
  UNION ALL
    SELECT i + 1 FROM n WHERE i < 5
)
SELECT i, i * i AS square FROM n;
```

**Output:**

```text
 i | square
---+--------
 1 |      1
 2 |      4
 3 |      9
 4 |     16
 5 |     25
(5 rows)
```

In PostgreSQL, `generate_series(1, 5)` does this directly; the recursive form is the portable one.

### Filling missing dates

Orders per day for the first week of March 2026, including days without orders:

```sql
WITH RECURSIVE days (d) AS (
    SELECT DATE '2026-03-01'
  UNION ALL
    SELECT d + 1 FROM days WHERE d < DATE '2026-03-07'
)
SELECT days.d AS day, count(o.order_id) AS orders
FROM days
LEFT JOIN orders o ON o.order_date = days.d
GROUP BY days.d
ORDER BY days.d;
```

**Output:**

```text
    day     | orders
------------+--------
 2026-03-01 |      1
 2026-03-02 |      0
 2026-03-03 |      0
 2026-03-04 |      0
 2026-03-05 |      0
 2026-03-06 |      0
 2026-03-07 |      0
(7 rows)
```

`date + integer` gives a date. With `generate_series('2026-03-01'::date, '2026-03-07', interval '1 day')` the values are timestamps and need a cast back to `date`.

### A graph with a cycle

**Schema and data:**

```sql
CREATE TABLE routes (src text, dst text);
INSERT INTO routes VALUES
    ('Chennai', 'Mumbai'), ('Mumbai', 'Delhi'), ('Delhi', 'Chennai'), ('Delhi', 'Pune');
```

Chennai → Mumbai → Delhi → Chennai is a cycle. A plain `UNION ALL` walk would never stop; here a depth limit is used to show how the rows repeat:

```sql
WITH RECURSIVE reach AS (
    SELECT dst AS city, 1 AS hops FROM routes WHERE src = 'Chennai'
  UNION ALL
    SELECT r.dst, x.hops + 1
    FROM reach x JOIN routes r ON r.src = x.city
    WHERE x.hops < 6
)
SELECT hops, city FROM reach ORDER BY hops, city;
```

**Output:**

```text
 hops |  city
------+---------
    1 | Mumbai
    2 | Delhi
    3 | Chennai
    3 | Pune
    4 | Mumbai
    5 | Delhi
    6 | Chennai
    6 | Pune
(8 rows)
```

Since `hops` grows, `UNION` would not help either. The `CYCLE` clause stops each path when it revisits a city:

```sql
WITH RECURSIVE reach AS (
    SELECT src, dst, 1 AS hops FROM routes WHERE src = 'Chennai'
  UNION ALL
    SELECT r.src, r.dst, x.hops + 1
    FROM reach x JOIN routes r ON r.src = x.dst
) CYCLE dst SET is_cycle USING visited
SELECT hops, src, dst, is_cycle, visited
FROM reach
ORDER BY hops, dst;
```

**Output:**

```text
 hops |   src   |   dst   | is_cycle |                visited
------+---------+---------+----------+---------------------------------------
    1 | Chennai | Mumbai  | f        | {(Mumbai)}
    2 | Mumbai  | Delhi   | f        | {(Mumbai),(Delhi)}
    3 | Delhi   | Chennai | f        | {(Mumbai),(Delhi),(Chennai)}
    3 | Delhi   | Pune    | f        | {(Mumbai),(Delhi),(Pune)}
    4 | Chennai | Mumbai  | t        | {(Mumbai),(Delhi),(Chennai),(Mumbai)}
(5 rows)
```

`visited` records the `dst` values along each path. The start city is not a `dst` in the anchor, so reaching Chennai at hop 3 is not yet a cycle; the next step revisits Mumbai, that row is marked `is_cycle = t`, and it is not expanded further. Filter `WHERE NOT is_cycle` for the reachable cities (Chennai included — it is reachable from itself).

### Without CYCLE: an array of visited nodes

The same protection on any PostgreSQL version, using an array:

```sql
WITH RECURSIVE reach AS (
    SELECT dst AS city, ARRAY['Chennai', dst] AS path FROM routes WHERE src = 'Chennai'
  UNION ALL
    SELECT r.dst, x.path || r.dst
    FROM reach x JOIN routes r ON r.src = x.city
    WHERE r.dst <> ALL (x.path)
)
SELECT city, array_to_string(path, ' -> ') AS route FROM reach ORDER BY array_length(path, 1), city;
```

**Output:**

```text
  city  |               route
--------+------------------------------------
 Mumbai | Chennai -> Mumbai
 Delhi  | Chennai -> Mumbai -> Delhi
 Pune   | Chennai -> Mumbai -> Delhi -> Pune
(3 rows)
```

### SEARCH DEPTH FIRST

```sql
WITH RECURSIVE org AS (
    SELECT emp_id, name, 0 AS level FROM employees WHERE manager_id IS NULL
  UNION ALL
    SELECT e.emp_id, e.name, o.level + 1
    FROM employees e JOIN org o ON e.manager_id = o.emp_id
) SEARCH DEPTH FIRST BY emp_id SET ord
SELECT repeat('  ', level) || name AS tree
FROM org
ORDER BY ord;
```

**Output:**

```text
   tree
-----------
 Asha
   Ravi
     Meena
     Karan
   Divya
     Arjun
     Sneha
     Rahul
   Vikram
     Pooja
   Farhan
   Nisha
(12 rows)
```

Siblings follow `emp_id` order this time, because `ord` is built from the `emp_id` values along each path.

## Comparison

### Ways to query a hierarchy

| Approach | Depth | Notes |
|----------|-------|-------|
| Self join | Fixed (one join per level) | Fine for "employee and manager" |
| Recursive CTE | Any | Standard SQL, works on adjacency lists (`parent_id`) |
| Materialized path column (`'1/2/3'`) or `ltree` extension | Any | Fast subtree reads, more work on moves |
| Nested sets / closure table | Any | Fast reads, complex writes |

## Common Mistakes

- Forgetting `RECURSIVE`.
- A recursive part that never stops (cycle in the data, or a generator without a `WHERE` limit).
- Relying on `UNION` to stop cycles while carrying a changing `level` or path column.
- Type mismatch between anchor and recursive part (e.g. a path that grows beyond `varchar(n)`): cast in the anchor.
- Joining in the wrong direction (walking up instead of down).
- Expecting an ordered result without `ORDER BY` (use a path or `SEARCH`).

## Revision

- `WITH RECURSIVE t AS (anchor UNION [ALL] recursive)`: anchor once, then repeat the recursive part on the previous step's rows until none are new.
- Down a tree: `child.parent_id = t.id`; up: `parent.id = t.parent_id`.
- Track `level`/`depth` and a `path` for display and ordering.
- Cycles: `UNION` only if rows repeat exactly; otherwise depth limit, visited array, or `CYCLE … SET … USING` (PostgreSQL 14+).
- `SEARCH DEPTH/BREADTH FIRST BY … SET …` gives a sortable order column.

## Quick Revision

A recursive CTE is an anchor plus a self-referencing part iterated on the previous step's rows until nothing new appears — use it for trees, graphs and series, and guard against cycles with CYCLE, a visited path or a depth limit.
