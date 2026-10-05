# Common Network Attacks and Defences — Practice

### P1. Identify the attack

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** attack types

An attacker on café Wi-Fi reads a user's password from an HTTP login form. Which attack is this?

- A) SYN flood
- B) Packet sniffing
- C) Port scanning
- D) DNS amplification

<details>
<summary>Answer</summary>

**Answer:** B) Packet sniffing

**Explanation:** The login was unencrypted HTTP; HTTPS would prevent it.

</details>

### P2. Match the defence

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** defences

Match each attack to its best defence: (a) ARP spoofing on an office LAN, (b) SYN flood, (c) phishing emails spoofing the company's domain, (d) MITM on HTTPS logins via SSL stripping.
Defences: HSTS, SYN cookies, Dynamic ARP Inspection, DMARC.

<details>
<summary>Answer</summary>

(a) Dynamic ARP Inspection, (b) SYN cookies, (c) DMARC (with SPF/DKIM), (d) HSTS.

</details>

### P3. Read the scan

**Difficulty:** Medium · **Type:** Output · **Concepts:** port states

An authorised scan of your server shows: 22 filtered, 443 open, 5432 open, 8080 closed. Which result is a problem, and what does "closed" on 8080 mean?

<details>
<summary>Answer</summary>

5432 (PostgreSQL) open to the scanner is a problem — the database should be reachable only from the app tier. "Closed" on 8080 means the host answered with RST: reachable, but nothing listens there (and no firewall dropped the probe — consider filtering it too).

</details>

### P4. DDoS response

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** DDoS mitigation

Your public API suddenly receives 50× normal traffic from 30,000 IPs, all hitting `/search` with random queries. List realistic mitigations.

<details>
<summary>Answer</summary>

An application-layer DDoS: put the API behind a CDN/WAF with bot detection and rate limiting per IP/token, require authentication or CAPTCHAs for expensive endpoints, cache search results, set strict timeouts and query limits, autoscale the stateless tier, and use the provider's DDoS protection. Blocking individual IPs will not keep up.

</details>
