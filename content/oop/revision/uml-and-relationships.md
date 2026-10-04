# UML and Relationships

How to read and draw class relationships, and how each maps to Java.

## Class Box

```text
┌──────────────────────────────┐
│ «interface» / {abstract} Name│
├──────────────────────────────┤
│ - field: Type                │   visibility: + public  - private  # protected  ~ package
│ - {static} counter: int      │
├──────────────────────────────┤
│ + operation(p: Type): Return │
└──────────────────────────────┘
```

## Relationship Notation

| Relationship | Text | PlantUML | Java | Meaning |
|--------------|------|----------|------|---------|
| Association | `A ──── B` | `A -- B` | field | knows / uses |
| Directed association | `A ───▶ B` | `A --> B` | field in A only | navigable one way |
| Aggregation | `Whole ◇──── Part` | `Whole o-- Part` | field; parts passed in | weak HAS-A, independent lifecycle |
| Composition | `Whole ◆──── Part` | `Whole *-- Part` | field; parts created and owned | strong HAS-A, bound lifecycle |
| Generalization | `Child ───▷ Parent` | `Parent <\|-- Child` | `extends` | IS-A |
| Realization | `Impl ┄┄┄▷ Interface` | `Interface <\|.. Impl` | `implements` | implements a contract |
| Dependency | `A ┄┄┄> B` | `A ..> B` | parameter / local / return | temporary use |

Reminders: diamonds sit at the **whole**; triangles point to the **parent/interface**; dashed = weaker (realization, dependency).

## Multiplicity

| Notation | Meaning | Java shape |
|----------|---------|------------|
| `1` | exactly one | non-null field |
| `0..1` | optional | nullable field / `Optional` getter |
| `*`, `0..*` | many | `List`/`Set`/`Map` |
| `1..*` | at least one | collection validated non-empty |

Read each end from the other class: `Customer 1 ──── 0..* Order` = "a customer has zero or more orders; each order has one customer".

## Choosing a Relationship

1. Is it permanently a kind of the other and fully substitutable? → generalization (otherwise do not inherit).
2. Does the whole create and exclusively own the part, and does the part die with it? → composition.
3. Does the whole group parts that exist independently or are shared? → aggregation.
4. Does one object merely use the other temporarily? → dependency.
5. Many-to-many with its own data (date, grade)? → an association class (`Enrollment`).

## Object Diagrams

Instances and links at one moment: `arun: Member ──── loan7: Loan ───▶ copy3: BookCopy`, each box with actual field values. Useful for explaining a specific scenario.

## Drawing in an Interview

- Main entities with 2–4 key fields; main operations only.
- Relationships with multiplicities; diamonds only where ownership matters.
- Interfaces at variation points and boundaries, with realizations.
- Keep it to one screen; add detail when asked.
