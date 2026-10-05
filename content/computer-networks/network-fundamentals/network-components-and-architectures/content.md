# Network Components and Architectures

**Module:** Network Fundamentals · **Interview priority:** Core

## What Is It?

Every network, from a home Wi-Fi to the Internet, is built from the same parts, and its applications are organised in one of two ways: **client-server** or **peer-to-peer (P2P)**.

## Why It Exists

Before you can follow a packet, you must know what it travels between (hosts), what it travels over (links and intermediate devices) and who starts the conversation (client) versus who waits for it (server). Backend development is client-server networking: your Spring Boot app is a server to browsers and a client to PostgreSQL.

## Network Components

| Component | Role | Examples |
|-----------|------|----------|
| **Host / end system** | Runs applications; the source or final destination of data | Laptop, phone, web server, database server, smart TV |
| **Network interface (NIC)** | Connects a host to a link; has a MAC address | Ethernet port, Wi-Fi adapter |
| **Link / transmission medium** | Carries the signal | Twisted-pair copper, optical fibre, radio (Wi-Fi, 5G) |
| **Intermediate devices** | Forward data between links and networks | Switch, router, access point, firewall, load balancer |
| **Protocols** | Rules for format, order and meaning | Ethernet, IP, TCP, HTTP, DNS |
| **Services / applications** | What users actually use | Web, email, file sharing, video, APIs |

A **node** is any device on the network — hosts *and* intermediate devices. The devices themselves are covered in [Network Devices](../../network-devices/nic-repeater-hub-bridge-switch/content.md).

## Clients and Servers

- A **server** is a program that **waits** (listens) on a known port for requests and answers them. The word is also used for the machine that runs such programs.
- A **client** is a program that **starts** the conversation by sending a request to a server.

The role belongs to the program in that conversation, not to the hardware: the same Spring Boot process is a **server** for incoming HTTP requests and a **client** of PostgreSQL, Redis and other APIs.

```text
Browser (client) ──HTTP──► Spring Boot (server)
                            Spring Boot (client) ──PostgreSQL protocol──► PostgreSQL (server)
                            Spring Boot (client) ──HTTP──► Payment API (server)
```

## Client-Server Architecture

One or more central servers provide a service; many clients request it.

```text
      client      client      client
          \         |         /
           \        |        /
            ──►  [ server ]  ◄──
```

| Strength | Weakness |
|----------|----------|
| Central control: one place for data, security and updates | The server is a bottleneck and a single point of failure (unless replicated) |
| Clients can be simple (a browser) | Cost grows with users: more servers, bandwidth, load balancers |
| Easy to secure and back up | If the server is down, nobody gets the service |

Examples: websites, REST APIs, email servers, databases, DNS.

**Two-tier vs three-tier:** a desktop app talking directly to a database is two-tier; a browser → application server → database is **three-tier**, which keeps business logic and database credentials off the user's device. Most web systems today are multi-tier (often with load balancers, caches and many services in between).

## Peer-to-Peer Architecture

Every participant (**peer**) is both a client and a server: it requests data from other peers and serves data to them.

```text
   peer ◄──► peer
    ▲  ╲    ╱  ▲
    │    ╳     │
    ▼  ╱    ╲  ▼
   peer ◄──► peer
```

| Strength | Weakness |
|----------|----------|
| Scales with users — each new peer adds capacity | Hard to secure, moderate or guarantee availability |
| No single point of failure | Peers behind NAT are hard to reach (see [NAT](../../nat/network-address-translation/content.md)) |
| Low cost for the provider | Data may be inconsistent; peers come and go |

Examples: BitTorrent, blockchain networks, the media path of many video calls (WebRTC connects browsers directly when NAT allows).

> [!NOTE]
> Many real systems are **hybrid**: a central server helps peers find each other (a tracker, a signalling server), then the peers exchange data directly.

## Comparison

| | Client-server | Peer-to-peer |
|---|---------------|--------------|
| Who serves? | Dedicated servers | Every peer |
| Scaling | Add servers | Grows with peers |
| Control and security | Centralised, easier | Distributed, harder |
| Single point of failure | Yes, unless replicated | No |
| Typical use | Web, APIs, email, databases | File sharing, blockchains, direct media |

## Common Traps

- **"A server is a powerful machine."** A server is a role: any program listening for requests. Your laptop running `java -jar app.jar` on port 8080 is a server.
- **"P2P means no servers at all."** Most P2P systems use a server to bootstrap (find peers), then exchange data directly.
- **"Client-server always means one server."** Large services run thousands of servers behind load balancers, but the architecture is still client-server.

## Interview Follow-up

- *"Is your Spring Boot application a client or a server?"* Both: a server to its callers, a client to its database and downstream APIs.
- *"Why is P2P hard on the Internet?"* Most peers sit behind NAT and firewalls that block unsolicited inbound connections — see [NAT traversal](../../nat/network-address-translation/content.md).

## Key Takeaways

- Components: hosts, NICs, links, intermediate devices, protocols, services.
- Client = starts the conversation; server = listens and responds. A role, not a machine.
- Client-server: central, controllable, but a bottleneck. P2P: scalable and resilient, but hard to control.
- Backend services are clients and servers at the same time.
