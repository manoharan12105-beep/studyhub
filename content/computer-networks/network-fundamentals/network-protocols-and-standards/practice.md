# Network Protocols and Standards — Practice

### P1. Element of a protocol

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** syntax, semantics, timing

"The server must answer a request; if no answer arrives in 30 seconds the client gives up." Which element of a protocol is this?

- A) Syntax
- B) Semantics
- C) Timing
- D) Encoding

<details>
<summary>Answer</summary>

**Answer:** C) Timing

**Explanation:** Order and time limits are the timing element. Syntax is the message format; semantics is the meaning of each field.

</details>

### P2. Who standardises it?

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** standards bodies

Match each to its standards body: (a) Wi-Fi, (b) TCP, (c) the port number registry, (d) Ethernet.

<details>
<summary>Answer</summary>

(a) IEEE 802.11, (b) IETF (RFC 9293), (c) IANA, (d) IEEE 802.3.

</details>

### P3. Which layer's problem?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** layering

For each problem, name the protocol in the HTTPS stack that solves it: (a) a byte was lost on the way, (b) someone on the café Wi-Fi could read the password, (c) the packet must cross 12 routers, (d) the server must know which resource is wanted.

<details>
<summary>Answer</summary>

(a) TCP (retransmission), (b) TLS (encryption), (c) IP (routing by destination address), (d) HTTP (method and path).

</details>

### P4. Protocol or implementation?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** specification vs implementation

Classify: HTTP/1.1, Tomcat, TLS 1.3, OpenSSL, TCP, the Linux kernel network stack.

<details>
<summary>Answer</summary>

Protocols: HTTP/1.1, TLS 1.3, TCP. Implementations: Tomcat (HTTP server), OpenSSL (TLS library), the Linux kernel stack (TCP/IP).

</details>
