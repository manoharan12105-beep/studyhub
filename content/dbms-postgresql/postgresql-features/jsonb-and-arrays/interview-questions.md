# JSONB and Arrays — Interview Questions

## Beginner

### Q1. What is the difference between JSON and JSONB in PostgreSQL?

<details>
<summary>Answer</summary>

`json` stores the input text exactly (whitespace, key order, duplicate keys) and re-parses it on every access. `jsonb` stores a decomposed binary form: keys are deduplicated (last wins) and reordered, insertion is slightly slower, but reading is faster and it supports containment (`@>`), key-exists operators and GIN indexes. Use `jsonb` unless you must preserve the exact original text.

</details>

### Q2. What is the difference between `->` and `->>`?

<details>
<summary>Answer</summary>

`->` returns the field (or array element) as `jsonb`, so it can be chained (`attrs -> 'dims' -> 'w'`). `->>` returns it as `text`, for comparisons and output. Because `->>` gives text, numbers must be cast before numeric comparison: `(attrs ->> 'qty')::int > 5`.

</details>

### Q3. How do you check whether an array column contains a value?

<details>
<summary>Answer</summary>

`'wireless' = ANY (tags)` for one value, or `tags @> ARRAY['wireless']` (contains all listed values), `tags && ARRAY['a','b']` (shares any value). `@>` and `&&` can use a GIN index on the array column.

</details>

## Intermediate

### Q4. How do you index a JSONB column?

<details>
<summary>Answer</summary>

A GIN index for containment and existence queries: `CREATE INDEX ON t USING gin (attrs)` (supports `@>`, `?`, `?|`, `?&`, path operators) or `USING gin (attrs jsonb_path_ops)` (smaller, faster, supports `@>` and path operators only). For equality or ranges on one specific key, a B-tree expression index: `CREATE INDEX ON t ((attrs ->> 'brand'))` — queries must use the same expression.

</details>

### Q5. When should you use JSONB instead of regular columns?

<details>
<summary>Answer</summary>

For attributes that vary from row to row, are optional or sparse, or are stored as received from external systems — product specifications, user preferences, webhook payloads. Keep data in regular columns when it is filtered, joined, aggregated, needs constraints or foreign keys, or is updated frequently: columns give types, constraints, statistics and cheap updates, while a JSON value is rewritten as a whole on every change.

</details>

### Q6. How would you update one key inside a JSONB document?

<details>
<summary>Answer</summary>

`UPDATE t SET attrs = jsonb_set(attrs, '{ram_gb}', '32') WHERE id = 1;` or merge with `attrs || '{"ram_gb": 32}'`, or (PostgreSQL 14+) subscript assignment `SET attrs['ram_gb'] = '32'`. Remove a key with `attrs - 'key'`. Internally the whole value is rewritten in a new row version.

</details>

## Advanced

### Q7. Why is storing a list of foreign ids in an array usually a bad design?

<details>
<summary>Answer</summary>

Array elements cannot have foreign keys, so deleted parents leave dangling ids; the value is not atomic (violates 1NF); you cannot store attributes per link (when it was added, a role); updating one element rewrites the array; and "which rows reference X" queries need GIN indexes and `@>` rather than ordinary joins. A junction table with two foreign keys and a composite primary key is the normalized design.

</details>

### Q8. How do you turn a JSON array of objects into rows?

<details>
<summary>Answer</summary>

`jsonb_array_elements(doc)` returns one `jsonb` per element (then extract fields with `->>`), `jsonb_to_recordset(doc) AS x(sku text, qty int)` maps fields to typed columns, and PostgreSQL 17+ provides the SQL-standard `JSON_TABLE(doc, '$[*]' COLUMNS (sku text PATH '$.sku', qty int PATH '$.qty'))`. Use `CROSS JOIN LATERAL` to apply them per row of a table.

</details>

### Q9. Why does `WHERE attrs ->> 'dpi' > '1600'` return wrong rows?

<details>
<summary>Answer</summary>

`->>` returns text, and text comparison is character by character: `'800' > '1600'` is TRUE because `'8' > '1'`. Cast first: `(attrs ->> 'dpi')::int > 1600`, or use a JSON path predicate `attrs @@ '$.dpi > 1600'`, which compares JSON numbers numerically.

</details>
