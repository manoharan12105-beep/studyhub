# The Transport Layer and Port Numbers

**Module:** Transport Layer · **Interview priority:** Core

## What Is It?

The **transport layer** delivers data **process to process**: from one application on one host to the right application on another host. It sits between applications (HTTP, DNS, JDBC) and the network layer (IP). Its two main protocols are **TCP** (reliable, ordered, connection-oriented) and **UDP** (simple, connectionless). Applications are identified by **port numbers**.

## Why It Exists

IP delivers packets to a **host**, best effort. Two problems remain:

1. **Which application?** A server runs a web server, SSH, PostgreSQL and more at once. IP addresses alone cannot tell them apart.
2. **Reliability:** IP may lose, duplicate or reorder packets. Many applications need a reliable byte stream.

The transport layer solves (1) with ports for every protocol, and (2) with TCP for the applications that need it.

## How It Works

### Responsibilities

| Function | Meaning | TCP | UDP |
|----------|---------|-----|-----|
| **Multiplexing / demultiplexing** | Many applications share one IP; ports separate their data | ✓ | ✓ |
| **Segmentation and reassembly** | Split the byte stream into segments; rebuild in order | ✓ | — (each datagram is independent) |
| **Connection management** | Set up and tear down a conversation | ✓ | — |
| **Reliability** | ACKs and retransmission | ✓ | — |
| **Ordering** | Sequence numbers | ✓ | — |
| **Flow control** | Do not overwhelm the receiver | ✓ | — |
| **Congestion control** | Do not overwhelm the network | ✓ | — |
| **Error detection** | Checksum over header and data | ✓ | ✓ |

### Port numbers

A **port** is a 16-bit number (0–65535) in the TCP/UDP header. Every segment carries a **source port** and a **destination port**.

| Range | Name | Used for |
|-------|------|----------|
| 0–1023 | **Well-known** (system) ports | Standard services; binding needs admin/root on Linux |
| 1024–49151 | **Registered** ports | Applications registered with IANA (PostgreSQL 5432, MySQL 3306, 8080 alternate HTTP) |
| 49152–65535 | **Dynamic / private / ephemeral** | Temporary client-side ports (IANA's range; Linux uses 32768–60999 by default) |

TCP port 53 and UDP port 53 are **different** ports — each protocol has its own space.

### Ports to know

| Port | Protocol | Service |
|------|----------|---------|
| 20/21 | TCP | FTP data / control |
| 22 | TCP | SSH, SFTP, SCP |
| 23 | TCP | Telnet |
| 25 | TCP | SMTP (server to server) |
| 53 | UDP/TCP | DNS |
| 67/68 | UDP | DHCP server / client |
| 80 | TCP | HTTP |
| 110 | TCP | POP3 |
| 123 | UDP | NTP (time) |
| 143 | TCP | IMAP |
| 161/162 | UDP | SNMP / SNMP traps |
| 443 | TCP (and UDP for HTTP/3) | HTTPS |
| 465 / 587 | TCP | SMTP over TLS / mail submission |
| 993 / 995 | TCP | IMAPS / POP3S |
| 3306 | TCP | MySQL |
| 3389 | TCP | RDP (Windows Remote Desktop) |
| 5432 | TCP | PostgreSQL |
| 6379 | TCP | Redis |
| 8080 | TCP | Alternate HTTP (Tomcat, Spring Boot default) |
| 9092 | TCP | Kafka |
| 27017 | TCP | MongoDB |

### Source and destination ports in a conversation

```text
Browser on 192.168.1.10 ─────────────────────────────► Server 203.0.113.10
  request:  src port 52100 (ephemeral)  →  dst port 443 (well-known)
  response: src port 443                →  dst port 52100
```

- The **server** listens on a fixed, known port so clients can find it.
- The **client** uses an **ephemeral port**, chosen automatically by its OS, so that many connections from one client can be told apart. The response simply swaps source and destination.

### Demultiplexing

When a segment arrives, the OS uses:

- **UDP:** destination IP + destination port → the one socket bound there.
- **TCP:** the full **4-tuple** (source IP, source port, destination IP, destination port) → the exact connection. This is how one server port (443) serves thousands of clients at once. See [Sockets and Connections](../sockets-and-connections/content.md).

## Real World

- Spring Boot listens on 8080 by default (`server.port`). Behind a load balancer, clients use 443 and the LB forwards to 8080 — two different TCP connections.
- "Address already in use" / "Port 8080 was already in use" = another process already listens there ([find it with `ss -ltnp`](../../../linux/networking/ports-and-http-tools/content.md)).
- Firewalls and security groups are written in terms of protocols and ports: "allow TCP 443 from anywhere, TCP 5432 only from the app subnet".

## Common Traps

- **"Ports are physical."** They are numbers in a header.
- **"A server uses a new port for each client."** The server side of every connection uses the same port (443); connections differ by the client's IP and port.
- **"The client must use the same port as the server."** Client ports are ephemeral and unrelated to the server port.
- **"Port 443 means HTTPS is secure."** The port is just a convention; any protocol can run on any port.

## Interview Follow-up

- *"Why do we need port numbers if we have IP addresses?"* IP identifies the host; ports identify the process on it.
- *"What is an ephemeral port?"* A temporary port the OS assigns to the client side of a connection.

## Key Takeaways

- Transport = process-to-process delivery. TCP adds reliability, order, flow and congestion control; UDP adds little more than ports and a checksum.
- Ports: 16 bits; 0–1023 well-known, 1024–49151 registered, 49152–65535 ephemeral.
- Servers listen on well-known ports; clients use ephemeral ports.
- TCP connections are identified by the 4-tuple.
