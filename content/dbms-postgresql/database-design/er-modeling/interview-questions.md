# Entity–Relationship Modeling — Interview Questions

## Beginner

### Q1. What is an ER diagram?

<details>
<summary>Answer</summary>

A diagram of the conceptual data model: entities (things stored, drawn as rectangles in Chen notation), their attributes (ovals) and the relationships between them (diamonds), annotated with cardinality and participation. It is drawn before the tables, to agree on what data the system holds and how it connects, and is then mapped to a relational schema.

</details>

### Q2. What is the difference between an entity and an entity set?

<details>
<summary>Answer</summary>

An entity is one distinguishable object (the customer Anil); an entity set (entity type) is the collection of all entities of the same kind (CUSTOMER). The entity set becomes a table; each entity becomes a row.

</details>

### Q3. What is a weak entity? Give an example.

<details>
<summary>Answer</summary>

An entity that cannot be uniquely identified by its own attributes and depends on an owner entity through an identifying relationship. Its key is the owner's key plus its partial key (discriminator). Example: a ROOM identified by (hotel_id, room_no) — room 101 exists in many hotels. It always has total participation in the identifying relationship, and in SQL its table has a composite primary key including the owner's foreign key, usually with `ON DELETE CASCADE`.

</details>

### Q4. What are the types of attributes?

<details>
<summary>Answer</summary>

Simple vs composite (address → street, city, pincode), single-valued vs multi-valued (phone numbers), stored vs derived (age derived from date of birth), and key attributes (identify the entity). Multi-valued attributes become separate tables; derived attributes are usually not stored.

</details>

## Intermediate

### Q5. What is the difference between cardinality and participation?

<details>
<summary>Answer</summary>

Cardinality is the maximum number of related entities: 1:1, 1:N or M:N. Participation is the minimum: total (every entity must take part — every order has a customer) or partial (some may not — a customer may have no orders). Min–max notation expresses both, e.g. ORDER participates in *places* with (1, 1), CUSTOMER with (0, N). Total participation on the "many" side becomes a `NOT NULL` foreign key.

</details>

### Q6. Where do attributes of a many-to-many relationship go?

<details>
<summary>Answer</summary>

On the relationship itself, because they describe the pair, not either entity: `quantity` in ORDER *contains* PRODUCT, `grade` in STUDENT *enrolls in* COURSE. When the M:N relationship becomes a junction table, these attributes become its columns.

</details>

### Q7. What is the degree of a relationship? Give an example of each.

<details>
<summary>Answer</summary>

The number of entity sets participating. Unary (recursive): EMPLOYEE *manages* EMPLOYEE. Binary: CUSTOMER *places* ORDER. Ternary: DOCTOR *prescribes* MEDICINE to PATIENT — the prescription involves all three at once and cannot always be replaced by three binary relationships without losing information.

</details>

## Advanced

### Q8. What are specialization, generalization and aggregation?

<details>
<summary>Answer</summary>

Specialization divides an entity set into sub-types with additional attributes or relationships (EMPLOYEE into ENGINEER and MANAGER); generalization combines similar entity sets into a super-type (CAR and BIKE into VEHICLE). Both form an ISA hierarchy, constrained as disjoint or overlapping and total or partial. Aggregation treats a relationship as a higher-level entity so it can participate in another relationship, e.g. the (EMPLOYEE works-on PROJECT) relationship being *monitored by* a MANAGER.

</details>

### Q9. Design the ER model for "students enroll in courses taught by instructors; each enrollment has a grade; a course can have several sections per semester".

<details>
<summary>Answer</summary>

Entities: STUDENT, COURSE, INSTRUCTOR, SECTION (weak: identified by course + semester + section number). Relationships: COURSE *has* SECTION (1:N, identifying, SECTION total); INSTRUCTOR *teaches* SECTION (1:N or M:N if co-teaching); STUDENT *enrolls in* SECTION (M:N) with attribute `grade`. Tables: `students`, `courses`, `instructors`, `sections (course_id, semester, section_no, PK of all three, FK course_id)`, `section_instructors` if M:N, `enrollments (student_id, course_id, semester, section_no, grade, PK (student_id, course_id, semester, section_no))`.

</details>
