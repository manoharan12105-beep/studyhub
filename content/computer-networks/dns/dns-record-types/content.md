# DNS Record Types: A, AAAA, CNAME, MX, NS, TXT and More

**Module:** DNS · **Interview priority:** Core

## What Is It?

A DNS zone is a set of **resource records**. Each record has a **name**, a **TTL**, a **class** (almost always `IN`, Internet), a **type** and **data**:

```text
name                TTL    class  type   data
api.example.com.    300    IN     A      203.0.113.10
```

The type decides what the data means.

## Why It Exists

A domain needs to publish more than one IPv4 address: IPv6 addresses, aliases, mail servers, which servers are authoritative, and text proofs for email security and domain ownership. Typed records let one system carry all of it.

## The Records

| Type | Maps | Example | Used for |
|------|------|---------|----------|
| **A** | Name → **IPv4** address | `api.example.com. 300 IN A 203.0.113.10` | Every IPv4 connection |
| **AAAA** | Name → **IPv6** address | `api.example.com. 300 IN AAAA 2001:db8::10` | IPv6 ("quad A") |
| **CNAME** | Name → **another name** (alias) | `www.example.com. 3600 IN CNAME example.com.` | Pointing to a CDN or load balancer hostname |
| **MX** | Domain → **mail server** (with priority) | `example.com. 3600 IN MX 10 mx1.example.com.` | Where to deliver email; lower number = preferred |
| **NS** | Zone → its **authoritative name servers** | `example.com. 86400 IN NS ns1.dnsprovider.net.` | Delegation |
| **TXT** | Name → **free text** | `example.com. IN TXT "v=spf1 include:_spf.mailer.com -all"` | SPF, DKIM, DMARC, domain verification (Google, Let's Encrypt DNS challenge) |
| **SOA** | Zone → administrative info | Primary server, admin email, serial, refresh timers, **negative-caching TTL** | One per zone |
| **PTR** | **IP → name** (reverse DNS) | `10.113.0.203.in-addr.arpa. IN PTR api.example.com.` | Logs, mail server reputation |
| **SRV** | Service → host **and port** | `_sip._tcp.example.com. IN SRV 10 5 5060 sip.example.com.` | Service discovery (SIP, XMPP, Kubernetes) |
| **CAA** | Which CAs may issue certificates | `example.com. IN CAA 0 issue "letsencrypt.org"` | Certificate issuance control |

### A and AAAA

- One name can have **several A records**: the resolver returns all, clients pick one (often the first) — simple **round-robin DNS** load distribution without health checks.
- Dual-stack clients query both A and AAAA and prefer IPv6 when it works ([IPv6](../../ip-addressing/ipv6-addressing/content.md)).

### CNAME rules

- A CNAME points a name at **another name**, never at an IP.
- A name that has a CNAME **cannot have any other record** — which is why the **zone apex** (`example.com` itself, which must have SOA and NS records) cannot be a CNAME. DNS providers offer **ALIAS/ANAME** or "CNAME flattening" (resolving the target and serving A records) for that case.
- Chains (`a → b → c`) work but cost extra lookups.

```text
www.shop.example.com.  CNAME  shop-prod-123.elb.amazonaws.com.
shop-prod-123.elb.amazonaws.com.  A  198.51.100.21
                                   A  198.51.100.22    ← the load balancer's IPs can change; the CNAME never needs to
```

### MX

```text
example.com.  MX  10 mx1.example.com.     ← tried first
example.com.  MX  20 mx2.example.com.     ← backup
mx1.example.com.  A  203.0.113.25         ← MX must point to a name with A/AAAA, not to an IP or a CNAME
```

### NS and glue

`example.com NS ns1.example.com` is circular — to find `ns1.example.com` you must ask `example.com`'s servers. The parent (`.com`) therefore also publishes the A record of `ns1.example.com` — a **glue record**.

## Real World

```bash
# Illustrative: query specific record types (dig on Linux/macOS, nslookup -type on Windows)
dig +short example.com A
dig +short example.com AAAA
dig +short example.com MX
nslookup -type=TXT example.com
```

Common backend tasks:

| Task | Record |
|------|--------|
| Point `api.mycompany.com` at a cloud load balancer | CNAME (or ALIAS at the apex) |
| Prove domain ownership to Google/AWS/Let's Encrypt | TXT |
| Make your app's emails pass spam filters | TXT (SPF, DKIM, DMARC) |
| Move to a new DNS provider | NS (at the registrar) |
| Find which host a log IP belongs to | PTR (reverse lookup) |

## Common Traps

- **"CNAME can point to an IP."** It must point to a name; use A/AAAA for IPs.
- **"Put a CNAME on example.com."** The apex cannot have a CNAME; use ALIAS/flattening.
- **"MX records contain IP addresses."** They contain host names (with priorities).
- **"Lower MX priority number = lower preference."** Lower number = **more** preferred.

## Interview Follow-up

- *"A vs CNAME?"* A gives an IPv4 address; CNAME says "this name is an alias for that name".
- *"Which records does email need?"* MX for delivery, TXT for SPF/DKIM/DMARC.

## Key Takeaways

- A = IPv4, AAAA = IPv6, CNAME = alias to another name, MX = mail servers with priority, NS = authoritative servers, TXT = text (SPF/DKIM/verification), SOA = zone info, PTR = reverse lookup.
- CNAMEs cannot coexist with other records and cannot be at the zone apex.
- Several A records = simple round-robin; MX and NS point to names, not IPs.
