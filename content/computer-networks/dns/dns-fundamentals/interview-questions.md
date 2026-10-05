# DNS Fundamentals — Interview Questions

## Beginner

### Q1. What is DNS and why do we need it?

<details>
<summary>Answer</summary>

The Domain Name System translates domain names into IP addresses (and stores mail, alias and verification records). We need it because people use names while networks route by IP, and because it adds indirection: a service can change servers or IPs by updating DNS without changing clients. It is a distributed hierarchy so that no single server must know every name.

</details>

### Q2. What are root, TLD and authoritative name servers?

<details>
<summary>Answer</summary>

Root servers sit at the top of the hierarchy and refer resolvers to the right TLD servers. TLD servers (for `.com`, `.org`, `.in` …) refer them to the authoritative servers of the specific domain. Authoritative servers hold the domain's actual records and return definitive answers.

</details>

## Intermediate

### Q3. What is the difference between a recursive resolver and an authoritative server?

**Style:** Comparison

<details>
<summary>Answer</summary>

A recursive resolver (ISP, router, `1.1.1.1`) answers clients by doing the full lookup on their behalf — querying root, TLD and authoritative servers — and caches results. An authoritative server only answers for the zones it hosts, from its own data, and does not look anything up for others.

</details>

### Q4. Which transport and port does DNS use?

<details>
<summary>Answer</summary>

UDP port 53 for normal queries, because they are small and a single round trip is enough. TCP port 53 when a response is too large (truncated UDP answer) and for zone transfers (AXFR/IXFR). DNS over TLS uses TCP 853; DNS over HTTPS uses 443.

</details>

## Advanced

### Q5. Why is DNS designed as a hierarchy instead of one central database?

**Style:** Why

<details>
<summary>Answer</summary>

Scale, performance and administration. Billions of lookups per second could not be served by one database; the hierarchy spreads load, and caching at resolvers means most queries never reach the top. Delegation lets each organisation manage its own zone independently. Redundancy (multiple NS servers, anycast roots) removes single points of failure.

</details>
