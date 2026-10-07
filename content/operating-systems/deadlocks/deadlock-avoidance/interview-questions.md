# Deadlock Avoidance — Interview Questions

## Beginner

### Q1. What is deadlock avoidance?

**Style:** Direct

<details>
<summary>Answer</summary>

A strategy in which the OS, knowing each process's maximum resource needs in advance, examines every resource request and grants it only if the system remains in a safe state afterwards. If granting would lead to an unsafe state, the requesting process waits. The Banker's algorithm is the standard avoidance algorithm.

</details>

### Q2. What is a safe state?

**Style:** Direct

<details>
<summary>Answer</summary>

A state in which there is at least one safe sequence: an ordering of all processes such that each process's remaining maximum need can be satisfied by the currently available resources plus those released by all processes earlier in the sequence. In a safe state, the OS can always schedule allocations so that every process finishes.

</details>

### Q3. Is an unsafe state the same as a deadlock?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Every deadlocked state is unsafe, but an unsafe state is not necessarily deadlocked. Unsafe means the OS cannot guarantee that all processes finish if they all request their maximum; they may still finish if some request less or release early. Avoidance refuses to enter unsafe states because it cannot rule deadlock out.

</details>

## Intermediate

### Q4. What information does deadlock avoidance require, and why is that a problem?

**Style:** Why

<details>
<summary>Answer</summary>

Each process must declare, in advance, the maximum number of instances of each resource type it may need, and the number of processes and resources should be fixed. Real programs rarely know their maximum needs, processes come and go constantly, and declaring the worst case leads to over-conservative decisions. That is why avoidance is mostly a theoretical tool and seldom used in general-purpose OSes.

</details>

### Q5. With 10 units, P0 (max 7, holds 3), P1 (max 4, holds 2), P2 (max 6, holds 2): is the state safe? Should a request by P2 for 2 more units be granted?

**Style:** Calculation

<details>
<summary>Answer</summary>

Available = 10 − 7 = 3; needs are 4, 2, 4. P1 can finish (2 ≤ 3) → 5 available; P2 (4 ≤ 5) → 7; P0 (4 ≤ 7) → 10. Safe sequence ⟨P1, P2, P0⟩ — **safe**.
If P2 gets 2 more: available 1, needs 4, 2, 2 — nobody fits → **unsafe**, so the request is **not granted**; P2 waits, even though 2 units are free.

</details>

### Q6. How does avoidance work when each resource type has a single instance?

**Style:** How

<details>
<summary>Answer</summary>

Use a resource-allocation graph with **claim edges** (dashed P ⇢ R: P may request R in the future). When P actually requests R, the claim edge becomes a request edge; the request is granted only if converting it into an assignment edge R → P does not create a cycle in the graph (claim edges included). A cycle would mean an unsafe state. Cycle detection takes O(n²) for n processes.

</details>

## Advanced

### Q7. Compare prevention, avoidance and detection in terms of utilisation and cost.

**Style:** Comparison

<details>
<summary>Answer</summary>

**Prevention** has no run-time cost but the lowest utilisation, because static rules (ordering, all-at-once requests) hold resources unnecessarily or restrict requests. **Avoidance** gives better utilisation but needs maximum demands and a safety check on every request. **Detection and recovery** allows the highest utilisation (anything goes) but pays for periodic detection and for recovery — aborted or rolled-back work.

</details>

### Q8. Why might avoidance make a process wait even though the resources it requests are free?

**Style:** Why

<details>
<summary>Answer</summary>

Because granting them could leave too few resources for any process to reach its declared maximum and finish. The free units are kept as a reserve so that at least one process can always complete and release its resources, which in turn lets the next one complete. Granting now could trap everyone later.

</details>
