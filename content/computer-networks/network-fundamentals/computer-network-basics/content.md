# What Is a Computer Network?

**Module:** Network Fundamentals · **Interview priority:** Core

## What Is It?

A **computer network** is two or more devices connected so they can exchange data by following agreed rules. The devices are called **nodes** or **hosts** (laptops, phones, servers, printers), the connections are **links** (copper cable, optical fibre, radio), and the agreed rules are **protocols**.

The **Internet** is a network of networks: millions of independent networks (homes, companies, universities, cloud providers, mobile carriers) joined together and all speaking the same core protocol, **IP**.

The whole subject answers one question:

> How does a message from an application on one device reach the right application on another device — possibly on the other side of the planet — correctly, quickly and safely?

## Why It Exists

Before networks, sharing data meant carrying it. Networks exist to share:

| What is shared | Example |
|----------------|---------|
| Information | Web pages, email, chat, video calls |
| Resources | One printer for an office, one database for many app servers |
| Computing | Cloud servers, distributed systems, microservices |
| Reliability | Backups in another city, a second path when one link fails |

### How it started

- **1960s — ARPANET.** The US Department of Defense's ARPA funded a network linking research computers. Its key idea was **packet switching**: break data into small packets that travel independently, so the network keeps working even if some links fail (see [Switching Techniques](../switching-techniques/content.md)).
- **1970s — TCP/IP.** Vint Cerf and Bob Kahn designed TCP and IP so *different* networks could interconnect. On **1 January 1983** ARPANET switched to TCP/IP — often called the birthday of the Internet.
- **1989–1991 — the World Wide Web.** Tim Berners-Lee at CERN created HTTP, HTML and URLs. The Web is an *application* that runs on the Internet; it is not the Internet itself.
- **Today.** Standards are published openly as **RFCs** by the **IETF**, so anyone can build compatible software (see [Network Protocols and Standards](../network-protocols-and-standards/content.md)).

> [!WARNING]
> **Common trap:** "The Internet and the Web are the same." The Internet is the global network infrastructure (IP, routers, links). The Web is one service on top of it (HTTP + HTML + URLs). Email, SSH, online games and DNS also use the Internet without being "the Web".

## How It Works

Sending data across a network always needs answers to four questions:

| Question | Answered by | Example |
|----------|-------------|---------|
| Which **device**? | IP address | `142.250.183.14` |
| Which **application** on that device? | Port number | `443` (HTTPS) |
| Which **next box** on this wire? | MAC address | `3c:22:fb:9a:10:4e` |
| In what **format and order**? | Protocols | HTTP over TLS over TCP over IP over Ethernet |

### IP address: which device

An **IP address** identifies a device's network interface on an IP network, like a postal address identifies a building. IPv4 addresses are 32 bits written as four numbers (`192.168.1.10`); IPv6 addresses are 128 bits (`2001:db8::10`). Routers use the destination IP to move a packet towards its target network. Details: [IPv4 Addressing](../../ip-addressing/ipv4-addressing/content.md).

### Port number: which application

One server runs many programs — a web server, a database, SSH. The **port number** (0–65535) says which program a message is for, like a flat number inside the building. A web browser connects to port 443 for HTTPS; PostgreSQL listens on 5432. Details: [Transport Layer and Ports](../../transport-layer/transport-layer-and-ports/content.md).

```text
   IP address  →  which building        142.250.183.14
   port        →  which flat inside it  :443
   together    →  one exact endpoint    142.250.183.14:443
```

### Packets: how the data travels

Large data is split into **packets**. Each packet carries a header with the source and destination addresses, travels independently through routers, and is reassembled at the destination. If one packet is lost, only that packet is resent — not the whole file.

### Protocols: the agreed rules

A protocol defines message format, order and meaning — for example HTTP says a request starts with a line like `GET /index.html HTTP/1.1`. Because the job is large, protocols are **layered**: each layer solves one problem and relies on the layer below (see [OSI Model Overview](../../osi-model/osi-model-overview/content.md)).

## Real World

Opening `https://example.com` uses a stack of networks and protocols you will meet in this course:

```text
Your laptop ──Wi-Fi──► home router ──fibre──► ISP ──► Internet backbone ──► data centre ──► web server
   DHCP gave it an IP     NAT translates       routing chooses paths         TCP + TLS + HTTP carry the page
   DNS turns the name into an IP address
```

The complete step-by-step version is [From Wi-Fi to Web Page](../../end-to-end-flows/url-to-webpage-journey/content.md).

**Think about it:** Why could ARPANET's packet switching survive a broken link when a telephone call could not?

<details>
<summary>Answer</summary>

A classic phone call reserved one fixed circuit end to end; if a link on it failed, the call dropped. With packet switching, each packet is forwarded independently, so routers can send later packets around the failed link.

</details>

## Common Traps

- **"An IP address identifies a computer."** It identifies a *network interface*. A laptop with Wi-Fi and Ethernet has two; a server can have many; addresses can change (DHCP).
- **"The port is a physical socket on the computer."** In networking a port is a 16-bit number in the TCP/UDP header, not a hardware connector.
- **"Data travels as one big piece."** It is split into packets (and frames on each link), which may take different paths and arrive out of order.

## Interview Follow-up

- *"What is the difference between the Internet and an intranet?"* → [Network Types](../network-types/content.md).
- *"Why do we need both IP addresses and MAC addresses?"* → [IP vs MAC Addresses](../../arp-and-local-delivery/ip-vs-mac-addresses/content.md).
- *"What happens when you type a URL?"* → [From Wi-Fi to Web Page](../../end-to-end-flows/url-to-webpage-journey/content.md).

## Key Takeaways

- A network = nodes + links + protocols. The Internet = a network of networks running IP.
- IP address → which device (interface); port → which application; MAC address → which device on the local link.
- Data is split into packets that travel independently — the idea that made ARPANET resilient.
- The Web (HTTP) is one application on the Internet, not the Internet itself.
