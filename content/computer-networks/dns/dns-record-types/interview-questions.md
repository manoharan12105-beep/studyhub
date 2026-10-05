# DNS Record Types — Interview Questions

## Beginner

### Q1. Explain the A, AAAA, CNAME, MX, NS and TXT records.

<details>
<summary>Answer</summary>

A maps a name to an IPv4 address; AAAA to an IPv6 address. CNAME makes a name an alias of another name. MX lists a domain's mail servers with priorities. NS lists a zone's authoritative name servers (delegation). TXT holds arbitrary text — used for SPF, DKIM, DMARC and domain-ownership verification.

</details>

### Q2. What is the difference between an A record and a CNAME record?

**Style:** Comparison

<details>
<summary>Answer</summary>

An A record directly maps a name to an IPv4 address. A CNAME maps a name to another name, which must then be resolved further. CNAMEs are useful when the target's IPs are managed elsewhere and may change (a CDN or cloud load balancer hostname), at the cost of an extra lookup and the restriction that a CNAME name can have no other records.

</details>

## Intermediate

### Q3. Why can't you put a CNAME on the root of your domain (`example.com`)?

**Style:** Why

<details>
<summary>Answer</summary>

A name with a CNAME must not have any other records, but the zone apex is required to have SOA and NS records (and often MX/TXT). So a CNAME at the apex would be invalid. DNS providers offer ALIAS/ANAME records or CNAME flattening, which resolve the target behind the scenes and answer with A/AAAA records.

</details>

### Q4. A domain has `MX 10 mx1` and `MX 20 mx2`. Which server receives mail?

<details>
<summary>Answer</summary>

Senders try `mx1` first because a lower preference number means higher priority; `mx2` is used only if `mx1` is unavailable. Equal numbers share the load.

</details>

## Advanced

### Q5. What is a glue record?

<details>
<summary>Answer</summary>

When a domain's name servers are inside the domain itself (`example.com NS ns1.example.com`), a resolver could not find `ns1.example.com` without already being able to query `example.com` — a circular dependency. The parent zone (`.com`) therefore also serves the A/AAAA record of `ns1.example.com` alongside the delegation; that address is the glue record.

</details>

### Q6. How would you point `api.mycompany.com` to a cloud load balancer, and why not with an A record?

**Style:** Scenario

<details>
<summary>Answer</summary>

Create `api.mycompany.com CNAME my-lb-1234.region.elb.amazonaws.com` (or the provider's alias record). The load balancer's IP addresses change as it scales or fails over; the provider updates its own hostname's A records, so your CNAME keeps working. A hard-coded A record would break whenever those IPs change.

</details>
