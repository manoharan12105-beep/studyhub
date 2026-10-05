# Keys — Practice

### P1. Identify the candidate keys

**Difficulty:** Easy · **Type:** Conceptual

`books(isbn, title, author, edition, internal_id)`. Rules: each book has a unique ISBN and a unique `internal_id`; the same title and author can exist in different editions; `(title, author, edition)` is unique. List the candidate keys, pick a primary key and name the alternate keys.

<details>
<summary>Answer</summary>

Candidate keys: `{isbn}`, `{internal_id}`, `{title, author, edition}`. A good primary key: `internal_id` (small, stable, surrogate). Alternate keys: `isbn` and `(title, author, edition)` — enforce both with `UNIQUE`.

</details>

### P2. Super key count

**Difficulty:** Medium · **Type:** Conceptual

R(A, B, C, D) has exactly one candidate key, {A, B}. How many super keys does R have? List them.

<details>
<summary>Hint</summary>

Any super key = the candidate key plus any subset of the remaining attributes.

</details>

<details>
<summary>Answer</summary>

2⁴⁻² = **4**: {A, B}, {A, B, C}, {A, B, D}, {A, B, C, D}.

</details>

### P3. Find repeated values

**Difficulty:** Easy · **Type:** Query · **Concepts:** candidate key check, GROUP BY, HAVING

Could `customers.city` be a candidate key? Show every non-null city that appears more than once and how often.

**Expected output:**

```text
  city   | customers
---------+-----------
 Chennai |         2
(1 row)
```

<details>
<summary>Hint</summary>

Group by `city`, keep groups whose count is above 1, and exclude `NULL`.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT city, count(*) AS customers
FROM customers
WHERE city IS NOT NULL
GROUP BY city
HAVING count(*) > 1;
```

**Explanation:** Chennai repeats, so `city` cannot identify customers. Even with no repeats, it would not be a key unless the business guaranteed uniqueness.

</details>

### P4. Composite key in action

**Difficulty:** Medium · **Type:** Query · **Concepts:** composite primary key

Using the sample database, try to add the Laptop (product 1) to order 101 a second time with `INSERT INTO order_items VALUES (101, 1, 1, 55000.00);`. What happens and why?

**Expected output:**

```text
ERROR:  duplicate key value violates unique constraint "order_items_pkey"
DETAIL:  Key (order_id, product_id)=(101, 1) already exists.
```

<details>
<summary>Hint</summary>

Look at the primary key of `order_items`.

</details>

<details>
<summary>Solution</summary>

```sql
INSERT INTO order_items VALUES (101, 1, 1, 55000.00);
```

**Explanation:** `order_items` has `PRIMARY KEY (order_id, product_id)`; the pair (101, 1) already exists. To buy two laptops, update `quantity` instead of adding a row — or use an upsert (`ON CONFLICT … DO UPDATE`).

</details>

### P5. Self-referencing foreign key

**Difficulty:** Medium · **Type:** Query · **Concepts:** foreign key, self-reference

The sample `employees.manager_id` references `employees.emp_id`. Try to give Pooja (9) a manager with id 42, which does not exist.

**Expected output:**

```text
ERROR:  insert or update on table "employees" violates foreign key constraint "employees_manager_id_fkey"
DETAIL:  Key (manager_id)=(42) is not present in table "employees".
```

<details>
<summary>Solution</summary>

```sql
UPDATE employees SET manager_id = 42 WHERE emp_id = 9;
```

**Explanation:** A self-referencing foreign key is checked like any other: 42 must exist in `employees.emp_id`. `NULL` would be accepted, meaning "no manager".

</details>

### P6. Design the keys

**Difficulty:** Hard · **Type:** Design

Design keys for a library: `members` (each has a library card number printed on the card and an email), `books` (ISBN; the library owns several copies of a book), `copies` (each physical copy has a barcode), and `loans` (a copy is lent to a member; the same copy is lent many times over the years, but only once at a time). Write the PostgreSQL `CREATE TABLE` statements with primary, alternate and foreign keys.

<details>
<summary>Hint</summary>

A loan cannot use `(copy_id, member_id)` as its key — the same member can borrow the same copy twice in different months.

</details>

<details>
<summary>Solution</summary>

```sql
CREATE TABLE members (
    member_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    card_no   text NOT NULL UNIQUE,
    email     text NOT NULL UNIQUE,
    name      text NOT NULL
);

CREATE TABLE books (
    isbn  text PRIMARY KEY,
    title text NOT NULL
);

CREATE TABLE copies (
    copy_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    barcode text NOT NULL UNIQUE,
    isbn    text NOT NULL REFERENCES books (isbn)
);

CREATE TABLE loans (
    loan_id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    copy_id     bigint NOT NULL REFERENCES copies (copy_id),
    member_id   bigint NOT NULL REFERENCES members (member_id),
    loaned_on   date   NOT NULL,
    returned_on date
);

-- only one open loan per copy at a time
CREATE UNIQUE INDEX one_open_loan_per_copy ON loans (copy_id) WHERE returned_on IS NULL;
```

**Explanation:**

- Surrogate primary keys plus `UNIQUE` natural keys (`card_no`, `email`, `barcode`).
- ISBN is a stable, standard natural key, so it is acceptable as the primary key of `books`.
- `loans` needs its own id because the history repeats pairs; the rule "one open loan per copy" is a **partial unique index** (see [Composite, Partial, Expression and Covering Indexes](../../indexing/advanced-indexes/content.md)).

</details>
