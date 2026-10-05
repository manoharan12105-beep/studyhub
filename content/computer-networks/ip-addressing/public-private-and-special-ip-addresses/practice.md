# Public, Private and Special IP Addresses — Practice

### P1. Private or public?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** RFC 1918

Which address is private?

- A) 172.32.10.5
- B) 172.20.10.5
- C) 192.169.1.1
- D) 11.0.0.1

<details>
<summary>Answer</summary>

**Answer:** B) 172.20.10.5

**Explanation:** `172.16.0.0/12` covers `172.16`–`172.31`. `172.32.x.x`, `192.169.x.x` and `11.x.x.x` are public.

</details>

### P2. Classify

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** special addresses

Classify each: `127.0.0.1`, `169.254.5.9`, `255.255.255.255`, `10.8.0.1`, `100.64.3.7`, `239.1.1.1`, `203.0.113.5`.

<details>
<summary>Answer</summary>

Loopback; link-local/APIPA; limited broadcast; private; CGNAT shared space; multicast; documentation (TEST-NET-3).

</details>

### P3. Bind address

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** 127.0.0.1 vs 0.0.0.0

A service works with `curl http://localhost:8080` on the server but other machines get "connection refused". `ss -ltn` shows `127.0.0.1:8080`. What is wrong?

<details>
<summary>Answer</summary>

It listens only on the loopback address, so only local clients can connect. Bind to `0.0.0.0` (all interfaces) or the server's LAN IP — e.g. `server.address=0.0.0.0` in Spring Boot — and check the firewall.

</details>

### P4. Diagnose the address

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** APIPA

A laptop shows `169.254.120.4` with no default gateway. Wi-Fi shows "connected". What failed, and what is your next check?

<details>
<summary>Answer</summary>

DHCP failed (the link is up). Check whether the DHCP server/router is working and reachable on that network or VLAN, whether its pool is full, then renew (`ipconfig /renew`).

</details>
