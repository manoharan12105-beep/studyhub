# JSONB and Arrays

**Module:** PostgreSQL Features · **Interview priority:** Frequently asked

## What Is It?

PostgreSQL can store structured values inside a single column:

- **`jsonb`** — a JSON document stored in a parsed binary form, with operators to read, test, modify and index it. (`json` stores the original text unchanged.)
- **Arrays** — an ordered list of values of one type, e.g. `text[]` or `integer[]`, with operators for containment and overlap.

```sql
-- Illustrative
CREATE TABLE gadgets (
    id    integer PRIMARY KEY,
    attrs jsonb,            -- {"brand": "Acme", "ports": 3, "wireless": true}
    tags  text[]            -- {office,usb}
);
```

## Why It Matters

- Backends receive and emit JSON; `jsonb` lets the database store flexible attributes (product specs, settings, event payloads) without a column per attribute, and still query and index them.
- Interviewers ask `json` vs `jsonb`, the `->` vs `->>` operators, how to index JSON, and when JSON or arrays break normalization.

## Core Concept

### json vs jsonb

| | `json` | `jsonb` |
|---|---|---|
| Storage | Exact input text | Decomposed binary |
| Whitespace, key order | Preserved | Not preserved (keys reordered) |
| Duplicate keys | All kept | Last value wins |
| Processing speed | Re-parsed on every access | Fast access, slightly slower to insert |
| Indexing (GIN), containment `@>` | No | Yes |
| Use | Only to keep the exact original text | Almost always |

### Reading jsonb

| Operator | Returns | Example → result |
|----------|---------|------------------|
| `->  'key'` / `-> n` | `jsonb` (object field / array element, 0-based) | `attrs -> 'brand'` → `"Acme"` |
| `->> 'key'` / `->> n` | `text` | `attrs ->> 'brand'` → `Acme` |
| `#> '{a,b}'` | `jsonb` at a path | `attrs #> '{dims,w}'` |
| `#>> '{a,b}'` | `text` at a path | |
| `attrs['brand']` | `jsonb` (subscript syntax, PostgreSQL 14+) | can also be assigned in `UPDATE` |

- `->>` returns text, so compare numbers after a cast: `(attrs ->> 'ports')::int > 2`.
- A missing key returns `NULL`, not an error.

### Testing jsonb

| Operator | True when |
|----------|-----------|
| `a @> b` | `a` **contains** `b` (all keys/values of `b` are in `a`) — indexable |
| `a ? 'key'` | Top-level key exists |
| `a ?| array['k1','k2']` / `a ?& array[…]` | Any / all keys exist |
| `a @? '$.path ? (@ > 2)'` | SQL/JSON path returns any item |
| `a @@ '$.ports > 2'` | SQL/JSON path predicate is true |

### Modifying and building jsonb

- `a || b` — merge objects (right side wins) or concatenate arrays.
- `a - 'key'` — remove a key; `a #- '{a,b}'` — remove at a path.
- `jsonb_set(a, '{path}', new_value)` — replace or add a value at a path.
- `jsonb_build_object('k', v, …)`, `jsonb_agg(expr)`, `to_jsonb(row)` — build JSON from relational data.
- `jsonb_array_elements(a)`, `jsonb_each(a)`, `jsonb_to_recordset(a)` — turn JSON into rows.
- PostgreSQL 17 adds SQL-standard `JSON_TABLE`, `JSON_VALUE`, `JSON_QUERY` and `JSON_EXISTS`.

### Indexing jsonb

- `CREATE INDEX … USING gin (attrs)` (operator class `jsonb_ops`) supports `@>`, `?`, `?|`, `?&`, `@?`, `@@`.
- `USING gin (attrs jsonb_path_ops)` is smaller and faster for `@>` and path queries, but does not support the key-exists operators.
- A **B-tree expression index** on one extracted value — `CREATE INDEX … ((attrs ->> 'brand'))` — supports equality and range queries on that key.

### Arrays

- Literal forms: `ARRAY['a', 'b']` or `'{a,b}'::text[]`.
- Subscripts are **1-based**; out-of-range subscripts return `NULL`; slices `arr[2:3]`.
- `= ANY (arr)` tests membership; `@>` (contains), `<@` (is contained by), `&&` (overlap) compare arrays and are GIN-indexable.
- `unnest(arr)` turns an array into rows; `array_agg(expr)` collects rows into an array.
- `cardinality(arr)` = number of elements; `array_length(arr, 1)` returns `NULL` for an empty array.

### When to use them — and when not

| Use JSONB / arrays for | Use normal columns / tables for |
|------------------------|----------------------------------|
| Attributes that vary per row and are rarely filtered or joined | Data you filter, join, aggregate or constrain regularly |
| Storing external payloads as received | Values that need foreign keys (an array cannot reference a table) |
| Small fixed lists (tags, roles) read together with the row | Lists that grow, are updated element by element, or relate to other entities |

Each update rewrites the whole `jsonb` value or array (a new row version), and the planner has few statistics about values inside them. A many-to-many relationship belongs in a junction table, not in an array of ids ([Relationship Mapping](../../database-design/relationship-mapping/content.md)).

## Syntax

```sql
-- Illustrative
col -> 'key'      col ->> 'key'      col #> '{a,b}'      col @> '{"k": "v"}'
col ? 'key'       jsonb_set(col, '{k}', '"v"')            col || '{"k": 1}'
ARRAY[1,2,3]      arr[1]      arr[2:3]      x = ANY (arr)      arr @> ARRAY[2]      arr && ARRAY[5]
```

## Examples

The examples use this table:

```sql
CREATE TABLE gadgets (
    id    integer PRIMARY KEY,
    name  text    NOT NULL,
    attrs jsonb   NOT NULL DEFAULT '{}',
    tags  text[]  NOT NULL DEFAULT '{}'
);
INSERT INTO gadgets VALUES
    (1, 'Laptop',   '{"brand": "Acme", "ram_gb": 16, "ports": ["usb-c", "hdmi"], "dims": {"w": 31, "h": 2}}', '{office,portable}'),
    (2, 'Mouse',    '{"brand": "Zeta", "wireless": true, "dpi": 1600}',                                       '{office,wireless}'),
    (3, 'Keyboard', '{"brand": "Acme", "wireless": false, "layout": "US"}',                                   '{office}'),
    (4, 'Headset',  '{"brand": "Zeta", "wireless": true, "ports": ["usb-c"]}',                                '{audio,wireless}');
```

### -> vs ->>

```sql
SELECT name,
       attrs -> 'brand'               AS brand_jsonb,
       attrs ->> 'brand'              AS brand_text,
       attrs #>> '{dims,w}'           AS width,
       attrs -> 'ports' -> 0          AS first_port,
       pg_typeof(attrs -> 'brand')    AS type_arrow,
       pg_typeof(attrs ->> 'brand')   AS type_double_arrow
FROM gadgets
ORDER BY id;
```

**Output:**

```text
   name   | brand_jsonb | brand_text | width | first_port | type_arrow | type_double_arrow
----------+-------------+------------+-------+------------+------------+-------------------
 Laptop   | "Acme"      | Acme       | 31    | "usb-c"    | jsonb      | text
 Mouse    | "Zeta"      | Zeta       | NULL  | NULL       | jsonb      | text
 Keyboard | "Acme"      | Acme       | NULL  | NULL       | jsonb      | text
 Headset  | "Zeta"      | Zeta       | NULL  | "usb-c"    | jsonb      | text
(4 rows)
```

Missing keys and paths give `NULL`. JSON arrays are indexed from 0.

### Filtering

Containment — wireless Zeta devices:

```sql
SELECT name FROM gadgets
WHERE attrs @> '{"brand": "Zeta", "wireless": true}'
ORDER BY id;
```

**Output:**

```text
  name
---------
 Mouse
 Headset
(2 rows)
```

Key existence and a numeric comparison (note the cast):

```sql
SELECT name, (attrs ->> 'ram_gb')::int AS ram_gb
FROM gadgets
WHERE attrs ? 'ram_gb' AND (attrs ->> 'ram_gb')::int >= 8;
```

**Output:**

```text
  name  | ram_gb
--------+--------
 Laptop |     16
(1 row)
```

SQL/JSON path: devices with a USB-C port:

```sql
SELECT name FROM gadgets
WHERE attrs @? '$.ports[*] ? (@ == "usb-c")'
ORDER BY id;
```

**Output:**

```text
  name
---------
 Laptop
 Headset
(2 rows)
```

### Comparing text from ->> as numbers

```sql
SELECT '{"dpi": "800"}'::jsonb ->> 'dpi' > '1600'           AS text_comparison,
       ('{"dpi": "800"}'::jsonb ->> 'dpi')::int > 1600       AS numeric_comparison;
```

**Output:**

```text
 text_comparison | numeric_comparison
-----------------+--------------------
 t               | f
(1 row)
```

As text, `'800' > '1600'` because `'8' > '1'`.

### Modifying jsonb

```sql
UPDATE gadgets
SET attrs = jsonb_set(attrs, '{ram_gb}', '32') || '{"refurbished": true}'
WHERE id = 1
RETURNING attrs;
```

**Output:**

```text
                                                    attrs
-------------------------------------------------------------------------------------------------------------
 {"dims": {"h": 2, "w": 31}, "brand": "Acme", "ports": ["usb-c", "hdmi"], "ram_gb": 32, "refurbished": true}
(1 row)
```

```sql
UPDATE gadgets
SET attrs = attrs - 'dpi'
WHERE id = 2
RETURNING attrs;
```

**Output:**

```text
                attrs
-------------------------------------
 {"brand": "Zeta", "wireless": true}
(1 row)
```

`jsonb` output shows keys in its own storage order (shorter keys first, then by bytes), not insertion order.

### jsonb normalisation vs json

```sql
SELECT '{"b": 1, "a": 2, "a": 3}'::json  AS as_json,
       '{"b": 1, "a": 2, "a": 3}'::jsonb AS as_jsonb;
```

**Output:**

```text
         as_json          |     as_jsonb
--------------------------+------------------
 {"b": 1, "a": 2, "a": 3} | {"a": 3, "b": 1}
(1 row)
```

### JSON to rows

```sql
SELECT g.name, p.port
FROM gadgets g
CROSS JOIN LATERAL jsonb_array_elements_text(g.attrs -> 'ports') AS p(port)
ORDER BY g.id, p.port;
```

**Output:**

```text
  name   | port
---------+-------
 Laptop  | hdmi
 Laptop  | usb-c
 Headset | usb-c
(3 rows)
```

Gadgets without `ports` produce no rows here (use `LEFT JOIN LATERAL … ON true` to keep them).

### JSON_TABLE (PostgreSQL 17+)

```sql
SELECT jt.*
FROM JSON_TABLE(
    '[{"sku": "A1", "qty": 2}, {"sku": "B7", "qty": 5}]'::jsonb,
    '$[*]' COLUMNS (sku text PATH '$.sku', qty int PATH '$.qty')
) AS jt;
```

**Output:**

```text
 sku | qty
-----+-----
 A1  |   2
 B7  |   5
(2 rows)
```

### Rows to JSON

```sql
SELECT d.dept_name,
       jsonb_agg(jsonb_build_object('name', e.name, 'salary', e.salary) ORDER BY e.salary DESC) AS staff
FROM departments d
JOIN employees e ON e.dept_id = d.dept_id
WHERE d.dept_id IN (30, 40)
GROUP BY d.dept_id
ORDER BY d.dept_id;
```

**Output:**

```text
 dept_name |                                   staff
-----------+---------------------------------------------------------------------------
 HR        | [{"name": "Vikram", "salary": 70000}, {"name": "Pooja", "salary": 52000}]
 Finance   | [{"name": "Farhan", "salary": 82000}]
(2 rows)
```

### Arrays: subscripts, membership, containment

```sql
SELECT name,
       tags,
       tags[1]                       AS first_tag,
       tags[5]                       AS out_of_range,
       cardinality(tags)             AS n,
       'wireless' = ANY (tags)       AS is_wireless,
       tags @> ARRAY['office']       AS has_office,
       tags && ARRAY['audio', 'portable'] AS overlaps
FROM gadgets
ORDER BY id;
```

**Output:**

```text
   name   |       tags        | first_tag | out_of_range | n | is_wireless | has_office | overlaps
----------+-------------------+-----------+--------------+---+-------------+------------+----------
 Laptop   | {office,portable} | office    | NULL         | 2 | f           | t          | t
 Mouse    | {office,wireless} | office    | NULL         | 2 | t           | t          | f
 Keyboard | {office}          | office    | NULL         | 1 | f           | t          | f
 Headset  | {audio,wireless}  | audio     | NULL         | 2 | t           | f          | t
(4 rows)
```

### unnest and array_agg

Tag usage counts:

```sql
SELECT tag, count(*) AS gadgets
FROM gadgets, unnest(tags) AS tag
GROUP BY tag
ORDER BY gadgets DESC, tag;
```

**Output:**

```text
   tag    | gadgets
----------+---------
 office   |       3
 wireless |       2
 audio    |       1
 portable |       1
(4 rows)
```

```sql
SELECT array_agg(name ORDER BY name) AS wireless_gadgets
FROM gadgets
WHERE 'wireless' = ANY (tags);
```

**Output:**

```text
 wireless_gadgets
------------------
 {Headset,Mouse}
(1 row)
```

### GIN index for containment

```sql
CREATE INDEX gadgets_attrs_gin ON gadgets USING gin (attrs jsonb_path_ops);
SET enable_seqscan = off;   -- tiny table: force the index to show the plan shape

EXPLAIN (COSTS OFF)
SELECT name FROM gadgets WHERE attrs @> '{"brand": "Acme"}';
```

**Output:**

```text
                        QUERY PLAN
-----------------------------------------------------------
 Bitmap Heap Scan on gadgets
   Recheck Cond: (attrs @> '{"brand": "Acme"}'::jsonb)
   ->  Bitmap Index Scan on gadgets_attrs_gin
         Index Cond: (attrs @> '{"brand": "Acme"}'::jsonb)
(4 rows)
```

A GIN index is a **bitmap** index type: PostgreSQL collects matching row locations, then visits the table and re-checks the condition.

## Comparison

### JSONB vs separate columns

| | Columns | `jsonb` |
|---|---|---|
| Schema enforced | Types, `NOT NULL`, `CHECK`, `FOREIGN KEY` | Only via `CHECK` on expressions (or none) |
| New attribute | `ALTER TABLE` | Just write it |
| Query/index | Any index, full statistics | GIN / expression indexes, limited statistics |
| Update one value | Writes the row | Rewrites the whole document in the row |
| Best for | Core, frequently queried data | Variable, optional, sparse attributes |

### Array vs junction table

| | `integer[]` of ids | Junction table |
|---|---|---|
| Referential integrity | No foreign keys on elements | Foreign keys on both sides |
| Query "who has X" | `@>` / `ANY`, GIN index | Join with B-tree indexes |
| Extra attributes per link (date, role) | Not possible | Columns on the junction table |
| Normal form | Violates 1NF (non-atomic value) | Normalized |

## Common Mistakes

- Using `json` when `jsonb` is meant.
- Comparing `->>` results as text when they hold numbers or dates.
- Using `->` (jsonb) where text is needed, e.g. `attrs -> 'brand' = 'Acme'` (error: comparing jsonb with an unknown literal that is not valid JSON).
- Putting core relational data (customer id, status, amounts) inside JSON, losing constraints and statistics.
- Forgetting arrays are 1-based but JSON arrays are 0-based.
- Arrays of foreign ids instead of a junction table.
- Expecting a B-tree index on the whole `jsonb` column to help `@>` queries (use GIN).

## Revision

- `jsonb` (binary, indexed, normalised) over `json` (text).
- `->` jsonb, `->>` text, `#>`/`#>>` paths, `@>` containment, `?` key exists, `@?`/`@@` JSON path.
- Modify with `||`, `-`, `jsonb_set`; build with `jsonb_build_object`/`jsonb_agg`; shred with `jsonb_array_elements`, `JSON_TABLE` (17+).
- Index: GIN (`jsonb_ops` or smaller `jsonb_path_ops`), or B-tree on `(attrs ->> 'key')`.
- Arrays: 1-based, `ANY`, `@>`, `&&`, `unnest`, `array_agg`, GIN-indexable; not a replacement for junction tables.

## Quick Revision

Use jsonb, not json: -> returns jsonb, ->> returns text (cast before comparing numbers), @> tests containment and GIN indexes it. Arrays are 1-based and support ANY, @> and &&, but core relational data and many-to-many links still belong in columns and tables.
