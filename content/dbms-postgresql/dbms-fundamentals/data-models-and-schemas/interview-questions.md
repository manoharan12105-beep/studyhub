# Data Models, Schema and Instance — Interview Questions

## Beginner

### Q1. What is the difference between a schema and an instance?

<details>
<summary>Answer</summary>

The schema is the structure of the database — tables, columns, types, constraints — and changes rarely. The instance is the data stored at a particular moment and changes with every insert, update or delete. Analogy: schema is a class, instance is the set of objects that exist right now.

</details>

### Q2. What is a data model? Name a few.

<details>
<summary>Answer</summary>

A collection of concepts for describing data, relationships and constraints. Examples: hierarchical (trees), network (graphs of records), relational (tables), object-oriented (objects and classes), and NoSQL models — document, key-value, column-family and graph.

</details>

### Q3. What does "schema" mean in PostgreSQL?

<details>
<summary>Answer</summary>

Two things. In DBMS theory, the design of the database. As a PostgreSQL object, a **namespace** inside a database that contains tables, views, functions and types — for example `public` (the default) or `sales`. Objects are addressed as `schema.object`, and the `search_path` setting decides which schemas are searched for unqualified names.

</details>

## Intermediate

### Q4. Compare the hierarchical, network and relational models.

<details>
<summary>Answer</summary>

| | Hierarchical | Network | Relational |
|---|---|---|---|
| Structure | Tree | Graph | Tables |
| Parents per record | One | Many | Not applicable — relationships are values |
| Many-to-many | Needs duplication | Supported via sets | Junction table |
| Access | Navigate pointers | Navigate pointers | Declarative SQL |

The relational model separates *what* you want from *how* it is fetched, which made ad-hoc queries and optimisation possible.

</details>

### Q5. Explain the three-schema architecture and data independence.

<details>
<summary>Answer</summary>

External level: user-specific views. Conceptual level: the full logical schema. Internal level: physical storage. Mappings between levels provide **physical data independence** (change storage or add an index without changing the logical schema) and **logical data independence** (change the logical schema without breaking external views and the applications using them).

</details>

### Q6. Is PostgreSQL purely relational?

<details>
<summary>Answer</summary>

It is usually described as an **object-relational** DBMS: relational at its core, plus user-defined types, table inheritance, arrays, composite types, JSONB documents and extensible index types. You can use it purely relationally, but it also covers many document-style needs.

</details>

## Advanced

### Q7. Is a document database "schema-less"?

<details>
<summary>Answer</summary>

Not really. It does not *enforce* a schema on write by default, but applications still expect particular fields and types — an implicit schema, often called **schema-on-read**. The trade-off is flexibility (add fields without migrations) against integrity (no database-enforced types, foreign keys or constraints unless you add validation rules).

</details>

### Q8. Where does PostgreSQL store the schema itself?

<details>
<summary>Answer</summary>

In the system catalog — ordinary tables in the `pg_catalog` schema: `pg_class` (tables, indexes, views), `pg_attribute` (columns), `pg_constraint`, `pg_index`, `pg_namespace` (schemas) and more. The SQL-standard `information_schema` views present the same metadata in a portable form.

</details>
