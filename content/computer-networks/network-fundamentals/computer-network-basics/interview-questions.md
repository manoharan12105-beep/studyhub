# What Is a Computer Network? — Interview Questions

## Beginner

### Q1. What is a computer network, and why do we need one?

<details>
<summary>Answer</summary>

A computer network is a set of devices (nodes) connected by links that exchange data using agreed rules (protocols). We need networks to share information (web, email), share resources (printers, databases, storage), distribute computing (cloud, microservices) and add reliability (backups and alternative paths).

</details>

### Q2. What is the difference between the Internet and the World Wide Web?

**Style:** Comparison

<details>
<summary>Answer</summary>

The Internet is the global infrastructure — networks, routers and links interconnected with IP. The Web is one application that runs on it: documents and APIs identified by URLs and transferred with HTTP. Email (SMTP), SSH, DNS and online games use the Internet but are not the Web.

</details>

### Q3. What is the role of an IP address and a port number when sending data?

<details>
<summary>Answer</summary>

The IP address identifies the destination device's network interface, so routers can deliver the packet to the right machine. The port number identifies the application (process) on that machine — 443 for an HTTPS server, 5432 for PostgreSQL. Together, IP + port name one endpoint, e.g. `93.184.215.14:443`.

</details>

## Intermediate

### Q4. Why is data split into packets instead of being sent as one stream?

**Style:** Why

<details>
<summary>Answer</summary>

- **Sharing:** many conversations can interleave on the same links; no one hogs a line.
- **Resilience:** packets are routed independently, so traffic can go around failures.
- **Efficient recovery:** a lost packet is resent alone instead of the whole transfer.
- **Size limits:** every link has a maximum frame size (MTU, typically 1500 bytes on Ethernet).

The cost is per-packet header overhead and the work of reordering and reassembling at the receiver.

</details>

### Q5. Does an IP address identify a computer?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Not exactly — it identifies a network *interface*. A laptop with Wi-Fi and Ethernet has two addresses, a server may have many, one interface can have several addresses (IPv4 and IPv6), and addresses can change when DHCP assigns a new one. Behind NAT, many devices even share one public address.

</details>

## Advanced

### Q6. Why did ARPANET use packet switching rather than the telephone network's circuit switching?

**Style:** Why

<details>
<summary>Answer</summary>

Circuit switching reserves a fixed path for the whole conversation: if a link on it fails, the connection is lost, and the reserved capacity is wasted during silence. Packet switching forwards each packet independently, so the network can route around damage and share link capacity among bursty computer traffic — exactly what a resilient network of research computers needed.

</details>
