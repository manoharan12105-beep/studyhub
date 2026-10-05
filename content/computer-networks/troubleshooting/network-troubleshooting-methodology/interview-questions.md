# Network Troubleshooting Methodology — Interview Questions

## Beginner

### Q1. How would you troubleshoot a user who says "the internet is not working"?

**Style:** Scenario

<details>
<summary>Answer</summary>

Clarify scope first (one device or everyone, one site or all, since when, what changed). Then bottom-up: link up (cable/Wi-Fi)? Valid IP configuration (`ipconfig /all` — not 169.254.x.x, right mask and gateway)? Ping the default gateway; ping an Internet IP like 8.8.8.8; resolve a name with `nslookup`; test the site with a browser or `curl -v`. The first failing step locates the fault: link, DHCP, LAN/gateway, upstream/ISP, DNS, or the specific site/firewall.

</details>

## Intermediate

### Q2. What are the bottom-up, top-down and divide-and-conquer approaches?

**Style:** Comparison

<details>
<summary>Answer</summary>

Bottom-up starts at the physical layer and moves up — thorough, good when nothing works. Top-down starts with the application (error messages, HTTP status) and moves down — good when only one application fails. Divide and conquer starts in the middle, typically with ping at Layer 3: if it succeeds, look higher; if it fails, look lower — fastest with experience.

</details>

### Q3. Why should you change only one thing at a time?

**Style:** Why

<details>
<summary>Answer</summary>

So you know which change fixed (or broke) something, can roll back precisely, and can document the real root cause. Several simultaneous changes may also hide the fault temporarily or create new ones.

</details>

## Advanced

### Q4. Your Spring Boot service cannot reach its PostgreSQL database after a deployment. Walk through your checks.

**Style:** Debugging

<details>
<summary>Answer</summary>

Read the exact exception first (UnknownHost, connection refused, timeout, authentication, SSL). Then layer by layer from the app host: DNS — does the DB host name resolve (`getent hosts db.internal`)? Network — route and reachability (`ip route get <ip>`, traceroute). Transport — `nc -zv db.internal 5432`: refused (PostgreSQL not listening on that address/port) vs timeout (security group/firewall, wrong subnet/route). Then TLS and authentication (`pg_hba.conf`, credentials, SSL mode), then pool settings. Compare with what changed in the deployment (config properties, network policies, secrets).

</details>
