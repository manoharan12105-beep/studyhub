# The TCP/IP Model

**Module:** TCP/IP Model · **Interview priority:** Core

## What Is It?

The **TCP/IP model** (Internet protocol suite) is the layered architecture the Internet actually runs on. It grew out of the ARPANET work of the 1970s and was defined by the protocols themselves, not by a committee first.

It is described in two common forms:

| 4-layer (RFC 1122) | 5-layer (used in most courses and textbooks) | Protocols | PDU |
|--------------------|----------------------------------------------|-----------|-----|
| Application | Application | HTTP, HTTPS, DNS, DHCP, SMTP, IMAP, SSH, FTP | Message / data |
| Transport | Transport | TCP, UDP (QUIC on top of UDP) | Segment / datagram |
| Internet | Network | IPv4, IPv6, ICMP | Packet |
| Link (network access) | Data Link | Ethernet, Wi-Fi, ARP, PPP | Frame |
| *(part of Link)* | Physical | Copper, fibre, radio | Bits |

Both describe the same stack; the 5-layer version simply separates the physical medium from the link protocol, which makes it easier to teach. This course uses the **5-layer** view.

## Why It Exists

TCP/IP was built to connect **different** networks — radio, satellite and wired networks of the 1970s — into one "internet". Its design choices explain why the Internet works the way it does:

- **IP as the narrow waist:** everything above runs over IP, and IP runs over anything below. New link technologies (Wi-Fi, 5G) and new applications (video streaming) arrive without changing IP.
- **Smart ends, simple core:** routers only forward packets (best effort); reliability (TCP) and intelligence live in the end hosts.
- **Working code first:** protocols were implemented and deployed, then standardised (RFCs). OSI's protocols were specified first and lost.

```text
        HTTP  DNS  SMTP  SSH  ...   (many applications)
           ╲    │     │    ╱
             TCP     UDP
               ╲     ╱
                 IP          ← the narrow waist: one protocol everyone shares
               ╱  │  ╲
       Ethernet  Wi-Fi  5G  ...    (many link technologies)
```

## How It Works

### Responsibilities by layer

| Layer | Responsibility | Address used | Implemented in |
|-------|----------------|--------------|----------------|
| Application | What the application wants: requests, responses, formats, encryption (TLS) | Hostname, URL | Applications and libraries (browser, Tomcat, JDK) |
| Transport | Process-to-process delivery; reliability and flow/congestion control (TCP) | Port | OS kernel |
| Network | Host-to-host delivery across networks; routing | IP address | OS kernel and routers |
| Data Link | Delivery to the next device on one link | MAC address | NIC driver and firmware, switches |
| Physical | Bits as signals | — | NIC hardware, cables, radio |

### Encapsulation in TCP/IP

Exactly the same idea as in OSI ([Encapsulation and Decapsulation](../../osi-model/encapsulation-and-decapsulation/content.md)):

```text
Application   [ HTTP request ]
Transport     [ TCP | HTTP request ]                        segment
Network       [ IP | TCP | HTTP request ]                   packet
Data Link     [ Eth | IP | TCP | HTTP request | FCS ]       frame
Physical      bits on the wire
```

### Protocols by layer, with what they are for

| Layer | Protocol | Used for |
|-------|----------|----------|
| Application | HTTP/HTTPS | Web pages, REST APIs |
| | DNS | Hostname → IP address |
| | DHCP | Get an IP configuration automatically |
| | SMTP / IMAP / POP3 | Send / read email |
| | SSH, FTP, SNMP | Remote shell, file transfer, device monitoring |
| | TLS | Encryption for HTTP and others (sits on TCP) |
| Transport | TCP | Reliable ordered byte stream |
| | UDP | Fast, connectionless datagrams |
| Network | IP (v4/v6) | Addressing and routing |
| | ICMP | Errors and diagnostics (`ping`, `traceroute`) |
| | OSPF, BGP | Building routing tables (carried in IP / TCP) |
| Data Link | Ethernet, Wi-Fi | Frames on the local link |
| | ARP (IPv4), NDP (IPv6) | IP address → MAC address |

## Real World

On a Linux server running a Spring Boot app:

- **Application:** your code, Spring MVC, Tomcat, Jackson, the JDK's TLS — all in the JVM process.
- **Transport and Network:** the Linux kernel (`ss -tn` shows its TCP sockets; `ip route` its routing table).
- **Data Link and Physical:** the NIC driver and hardware (`ip link`).

When you write `restClient.get().uri("https://api.example.com")`, the JVM asks the kernel for a TCP socket; the kernel does TCP and IP; the NIC sends frames.

## Common Traps

- **"TCP/IP has 4 layers, so 5 is wrong"** (or the reverse). Both are used; say which one you mean. The RFC defines 4 (Link, Internet, Transport, Application); textbooks often split Link into Data Link and Physical.
- **"The Internet layer is the same as OSI's network layer only."** Yes in function — but note ICMP and IP live there, while ARP is usually placed in the link layer.
- **"TLS is a TCP/IP layer."** TLS runs inside the Application layer of TCP/IP (on top of TCP).

## Interview Follow-up

- *"Why is TCP/IP used instead of OSI?"* → [OSI vs TCP/IP](../osi-vs-tcp-ip/content.md).
- *"Where does a Spring Boot app sit in TCP/IP?"* Application layer; TCP and IP are provided by the operating system.

## Key Takeaways

- TCP/IP layers: Application, Transport, Network (Internet), Data Link, Physical (5-layer view); RFC 1122 merges the last two into Link.
- IP is the narrow waist: many applications above, many link technologies below.
- Applications and TLS live in the Application layer; TCP/UDP and IP live in the OS kernel; links live in NICs and switches.
