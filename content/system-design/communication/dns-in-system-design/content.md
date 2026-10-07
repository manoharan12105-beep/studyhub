# DNS in System Design

**Module:** Communication and APIs · **Interview priority:** Frequently asked

## What Is It?

People use names (`photoapp.com`); machines connect to IP addresses (`203.0.113.10`). The **Domain Name System (DNS)** is the Internet's distributed phone book that translates one into the other. For system design, DNS matters in three ways: it is the first hop of every request, its caching decides how fast changes take effect, and it can route users to different servers or regions.

For the protocol details (record types, packet formats) see the Computer Networks lessons [DNS Fundamentals](../../../computer-networks/dns/dns-fundamentals/content.md) and [DNS Resolution](../../../computer-networks/dns/dns-resolution-process/content.md).

## Why It Exists

A single list of every name could not work:

- There are over 350 million registered domains; no browser could ship or search such a list.
- Addresses change (a site moves hosting provider), and every copy of the list would need updating.
- One central server would be a single point of failure for the entire Internet.

So DNS is **hierarchical** (root → top-level domain → the domain's own servers), **distributed** (each organisation runs its own part) and **heavily cached**.

## How It Works

### A lookup

```text
Browser cache? → OS cache? → Resolver (ISP or public, e.g. 8.8.8.8) cache?
   miss ↓
Resolver → Root server     "who handles .com?"            → TLD servers for .com
Resolver → .com TLD server "who handles photoapp.com?"    → photoapp.com's name servers
Resolver → Authoritative   "address of photoapp.com?"     → 203.0.113.10 (TTL 300 s)
Resolver caches the answer and returns it; the browser connects to 203.0.113.10
```

There are 13 root server **identities** (named A to M), run by 12 independent organisations and served from well over a thousand physical instances worldwide through anycast, so the root is neither small nor fragile. A domain like `example.com` and its subdomains (`docs.example.com`, `api.example.com`) are managed together as a **zone** on the domain's authoritative name servers.

### TTL: how long answers are cached

Every record has a **time to live (TTL)**. Resolvers and clients reuse the answer until it expires.

| TTL | Benefit | Cost |
|-----|---------|------|
| Long (hours, days) | Fewer lookups, faster first requests, less load on name servers | Changes (moving servers, failover) take hours to reach everyone |
| Short (30–300 s) | Changes take effect quickly | More lookups, slightly slower first requests |

Before a planned migration, teams lower the TTL days in advance, switch the record, then raise it again. Some clients and resolvers ignore TTLs and cache longer, so old servers should keep working for a while after a change.

### DNS as a routing tool

| Technique | How it works | Used for |
|-----------|--------------|----------|
| Multiple A records | Return several IPs; clients pick one | Crude load spreading |
| Weighted records | Return IPs in proportion to weights | Gradual migrations, canaries |
| Geo / latency-based DNS | Answer depends on where the resolver is | Send users to the nearest region |
| Health-checked failover | DNS provider stops returning unhealthy endpoints | Region failover |

With a load balancer in front, DNS returns the **load balancer's** address, not individual servers'. DNS-level balancing is coarse: caching means clients keep using an answer until the TTL expires, so it cannot react within seconds. Use it across regions; use load balancers within a region.

**Think about it:** a region fails and DNS failover switches `api.example.com` to the backup region. The record's TTL was 3,600 seconds. What do users experience?

<details>
<summary>Answer</summary>

Resolvers that cached the old answer keep sending users to the dead region for up to an hour (longer if they ignore TTLs). Clients that retry or re-resolve recover sooner. This is why failover records use short TTLs (30–60 s), and why anycast or global load balancers that keep one stable IP are used when faster failover is needed.

</details>

## What Can Fail

- **DNS provider outage:** nobody can resolve the name even though servers are healthy. Mitigation: two DNS providers or a highly available managed service.
- **Stale caches after a change:** some users reach the old address until TTLs expire.
- **Misconfiguration:** a wrong record or an expired domain takes the whole service down — DNS changes deserve the same review as code changes.

## Common Traps

> [!WARNING]
> **Common trap:** "DNS load balancing is as good as a load balancer." DNS answers are cached and cannot see server load or health within seconds; it is suited to coarse, cross-region routing.

## Interview Follow-up

- *"Where is DNS cached?"* In the browser, the operating system and the recursive resolver (and sometimes in application runtimes such as the JVM).

## Key Takeaways

- DNS turns names into addresses through a hierarchy: resolver → root → TLD → authoritative name server.
- Answers are cached for the record's TTL: long TTLs are fast and cheap, short TTLs make changes and failover quick.
- DNS can route by weight, geography and health, but only coarsely; load balancers handle fine-grained balancing.
- DNS is a dependency of every request: make it redundant and change it carefully.
