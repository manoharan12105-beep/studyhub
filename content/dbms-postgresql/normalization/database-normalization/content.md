# Database Normalization (1NF to BCNF)

**Module:** Normalization · **Interview priority:** Core

## What Is It?

**Normalization** is the process of organising tables so that each fact is stored **once**, in the table whose key it depends on. It works by decomposing tables using [functional dependencies](../functional-dependencies/content.md), guided by a sequence of **normal forms**:

| Normal form | Rule (informal) |
|-------------|-----------------|
| **1NF** | Every column holds a single (atomic) value; no repeating groups |
| **2NF** | 1NF, and no non-key attribute depends on **part** of a candidate key |
| **3NF** | 2NF, and no non-key attribute depends on another **non-key** attribute |
| **BCNF** | Every determinant (left side of a non-trivial FD) is a **superkey** |
| 4NF / 5NF | No independent multi-valued facts in one table / no join dependencies that are not implied by keys |

The classic summary: every non-key attribute must depend on **the key, the whole key, and nothing but the key**.

## Why It Matters

- Redundant data causes **anomalies**: updates that leave copies disagreeing, facts that cannot be recorded until something unrelated exists, and facts lost when an unrelated row is deleted.
- "Explain 1NF, 2NF, 3NF and BCNF with an example" is among the most frequently asked DBMS questions in placements.
- Knowing *why* tables are split also tells you when it is reasonable not to split them ([Denormalization](../denormalization/content.md)).

## Core Concept

### Anomalies in an unnormalized table

`enrollment_flat(student_id, student_name, course_id, course_title, instructor, instructor_office, grade)` with key `(student_id, course_id)`:

| Anomaly | Example |
|---------|---------|
| **Update** | The instructor of DB101 is stored in every DB101 enrollment; changing it in one row leaves others stale |
| **Insertion** | A new course cannot be recorded until a student enrolls (the key needs a `student_id`) |
| **Deletion** | Deleting the last enrollment of a course loses the course's title and instructor |

### First normal form (1NF)

- Each column contains **atomic** values of one domain — no lists (`'DB101, JV201'`), no repeating column groups (`course1`, `course2`, `course3`).
- Each row is unique (has a key).
- Fix: one row per value, moving multi-valued data to rows (or to a separate table).

PostgreSQL arrays and `jsonb` technically allow non-atomic values; whether that breaks 1NF in spirit depends on whether the database ever needs to query or constrain the individual elements.

### Second normal form (2NF)

- In 1NF, and every **non-prime** attribute is **fully** dependent on **every** candidate key — no partial dependencies.
- Only relevant when a candidate key is composite; a table whose keys are all single columns is automatically in 2NF.
- Fix: move the partially dependent attributes, with the part of the key they depend on, into their own table.

### Third normal form (3NF)

- In 2NF, and no non-prime attribute is **transitively** dependent on a candidate key.
- Formal definition: for every non-trivial FD `X → A`, either `X` is a **superkey**, or `A` is a **prime** attribute.
- Fix: move the transitively dependent attributes, with their determinant, into their own table.

### Boyce–Codd normal form (BCNF)

- For every non-trivial FD `X → A`, `X` is a **superkey**. (3NF without the "or `A` is prime" escape.)
- Differs from 3NF only when there are **overlapping composite candidate keys**.
- Fix: decompose on the violating FD `X → A` into `(X, A)` and `(R − A)`.

### Good decompositions

| Property | Meaning | Test |
|----------|---------|------|
| **Lossless join** | Joining the pieces gives back exactly the original rows (no spurious rows) | Decomposing `R` into `R1`, `R2` is lossless if the common attributes are a key of `R1` or of `R2` |
| **Dependency preservation** | Every FD can be checked within a single piece (enforced by keys) | Union of FDs on the pieces implies all original FDs |

- 3NF decomposition can always be both lossless and dependency-preserving.
- BCNF decomposition is always lossless but **may lose** a dependency — then that rule needs a trigger or must be accepted. This is the main practical reason to stop at 3NF.

### 4NF and 5NF (awareness)

- **4NF**: no table holds two independent multi-valued facts about the same key. `employee_skills_languages(emp, skill, language)` forces every skill to be paired with every language; split into `(emp, skill)` and `(emp, language)`.
- **5NF**: a table cannot be split further into smaller tables that rejoin losslessly, except as implied by its keys. Rare in practice.

## Syntax

```text
Decomposition by FD X → Y in R:
    R1 = (X, Y)            key: X
    R2 = (R − Y)           contains X as a foreign key to R1
Lossless because the common attributes X are a key of R1.
```

## Examples

### Unnormalized → 1NF

A spreadsheet-style table with a list in one column:

```sql
CREATE TABLE student_courses_raw (student_id int, student_name text, courses text);
INSERT INTO student_courses_raw VALUES
    (1, 'Asha',  'DB101, JV201'),
    (2, 'Ravi',  'DB101'),
    (3, 'Meena', 'DB101, OS301');

SELECT student_id, student_name, trim(c) AS course_id
FROM student_courses_raw, unnest(string_to_array(courses, ',')) AS c
ORDER BY student_id, course_id;
```

**Output:**

```text
 student_id | student_name | course_id
------------+--------------+-----------
          1 | Asha         | DB101
          1 | Asha         | JV201
          2 | Ravi         | DB101
          3 | Meena        | DB101
          3 | Meena        | OS301
(5 rows)
```

One row per (student, course) is in 1NF. Finding the students of DB101 is now a plain `WHERE course_id = 'DB101'` rather than string searching.

### The 1NF table and its anomalies

```sql
CREATE TABLE enrollment_1nf (
    student_id        int,
    student_name      text,
    course_id         text,
    course_title      text,
    instructor        text,
    instructor_office text,
    grade             char(1),
    PRIMARY KEY (student_id, course_id)
);
INSERT INTO enrollment_1nf VALUES
    (1, 'Asha',  'DB101', 'Databases',         'Dr. Rao',  'B-204', 'A'),
    (1, 'Asha',  'JV201', 'Java',              'Dr. Iyer', 'C-110', 'B'),
    (2, 'Ravi',  'DB101', 'Databases',         'Dr. Rao',  'B-204', 'B'),
    (3, 'Meena', 'DB101', 'Databases',         'Dr. Rao',  'B-204', 'A'),
    (3, 'Meena', 'OS301', 'Operating Systems', 'Dr. Rao',  'B-204', NULL);
```

FDs: `student_id → student_name`; `course_id → course_title, instructor`; `instructor → instructor_office`; `(student_id, course_id) → grade`.

Insertion anomaly — a new course with no students cannot be stored:

```sql
INSERT INTO enrollment_1nf (course_id, course_title, instructor)
VALUES ('AI401', 'Machine Learning', 'Dr. Iyer');
```

**Output:**

```text
ERROR:  null value in column "student_id" of relation "enrollment_1nf" violates not-null constraint
DETAIL:  Failing row contains (null, null, AI401, Machine Learning, Dr. Iyer, null, null).
```

### 1NF → 2NF: remove partial dependencies

`student_name` depends only on `student_id`; `course_title`, `instructor`, `instructor_office` only on `course_id`:

```sql
CREATE TABLE students AS
    SELECT DISTINCT student_id, student_name FROM enrollment_1nf;
CREATE TABLE courses_2nf AS
    SELECT DISTINCT course_id, course_title, instructor, instructor_office FROM enrollment_1nf;
CREATE TABLE enrollments AS
    SELECT student_id, course_id, grade FROM enrollment_1nf;

ALTER TABLE students    ADD PRIMARY KEY (student_id);
ALTER TABLE courses_2nf ADD PRIMARY KEY (course_id);
ALTER TABLE enrollments ADD PRIMARY KEY (student_id, course_id);

SELECT * FROM courses_2nf ORDER BY course_id;
```

**Output:**

```text
 course_id |   course_title    | instructor | instructor_office
-----------+-------------------+------------+-------------------
 DB101     | Databases         | Dr. Rao    | B-204
 JV201     | Java              | Dr. Iyer   | C-110
 OS301     | Operating Systems | Dr. Rao    | B-204
(3 rows)
```

`courses_2nf` still repeats Dr. Rao's office for every course he teaches: `course_id → instructor → instructor_office` is transitive.

### 2NF → 3NF: remove transitive dependencies

```sql
CREATE TABLE instructors AS
    SELECT DISTINCT instructor, instructor_office FROM courses_2nf;
CREATE TABLE courses AS
    SELECT course_id, course_title, instructor FROM courses_2nf;

ALTER TABLE instructors ADD PRIMARY KEY (instructor);
ALTER TABLE courses     ADD PRIMARY KEY (course_id);
ALTER TABLE courses     ADD FOREIGN KEY (instructor) REFERENCES instructors;
ALTER TABLE enrollments ADD FOREIGN KEY (student_id) REFERENCES students;
ALTER TABLE enrollments ADD FOREIGN KEY (course_id)  REFERENCES courses;

SELECT * FROM instructors ORDER BY instructor;
```

**Output:**

```text
 instructor | instructor_office
------------+-------------------
 Dr. Iyer   | C-110
 Dr. Rao    | B-204
(2 rows)
```

Now every fact is stored once: a student's name, a course's title and instructor, an instructor's office. The anomalies are gone:

```sql
INSERT INTO courses VALUES ('AI401', 'Machine Learning', 'Dr. Iyer');   -- course without students
UPDATE instructors SET instructor_office = 'B-301' WHERE instructor = 'Dr. Rao';   -- one row
SELECT c.course_id, c.instructor, i.instructor_office
FROM courses c JOIN instructors i ON i.instructor = c.instructor
ORDER BY c.course_id;
```

**Output:**

```text
 course_id | instructor | instructor_office
-----------+------------+-------------------
 AI401     | Dr. Iyer   | C-110
 DB101     | Dr. Rao    | B-301
 JV201     | Dr. Iyer   | C-110
 OS301     | Dr. Rao    | B-301
(4 rows)
```

### Proving the decomposition is lossless

Joining the 3NF tables must reproduce the original 1NF rows exactly — no rows missing, none invented:

```sql
WITH rejoined AS (
    SELECT e.student_id, s.student_name, e.course_id, c.course_title, c.instructor, e.grade
    FROM enrollments e
    JOIN students s ON s.student_id = e.student_id
    JOIN courses c  ON c.course_id = e.course_id
)
SELECT (SELECT count(*) FROM (
            SELECT student_id, student_name, course_id, course_title, instructor, grade FROM enrollment_1nf
            EXCEPT
            SELECT student_id, student_name, course_id, course_title, instructor, grade FROM rejoined) AS a) AS missing,
       (SELECT count(*) FROM (
            SELECT student_id, student_name, course_id, course_title, instructor, grade FROM rejoined
            EXCEPT
            SELECT student_id, student_name, course_id, course_title, instructor, grade FROM enrollment_1nf) AS b) AS spurious;
```

**Output:**

```text
 missing | spurious
---------+----------
       0 |        0
(1 row)
```

Each split was on a determinant that became the key of the new table (`student_id`, `course_id`, `instructor`), which is exactly the lossless-join condition. (The office is left out of the comparison because it was deliberately updated above.)

### A lossy decomposition

Splitting on a non-key column invents rows. Decompose `enrollment_1nf` into `(student_id, instructor)` and `(instructor, course_id)` — `instructor` is not a key of either piece:

```sql
WITH a AS (SELECT DISTINCT student_id, instructor FROM enrollment_1nf),
     b AS (SELECT DISTINCT instructor, course_id FROM enrollment_1nf)
SELECT a.student_id, b.course_id
FROM a JOIN b ON b.instructor = a.instructor
EXCEPT
SELECT student_id, course_id FROM enrollment_1nf
ORDER BY 1, 2;
```

**Output:**

```text
 student_id | course_id
------------+-----------
          1 | OS301
          2 | OS301
(2 rows)
```

The join claims Asha takes OS301 and Ravi takes OS301 — spurious rows, because Dr. Rao teaches several courses.

### 3NF but not BCNF

Rules for tutoring: each instructor teaches exactly one subject; a student has at most one instructor per subject. `tutoring(student, subject, instructor)`:

```text
FDs:            (student, subject) → instructor        instructor → subject
Candidate keys: {student, subject}, {student, instructor}
All attributes are prime → 3NF holds (instructor → subject: subject is prime)
BCNF fails: instructor is not a superkey
```

```sql
CREATE TABLE tutoring (
    student    text,
    subject    text,
    instructor text,
    PRIMARY KEY (student, subject)
);
INSERT INTO tutoring VALUES
    ('Asha', 'Maths',   'Mr. Sen'),
    ('Ravi', 'Maths',   'Mr. Sen'),
    ('Asha', 'Physics', 'Ms. Das');
UPDATE tutoring SET subject = 'Chemistry' WHERE student = 'Asha' AND instructor = 'Mr. Sen';
SELECT instructor, string_agg(DISTINCT subject, ', ') AS subjects
FROM tutoring GROUP BY instructor ORDER BY instructor;
```

**Output:**

```text
 instructor |     subjects
------------+------------------
 Mr. Sen    | Chemistry, Maths
 Ms. Das    | Physics
(2 rows)
```

The table now says Mr. Sen teaches two subjects, violating `instructor → subject` — the BCNF violation in action. BCNF decomposition: `instructor_subjects(instructor PRIMARY KEY, subject)` and `student_instructors(student, instructor)`. That is lossless, but the rule "one instructor per (student, subject)" now spans two tables and no key enforces it:

```sql
CREATE TABLE instructor_subjects (instructor text PRIMARY KEY, subject text NOT NULL);
CREATE TABLE student_instructors (
    student    text,
    instructor text REFERENCES instructor_subjects,
    PRIMARY KEY (student, instructor)
);
INSERT INTO instructor_subjects VALUES ('Mr. Sen', 'Maths'), ('Mr. Rao', 'Maths'), ('Ms. Das', 'Physics');
INSERT INTO student_instructors VALUES ('Asha', 'Mr. Sen'), ('Asha', 'Mr. Rao');   -- two Maths instructors: accepted

SELECT si.student, s.subject, count(*) AS instructors
FROM student_instructors si JOIN instructor_subjects s ON s.instructor = si.instructor
GROUP BY si.student, s.subject;
```

**Output:**

```text
 student | subject | instructors
---------+---------+-------------
 Asha    | Maths   |           2
(1 row)
```

The lost dependency `(student, subject) → instructor` would need a trigger. This is the 3NF-vs-BCNF trade-off: BCNF removes all FD redundancy, 3NF guarantees dependency preservation.

## Comparison

### Normal forms at a glance

| | 1NF | 2NF | 3NF | BCNF |
|---|---|---|---|---|
| Atomic values | ✓ | ✓ | ✓ | ✓ |
| No partial dependency on a key | | ✓ | ✓ | ✓ |
| No transitive dependency | | | ✓ | ✓ |
| Every determinant is a superkey | | | | ✓ |
| Lossless decomposition possible | ✓ | ✓ | ✓ | ✓ |
| Dependency preservation guaranteed | ✓ | ✓ | ✓ | Not always |

### 3NF vs BCNF

| | 3NF | BCNF |
|---|---|---|
| FD `X → A` allowed when | `X` is a superkey **or** `A` is prime | `X` is a superkey |
| Differ when | Overlapping composite candidate keys exist | — |
| Redundancy from FDs | Possible (rare) | None |
| Dependency preservation | Always achievable | Not always |

## Common Mistakes

- Defining 2NF as "no partial dependency on the primary key" only — it is on **any** candidate key, and concerns non-prime attributes.
- Saying a table with a single-column key can violate 2NF (it cannot; it can violate 3NF).
- Treating 3NF and BCNF as identical.
- Splitting on a non-key attribute and producing a lossy decomposition (spurious rows).
- Normalizing away deliberate historical snapshots (the price paid on an order line is not redundant with the current price).
- Assuming "more normalized is always better" — reporting tables and caches are legitimately denormalized.

## Revision

- Anomalies: update, insertion, deletion — caused by storing a fact many times.
- 1NF atomic values; 2NF no partial dependency (composite keys only); 3NF no transitive dependency (`X → A`: `X` superkey or `A` prime); BCNF every determinant a superkey.
- Decompose on `X → Y` into `(X, Y)` and `(R − Y)`: lossless because `X` is a key of the first piece.
- 3NF: always lossless + dependency-preserving. BCNF: lossless, may lose a dependency.
- 4NF: independent multi-valued facts in separate tables.

## Quick Revision

Normalize so each fact lives once: 1NF atomic values, 2NF no dependency on part of a key, 3NF no dependency through a non-key, and BCNF where every determinant is a superkey. Split on determinants so joins are lossless, and remember BCNF can lose a dependency that 3NF keeps.
