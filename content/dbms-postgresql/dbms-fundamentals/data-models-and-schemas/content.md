# Data Models, Schema and Instance

**Module:** DBMS Fundamentals · **Interview priority:** Frequently asked

## What Is It?

A **data model** is the set of concepts a DBMS uses to describe data: what structures exist (tables, trees, documents, objects), how they relate, and what rules apply. The **schema** is the *design* of a particular database written in that model — its tables, columns, types and constraints. An **instance** (or **state**) is the actual data stored at one moment.

## Why It Matters

- Choosing a database starts with choosing a data model: relational for structured business data, documents for flexible nested records, graphs for highly connected data.
- "Schema vs instance" is a classic definition question, and in PostgreSQL the word *schema* has a second meaning (a namespace inside a database) that confuses many candidates.

## Core Concept

### Schema vs instance

| | Schema | Instance |
|---|--------|----------|
| What | Structure / blueprint | Data at a point in time |
| Changes | Rarely (migrations, `ALTER TABLE`) | Constantly (every `INSERT`, `UPDATE`, `DELETE`) |
| Analogy | A class definition | The objects existing right now |
| Example | `employees(emp_id integer PRIMARY KEY, name text, salary integer …)` | The 12 employee rows in the sample database today |

```text
Schema (intension)                 Instance (extension) at 10:00
employees                          emp_id | name  | salary
---------                          -------+-------+--------
emp_id   integer  PRIMARY KEY           1 | Asha  | 150000
name     text     NOT NULL              2 | Ravi  |  95000
salary   integer  CHECK (> 0)          ... 10 more rows
```

After `INSERT INTO employees …` at 10:05, the instance changes; the schema does not.

### Two meanings of "schema" in PostgreSQL

1. **Database design (DBMS theory)** — the structure of the whole database, as above.
2. **PostgreSQL schema object** — a **namespace** inside a database that groups tables, views and functions: `public`, `sales`, `hr`. Two tables can share a name in different schemas (`sales.orders`, `archive.orders`).

```text
PostgreSQL server (cluster)
└── database: studyhub
    ├── schema: public      → departments, employees, orders, ...
    └── schema: reporting   → monthly_sales (view)
```

When someone asks "what is a schema?" in a PostgreSQL interview, give both meanings. Namespace schemas are covered in [Generated Columns, Schemas and Extensions](../../postgresql-features/generated-columns-schemas-extensions/content.md).

### Three-level architecture (where schemas live)

The classic ANSI/SPARC architecture describes a database at three levels:

| Level | Describes | Example |
|-------|-----------|---------|
| External (view) level | What one user group sees | A view `employee_directory` without salaries |
| Conceptual (logical) level | All tables, columns, relationships, constraints | The seven sample tables |
| Internal (physical) level | How data is stored | Heap files, 8 kB pages, B-tree indexes |

This separation gives **data independence**: the physical level can change (add an index) without changing the conceptual schema, and the conceptual schema can grow without breaking external views.

### Data models

| Model | Structure | Relationships | Typical use | Examples |
|-------|-----------|---------------|-------------|----------|
| Hierarchical | Tree of records (parent → children) | Each child has exactly one parent | Early mainframes; today's file systems and XML resemble it | IBM IMS |
| Network | Graph of records and sets | A record can have many parents (many-to-many) | 1970s systems (CODASYL) | IDMS |
| Relational | Tables (relations) of rows | Values: keys and foreign keys | Business data, most applications | PostgreSQL, MySQL, Oracle |
| Object-oriented | Objects with attributes and methods, class hierarchies | Object references | Engineering/CAD niches | db4o, ObjectDB |
| Object-relational | Relational plus user-defined types, inheritance, arrays | Keys and references | PostgreSQL's extensibility | PostgreSQL |
| Document (NoSQL) | Nested JSON-like documents | Embedding or references | Flexible, nested records | MongoDB |
| Key-value (NoSQL) | Opaque value per key | None | Caches, sessions | Redis |
| Graph (NoSQL) | Nodes and edges with properties | First-class edges | Social graphs, recommendations | Neo4j |

### Why the relational model won for business data

- **Navigation vs declaration.** Hierarchical and network databases made programmers *navigate* pointers record by record. The relational model lets you *declare* what you want (`SELECT … WHERE …`) and the DBMS decides how to fetch it.
- **Relationships by value.** A foreign key is just a value (`dept_id = 10`), so any relationship can be queried, not only the ones built into pointers.
- **Mathematical basis.** Relational algebra made query optimisation and normalisation rigorous.

### Hierarchical and network in one picture

```text
Hierarchical (one parent each)        Network (many parents allowed)

        Department                     Student        Course
        /        \                         \          /
   Employee    Employee                     Enrolment
      |
   Dependent                      One Enrolment record has two parents:
                                  a Student and a Course
```

The hierarchical model struggles with many-to-many relationships (an employee in two projects must be duplicated); the network model allows them but needs pointer navigation.

### Metadata and the data dictionary

The schema itself is stored as data — the **data dictionary** or **system catalog**. In PostgreSQL every table you create becomes a row in `pg_catalog.pg_class`, every column a row in `pg_attribute`.

## Examples

### Schema vs instance in PostgreSQL

The schema of `departments` (from the catalog):

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'departments'
ORDER BY ordinal_position;
```

**Output:**

```text
 column_name | data_type | is_nullable
-------------+-----------+-------------
 dept_id     | integer   | NO
 dept_name   | text      | NO
 location    | text      | YES
(3 rows)
```

The instance right now:

```sql
SELECT count(*) AS departments_now FROM departments;
```

**Output:**

```text
 departments_now
-----------------
               5
(1 row)
```

Changing the instance does not change the schema:

```sql
INSERT INTO departments VALUES (60, 'Legal', 'Delhi');
SELECT count(*) AS departments_now FROM departments;
```

**Output:**

```text
 departments_now
-----------------
               6
(1 row)
```

### PostgreSQL schemas as namespaces

```sql
CREATE SCHEMA reporting;
CREATE TABLE reporting.departments (dept_id integer, note text);

SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'departments'
ORDER BY table_schema;
```

**Output:**

```text
 table_schema | table_name
--------------+-------------
 public       | departments
 reporting    | departments
(2 rows)
```

Two different tables called `departments`, in two schemas of one database.

## Common Mistakes

- Defining schema as "the data in the database" — that is the instance.
- Mixing up the two PostgreSQL meanings of schema in an interview without saying which one you mean.
- Saying the relational model stores relationships as pointers — it stores them as values (foreign keys).
- Calling NoSQL "schema-less". Document databases usually have an *implicit* schema enforced by the application; it is "schema-on-read" rather than no schema.

## Revision

- Data model = concepts for describing data (relational, hierarchical, network, object, document, key-value, graph).
- Schema = structure (changes rarely); instance = current data (changes constantly).
- PostgreSQL also uses "schema" for a namespace inside a database (`public`, `sales`).
- Three levels: external (views), conceptual (tables), internal (storage) → data independence.
- Hierarchical: tree, one parent; network: graph, many parents; relational: tables + keys, declarative SQL.
- The schema is stored as metadata in the system catalog.

## Quick Revision

Schema = blueprint, instance = data now. Relational model = tables related by key values and queried declaratively; older hierarchical/network models navigated pointers.
