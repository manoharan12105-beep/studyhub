# Sockets and Connections — Practice

### P1. Identify the tuple

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** 4-tuple

Which set uniquely identifies a TCP connection?

- A) Source IP and destination IP
- B) Destination IP and destination port
- C) Source IP, source port, destination IP, destination port
- D) Source MAC and destination MAC

<details>
<summary>Answer</summary>

**Answer:** C) Source IP, source port, destination IP, destination port

</details>

### P2. Same or different?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** connections

Are these the same connection? (a) `10.0.0.5:50000 → 10.0.0.9:443` and (b) `10.0.0.5:50001 → 10.0.0.9:443`.

<details>
<summary>Answer</summary>

No — the source ports differ, so they are two separate connections to the same server socket.

</details>

### P3. Count the sockets

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** listening vs connected sockets

A Tomcat server on port 8080 has 300 open client connections. How many TCP sockets on local port 8080 does the server have?

<details>
<summary>Answer</summary>

**301**: one listening socket plus 300 connected sockets, all with local port 8080.

</details>

### P4. Read ss output

**Difficulty:** Medium · **Type:** Command · **Concepts:** ss

In `ss -tan`, a line reads `ESTAB 0 0 10.0.1.15:43872 10.0.2.20:5432`. Which side is the client, what service is it, and which port is ephemeral?

<details>
<summary>Answer</summary>

`10.0.1.15` is the client (ephemeral port **43872**) connected to PostgreSQL on `10.0.2.20:5432`.

</details>
