# DNS Record Types — Practice

### P1. IPv6 record

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** AAAA

Which record maps a name to an IPv6 address?

- A) A
- B) AAAA
- C) PTR
- D) MX

<details>
<summary>Answer</summary>

**Answer:** B) AAAA

</details>

### P2. Choose the record

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** record purposes

Which record: (a) Google asks you to prove you own the domain, (b) switch the domain to a new DNS provider, (c) find the hostname for IP `203.0.113.10`, (d) send mail for the domain to `mail.provider.com`, (e) make `shop.example.com` an alias of a CDN hostname.

<details>
<summary>Answer</summary>

(a) TXT, (b) NS (changed at the registrar), (c) PTR, (d) MX, (e) CNAME.

</details>

### P3. Find the error

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** record rules

Which of these zone entries are invalid, and why?
(a) `www.example.com. CNAME 203.0.113.10`
(b) `example.com. CNAME lb.cloud.net.`
(c) `example.com. MX 10 mail.example.com.`
(d) `api.example.com. CNAME api-lb.cloud.net.` plus `api.example.com. TXT "v=1"`

<details>
<summary>Answer</summary>

(a) Invalid — a CNAME must point to a name, not an IP (use an A record). (b) Invalid — no CNAME at the zone apex (use ALIAS/flattening). (c) Valid. (d) Invalid — a name with a CNAME cannot have other records.

</details>

### P4. Mail routing

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** MX priority

`example.com` has `MX 5 a.mx.net`, `MX 5 b.mx.net`, `MX 50 backup.mx.net`. Describe how senders choose.

<details>
<summary>Answer</summary>

They try the lowest preference first: `a` and `b` (both 5) share the load (chosen in random order). `backup.mx.net` (50) is used only if neither `a` nor `b` accepts.

</details>
