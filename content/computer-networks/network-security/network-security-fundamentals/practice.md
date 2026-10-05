# Network Security Fundamentals — Practice

### P1. AuthN or AuthZ?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** authentication vs authorization

A logged-in user tries to open the admin dashboard and is refused. Which failed, and which status code fits?

- A) Authentication, 401
- B) Authorization, 403
- C) Authentication, 403
- D) Authorization, 404

<details>
<summary>Answer</summary>

**Answer:** B) Authorization, 403

**Explanation:** The user's identity is known (authenticated), but the user lacks permission.

</details>

### P2. Classify

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** AuthN vs AuthZ

Authentication or authorization: (a) entering an OTP, (b) a security group allowing port 5432 from the app subnet, (c) an SSH server checking your key, (d) "users can edit only their own profile".

<details>
<summary>Answer</summary>

(a) authentication, (b) authorization (network access policy), (c) authentication, (d) authorization.

</details>

### P3. CIA mapping

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** CIA triad

Which CIA goal does each protect: (a) HTTPS encryption, (b) a DDoS mitigation service, (c) a digital signature on a software update, (d) a second database replica in another zone?

<details>
<summary>Answer</summary>

(a) Confidentiality (and integrity), (b) availability, (c) integrity (and authenticity), (d) availability.

</details>

### P4. Design review

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** least privilege, segmentation

A startup runs its Spring Boot app and PostgreSQL on one public VM with ports 22, 5432 and 8080 open to `0.0.0.0/0`. List the network-level improvements.

<details>
<summary>Answer</summary>

Put a load balancer (443 only) in a public subnet and move the app and database to private subnets; allow 8080 only from the load balancer and 5432 only from the app; close SSH to the Internet (bastion, VPN or a session manager, keys only); terminate TLS at the load balancer; use a least-privilege DB user; enable logging and alerts.

</details>
