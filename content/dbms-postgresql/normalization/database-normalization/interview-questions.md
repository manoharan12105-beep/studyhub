# Database Normalization — Interview Questions

## Beginner

### Q1. What is normalization and why is it needed?

<details>
<summary>Answer</summary>

Organising tables so that each fact is stored once, in the table whose key it depends on, by decomposing tables according to functional dependencies. It removes redundancy and the anomalies redundancy causes: update anomalies (copies disagree), insertion anomalies (cannot store a fact without an unrelated one) and deletion anomalies (deleting one fact loses another).

</details>

### Q2. Explain 1NF, 2NF and 3NF with an example.

<details>
<summary>Answer</summary>

Start with `enrollment(student_id, student_name, courses)` where `courses` is `'DB101, JV201'`.

- **1NF**: atomic values — one row per (student, course): `(student_id, student_name, course_id, course_title, instructor, grade)`, key `(student_id, course_id)`.
- **2NF**: no partial dependency — `student_name` depends only on `student_id`, `course_title`/`instructor` only on `course_id`. Split into `students(student_id, student_name)`, `courses(course_id, course_title, instructor, instructor_office)`, `enrollments(student_id, course_id, grade)`.
- **3NF**: no transitive dependency — `course_id → instructor → instructor_office`. Split `instructors(instructor, instructor_office)` out of `courses`.

</details>

### Q3. What are insertion, update and deletion anomalies?

<details>
<summary>Answer</summary>

In a table storing enrollments together with course details: an **insertion** anomaly — a new course cannot be added until someone enrolls (the key needs a student); an **update** anomaly — the instructor of a course is stored in every enrollment row and changing one copy leaves others wrong; a **deletion** anomaly — deleting the last enrollment loses the course's details.

</details>

## Intermediate

### Q4. What is the difference between 3NF and BCNF?

<details>
<summary>Answer</summary>

Both require, for every non-trivial FD `X → A`, that `X` be a superkey — but 3NF also allows the FD if `A` is a prime attribute (part of some candidate key); BCNF does not. They differ only with overlapping composite candidate keys. Example: `tutoring(student, subject, instructor)` with `(student, subject) → instructor` and `instructor → subject`: keys are `{student, subject}` and `{student, instructor}`; `instructor → subject` is allowed in 3NF (subject is prime) but violates BCNF (instructor is not a superkey).

</details>

### Q5. Can a table with a single-column primary key violate 2NF?

<details>
<summary>Answer</summary>

No — if every candidate key is a single attribute, no attribute can depend on "part" of a key, so a 1NF table is automatically in 2NF. It can still violate 3NF through a transitive dependency (e.g. `emp_id → dept_id → dept_name`). If the table has another, composite candidate key, partial dependencies on that key must still be checked.

</details>

### Q6. What is a lossless-join decomposition?

<details>
<summary>Answer</summary>

A decomposition where joining the resulting tables gives back exactly the original rows — no rows lost and no spurious rows invented. A binary decomposition of `R` into `R1` and `R2` is lossless if the common attributes form a key of `R1` or `R2`. Splitting on a non-key attribute (e.g. an instructor who teaches several courses) produces spurious rows on rejoin.

</details>

### Q7. What is dependency preservation?

<details>
<summary>Answer</summary>

A decomposition is dependency-preserving if every original FD can be checked within a single resulting table (and hence enforced by that table's keys) without joins. 3NF decompositions can always be both lossless and dependency-preserving; BCNF decompositions are lossless but sometimes lose a dependency, which then has to be enforced by a trigger or application logic.

</details>

## Advanced

### Q8. What is 4NF? Give an example.

<details>
<summary>Answer</summary>

4NF forbids non-trivial multivalued dependencies whose left side is not a superkey — informally, a table must not store two independent multi-valued facts about the same entity. `emp_skill_language(emp, skill, language)` must list every skill with every language (Asha knows SQL and Java, speaks Tamil and English → 4 rows); adding a language means adding a row per skill. Split into `emp_skills(emp, skill)` and `emp_languages(emp, language)`.

</details>

### Q9. Is a fully normalized design always best?

<details>
<summary>Answer</summary>

For transactional (OLTP) data, 3NF/BCNF is the right default: it prevents anomalies and keeps writes simple. But read-heavy reporting and analytics often denormalize (star schemas, summary tables, materialized views) to avoid many joins; some redundancy is deliberate (price snapshots on order lines, cached counters). The rule is: normalize first, then denormalize deliberately where measurements justify it, with a plan for keeping copies consistent.

</details>

### Q10. A 3NF table still has redundancy. How is that possible?

<details>
<summary>Answer</summary>

Through an FD `X → A` where `X` is not a superkey but `A` is prime — allowed by 3NF, forbidden by BCNF. In `tutoring(student, subject, instructor)`, the fact "Mr. Sen teaches Maths" is repeated for every student he tutors, so updating his subject in one row can contradict the others. Redundancy from multivalued or join dependencies (4NF, 5NF) can also remain.

</details>
