# The Building Blocks of a System — Practice

### P1. Match the block

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** building blocks

Match each need to a block: (a) send a welcome email after signup without slowing signup, (b) serve product images quickly worldwide, (c) store 10 TB of PDF invoices, (d) spread traffic across 8 servers, (e) avoid repeating a 12-table join on every page view.

<details>
<summary>Answer</summary>

(a) Message queue, (b) CDN, (c) object storage, (d) load balancer, (e) cache.

</details>

### P2. Sync or async

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** sync vs async

Which operation should be synchronous in a ride-hailing app?

- A) Sending a trip receipt by email
- B) Updating the driver's monthly earnings report
- C) Confirming to the rider that a driver accepted the trip
- D) Recording analytics about app usage

<details>
<summary>Answer</summary>

**Answer:** C) Confirming to the rider that a driver accepted the trip

The rider is waiting for that answer; the others can happen later.

</details>

### P3. Direct database access

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** API layer

A team proposes letting the mobile app connect directly to the database "to save a network hop". Give three reasons to refuse.

<details>
<summary>Answer</summary>

(1) Credentials would ship inside every app and could be extracted. (2) The app could run any query, including expensive or destructive ones, with no authorisation per user. (3) Any schema change would break installed apps that cannot be updated instantly. Also: no central place for caching, validation or rate limiting, and database connection limits would be exhausted by millions of devices.

</details>
