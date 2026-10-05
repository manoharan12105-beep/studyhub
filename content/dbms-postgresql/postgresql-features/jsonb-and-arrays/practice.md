# JSONB and Arrays — Practice

### P1. Pick the operator

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** -> vs ->>

`settings` is `{"theme": "dark", "fontSize": 14}`. Which expression returns the text `dark`?

- A) `settings -> 'theme'`
- B) `settings ->> 'theme'`
- C) `settings ? 'theme'`
- D) `settings @> '{"theme": "dark"}'`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** A returns the `jsonb` value `"dark"` (with quotes); C and D return booleans.

</details>

### P2. Orders as JSON documents

**Difficulty:** Medium · **Type:** Query · **Concepts:** jsonb_build_object, jsonb_agg

Produce one JSON document per delivered order of customer 1, shaped `{"order_id": …, "items": [{"product": …, "qty": …}, …]}`, items ordered by product name.

**Expected output:**

```text
                                              doc
-----------------------------------------------------------------------------------------------
 {"items": [{"qty": 1, "product": "Laptop"}, {"qty": 2, "product": "Mouse"}], "order_id": 101}
 {"items": [{"qty": 1, "product": "Chair"}, {"qty": 1, "product": "Desk"}], "order_id": 107}
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT jsonb_build_object(
           'order_id', o.order_id,
           'items', jsonb_agg(jsonb_build_object('product', p.name, 'qty', oi.quantity)
                              ORDER BY p.name)
       ) AS doc
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p     ON p.product_id = oi.product_id
WHERE o.customer_id = 1 AND o.status = 'DELIVERED'
GROUP BY o.order_id
ORDER BY o.order_id;
```

**Explanation:** The keys appear in `jsonb` storage order (`items` before `order_id`, `qty` before `product`), not in the order written. JSON objects are unordered, so this is equivalent; if a consumer insists on the written order, build with `json_build_object`/`json_agg`, which keep it.

</details>

### P3. Query an event payload

**Difficulty:** Medium · **Type:** Query · **Concepts:** containment, ->>, casting

**Schema and data:**

```sql
CREATE TABLE events (id int, payload jsonb);
INSERT INTO events VALUES
    (1, '{"type": "payment", "amount": "1500.00", "currency": "INR"}'),
    (2, '{"type": "login", "user": "anil"}'),
    (3, '{"type": "payment", "amount": "250.50", "currency": "INR"}'),
    (4, '{"type": "payment", "amount": "99.99", "currency": "USD"}');
```

Return the total INR payment amount.

**Expected output:**

```text
 inr_total
-----------
   1750.50
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT sum((payload ->> 'amount')::numeric) AS inr_total
FROM events
WHERE payload @> '{"type": "payment", "currency": "INR"}';
```

**Explanation:** The amounts are JSON strings, so `->>` and a cast to `numeric` are required; `@>` filters by two keys at once and can use a GIN index.

</details>

### P4. Users with all required roles

**Difficulty:** Medium · **Type:** Query · **Concepts:** array containment

**Schema and data:**

```sql
CREATE TABLE app_users (name text, roles text[]);
INSERT INTO app_users VALUES
    ('anil', '{viewer,editor}'), ('bhavna', '{viewer,editor,admin}'),
    ('chirag', '{viewer}'),      ('deepa', '{admin}');
```

List users who have both `editor` and `admin`, and separately count users having at least one of them.

**Expected output:**

```text
 has_both | has_any
----------+---------
 bhavna   |       3
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT (SELECT string_agg(name, ', ' ORDER BY name)
        FROM app_users WHERE roles @> ARRAY['editor', 'admin']) AS has_both,
       (SELECT count(*)
        FROM app_users WHERE roles && ARRAY['editor', 'admin'])  AS has_any;
```

</details>

### P5. Why does this filter fail?

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** jsonb vs text comparison

**Schema and data:**

```sql
CREATE TABLE devices (id int, specs jsonb);
INSERT INTO devices VALUES (1, '{"brand": "Acme", "ram": 8}'), (2, '{"brand": "Zeta", "ram": 16}');
```

```sql
SELECT id FROM devices WHERE specs -> 'brand' = 'Acme';
```

**Output:**

```text
ERROR:  invalid input syntax for type json
LINE 1: SELECT id FROM devices WHERE specs -> 'brand' = 'Acme';
                                                        ^
DETAIL:  Token "Acme" is invalid.
CONTEXT:  JSON data, line 1: Acme
```

Explain the error and give two correct filters.

<details>
<summary>Answer</summary>

`specs -> 'brand'` is `jsonb`, so the literal `'Acme'` is parsed as JSON — and `Acme` without quotes is not valid JSON. Compare text with text, or JSON with JSON:

```sql
SELECT id FROM devices WHERE specs ->> 'brand' = 'Acme';
SELECT id FROM devices WHERE specs @> '{"brand": "Acme"}';
```

**Output:**

```text
 id
----
  1
(1 row)

 id
----
  1
(1 row)
```

(`specs -> 'brand' = '"Acme"'` also works: the literal is then a valid JSON string.)

</details>
