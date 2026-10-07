# Consistent Hashing — Practice

### P1. Find the owner

**Difficulty:** Easy · **Type:** Output · **Concepts:** ring lookup

Ring 0–99. Nodes at A = 10, B = 40, C = 75. Keys hash to 5, 12, 40, 60 and 90. Which node owns each (clockwise, wrapping)?

<details>
<summary>Answer</summary>

5 → A (next clockwise is 10). 12 → B (40). 40 → B (a key exactly at a node's position belongs to that node). 60 → C (75). 90 → wraps past 99 to A (10).

</details>

### P2. Add a node

**Difficulty:** Medium · **Type:** Output · **Concepts:** key movement

Same ring; node D is added at 55. Which of the keys in P1 move, and to where?

<details>
<summary>Answer</summary>

Only keys between B (40) and D (55) that belonged to C move to D. Key 60 is after 55, so it stays with C. None of the five keys move — keys between 41 and 55 would have moved from C to D.

</details>

### P3. Movement comparison

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** modulo vs ring

A cache cluster grows from 9 to 10 nodes. Roughly what fraction of keys move with modulo hashing, and with consistent hashing?

<details>
<summary>Answer</summary>

Modulo: a key stays when `h % 9 == h % 10`, which holds for about 9 in 90 keys → about **90 %** move. Consistent hashing: about **1/10 = 10 %** move.

</details>

### P4. Why virtual nodes

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** virtual nodes

Give two benefits of placing each server at 200 points on the ring instead of 1.

<details>
<summary>Answer</summary>

(1) Even load: each server owns many small arcs, so its share of keys is close to 1/N. (2) When a server fails or leaves, its keys are spread across many other servers instead of all landing on one neighbour. (Also: servers can be weighted by giving them more points.)

</details>
