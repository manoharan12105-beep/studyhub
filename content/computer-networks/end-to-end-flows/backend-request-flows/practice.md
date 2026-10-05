# Backend Request Flows — Practice

### P1. Who terminates TLS?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** TLS termination

In a typical cloud setup, which component usually holds the public certificate and terminates HTTPS for a Spring Boot API?

- A) PostgreSQL
- B) The load balancer
- C) The DNS server
- D) The browser

<details>
<summary>Answer</summary>

**Answer:** B) The load balancer

</details>

### P2. Map the error

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** errors by hop

Which hop or layer: (a) `UnknownHostException: inventory.internal`, (b) `Connection is not available, request timed out after 30000ms` (HikariCP), (c) `no pg_hba.conf entry for host "10.0.1.12"`, (d) browser console: "blocked by CORS policy".

<details>
<summary>Answer</summary>

(a) DNS / service discovery. (b) The application's DB pool is exhausted (slow queries or leaks), not the network. (c) Network reached PostgreSQL; its client-authentication rules reject that IP. (d) The API's CORS response headers do not allow the frontend's origin (browser enforcement).

</details>

### P3. Latency budget

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** round trips

An endpoint calls service A (8 ms) and service B (12 ms) independently, then runs 3 sequential queries (1 ms each). Client ↔ LB RTT is 50 ms (connection open); LB ↔ app adds 1 ms. Estimate total latency with sequential vs parallel service calls.

<details>
<summary>Answer</summary>

Sequential: 50 + 1 + 8 + 12 + 3 = **74 ms**. Parallel: 50 + 1 + 12 + 3 = **66 ms**.

</details>

### P4. Design the rules

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** network segmentation

List the network rules for: Internet → LB (443), LB → app instances (8080), app → PostgreSQL (5432), admins → app instances (SSH), and nothing else.

<details>
<summary>Answer</summary>

LB security group: inbound TCP 443 from `0.0.0.0/0`. App security group: inbound TCP 8080 only from the LB's security group; inbound 22 only from the bastion/VPN security group (or no SSH at all with a session manager). DB security group: inbound TCP 5432 only from the app's security group. Database and app in private subnets; outbound Internet for the app via a NAT gateway if needed. Default deny elsewhere.

</details>
