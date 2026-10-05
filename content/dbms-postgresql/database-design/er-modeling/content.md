# Entity–Relationship Modeling

**Module:** Database Design · **Interview priority:** Frequently asked

## What Is It?

The **Entity–Relationship (ER) model** is a way to describe the data of an application **before** writing tables: which things it stores (**entities**), what is known about them (**attributes**) and how they are connected (**relationships**). The result, an **ER diagram (ERD)**, is then mapped to tables ([Relationship Mapping](../relationship-mapping/content.md)).

```text
┌──────────┐        places        ┌─────────┐       contains       ┌─────────┐
│ CUSTOMER │ 1 ───────────────< N │  ORDER  │ M >──────────────< N │ PRODUCT │
└──────────┘                      └─────────┘                      └─────────┘
```

## Why It Matters

- Design mistakes are the most expensive to fix later: a wrong cardinality means a schema change and a data migration.
- "Draw an ER diagram for a library / hospital / e-commerce system" is a standard DBMS interview and exam question, followed by "convert it to tables".
- ER vocabulary (weak entity, participation, cardinality) appears in almost every DBMS viva.

## Core Concept

### Entities and entity sets

- An **entity** is a distinguishable thing: a particular customer, an order, a product.
- An **entity set** (entity type) is the collection of similar entities — `CUSTOMER`. It becomes a table.
- A **strong entity** has its own key (`customer_id`).
- A **weak entity** cannot be identified by its own attributes alone; it depends on an **owner** entity through an **identifying relationship**. Its key = owner's key + a **partial key** (discriminator). Example: an order line is identified by (order, line number); a room by (hotel, room number). Weak entities always have **total participation** in the identifying relationship.

### Attributes

| Kind | Meaning | Example | Becomes |
|------|---------|---------|---------|
| Simple | Indivisible | `price` | A column |
| Composite | Made of parts | `address` → street, city, pincode | Several columns |
| Single-valued | One value per entity | `date_of_birth` | A column |
| Multi-valued | Several values per entity | `phone_numbers` | A separate table (or an array) |
| Derived | Computed from others | `age` from `date_of_birth` | Not stored (or a generated column/view) |
| Key | Identifies the entity | `customer_id` | Primary key |

### Relationships

- A **relationship** associates entities: CUSTOMER *places* ORDER.
- **Degree**: number of entity sets involved — **unary** (recursive: EMPLOYEE *manages* EMPLOYEE), **binary** (most common), **ternary** (DOCTOR *prescribes* MEDICINE to PATIENT).
- Relationships may have attributes: ORDER *contains* PRODUCT has `quantity` and `unit_price` — they belong to the pair, not to either entity.

### Cardinality (mapping constraints)

How many entities on one side can relate to one entity on the other:

| Cardinality | Meaning | Example |
|-------------|---------|---------|
| One-to-one (1:1) | Each A relates to at most one B, and vice versa | EMPLOYEE — PARKING_SPOT |
| One-to-many (1:N) | One A to many B; each B to at most one A | DEPARTMENT — EMPLOYEE |
| Many-to-one (N:1) | The same, read from the other side | EMPLOYEE — DEPARTMENT |
| Many-to-many (M:N) | Many A to many B | ORDER — PRODUCT, STUDENT — COURSE |

Read cardinality from both sides: "a department **has many** employees; an employee **belongs to one** department".

### Participation (existence constraints)

- **Total** (mandatory): every entity must take part — every order must belong to a customer. Drawn as a double line in Chen notation; becomes `NOT NULL` on the foreign key.
- **Partial** (optional): some entities do not take part — a customer may have no orders; an employee may have no department (Nisha in the sample data).

**Min–max notation** combines both: `(0, N)` = optional, many; `(1, 1)` = mandatory, exactly one.

### Notations

Chen notation (textbooks, exams):

```text
  [ENTITY]        rectangle            (attribute)       oval
  [[WEAK]]        double rectangle     ((multi-valued))  double oval
  <RELATIONSHIP>  diamond              (-derived-)       dashed oval
  <<IDENTIFYING>> double diamond       key attribute     underlined
  ══  total participation (double line)    ──  partial participation
```

Crow's foot notation (industry tools):

```text
  ──┼──   exactly one          ──○┼──  zero or one
  ──<     many                 ──○<    zero or many
  ──┼<    one or many

  DEPARTMENT ──┼────────○< EMPLOYEE
  "a department has zero or many employees; an employee has exactly one department"
```

### Generalization, specialization and aggregation (EER)

- **Specialization** (top-down): splitting an entity into sub-types with extra attributes — PAYMENT into CARD_PAYMENT and UPI_PAYMENT. **Generalization** (bottom-up) is the reverse: common attributes of CAR and BIKE lifted into VEHICLE. Drawn with an "ISA" triangle.
- Constraints on specialization: **disjoint** vs **overlapping** (can an entity be both?), **total** vs **partial** (must every entity be one of the sub-types?).
- **Aggregation** treats a relationship as an entity so it can take part in another relationship — e.g. (EMPLOYEE *works on* PROJECT) is *monitored by* MANAGER.

### Design process

1. List the nouns in the requirements → candidate entities and attributes.
2. List the verbs → candidate relationships.
3. Decide keys, cardinalities and participation for each relationship — ask "can one X have many Y? can Y exist without X?".
4. Move attributes to where they belong (a relationship attribute like `quantity` belongs to the M:N relationship).
5. Map to tables, then check normalization.

## Syntax

```text
ER (Chen) → tables (summary; details in Relationship Mapping)
strong entity          → table with its own primary key
weak entity            → table with PK (owner_key, partial_key) and FK to owner, ON DELETE CASCADE
1:N relationship       → FK on the N side
1:1 relationship       → FK with UNIQUE (or shared primary key)
M:N relationship       → junction table with two FKs and a composite PK
multi-valued attribute → separate table
total participation    → FK column NOT NULL
```

## Examples

### ER diagram of the sample database

```text
                                   manages (1:N, unary)
                                   ┌──────────────┐
                                   │              │
┌────────────┐ 1  works in  N ┌────┴───────┐      │
│ DEPARTMENT │────────────────│  EMPLOYEE  │──────┘
│ dept_id PK │                │ emp_id PK  │
│ dept_name  │                │ dept_id    │
└────────────┘                │ manager_id │
                              └────────────┘

┌─────────────┐ 1   places    N ┌─────────────┐ M  contains  N ┌─────────────┐
│  CUSTOMER   │─────────────────│    ORDER    │────────────────│   PRODUCT   │
│ customer_id │                 │ order_id    │ quantity,      │ product_id  │
└─────────────┘                 │ customer_id │ unit_price     └─────────────┘
                                └─────────────┘
```

- *places*: every order must have a customer (total participation of ORDER → `orders.customer_id NOT NULL`); a customer may have no orders (Fatima) — partial participation of CUSTOMER.
- *works in*: partial on both sides — an employee may have no department (`dept_id` nullable → Nisha) and a department may have no employees (Research).
- *manages*: a unary 1:N relationship of EMPLOYEE with itself, stored as `manager_id`; Asha has no manager.
- *contains* is M:N with attributes, so it becomes the `order_items` table.

### A weak entity in SQL

An order line identified by its order plus a line number:

```sql
CREATE TABLE invoice_headers (
    invoice_no integer PRIMARY KEY,
    issued_on  date NOT NULL
);
CREATE TABLE invoice_lines (
    invoice_no  integer NOT NULL REFERENCES invoice_headers (invoice_no) ON DELETE CASCADE,
    line_no     smallint NOT NULL,                 -- partial key
    description text    NOT NULL,
    amount      numeric(12,2) NOT NULL,
    PRIMARY KEY (invoice_no, line_no)              -- owner key + partial key
);
INSERT INTO invoice_headers VALUES (1, '2026-03-01');
INSERT INTO invoice_lines VALUES (1, 1, 'Consulting', 5000), (1, 2, 'Travel', 1200);
INSERT INTO invoice_lines VALUES (2, 1, 'Orphan line', 100);
```

**Output:**

```text
ERROR:  insert or update on table "invoice_lines" violates foreign key constraint "invoice_lines_invoice_no_fkey"
DETAIL:  Key (invoice_no)=(2) is not present in table "invoice_headers".
```

The line cannot exist without its invoice (the foreign key rejects invoice 2), and deleting the invoice deletes its lines:

```sql
DELETE FROM invoice_headers WHERE invoice_no = 1;
SELECT count(*) AS remaining_lines FROM invoice_lines;
```

**Output:**

```text
 remaining_lines
-----------------
               0
(1 row)
```

### Reading requirements: a library

Requirements: *"Members borrow copies of books. A book can have several copies and several authors; an author writes many books. Each loan records the borrow date and the due date. A member can have at most 5 active loans."*

```text
Entities:      MEMBER, BOOK, COPY (weak: identified by book + copy number), AUTHOR
Relationships: AUTHOR —writes— BOOK          M:N
               BOOK   —has—    COPY          1:N, identifying (COPY total)
               MEMBER —borrows— COPY         M:N over time → LOAN (borrowed_on, due_on, returned_on)
Constraint:    "at most 5 active loans" is not expressible in the ER diagram itself;
               it becomes a check in a trigger or in the application
```

The full schema is built in [Schema Design Case Studies](../schema-design-case-studies/content.md).

## Comparison

### Strong vs weak entity

| | Strong entity | Weak entity |
|---|---|---|
| Own primary key | Yes | No — partial key only |
| Depends on another entity | No | Yes (owner, via identifying relationship) |
| Participation in identifying relationship | — | Always total |
| Table key | Own key | Owner key + partial key |
| Chen symbol | Rectangle | Double rectangle |

### Chen vs crow's foot

| | Chen | Crow's foot |
|---|---|---|
| Relationships | Diamonds | Lines |
| Attributes | Ovals around entities | Listed inside the entity box |
| Cardinality | 1, N, M labels (or min–max) | Symbols at line ends |
| Used in | Textbooks, exams | Design tools, industry |

## Common Mistakes

- Modelling an attribute of a relationship (quantity, grade, role) as an attribute of one entity.
- Treating a multi-valued attribute as a single column (comma-separated phone numbers).
- Getting cardinality wrong by reading only one direction.
- Confusing participation (must it take part?) with cardinality (how many?).
- Making everything a strong entity with surrogate ids and losing the "cannot exist without its owner" rule.
- Storing derived attributes (age, totals) that then drift from their sources.

## Revision

- Entity (thing) → table; attribute → column; relationship → foreign key or junction table.
- Strong entity: own key. Weak entity: owner key + partial key, identifying relationship, total participation.
- Attributes: simple/composite, single/multi-valued, derived, key.
- Degree: unary, binary, ternary. Cardinality: 1:1, 1:N, M:N. Participation: total (NOT NULL FK) or partial.
- EER: specialization/generalization (ISA; disjoint/overlapping, total/partial), aggregation.

## Quick Revision

An ER model lists entities, attributes and relationships with cardinality (1:1, 1:N, M:N) and participation (total or partial). Weak entities borrow their owner's key, multi-valued attributes and M:N relationships become separate tables, and relationship attributes belong to the relationship.
