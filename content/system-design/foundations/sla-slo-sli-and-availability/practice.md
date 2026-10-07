# SLA, SLO, SLI and Availability Math — Practice

### P1. Which is which?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** SLI, SLO, SLA

"We promise customers 99.5 % monthly uptime or refund 10 % of the bill." This is:

- A) An SLI
- B) An SLO
- C) An SLA
- D) An error budget

<details>
<summary>Answer</summary>

**Answer:** C) An SLA

It is a contract with a penalty.

</details>

### P2. Downtime budget

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** nines

How many minutes of downtime does a 99.95 % SLO allow in a 30-day month?

<details>
<summary>Answer</summary>

30 × 24 × 60 = 43,200 minutes. 0.05 % of that = **21.6 minutes**.

</details>

### P3. Series path

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** series availability

A request goes through a load balancer (99.99 %), an API (99.95 %) and a database (99.9 %). What is the path's availability?

<details>
<summary>Answer</summary>

0.9999 × 0.9995 × 0.999 ≈ 0.9984 → **≈ 99.84 %**.

</details>

### P4. Redundant pair

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** parallel availability

You run two independent copies of a 99.5 % service behind a load balancer; either copy can serve. What is the availability of the pair (ignoring the load balancer)?

<details>
<summary>Answer</summary>

1 − (0.005 × 0.005) = 1 − 0.000025 = **99.9975 %**.

</details>

### P5. The hidden assumption

**Difficulty:** Hard · **Type:** Failure · **Concepts:** independence of failures

The pair in P4 runs in the same rack and both received the same release at the same time. Why might real availability be close to 99.5 %, not 99.9975 %?

<details>
<summary>Answer</summary>

The calculation assumes independent failures. A shared rack (power, switch), a shared zone, or a shared bad release make both copies fail together, so the pair behaves like one machine. Spread copies across racks or zones and roll out releases gradually to keep failures independent.

</details>
