# Functional Dependencies — Interview Questions

## Beginner

### Q1. What is a functional dependency?

<details>
<summary>Answer</summary>

A constraint `X → Y` meaning that any two rows with the same values of `X` must have the same values of `Y` — `X` determines `Y`. Example: `employee_id → employee_name`. FDs come from business rules and are used to identify keys and decide how to split tables during normalization.

</details>

### Q2. What is the difference between a partial and a transitive dependency?

<details>
<summary>Answer</summary>

A partial dependency is a non-key attribute depending on only part of a composite candidate key: with key `(student_id, course_id)`, `student_name` depends on `student_id` alone. A transitive dependency is a non-key attribute depending on the key through another non-key attribute: `emp_id → dept_id → dept_name`. 2NF removes partial dependencies; 3NF removes transitive ones.

</details>

### Q3. What is a trivial functional dependency?

<details>
<summary>Answer</summary>

One where the right side is a subset of the left side, such as `(A, B) → A`. It holds in every relation and carries no information. Normal-form definitions concern non-trivial dependencies.

</details>

## Intermediate

### Q4. What are Armstrong's axioms?

<details>
<summary>Answer</summary>

Inference rules that derive all FDs implied by a set: reflexivity (if `Y ⊆ X` then `X → Y`), augmentation (if `X → Y` then `XZ → YZ`) and transitivity (if `X → Y` and `Y → Z` then `X → Z`). They are sound (derive only valid FDs) and complete (derive all of them). Union, decomposition and pseudo-transitivity follow from them.

</details>

### Q5. How do you find the candidate keys of a relation from its FDs?

<details>
<summary>Answer</summary>

Attributes that appear on no right-hand side must be in every key; start with them and compute the closure. If the closure contains all attributes, that set is the only candidate key. Otherwise add other attributes one at a time (then pairs, …), compute closures, and keep the minimal sets whose closure is everything. Check minimality: no proper subset may also be a superkey.

</details>

### Q6. What is the closure of an attribute set and why is it useful?

<details>
<summary>Answer</summary>

`X⁺` is the set of all attributes functionally determined by `X`, computed by repeatedly applying FDs whose left side is contained in the current set. It tells you whether `X` is a superkey (`X⁺` = all attributes), whether an FD `X → Y` is implied (`Y ⊆ X⁺`), and helps compute minimal covers.

</details>

## Advanced

### Q7. Can you determine functional dependencies by looking at the data in a table?

<details>
<summary>Answer</summary>

Only partially. Data can refute an FD — `SELECT x FROM t GROUP BY x HAVING count(DISTINCT y) > 1` finds counterexamples — but it cannot prove one, because a future row may break it; small samples especially show accidental dependencies. FDs must come from the meaning of the data (business rules). Data profiling is useful to suggest candidates and find dirty data.

</details>

### Q8. What is a prime attribute, and why does it matter for 3NF?

<details>
<summary>Answer</summary>

An attribute that belongs to at least one candidate key. 3NF allows an FD `X → A` where `X` is not a superkey if `A` is prime; BCNF does not. So a relation with keys `{A,B}`, `{B,C}`, `{B,D}` and FD `C → D` is in 3NF (`D` is prime) but not BCNF (`C` is not a superkey).

</details>

### Q9. What is a minimal (canonical) cover?

<details>
<summary>Answer</summary>

An equivalent set of FDs with single attributes on the right, no extraneous attributes on the left and no redundant FDs. It is the input to the 3NF synthesis algorithm (one table per FD in the cover, plus a key table if needed), which yields a lossless, dependency-preserving 3NF design.

</details>
