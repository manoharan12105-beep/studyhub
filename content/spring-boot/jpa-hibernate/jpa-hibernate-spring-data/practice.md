# JPA vs Hibernate vs Spring Data JPA — Practice

### P1. Which layer?

**Difficulty:** Easy · **Type:** MCQ

Which statement is correct?

- A) Spring Data JPA is a JPA provider like Hibernate
- B) JPA is a specification; Hibernate implements it; Spring Data JPA builds repositories on top of JPA
- C) Hibernate is a specification; JPA implements it
- D) Spring Data JPA generates SQL without Hibernate

<details>
<summary>Answer</summary>

**Answer:** B) JPA is a specification; Hibernate implements it; Spring Data JPA builds repositories on top of JPA

**Explanation:** The three are layered, not alternatives.

</details>

### P2. Place the responsibility

**Difficulty:** Medium · **Type:** Conceptual

Which layer is responsible for each: (a) parsing `findByEmailAndActiveTrue`; (b) defining `@OneToMany`; (c) generating `select ... from customer c1_0 where ...`; (d) deciding that a modified managed entity needs an UPDATE.

<details>
<summary>Answer</summary>

(a) Spring Data JPA (query derivation). (b) JPA specification (`jakarta.persistence`). (c) Hibernate (SQL generation for the dialect). (d) Hibernate (dirty checking, as required by JPA semantics).

</details>

### P3. Explain your stack

**Difficulty:** Easy · **Type:** Scenario

An interviewer asks: "Which ORM did you use in your project?" Your project uses `JpaRepository` interfaces and PostgreSQL. Give a precise answer.

<details>
<summary>Answer</summary>

"Spring Data JPA repositories over JPA, with Hibernate as the JPA provider and PostgreSQL through HikariCP." Then mention specifics you handled — derived queries and `@Query` JPQL, transactions in services, fetch strategies to avoid N+1.

</details>
