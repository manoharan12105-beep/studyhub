# The TCP/IP Model — Interview Questions

## Beginner

### Q1. What are the layers of the TCP/IP model?

<details>
<summary>Answer</summary>

In the 4-layer form (RFC 1122): Link (network access), Internet, Transport and Application. In the commonly taught 5-layer form: Physical, Data Link, Network, Transport and Application. They describe the same stack; the 5-layer version separates the physical medium from the link protocol.

</details>

### Q2. Name two protocols at each TCP/IP layer.

<details>
<summary>Answer</summary>

Application: HTTP, DNS (also SMTP, SSH, DHCP). Transport: TCP, UDP. Network/Internet: IP, ICMP. Data Link: Ethernet, Wi-Fi (and ARP). Physical: copper/fibre/radio signalling standards.

</details>

## Intermediate

### Q3. What does "IP is the narrow waist of the Internet" mean?

**Style:** Why

<details>
<summary>Answer</summary>

All applications and transports run over one network protocol, IP, and IP runs over any link technology. Because everyone agrees on that single layer, new applications and new link types can be added independently — Wi-Fi, 5G, HTTP/3 and video streaming arrived without changing IP.

</details>

### Q4. Which parts of the TCP/IP stack does a Java application implement, and which does the OS?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The application (with its libraries — Tomcat, Jackson, the JDK's TLS) implements the Application layer: HTTP, serialisation and encryption. It opens sockets through the OS; the kernel implements TCP/UDP (transport) and IP (network, including the routing table). The NIC driver and hardware handle the Data Link and Physical layers.

</details>

## Advanced

### Q5. What design principle made TCP/IP scale, compared with the phone network?

**Style:** Why

<details>
<summary>Answer</summary>

The end-to-end principle: keep the core simple (routers do best-effort, stateless packet forwarding) and put intelligence — reliability, ordering, congestion response, security — in the end hosts. The core then needs no per-connection state, so it scales to billions of flows and survives failures, and new services can be deployed by updating end hosts only.

</details>
