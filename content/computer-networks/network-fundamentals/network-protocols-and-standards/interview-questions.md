# Network Protocols and Standards — Interview Questions

## Beginner

### Q1. What is a protocol?

<details>
<summary>Answer</summary>

An agreed set of rules for communication: message format (syntax), meaning (semantics) and order/timing, including what to do on errors. Example: HTTP defines that a client sends a request line, headers and an optional body, and the server answers with a status line such as `HTTP/1.1 200 OK`.

</details>

### Q2. What is an RFC?

<details>
<summary>Answer</summary>

A Request for Comments: a numbered document published by the IETF that specifies an Internet protocol or practice — e.g. RFC 791 (IPv4), RFC 9293 (TCP), RFC 9110 (HTTP semantics). Once published, an RFC is never changed; corrections come as new RFCs.

</details>

## Intermediate

### Q3. Why are network protocols organised in layers?

**Style:** Why

<details>
<summary>Answer</summary>

Separation of concerns: each layer solves one problem (application meaning, reliability, routing, the physical link) and offers a service to the layer above. Layers can then evolve independently — Wi-Fi replaced cables without changing HTTP, and HTTP/2 arrived without changing IP — and troubleshooting can be done layer by layer.

</details>

### Q4. Is TCP/IP a single protocol?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. "TCP/IP" names the Internet protocol suite: IP (with ICMP) at the network layer, TCP and UDP at the transport layer, link protocols such as Ethernet and ARP below, and application protocols such as HTTP, DNS and SSH above. TCP and IP are just its two best-known members.

</details>

## Advanced

### Q5. What is the difference between a protocol and its implementation? Why does it matter?

<details>
<summary>Answer</summary>

The protocol is the specification (the RFC); an implementation is code that follows it (Tomcat, Netty, the Linux TCP stack, curl). It matters because implementations can have bugs, defaults and limits that the protocol does not — e.g. timeouts, maximum header size, or which HTTP versions are enabled. When two implementations disagree, the specification decides which one is wrong.

</details>
