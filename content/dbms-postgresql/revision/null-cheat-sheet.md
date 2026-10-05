# NULL Cheat Sheet

`NULL` means "unknown or not applicable". It is not zero, not an empty string, and not equal to anything — not even another `NULL`.

## Three-Valued Logic

| `AND` | true | false | unknown |
|-------|------|-------|---------|
| **true** | true | false | unknown |
| **false** | false | false | false |
| **unknown** | unknown | false | unknown |

| `OR` | true | false | unknown |
|------|------|-------|---------|
| **true** | true | true | true |
| **false** | true | false | unknown |
| **unknown** | true | unknown | unknown |

`NOT unknown` = unknown. `WHERE`, `ON` and `HAVING` keep only rows where the condition is **true**; a `CHECK` constraint, by contrast, passes when its condition is true **or unknown**.

## Behaviour by Feature

| Feature | With `NULL` |
|---------|-------------|
| `=`, `<>`, `<`, `>` | Unknown |
| `IS NULL` / `IS NOT NULL` | True or false |
| `IS [NOT] DISTINCT FROM` | NULL-safe equality |
| Arithmetic, `\|\|` | `NULL` |
| `concat()`, `concat_ws()` | Skip `NULL`s |
| `count(*)` | Counts the row |
| `count(col)`, `sum`, `avg`, `min`, `max` | Ignore `NULL`s; `NULL` if no non-null input (count → 0) |
| `GROUP BY`, `DISTINCT`, `UNION`, `INTERSECT`, `EXCEPT` | `NULL`s treated as equal |
| `ORDER BY` | Last ascending, first descending (`NULLS FIRST/LAST`) |
| `UNIQUE` | Many `NULL`s allowed (unless `NULLS NOT DISTINCT`) |
| Joins | `NULL` keys never match |
| `x IN (…, NULL)` | True if found, else unknown |
| `x NOT IN (…, NULL)` | Never true |
| `CASE WHEN x = NULL` | Never taken — use `WHEN x IS NULL` |

## Proof in One Query

```sql
SELECT NULL = NULL                  AS eq,
       NULL IS NULL                 AS is_null,
       NULL IS NOT DISTINCT FROM NULL AS not_distinct,
       1 + NULL                     AS plus,
       coalesce(NULL, 'default')    AS coalesced,
       (SELECT count(commission) FROM employees) AS counted_commissions,
       (SELECT count(*) FROM employees)          AS counted_rows;
```

**Output:**

```text
  eq  | is_null | not_distinct | plus | coalesced | counted_commissions | counted_rows
------+---------+--------------+------+-----------+---------------------+--------------
 NULL | t       | t            | NULL | default   |                   3 |           12
(1 row)
```

## Functions

- `coalesce(a, b, …)` — first non-null.
- `nullif(a, b)` — `NULL` if equal (avoid division by zero: `x / nullif(y, 0)`).
- `num_nulls(…)`, `num_nonnulls(…)` — count nulls among arguments.

## Design Advice

- Use `NOT NULL` for every required column.
- Do not use magic values (`-1`, `'N/A'`, `1900-01-01`) instead of `NULL`.
- Decide and document what `NULL` means for each nullable column.
- In queries, state how `NULL` is handled (`coalesce`, `IS NULL`, `NOT EXISTS`).
