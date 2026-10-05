# DNS Caching, TTL, Propagation and Failure Scenarios

**Module:** DNS · **Interview priority:** Core

## What Is It?

Every DNS answer carries a **TTL** (time to live, in seconds) that says how long any cache may reuse it. Caching makes DNS fast and scalable — and explains why DNS changes take time to be seen everywhere ("propagation") and why some DNS failures look intermittent.

## Why It Exists

Without caching, every connection would trigger a chain of queries to root, TLD and authoritative servers. With caching, most lookups are answered from the browser, the OS or the resolver in under a millisecond. The TTL is the owner's trade-off between **speed/load** (long TTL) and **agility** (short TTL — changes take effect quickly).

## How It Works

### TTL in practice

```text
api.example.com.   300   IN  A  203.0.113.10
                   └ any cache may reuse this answer for up to 300 s (5 min)
```

- A resolver that cached the record **counts the TTL down** and returns the remaining value to clients.
- Typical TTLs: 60–300 s for records that may change (load balancers, failover), 3,600 s–1 day for stable ones, NS records of TLDs: days.

### Negative caching

"This name does not exist" (NXDOMAIN) is also cached — for the **negative TTL** from the zone's SOA record. If you query a name *before* creating it, resolvers may keep answering NXDOMAIN for a while after you add it.

### "DNS propagation"

There is no push mechanism: when you change a record at the authoritative server, every resolver that cached the **old** answer keeps using it until its TTL runs out. Users of different ISPs therefore see the change at different times.

**Plan a migration:**

1. Days before: lower the TTL (e.g. 86,400 → 300 s) and wait at least the **old** TTL.
2. Change the record. Caches now expire within 5 minutes.
3. Keep the old server running until traffic stops arriving.
4. Raise the TTL again.

Changing **NS** records (moving DNS providers) is slower: the TLD's NS TTL (often 1–2 days) applies.

### Where caches live

| Cache | How to clear |
|-------|--------------|
| Browser | Chrome: `chrome://net-internals/#dns` |
| OS | Windows `ipconfig /flushdns`; Linux with systemd-resolved `resolvectl flush-caches` |
| JVM | `networkaddress.cache.ttl` (default 30 s without a security manager); negative 10 s |
| Recursive resolver | Only its operator; you wait for the TTL |

## DNS Failure Scenarios

| Symptom | Likely cause | How to confirm |
|---------|--------------|----------------|
| **Can ping `8.8.8.8` but not `google.com`** | DNS resolution failing: wrong/unreachable DNS server, DNS blocked by a firewall, resolver down | `nslookup google.com` fails or times out; try another resolver: `nslookup google.com 1.1.1.1` |
| `NXDOMAIN` for a name that should exist | Typo; record not created; querying a split-horizon internal name from outside; negative cache after querying too early | Query the authoritative server directly: `dig @ns1.provider.net name` |
| `SERVFAIL` | Authoritative servers unreachable or misconfigured (lame delegation), DNSSEC failure | `dig +trace name`; try a different resolver |
| Timeout | Resolver unreachable (wrong IP from DHCP, firewall blocks UDP 53) | `nslookup name <other resolver>` works? |
| Some users see the old site | Cached old record (TTL not yet expired) | Compare answers from several resolvers; check the TTL |
| Works on your laptop, not in the container/VM | Different `/etc/resolv.conf`; internal names only resolvable via the company DNS | `cat /etc/resolv.conf`, `getent hosts name` inside the container |
| Works with IP in the URL, not with the name | DNS — or the server needs the `Host` header/SNI to choose the site | Use `curl --resolve name:443:IP https://name/` |
| Name resolves to a wrong/old IP on one machine | Entry in the hosts file | Check `/etc/hosts` or `C:\Windows\System32\drivers\etc\hosts` |

### Split-horizon DNS

Companies often answer the same name differently inside and outside (internal IP for employees, public IP for others) or have internal-only zones (`corp.internal`). A laptop off the VPN cannot resolve them — a common "works in the office, not at home" problem.

## Real World

- Cloud failover (Route 53 health checks) relies on short TTLs so clients move to the healthy region quickly.
- Some clients and runtimes ignore TTLs (old JVM settings caching forever), so they keep connecting to a decommissioned IP — set reasonable DNS cache TTLs in long-running services.
- DNS is a frequent root cause in large outages because almost everything depends on it.

## Common Traps

- **"DNS propagation is a process that pushes changes."** It is only caches expiring.
- **"Lowering the TTL takes effect immediately."** Resolvers that cached the record with the old TTL keep it until that old TTL expires.
- **"If ping by IP works, the network is fine."** Layers 1–3 are fine; name resolution may still be broken.

## Interview Follow-up

- *"You changed a DNS record an hour ago and some users still reach the old server. Why?"* Their resolvers cached the old answer and the TTL has not expired.
- *"Can ping an IP but not a domain — why?"* DNS; see the first scenario.

## Key Takeaways

- TTL = how long caches may reuse an answer; negative answers are cached too (SOA negative TTL).
- "Propagation" = waiting for old cached answers to expire; lower TTLs before planned changes.
- Ping by IP works but not by name → DNS problem: check the resolver, try another one, check hosts files.
- NXDOMAIN = name missing; SERVFAIL = DNS infrastructure problem; timeout = resolver unreachable.
