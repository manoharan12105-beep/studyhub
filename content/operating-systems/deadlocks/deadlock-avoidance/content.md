# Deadlock Avoidance

**Module:** Deadlocks · **Interview priority:** Core

## Concept

**Deadlock avoidance** lets processes request resources freely, but before granting any request the OS checks whether the system would still be in a **safe state** afterwards. If granting would make the state **unsafe**, the process waits even if the resources are available right now.

It needs **advance information**: each process declares the **maximum** number of each resource type it may ever need.

## Why It Matters

Prevention's static rules waste resources. Avoidance keeps utilisation higher by looking ahead one request at a time. The ideas of **safe state** and **safe sequence** are the foundation of the [Banker's algorithm](../bankers-algorithm/content.md), a favourite calculation question.

## How It Works

### Safe state and safe sequence

A state is **safe** if there is at least one order of all processes — a **safe sequence** ⟨P_a, P_b, …⟩ — in which each process can get its remaining maximum need from the currently available resources **plus** the resources released by the processes before it in the sequence, finish, and release everything.

```text
 safe state    → a safe sequence exists → the OS can always avoid deadlock
 unsafe state  → no safe sequence       → deadlock is POSSIBLE (not certain)
 deadlock      ⊂ unsafe states
```

```text
 ┌───────────────────────────── all states ─┐
 │  safe states       ┌──── unsafe ───────┐  │
 │                    │   ┌─ deadlock ─┐  │  │
 │                    │   └────────────┘  │  │
 │                    └───────────────────┘  │
 └──────────────────────────────────────────┘
```

An unsafe state is not yet a deadlock: processes might release resources early or never request their maximum. But the OS can no longer **guarantee** finishing everyone, so avoidance never enters one.

### The avoidance rule

For each request: pretend to grant it, then check whether the new state is safe.

- Safe → grant.
- Unsafe → make the process **wait** and restore the old state.

### Algorithms

| Resource instances | Algorithm |
|--------------------|-----------|
| One instance of each type | **Resource-allocation graph with claim edges**: a claim edge P ⇢ R means P may request R in future. Grant a request only if converting it to an assignment edge creates no cycle (counting claim edges). |
| Multiple instances | **Banker's algorithm**: safety algorithm on Allocation, Max, Need and Available matrices. |

## Example

One resource type with **10 units**.

| Process | Max | Allocated | Need = Max − Allocated |
|---------|-----|-----------|------------------------|
| P0 | 7 | 3 | 4 |
| P1 | 4 | 2 | 2 |
| P2 | 6 | 2 | 4 |

Allocated = 7, so Available = 10 − 7 = **3**.

**Is it safe?** Work = 3. P0 needs 4 > 3, skip. P1 needs 2 ≤ 3 → finishes, Work = 3 + 2 = 5. P2 needs 4 ≤ 5 → Work = 7. P0 needs 4 ≤ 7 → Work = 10. Safe sequence **⟨P1, P2, P0⟩** (⟨P1, P0, P2⟩ also works). **Safe.**

**P2 requests 2 more units.** They are available (2 ≤ 3), but pretend to grant: Available = 1, P2 Allocated 4, Need 2. Now P0 needs 4, P1 needs 2, P2 needs 2 — all greater than 1. No process can be guaranteed to finish → **unsafe** → P2 must **wait**, even though the units are free.

**P2 requests 1 unit instead.** Available = 2, P2 Need 3. P1 (2 ≤ 2) → Work 4; P2 (3 ≤ 4) → Work 7; P0 → 10. Safe → **grant**.

## Comparison

| Aspect | Prevention | Avoidance | Detection and recovery |
|--------|-----------|-----------|------------------------|
| When it acts | Design time (rules) | Every request (run time) | Periodically, after the fact |
| Needs maximum demands in advance | No | **Yes** | No |
| Deadlock possible? | Never | Never | Yes — then recovered |
| Resource utilisation | Lowest | Medium | Highest |
| Run-time cost | None | Safety check per request | Detection runs + recovery losses |
| Example | Lock ordering | Banker's algorithm | Database deadlock detector |

## Important Points

- Avoidance grants a request only if the resulting state is **safe**.
- Safe state = a safe sequence exists. Unsafe ≠ deadlock, but deadlock ⊂ unsafe.
- Requires every process's **maximum** needs in advance.
- Single instances → RAG with claim edges; multiple instances → Banker's algorithm.
- A process may be made to wait even though the resources it asks for are free.

## Common Confusion

> [!WARNING]
> **"Unsafe state means deadlock."** An unsafe state means the OS cannot *guarantee* avoiding deadlock; processes might still finish if they need less than their declared maximum. Avoidance simply refuses to take that risk.

- **"If resources are available, the request is granted."** Not under avoidance: availability is necessary but not enough; the result must also be safe.
- **There can be several safe sequences.** Finding one is enough.

## Interview Perspective

- *"What is a safe state? Is an unsafe state a deadlock?"* — definition; no, deadlock ⊂ unsafe.
- *"Prevention vs avoidance?"* — static rules vs run-time safety check with advance knowledge.
- *"Why isn't avoidance used in general-purpose OSes?"* — maximum needs unknown, the process set changes constantly, and the check costs time.

## Quick Revision

- Grant only if the new state is safe.
- Safe = a safe sequence exists; unsafe = possible deadlock.
- Needs Max per process. Single instance → claim-edge RAG; many → Banker's.
- Free resources can still be refused.
