# DNS Resolution — Interview Questions

## Beginner

### Q1. Walk through how `example.com` is resolved with empty caches.

**Style:** What happens internally

<details>
<summary>Answer</summary>

The OS stub resolver sends a recursive query to the configured recursive resolver. The resolver asks a root server, which refers it to the `.com` TLD servers; asks a `.com` server, which refers it to `example.com`'s authoritative servers; asks an authoritative server, which returns the A (or AAAA) record with a TTL. The resolver caches it and returns it to the client, which caches it too and connects to that IP.

</details>

## Intermediate

### Q2. What is the difference between a recursive and an iterative DNS query?

**Style:** Comparison

<details>
<summary>Answer</summary>

In a recursive query the client asks the server for the complete answer and the server does all the work (stub → resolver). In an iterative query the server replies with the best information it has — the answer or a referral to other servers — and the asker follows up itself (resolver → root/TLD/authoritative). Root and TLD servers only answer iteratively.

</details>

### Q3. Where is DNS data cached?

<details>
<summary>Answer</summary>

In the browser, in the operating system's resolver cache (alongside the hosts file), in the application runtime (e.g. the JVM's address cache), in the recursive resolver (router, ISP, public resolver), and resolvers also cache referral data for TLDs and domains. Each record is cached for at most its TTL (negative answers per the SOA's negative TTL).

</details>

## Advanced

### Q4. What does SERVFAIL mean, and how is it different from NXDOMAIN?

**Style:** Comparison

<details>
<summary>Answer</summary>

NXDOMAIN is a definitive answer from the authoritative side: the name does not exist. SERVFAIL means the resolver could not obtain an answer — the authoritative servers were unreachable or misconfigured (lame delegation), or DNSSEC validation failed. NXDOMAIN points to a wrong or missing name; SERVFAIL points to a broken DNS setup or infrastructure.

</details>

### Q5. Why might the very first request a service makes to another API be slower than later ones?

**Style:** Why

<details>
<summary>Answer</summary>

The first request pays for a DNS lookup (possibly a full iterative resolution if caches are cold), a TCP handshake, a TLS handshake and TCP slow start. Later requests reuse the cached DNS answer and a pooled, warmed-up connection. Warm-up requests, connection pools and keep-alive remove most of this cost.

</details>
