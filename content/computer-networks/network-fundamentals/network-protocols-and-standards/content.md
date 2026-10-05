# Network Protocols and Standards

**Module:** Network Fundamentals · **Interview priority:** Frequently asked

## What Is It?

A **protocol** is an agreed set of rules for communication: the **format** of messages, their **order**, what each one **means**, and what to do on errors or timeouts. Two programs written by different people, in different languages, on different operating systems can talk only because both follow the same protocol.

```text
Human analogy                      HTTP
"Hello"            ──►             GET /index.html HTTP/1.1
          ◄──  "Hi, how can I help?"       HTTP/1.1 200 OK + the page
```

## Why It Exists

Without shared rules, a receiver cannot tell where a message starts, which bytes are the address, or whether the sender expects an answer. Protocols turn raw bits into meaningful, interoperable communication. **Standards** make the rules public so any vendor can implement them — the reason a Samsung phone can load a page from a Linux server through a Cisco router.

## How It Works

### The three elements of a protocol

| Element | Question | HTTP example |
|---------|----------|--------------|
| **Syntax** | What is the format? | Request line, headers, blank line, body |
| **Semantics** | What does each part mean? | `GET` = read a resource; `404` = not found |
| **Timing** | When and in what order? | Request first, then response; a timeout if no answer |

### Who writes the standards

| Body | Standardises | Examples |
|------|--------------|----------|
| **IETF** (Internet Engineering Task Force) | Internet protocols, published as **RFCs** | IP (RFC 791), TCP (RFC 9293), HTTP semantics (RFC 9110), DNS (RFC 1034/1035) |
| **IEEE** | LAN and wireless link standards | Ethernet (802.3), Wi-Fi (802.11), VLANs (802.1Q) |
| **ISO** | The OSI reference model | ISO/IEC 7498 |
| **W3C / WHATWG** | Web content and browser APIs | HTML, CSS, Fetch |
| **IANA** (under ICANN) | Number registries | Port numbers, root DNS zone, IP address blocks |

An **RFC** (Request for Comments) is the document that defines an Internet standard. "Read the RFC" is how engineers settle arguments about protocol behaviour.

### Protocols are layered

No single protocol does everything. Each solves one problem and uses the one below:

| Protocol | Problem it solves |
|----------|-------------------|
| HTTP | What the application wants (a page, an API call) |
| TLS | Keeping it private and authentic |
| TCP | Reliable, ordered delivery to the right process (port) |
| IP | Getting packets across networks to the right host |
| Ethernet / Wi-Fi | Getting frames to the next device on this link |

This layering is formalised by the [OSI model](../../osi-model/osi-model-overview/content.md) and the [TCP/IP model](../../tcp-ip-model/tcp-ip-model/content.md).

### Common protocols you will meet

| Protocol | Purpose | Transport · Port |
|----------|---------|------------------|
| HTTP / HTTPS | Web pages and APIs | TCP 80 / TCP 443 (HTTP/3: UDP 443) |
| DNS | Names → IP addresses | UDP 53 (TCP 53 for large answers) |
| DHCP | Automatic IP configuration | UDP 67 (server), 68 (client) |
| SSH | Secure remote shell | TCP 22 |
| SMTP | Sending email between servers | TCP 25 (587 for client submission) |
| TCP / UDP | Transport | — (they *provide* ports) |
| IP, ICMP, ARP | Network and link support | — |

The full table is in [Application Layer Protocols](../../application-layer/application-layer-protocols/content.md).

## Real World

- Spring Boot does not implement HTTP from scratch: embedded Tomcat implements the HTTP RFCs, the JDK implements TLS, and the operating system kernel implements TCP and IP. Each layer is a separate, standard implementation.
- When a load balancer, browser and server disagree (for example about a header), the RFC decides who is wrong.

## Common Traps

- **"TCP/IP is one protocol."** It is a *suite*: IP, TCP, UDP, ICMP, ARP and many more.
- **"A protocol is software."** A protocol is a specification. Software (Tomcat, the Linux kernel, curl) *implements* it.
- **"Port numbers are part of IP."** Ports belong to the transport layer (TCP/UDP headers). IP knows only addresses.

## Interview Follow-up

- *"Why are protocols layered?"* Each layer can change independently (Wi-Fi replaced Ethernet cables without changing HTTP; HTTP/2 arrived without changing IP), and each problem is solved once.
- *"What is an RFC?"* The IETF's numbered documents that define Internet protocols.

## Key Takeaways

- Protocol = syntax + semantics + timing.
- IETF publishes Internet standards as RFCs; IEEE defines Ethernet and Wi-Fi; IANA assigns ports and addresses.
- Protocols are layered: HTTP → TLS → TCP → IP → Ethernet/Wi-Fi.
- A protocol is a specification; Tomcat, curl and the kernel are implementations.
