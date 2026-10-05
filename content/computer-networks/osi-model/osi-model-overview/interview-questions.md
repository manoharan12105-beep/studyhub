# The OSI Model — Interview Questions

## Beginner

### Q1. Name the seven OSI layers and the job of each.

<details>
<summary>Answer</summary>

7 Application — network services for applications (HTTP, DNS). 6 Presentation — data format, encoding, encryption, compression. 5 Session — establishing, managing and ending dialogues. 4 Transport — process-to-process delivery, ports, reliability (TCP/UDP). 3 Network — host-to-host delivery across networks, IP addressing and routing. 2 Data Link — node-to-node delivery on one link, framing, MAC addresses, error detection. 1 Physical — transmitting bits as signals over the medium.

</details>

### Q2. What is the PDU at each layer?

<details>
<summary>Answer</summary>

Application/Presentation/Session: data (message). Transport: segment (TCP) or datagram (UDP). Network: packet. Data Link: frame. Physical: bits.

</details>

### Q3. At which layer do a hub, a switch and a router work?

<details>
<summary>Answer</summary>

Hub: Layer 1 (repeats signals). Switch: Layer 2 (forwards frames by MAC). Router: Layer 3 (forwards packets by IP). Layer 3 switches do both 2 and 3.

</details>

## Intermediate

### Q4. Why is networking divided into layers?

**Style:** Why

<details>
<summary>Answer</summary>

Each layer solves one problem and hides it from the others. That allows independent change (Wi-Fi upgrades do not affect HTTP), interoperability between vendors, reuse (TCP serves every application), a common vocabulary, and layer-by-layer troubleshooting.

</details>

### Q5. Which layers are processed by a router, and which only by end hosts?

**Style:** What happens internally

<details>
<summary>Answer</summary>

A router processes layers 1–3: it receives the signal, checks and strips the frame, reads the IP header, decides the next hop, decrements TTL and builds a new frame. Layers 4–7 (TCP/UDP, TLS, HTTP) are end-to-end: only the source and destination hosts process them — unless a middlebox such as NAT, a firewall or a load balancer looks deeper.

</details>

### Q6. What does "peer-to-peer communication between layers" mean in the OSI model?

<details>
<summary>Answer</summary>

Each layer logically communicates with the same layer on the other host using its own protocol and header: TCP on the client exchanges segments with TCP on the server, though physically the data goes down through the lower layers, across the medium and up again. Each layer reads only the header added by its peer.

</details>

## Advanced

### Q7. Where does TLS fit in the OSI model?

**Style:** Follow-up

<details>
<summary>Answer</summary>

There is no perfect fit, because OSI predates TLS and the Internet follows TCP/IP. TLS performs presentation-layer functions (encryption, data integrity) and session-like functions (handshake, session resumption) and runs on top of TCP, below HTTP. A good answer: "Usually placed at the presentation layer (or between transport and application) because it encrypts application data on top of TCP."

</details>

### Q8. How would you use the OSI model to troubleshoot "the website does not open"?

**Style:** Scenario

<details>
<summary>Answer</summary>

Bottom-up: Layer 1 — connected? Layer 2 — interface up, gateway MAC resolvable? Layer 3 — have an IP, can ping the gateway and an Internet IP? Then DNS — does the name resolve? Layer 4 — can I open TCP 443 (`nc -zv`), refused or timeout? Layer 5–6 — does the TLS handshake succeed? Layer 7 — what HTTP status does `curl -v` show? The first failing layer is where the fault is. If other sites work, go top-down instead and start at DNS/HTTP for that site.

</details>
