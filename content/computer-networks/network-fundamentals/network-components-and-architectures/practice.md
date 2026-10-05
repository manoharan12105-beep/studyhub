# Network Components and Architectures — Practice

### P1. Who is the client?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** client, server

A Spring Boot application receives `GET /orders/7` and then queries PostgreSQL. In the conversation with PostgreSQL, the Spring Boot application is the:

- A) Server
- B) Client
- C) Peer
- D) Gateway

<details>
<summary>Answer</summary>

**Answer:** B) Client

**Explanation:** It starts the conversation with PostgreSQL, which listens on port 5432 and responds. The client/server role belongs to each conversation.

</details>

### P2. Pick the architecture

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** client-server, P2P

Classify each: (a) a banking web app, (b) BitTorrent download, (c) DNS lookups, (d) a WebRTC video call where media flows directly between browsers.

<details>
<summary>Answer</summary>

(a) client-server, (b) P2P, (c) client-server (resolvers and name servers), (d) hybrid: a signalling server sets up the call, then media flows peer to peer.

</details>

### P3. Single point of failure

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** client-server weaknesses

Your API runs on one server. List two network-level changes that remove it as a single point of failure.

<details>
<summary>Answer</summary>

Run several instances behind a [load balancer](../../performance/load-balancing-l4-vs-l7/content.md) with health checks, and place them in different zones or data centres. The load balancer itself must also be redundant (a managed or paired load balancer).

</details>

### P4. Name the components

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** components

A phone on Wi-Fi loads a web page. Name one example of each: host, NIC, link, intermediate device, protocol.

<details>
<summary>Answer</summary>

Host: the phone (and the web server). NIC: the phone's Wi-Fi adapter. Link: radio between phone and access point, then fibre to the ISP. Intermediate device: the access point or home router. Protocol: Wi-Fi (802.11), IP, TCP, TLS, HTTP, DNS.

</details>
