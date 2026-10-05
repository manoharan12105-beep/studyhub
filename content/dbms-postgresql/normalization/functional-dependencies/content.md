# Functional Dependencies

**Module:** Normalization · **Interview priority:** Frequently asked

## What Is It?

A **functional dependency (FD)** `X → Y` says: whenever two rows agree on the attributes `X`, they must also agree on `Y`. `X` **determines** `Y`; `Y` is **functionally dependent** on `X`.

```text
student_id → student_name       one student id always has one name
course_id  → course_title
(student_id, course_id) → grade a student's grade is per course
```

FDs are statements about the **meaning** of the data (business rules), not about whatever rows happen to be in a table today. They are the tool used to find keys and to normalize tables.

## Why It Matters

- Normal forms (2NF, 3NF, BCNF) are defined in terms of functional dependencies; you cannot normalize correctly without identifying them.
- Exam and interview questions ask for attribute closures, candidate keys and whether a relation is in a given normal form from a list of FDs.
- Practically, an FD that is not enforced by a key is a source of **update anomalies** — the same fact stored in several rows that can disagree.

## Core Concept

### Kinds of dependencies

| Kind | Definition | Example (enrollment table) |
|------|------------|----------------------------|
| **Trivial** | `Y ⊆ X` (always true) | `(student_id, course_id) → student_id` |
| **Non-trivial** | `Y` not a subset of `X` | `student_id → student_name` |
| **Full** | `Y` depends on all of `X`, not on any proper subset | `(student_id, course_id) → grade` |
| **Partial** | `Y` depends on part of a composite key | `(student_id, course_id) → student_name`, because `student_id → student_name` |
| **Transitive** | `X → Z` holds via `X → Y` and `Y → Z`, with `Y` not a key | `emp_id → dept_id → dept_name` |
| **Multivalued** (`X ↠ Y`) | For each `X`, the set of `Y` values is independent of other attributes | `employee ↠ skill`, `employee ↠ language` in one table (basis of 4NF) |

### Armstrong's axioms

Sound and complete rules for deriving every FD implied by a given set:

| Rule | Statement |
|------|-----------|
| Reflexivity | If `Y ⊆ X`, then `X → Y` |
| Augmentation | If `X → Y`, then `XZ → YZ` |
| Transitivity | If `X → Y` and `Y → Z`, then `X → Z` |

Derived rules:

| Rule | Statement |
|------|-----------|
| Union | `X → Y` and `X → Z` ⇒ `X → YZ` |
| Decomposition | `X → YZ` ⇒ `X → Y` and `X → Z` |
| Pseudo-transitivity | `X → Y` and `WY → Z` ⇒ `WX → Z` |

Note: there is **no** rule splitting the left side — `AB → C` does not imply `A → C`.

### Attribute closure (X⁺)

The **closure** `X⁺` is the set of all attributes determined by `X`. Algorithm:

1. Start with `result = X`.
2. Repeat: for each FD `L → R`, if `L ⊆ result`, add `R` to `result`.
3. Stop when nothing changes.

`X` is a **superkey** if `X⁺` contains all attributes; a **candidate key** if it is a minimal superkey (no proper subset is a superkey).

Worked example — `R(A, B, C, D, E)` with `F = { A → B, B → C, CD → E }`:

```text
{A}⁺:    start {A}
         A → B        → {A, B}
         B → C        → {A, B, C}
         CD → E       needs D — not applicable
         result {A, B, C}                      not a superkey

{A, D}⁺: start {A, D}
         A → B        → {A, B, D}
         B → C        → {A, B, C, D}
         CD → E       → {A, B, C, D, E}        all attributes: superkey
```

`{A}⁺` and `{D}⁺ = {D}` are not superkeys, so `{A, D}` is minimal: a **candidate key**. Shortcut for finding keys: attributes that never appear on any right-hand side (`A` and `D` here) must be in every candidate key.

### Prime and non-prime attributes

- **Prime attribute**: part of **some** candidate key (`A`, `D` above).
- **Non-prime attribute**: in no candidate key (`B`, `C`, `E`).

These terms are used directly in the definitions of 2NF and 3NF.

### Minimal (canonical) cover

A simplified equivalent set of FDs: single attributes on the right, no extraneous attributes on the left, no redundant FDs. Example: `{A → BC, B → C, A → B}` reduces to `{A → B, B → C}` (`A → C` follows by transitivity). Used by the 3NF synthesis algorithm.

### FDs and data

- A table's rows can **disprove** an FD (two rows with the same `X` and different `Y`), but can never **prove** one — the next insert could break it.
- An FD is **enforced** by the database only when `X` is a key (`PRIMARY KEY`/`UNIQUE`) of a table containing `X` and `Y`. Normalization arranges tables so that every FD is enforced this way.

## Syntax

```text
X → Y            X determines Y
X⁺               closure of X under the given FDs
superkey         X⁺ = all attributes
candidate key    minimal superkey
```

## Examples

### An unnormalized enrollment table

```sql
CREATE TABLE enrollment_flat (
    student_id   int,
    student_name text,
    course_id    text,
    course_title text,
    instructor   text,
    grade        char(1),
    PRIMARY KEY (student_id, course_id)
);
INSERT INTO enrollment_flat VALUES
    (1, 'Asha',  'DB101', 'Databases', 'Dr. Rao',   'A'),
    (1, 'Asha',  'JV201', 'Java',      'Dr. Iyer',  'B'),
    (2, 'Ravi',  'DB101', 'Databases', 'Dr. Rao',   'B'),
    (3, 'Meena', 'DB101', 'Databases', 'Dr. Rao',   'A');
```

Intended FDs: `student_id → student_name`, `course_id → course_title`, `course_id → instructor`, `(student_id, course_id) → grade`. The key is `(student_id, course_id)`; `student_name`, `course_title` and `instructor` depend on **part** of it (partial dependencies).

### Checking whether data violates an FD

Does `course_id → instructor` hold in the data? Look for a `course_id` with more than one instructor:

```sql
SELECT course_id, count(DISTINCT instructor) AS instructors
FROM enrollment_flat
GROUP BY course_id
HAVING count(DISTINCT instructor) > 1;
```

**Output:**

```text
 course_id | instructors
-----------+-------------
(0 rows)
```

No violations — yet nothing prevents one. An update anomaly creates it:

```sql
UPDATE enrollment_flat SET instructor = 'Dr. Menon'
WHERE student_id = 3 AND course_id = 'DB101';

SELECT course_id, string_agg(DISTINCT instructor, ', ') AS instructors
FROM enrollment_flat
GROUP BY course_id
HAVING count(DISTINCT instructor) > 1;
```

**Output:**

```text
 course_id |    instructors
-----------+--------------------
 DB101     | Dr. Menon, Dr. Rao
(1 row)
```

The course's instructor is stored three times; changing one copy leaves the table contradicting itself. Moving `course_id → instructor` into a `courses` table whose key is `course_id` makes the database enforce it ([Database Normalization](../database-normalization/content.md)).

### Discovering candidate dependencies in data

The data can suggest FDs to ask the business about. Which columns have a single value per `student_id`?

```sql
SELECT bool_and(names = 1)   AS student_id_determines_name,
       bool_and(courses = 1) AS student_id_determines_course
FROM (SELECT student_id,
             count(DISTINCT student_name) AS names,
             count(DISTINCT course_id)    AS courses
      FROM enrollment_flat
      GROUP BY student_id) AS per_student;
```

**Output:**

```text
 student_id_determines_name | student_id_determines_course
----------------------------+------------------------------
 t                          | f
(1 row)
```

`student_id → student_name` is consistent with the data; `student_id → course_id` is refuted (Asha takes two courses).

## Comparison

### Partial vs transitive dependency

| | Partial | Transitive |
|---|---|---|
| Determinant | Part of a composite candidate key | A non-key attribute |
| Example | `(student_id, course_id) → student_name` via `student_id` | `emp_id → dept_id → dept_name` |
| Possible with a single-column key | No | Yes |
| Removed by | 2NF | 3NF |

### Superkey vs candidate key

| | Superkey | Candidate key |
|---|---|---|
| Determines all attributes | Yes | Yes |
| Minimal | Not necessarily | Yes |
| Example (`R(A,B,C,D,E)` above) | `{A, D}`, `{A, B, D}`, `{A, C, D, E}` | `{A, D}` |

## Common Mistakes

- Reading FDs off sample data instead of business rules.
- Splitting the left side: `AB → C` does not give `A → C`.
- Forgetting trivial dependencies or that every attribute set determines itself.
- Missing a candidate key: attributes that appear on no right-hand side must be in every key — start from them.
- Confusing "prime attribute" (in some candidate key) with "primary key column".
- Thinking an FD is enforced because the data currently satisfies it.

## Revision

- `X → Y`: equal `X` ⇒ equal `Y`; comes from business meaning.
- Trivial, non-trivial, full, partial (part of a composite key → non-key), transitive (key → non-key → non-key), multivalued (`↠`).
- Armstrong: reflexivity, augmentation, transitivity (+ union, decomposition, pseudo-transitivity).
- Closure `X⁺` by repeatedly applying FDs; superkey if `X⁺` = all; candidate key = minimal superkey.
- Prime attribute = in some candidate key.
- Data can refute an FD (`GROUP BY X HAVING count(DISTINCT Y) > 1`) but never prove it; keys enforce FDs.

## Quick Revision

X → Y means rows equal on X are equal on Y. Compute closures to find candidate keys, and spot partial dependencies (on part of a key) and transitive ones (through a non-key) — those are what normalization removes by making every determinant a key.
