# Common Network Attacks and Defences — Interview Questions

## Beginner

### Q1. What is the difference between DoS and DDoS?

**Style:** Comparison

<details>
<summary>Answer</summary>

A Denial-of-Service attack tries to make a service unavailable by exhausting its resources (bandwidth, connections, CPU). In a Distributed DoS the traffic comes from many sources at once — typically a botnet or reflection/amplification — so blocking a single IP does not help; defences rely on CDNs/anycast, scrubbing services, rate limiting and capacity.

</details>

### Q2. What is a man-in-the-middle attack?

<details>
<summary>Answer</summary>

An attacker secretly sits between two communicating parties, relaying and possibly reading or modifying their messages while each believes it talks directly to the other. It can be set up with ARP spoofing, rogue Wi-Fi access points, DNS spoofing or a compromised router. TLS with proper certificate verification, HSTS and SSH host-key checking defeat it.

</details>

## Intermediate

### Q3. What is ARP spoofing and why does it work?

**Style:** Why

<details>
<summary>Answer</summary>

ARP has no authentication: hosts accept ARP replies (even unsolicited ones) and update their caches. An attacker on the LAN sends forged replies claiming the gateway's IP maps to its own MAC, so victims send their traffic to the attacker, who can forward it (MITM). Defences: Dynamic ARP Inspection on switches, static gateway entries, segmentation, and encryption so intercepted data is useless.

</details>

### Q4. How does a SYN flood work, and how do SYN cookies help?

<details>
<summary>Answer</summary>

The attacker sends many SYNs, often from spoofed addresses, and never completes the handshake, filling the server's queue of half-open connections so real clients are refused. With SYN cookies the server stores no state for new SYNs; it encodes the connection information in its initial sequence number, and only when a valid ACK returns (proving a real client) does it create the connection.

</details>

### Q5. What is port scanning, and how can you tell open, closed and filtered ports apart?

<details>
<summary>Answer</summary>

Probing a host's ports to discover running services. A SYN answered by SYN-ACK means open (a service listens); a RST means closed (host reachable, nothing listening); no reply or an ICMP prohibited message means filtered by a firewall. Defend by exposing only necessary ports, default-deny firewalls, patching and intrusion detection.

</details>

## Advanced

### Q6. How do amplification DDoS attacks use UDP and IP spoofing?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The attacker sends small UDP requests to open servers (DNS resolvers, NTP, memcached) with the source IP spoofed to the victim's address. The servers send much larger responses — sometimes tens to thousands of times bigger — to the victim, multiplying the attacker's bandwidth. UDP's lack of a handshake allows the spoofing. Mitigations: source-address validation by ISPs (BCP 38), closing open resolvers/services, response rate limiting, and upstream DDoS scrubbing for victims.

</details>

### Q7. Does a valid HTTPS certificate protect users from phishing?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. A certificate only proves that the connection is encrypted to the owner of that domain; attackers can easily get valid certificates for look-alike domains. Phishing defences are MFA (ideally phishing-resistant passkeys/FIDO2), password managers that fill only on the real domain, DMARC against spoofed sender domains, and user awareness.

</details>
