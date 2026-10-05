# DNS Resolution: Recursive and Iterative Queries

**Module:** DNS · **Interview priority:** Core

## What Is It?

**DNS resolution** is the process of turning a name into an answer. Two kinds of queries work together:

- **Recursive query:** the client says "give me the **final** answer (or an error)". Your device sends this to its recursive resolver.
- **Iterative query:** the server answers with the best it knows — often a **referral** ("ask these servers instead"). The recursive resolver uses these when walking root → TLD → authoritative.

## Why It Exists

Clients should be simple: one question, one answer. The heavy work — following the hierarchy, retrying, validating, caching — is done once by a recursive resolver that serves many clients. Iterative queries keep root and TLD servers light: they never chase answers for anyone.

## How It Works

### "What happens when I type example.com?" — the DNS part

Assume every cache is empty:

```text
 Browser / OS (stub)        Recursive resolver            Root      .com TLD     example.com
                                                          server     server     authoritative
 1. A? example.com ───────────►│
                               │ 2. A? example.com ──────►│
                               │◄── referral: .com NS ────│
                               │ 3. A? example.com ─────────────────►│
                               │◄── referral: example.com NS ────────│
                               │ 4. A? example.com ──────────────────────────────►│
                               │◄── A 203.0.113.10  TTL 3600 ─────────────────────│
 5. A 203.0.113.10 ◄───────────│   (cached for up to 3600 s)
```

| Step | Query | Type | Answer |
|------|-------|------|--------|
| 1 | Stub → resolver: "A record for `example.com`?" | **Recursive** | Will be the final answer |
| 2 | Resolver → root server | Iterative | Referral: the `.com` TLD servers (NS + their addresses, "glue") |
| 3 | Resolver → `.com` TLD server | Iterative | Referral: `example.com`'s authoritative servers |
| 4 | Resolver → authoritative server | Iterative | **Answer**: `A 203.0.113.10`, TTL 3600 |
| 5 | Resolver → stub | Response to the recursive query | The answer; resolver and stub both cache it |

Then the browser opens a TCP connection to `203.0.113.10`.

### Caching at every layer

```text
browser cache → OS cache (+ hosts file) → router/resolver cache → (root → TLD → authoritative)
```

Each answer has a **TTL**; caches may reuse it until the TTL expires. In practice the root and TLD steps are almost always cached (their NS records have long TTLs), so a typical lookup costs **one** query from the resolver — or **zero** if the answer is already cached. A full lookup from a cold cache costs several round trips, often 20–200 ms.

### A CNAME in the chain

If `www.example.com` is a **CNAME** to `example.cdn.net`, the resolver follows the alias and resolves `example.cdn.net` too, returning both records. Each extra name can mean extra lookups.

### Recursive vs iterative

| | Recursive | Iterative |
|---|-----------|-----------|
| Who asks | Stub → recursive resolver | Recursive resolver → root/TLD/authoritative |
| Response | The final answer or an error (NXDOMAIN, SERVFAIL) | The answer if known, otherwise a referral |
| Work done by | The server receiving it | The client sending it |
| Burden | On the resolver | Spread across the hierarchy |

### Failure answers

| Response | Meaning |
|----------|---------|
| **NOERROR** with records | Success |
| **NXDOMAIN** | The name does not exist |
| **NOERROR, no answer** (NODATA) | The name exists but has no record of that type (e.g. no AAAA) |
| **SERVFAIL** | The resolver could not get an answer (authoritative servers down, DNSSEC failure) |
| **REFUSED** | The server will not answer this client |
| Timeout | No response from the resolver at all |

Details and scenarios: [DNS Caching, TTL and Failures](../dns-caching-ttl-and-failures/content.md).

## Real World

- The first request to a new API host in a Spring Boot app includes a DNS lookup; the JVM caches successful lookups (by default 30 s when no security manager is set; configurable with `networkaddress.cache.ttl`).
- In Kubernetes, `my-service.my-namespace.svc.cluster.local` is resolved by CoreDNS inside the cluster; names outside the cluster are forwarded upstream.
- `dig +trace example.com` performs the iterative walk itself and prints every referral.

## Common Traps

- **"My laptop contacts the root servers."** The recursive resolver does; your laptop sends one recursive query.
- **"Recursive means the root server recurses."** Root and TLD servers answer iteratively with referrals.
- **"Every lookup walks the whole hierarchy."** Caching makes full walks rare.

## Interview Follow-up

- *"Recursive vs iterative DNS query?"* Final answer requested vs referral accepted — see the table.
- *"Why is the first visit to a site slower?"* Cold caches: DNS walk + TCP + TLS handshakes.

## Key Takeaways

- Stub → recursive resolver (recursive query) → root → TLD → authoritative (iterative queries, referrals).
- Answers are cached at the browser, OS and resolver for their TTL.
- CNAMEs add steps; NXDOMAIN = no such name; SERVFAIL = resolver could not get an answer.
