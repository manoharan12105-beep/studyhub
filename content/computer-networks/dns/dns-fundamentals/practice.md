# DNS Fundamentals — Practice

### P1. DNS port

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** DNS transport

Which port and transport do normal DNS queries use?

- A) TCP 80
- B) UDP 53
- C) UDP 67
- D) TCP 22

<details>
<summary>Answer</summary>

**Answer:** B) UDP 53

</details>

### P2. Read the name

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** hierarchy

For `api.payments.example.co.in`, identify the TLD, the domain registered by the company and the subdomain levels.

<details>
<summary>Answer</summary>

TLD `in` (with the public second level `co.in`); the registered domain is `example.co.in`; `payments` and `api` are subdomains.

</details>

### P3. Who answers?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** server roles

Which server type: (a) knows where `.com` servers are, (b) holds `example.com`'s A records, (c) caches answers for thousands of clients, (d) the resolver library inside your OS.

<details>
<summary>Answer</summary>

(a) Root server, (b) authoritative server, (c) recursive resolver, (d) stub resolver.

</details>

### P4. Non-authoritative

**Difficulty:** Medium · **Type:** Output · **Concepts:** nslookup output

`nslookup example.com` prints "Non-authoritative answer". Is that an error?

<details>
<summary>Answer</summary>

No. It means the answer came from a recursive resolver's cache rather than directly from the domain's authoritative server — the normal case.

</details>
