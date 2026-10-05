# DNS Fundamentals: The Internet's Phone Book

**Module:** DNS · **Interview priority:** Core

## What Is It?

The **Domain Name System (DNS)** translates human-friendly **names** (`api.example.com`) into the **IP addresses** computers use (`203.0.113.10`, `2001:db8::10`), and stores other data about domains (mail servers, verification records, aliases). It is a **distributed, hierarchical database** spread across millions of servers, queried mostly over **UDP port 53**.

## Why It Exists

- People remember names, not numbers.
- **Indirection:** a service can move to new servers, clouds or load balancers by changing DNS, without changing any client.
- **Scale:** in the early ARPANET, every host downloaded one file (`HOSTS.TXT`) listing all names. That could not scale, so DNS (1983) split the namespace into a hierarchy where each organisation manages its own part.

## How It Works

### The domain hierarchy

Names are read **right to left**, from the most general to the most specific:

```text
                         . (root)
           ┌─────────────┼──────────────┐
          com            org            in            ← top-level domains (TLDs)
       ┌───┴────┐         │           ┌──┴──┐
    example   google    wikipedia    co    gov        ← second-level domains
       │                              │
  api, www, mail                    example            ← subdomains / hosts
```

`api.example.com.` — the final dot is the (usually hidden) **root**.

| Level | Example | Who runs it |
|-------|---------|-------------|
| **Root** | `.` | 13 root server identities (`a.root-servers.net` … `m.root-servers.net`), each served by many **anycast** instances worldwide |
| **TLD** | `.com`, `.org`, `.in`, `.dev` | Registries (e.g. Verisign for `.com`) |
| **Second-level domain** | `example.com` | Registered by you through a registrar |
| **Subdomain** | `api.example.com` | You, in your zone |

### Zones and delegation

A **zone** is the part of the namespace one organisation administers. A parent zone **delegates** a child by publishing **NS records** that name the child's authoritative servers:

- The root zone says: "for `com`, ask these servers" (NS records).
- The `com` zone says: "for `example.com`, ask `ns1.dnsprovider.net`".
- The `example.com` zone holds the actual records: `api.example.com A 203.0.113.10`.

### The four kinds of DNS servers

| Server | Role |
|--------|------|
| **Stub resolver** | The small client in your OS/browser; asks one recursive resolver and waits for a final answer |
| **Recursive resolver** | Does the work: follows referrals from root → TLD → authoritative, caches results. Your ISP's resolver, your router, or public ones (`1.1.1.1`, `8.8.8.8`) |
| **Root / TLD servers** | Do not know final answers; they **refer** the resolver to the next level |
| **Authoritative server** | Holds the zone's records and gives the definitive answer (Route 53, Cloudflare DNS, your company's DNS) |

The full step-by-step lookup is in [DNS Resolution](../dns-resolution-process/content.md); record types in [DNS Records](../dns-record-types/content.md).

### Transport

- Queries and answers are small, so DNS uses **UDP 53** (one round trip, no handshake).
- **TCP 53** for responses too big for UDP (the server sets the truncated flag) and zone transfers between servers.
- Encrypted variants: **DNS over TLS** (TCP 853) and **DNS over HTTPS** (443) hide queries from the local network.

### Name resolution order on a host

Before asking DNS, the OS usually checks the **hosts file** (`/etc/hosts`, `C:\Windows\System32\drivers\etc\hosts`), then its own cache, then the configured resolver (`/etc/resolv.conf`, or from DHCP). The browser also has its own DNS cache.

## Real World

```bash
# Windows (Command Prompt) or Linux
nslookup example.com
```

**Output (varies; resolver address replaced):**

```text
Server:  UnKnown
Address:  192.168.1.1

Non-authoritative answer:
Name:    example.com
Addresses:  2606:4700:83b5:72db:f23b:50c:ef6b:ff98
          172.66.147.243
          104.20.23.154
```

- `Server` is the recursive resolver (here the home router).
- **Non-authoritative answer** = it came from a resolver's cache, not directly from `example.com`'s authoritative server.
- Several addresses (IPv6 and IPv4) are returned; the client picks one.

For backend developers: a Spring Boot app resolves `db.internal` or `payments-api.svc.cluster.local` through DNS every time it opens a new connection — in Kubernetes, CoreDNS provides service discovery this way.

## Common Traps

- **"DNS uses only UDP."** Also TCP (large answers, zone transfers) and encrypted transports.
- **"The root servers know every domain."** They only know where each TLD's servers are.
- **"There are only 13 root servers."** There are 13 root *identities*, served by over a thousand anycast instances.
- **"`www.example.com` and `example.com` are the same."** They are different names and can have different records.

## Interview Follow-up

- *"What is the difference between a recursive resolver and an authoritative server?"* The resolver finds answers for clients and caches them; the authoritative server owns and serves the zone's records.
- *"What happens when you type a URL?"* DNS is step one — see [From Wi-Fi to Web Page](../../end-to-end-flows/url-to-webpage-journey/content.md).

## Key Takeaways

- DNS maps names to IPs (and more) through a distributed hierarchy: root → TLD → authoritative.
- Zones delegate to child zones with NS records.
- Stub resolver → recursive resolver (does the work, caches) → root/TLD (referrals) → authoritative (answer).
- UDP 53 normally, TCP 53 for big answers/transfers; DoT/DoH for privacy.
