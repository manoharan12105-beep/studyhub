# The TCP/IP Model — Practice

### P1. Layer of a protocol

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** TCP/IP layers

In the TCP/IP model, ICMP belongs to which layer?

- A) Application
- B) Transport
- C) Network (Internet)
- D) Data Link

<details>
<summary>Answer</summary>

**Answer:** C) Network (Internet)

**Explanation:** ICMP is carried inside IP packets and reports network-layer errors (unreachable, TTL exceeded).

</details>

### P2. Place the protocols

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** protocol examples by layer

Place in the 5-layer TCP/IP model: DHCP, UDP, IPv6, Ethernet, TLS, OSPF, ARP.

<details>
<summary>Answer</summary>

Application: DHCP, TLS (on top of TCP). Transport: UDP. Network: IPv6, OSPF (a routing protocol carried directly in IP). Data Link: Ethernet, ARP.

</details>

### P3. Who implements it?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** stack implementation

A Spring Boot service calls PostgreSQL. For each, say whether it is done by the JVM application, the OS kernel or the NIC: (a) building the SQL protocol message, (b) retransmitting a lost segment, (c) choosing the outgoing interface by routing table, (d) computing the Ethernet CRC.

<details>
<summary>Answer</summary>

(a) JVM application (JDBC driver), (b) OS kernel (TCP), (c) OS kernel (IP routing), (d) NIC hardware.

</details>

### P4. 4 or 5 layers?

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** 4-layer vs 5-layer

How do the 4-layer and 5-layer descriptions of TCP/IP differ? Is one of them wrong?

<details>
<summary>Answer</summary>

The 4-layer (RFC 1122) version has a single Link layer; the 5-layer version splits it into Data Link and Physical. Neither is wrong — the 5-layer view is a teaching refinement of the same architecture.

</details>
