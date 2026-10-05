# Mapping Relationships to Tables — Practice

### P1. Where does the foreign key go?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** 1:N mapping

"An author writes many blog posts; each post has exactly one author." Where should the foreign key be?

- A) `authors.post_id`
- B) `posts.author_id NOT NULL`
- C) `posts.author_id` (nullable)
- D) A junction table `author_posts`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** 1:N → foreign key on the many side (posts). "Exactly one author" = total participation → `NOT NULL`. A junction table (D) is for M:N.

</details>

### P2. Tags for products

**Difficulty:** Medium · **Type:** Query · **Concepts:** junction table, aggregation

Create `tags (tag_id, name)` and a junction table `product_tags` for the sample `products`. Tag Laptop as `portable` and `premium`, Mouse as `portable`, Desk as `premium`. Then list each tag with its products (alphabetical, comma-separated).

**Expected output:**

```text
   tag    |   products
----------+---------------
 portable | Laptop, Mouse
 premium  | Desk, Laptop
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE TABLE tags (tag_id int PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE product_tags (
    product_id int NOT NULL REFERENCES products ON DELETE CASCADE,
    tag_id     int NOT NULL REFERENCES tags ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);
CREATE INDEX product_tags_tag_idx ON product_tags (tag_id);

INSERT INTO tags VALUES (1, 'portable'), (2, 'premium');
INSERT INTO product_tags VALUES (1, 1), (1, 2), (2, 1), (4, 2);

SELECT t.name AS tag, string_agg(p.name, ', ' ORDER BY p.name) AS products
FROM tags t
JOIN product_tags pt ON pt.tag_id = t.tag_id
JOIN products p      ON p.product_id = pt.product_id
GROUP BY t.tag_id
ORDER BY t.name;
```

</details>

### P3. Fix the design

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** comma-separated lists, 1NF

A table stores course prerequisites as text:

**Schema and data:**

```sql
CREATE TABLE courses_v1 (course_id text PRIMARY KEY, title text, prerequisites text);
INSERT INTO courses_v1 VALUES
    ('DB101', 'Databases', NULL),
    ('DB201', 'Advanced Databases', 'DB101'),
    ('DS301', 'Data Science', 'DB101,ST101');
```

A query to find courses that require `DB101` returns too little:

```sql
SELECT course_id FROM courses_v1 WHERE prerequisites = 'DB101';
```

**Output:**

```text
 course_id
-----------
 DB201
(1 row)
```

Redesign the prerequisites and write the query again.

<details>
<summary>Answer</summary>

The list in one column breaks first normal form: equality cannot see `DB101` inside `'DB101,ST101'`, `LIKE '%DB101%'` would also match `DB1010`, and nothing checks that `ST101` exists. Model it as a self-referencing M:N:

```sql
CREATE TABLE course_prereqs (
    course_id text NOT NULL REFERENCES courses_v1,
    prereq_id text NOT NULL REFERENCES courses_v1,
    PRIMARY KEY (course_id, prereq_id),
    CHECK (course_id <> prereq_id)
);
INSERT INTO courses_v1 VALUES ('ST101', 'Statistics', NULL);
INSERT INTO course_prereqs VALUES ('DB201', 'DB101'), ('DS301', 'DB101'), ('DS301', 'ST101');

SELECT course_id FROM course_prereqs WHERE prereq_id = 'DB101' ORDER BY course_id;
```

**Output:**

```text
 course_id
-----------
 DB201
 DS301
(2 rows)
```

(Afterwards the `prerequisites` text column would be dropped.)

</details>

### P4. One-to-one, optional

**Difficulty:** Hard · **Type:** Design · **Concepts:** 1:1, UNIQUE, participation

Each employee may be assigned at most one parking spot, and each spot to at most one employee. Spots exist without employees. Design the tables so that both "at most one" rules are enforced, and show that assigning a second spot to Asha fails.

**Expected output:**

```text
ERROR:  duplicate key value violates unique constraint "parking_spots_emp_id_key"
DETAIL:  Key (emp_id)=(1) already exists.
```

<details>
<summary>Hint</summary>

Put a nullable foreign key on the spot (spots exist without employees) and make it `UNIQUE` so one employee cannot hold two spots. `UNIQUE` allows many `NULL`s.

</details>

<details>
<summary>Solution</summary>

```sql
CREATE TABLE parking_spots (
    spot_code text PRIMARY KEY,
    emp_id    int UNIQUE REFERENCES employees (emp_id) ON DELETE SET NULL
);
INSERT INTO parking_spots VALUES ('P1', 1), ('P2', NULL), ('P3', NULL);
UPDATE parking_spots SET emp_id = 1 WHERE spot_code = 'P2';
```

**Explanation:** Each spot holds at most one employee (one column); the `UNIQUE` constraint stops an employee holding two spots; `NULL`s are allowed for free spots (and are not considered duplicates). `ON DELETE SET NULL` frees the spot when the employee leaves.

</details>
