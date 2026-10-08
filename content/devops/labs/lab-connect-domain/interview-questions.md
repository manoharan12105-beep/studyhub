# Lab 13 — Interview Questions

## Beginner

### Q1. What DNS record do you create to point a subdomain to a VPS?

**Style:** What

<details>
<summary>Answer</summary>

An A record for the subdomain (for example host `api`) whose value is the server's public IPv4 address; an AAAA record too if the server has IPv6.

</details>

## Intermediate

### Q2. Why lower the TTL before changing a record?

**Style:** Why

<details>
<summary>Answer</summary>

Resolvers cache a record for its TTL. A short TTL (minutes) means that after a change, old answers disappear quickly; with a one-day TTL some users would keep reaching the old address for up to a day.

</details>

### Q3. How does Nginx know which site to serve when several domains point to the same IP?

**Style:** How

<details>
<summary>Answer</summary>

It compares the request's `Host` header (and, for HTTPS, the TLS SNI name) with the `server_name` of the server blocks listening on that port; a request matching none goes to the default server for the port.

</details>
