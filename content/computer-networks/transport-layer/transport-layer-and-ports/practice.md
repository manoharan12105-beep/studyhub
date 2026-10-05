# The Transport Layer and Port Numbers — Practice

### P1. Default port

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** well-known ports

Which port does PostgreSQL listen on by default?

- A) 3306
- B) 5432
- C) 6379
- D) 27017

<details>
<summary>Answer</summary>

**Answer:** B) 5432

**Explanation:** 3306 = MySQL, 6379 = Redis, 27017 = MongoDB.

</details>

### P2. Match the port

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** port numbers

Match: 22, 25, 53, 67, 443, 3389 → HTTPS, DHCP server, SSH, RDP, DNS, SMTP.

<details>
<summary>Answer</summary>

22 SSH, 25 SMTP, 53 DNS, 67 DHCP server, 443 HTTPS, 3389 RDP.

</details>

### P3. Swap the ports

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** source/destination ports

A browser sends a request from `192.168.1.10:51544` to `203.0.113.10:443`. Write the source and destination of the response.

<details>
<summary>Answer</summary>

Source `203.0.113.10:443`, destination `192.168.1.10:51544`.

</details>

### P4. Range classification

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** port ranges

Classify: 443, 8080, 54012, 1023, 1024.

<details>
<summary>Answer</summary>

443 well-known, 8080 registered, 54012 dynamic/ephemeral, 1023 well-known (last one), 1024 registered (first one).

</details>

### P5. Two apps

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** binding a port

You start a second Spring Boot app on the same machine without changing anything and it fails with "Port 8080 was already in use". Why, and give two fixes.

<details>
<summary>Answer</summary>

Only one socket can listen on a given IP, port and protocol; the first app already listens on TCP 8080. Fix: give the second app another port (`server.port=8081`), or stop the first one (find it with `ss -ltnp 'sport = :8080'` or `netstat -ano | findstr :8080` on Windows).

</details>
