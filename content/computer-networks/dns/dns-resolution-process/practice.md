# DNS Resolution — Practice

### P1. Who sends recursive queries?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** recursive query

Which query is normally recursive?

- A) Resolver → root server
- B) Resolver → TLD server
- C) Laptop → its configured resolver
- D) Resolver → authoritative server

<details>
<summary>Answer</summary>

**Answer:** C) Laptop → its configured resolver

</details>

### P2. Order the steps

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** resolution order

Order (cold cache): (a) authoritative returns A record, (b) root refers to `.org` servers, (c) laptop asks resolver, (d) TLD refers to `wikipedia.org` servers, (e) resolver returns answer and caches it.

<details>
<summary>Answer</summary>

(c) → (b) → (d) → (a) → (e).

</details>

### P3. Warm cache

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** caching

The resolver already cached the `.com` NS records (TTL 2 days) but not `shop.example.com`. Which servers does it contact now?

<details>
<summary>Answer</summary>

It skips the root and goes straight to a `.com` TLD server (unless `example.com`'s NS records are also cached, in which case it asks `example.com`'s authoritative server directly).

</details>

### P4. Interpret the answer

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** NXDOMAIN vs SERVFAIL

(a) `nslookup shopp.example.com` → "Non-existent domain". (b) `nslookup api.partner.com` → "Server failed". What do they suggest?

<details>
<summary>Answer</summary>

(a) NXDOMAIN — the name does not exist (here a typo). (b) SERVFAIL — the resolver could not get an answer: `partner.com`'s authoritative servers may be down or misconfigured, or DNSSEC validation failed. Try another resolver and check the partner's NS servers.

</details>
