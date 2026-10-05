# UDP — Interview Questions

## Beginner

### Q1. What is UDP and what does its header contain?

<details>
<summary>Answer</summary>

The User Datagram Protocol is a connectionless transport protocol that adds ports and a checksum to IP. Its 8-byte header has source port, destination port, length and checksum. It provides no connection setup, reliability, ordering, flow control or congestion control.

</details>

### Q2. Give examples of applications that use UDP and why.

<details>
<summary>Answer</summary>

DNS (small query/response; a handshake would double the latency), DHCP (client has no IP and must broadcast), VoIP/video calls/games (late packets are useless, so retransmission would hurt), live streaming and multicast (one-to-many), NTP and SNMP (small periodic messages), and QUIC/HTTP/3 (implements its own reliability on top).

</details>

## Intermediate

### Q3. Why would a video call prefer UDP over TCP?

**Style:** Why

<details>
<summary>Answer</summary>

In real-time media a packet that arrives late is worthless. TCP would retransmit a lost packet and hold back all following data until it arrives (head-of-line blocking), causing freezes. With UDP the application skips the lost packet, uses error concealment or forward error correction, and keeps playing, while adapting its bitrate itself.

</details>

### Q4. Does UDP detect errors?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Yes, with a checksum covering the header, data and a pseudo-header of the IP addresses (optional in IPv4, mandatory in IPv6). A datagram with a bad checksum is discarded. UDP does not notify the sender or retransmit — recovery, if any, is the application's job.

</details>

## Advanced

### Q5. Why is UDP abused in amplification DDoS attacks?

**Style:** Scenario

<details>
<summary>Answer</summary>

UDP has no handshake, so a server answers a datagram without verifying the source address. An attacker sends small requests with the victim's spoofed IP to open DNS resolvers, NTP or memcached servers whose responses are much larger; the servers flood the victim with amplified traffic. Defences: disable open resolvers/unneeded services, response rate limiting, and ISP source-address filtering (BCP 38).

</details>

### Q6. HTTP/3 uses UDP. Does that mean HTTP/3 is unreliable?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. HTTP/3 runs on QUIC, which is built on UDP but implements reliable, ordered streams, congestion control and mandatory TLS 1.3 encryption itself. Using UDP lets QUIC avoid TCP's head-of-line blocking across streams, combine the transport and TLS handshakes, and evolve in user space without waiting for OS kernels and middleboxes.

</details>
