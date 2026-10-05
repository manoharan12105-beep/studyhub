# DNS Caching, TTL and Failures — Interview Questions

## Beginner

### Q1. What is a DNS TTL?

<details>
<summary>Answer</summary>

The time to live, in seconds, attached to each DNS record. Any cache (resolver, OS, browser) may reuse the answer for at most that long before asking again. Short TTLs allow quick changes; long TTLs reduce lookups and load.

</details>

### Q2. You can ping `8.8.8.8` but not `google.com`. What is wrong?

**Style:** Debugging

<details>
<summary>Answer</summary>

IP connectivity works (layers 1–3 are fine), so name resolution is failing: the configured DNS server is wrong, unreachable or down, or DNS (UDP/TCP 53) is blocked. Check with `nslookup google.com`, then try a public resolver (`nslookup google.com 1.1.1.1`); inspect the DNS settings from DHCP (`ipconfig /all`, `/etc/resolv.conf`) and the hosts file.

</details>

## Intermediate

### Q3. What is DNS propagation and why does it take time?

<details>
<summary>Answer</summary>

After a record changes at the authoritative server, resolvers around the world still hold the old answer in their caches until its TTL expires; there is no mechanism to push the change. So different users see the new value at different times. Lowering the TTL well in advance of a planned change shortens this window.

</details>

### Q4. What is negative caching?

<details>
<summary>Answer</summary>

Caching of "does not exist" answers (NXDOMAIN or no data). Resolvers keep them for the negative TTL given in the zone's SOA record. If you look up a name before creating it, you may keep getting NXDOMAIN for a while after it is created.

</details>

## Advanced

### Q5. A service migrated to a new IP; most clients moved within minutes, but one Java service kept calling the old IP for hours. Why?

**Style:** Scenario

<details>
<summary>Answer</summary>

That service did not re-resolve the name: either the JVM DNS cache TTL was configured very high (`networkaddress.cache.ttl=-1` caches forever), or it kept long-lived pooled connections open to the old IP, or the name was hard-coded in a hosts file. Fixes: a sensible DNS cache TTL, connection max-lifetime in pools so connections are re-established, and keeping the old server serving (or redirecting) during migrations.

</details>

### Q6. How would you plan a DNS change to move a website to a new server with minimal disruption?

**Style:** Scenario

<details>
<summary>Answer</summary>

Several days before (at least one old TTL ahead), lower the record's TTL to e.g. 300 s. Bring up the new server and test it directly (`curl --resolve`). Change the record, monitor traffic shifting to the new server, keep the old server running until requests stop, then raise the TTL again.

</details>
