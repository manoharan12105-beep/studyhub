# The OSI Model: Seven Layers

**Module:** OSI Model · **Interview priority:** Core

## What Is It?

The **OSI (Open Systems Interconnection) model** is a reference model published by ISO that splits network communication into **seven layers**. Each layer has one job, offers a service to the layer above, and uses the service of the layer below.

| # | Layer | Job in one line | PDU (data unit) | Address / identifier | Examples |
|---|-------|-----------------|-----------------|----------------------|----------|
| 7 | **Application** | Network services for applications | Data / message | URL, hostname | HTTP, DNS, SMTP, SSH, FTP |
| 6 | **Presentation** | Format, encode, encrypt, compress | Data | — | TLS (encryption), JSON/UTF-8, JPEG, gzip |
| 5 | **Session** | Open, manage and close dialogues | Data | Session ID | Session setup, checkpoints (RPC, NetBIOS); TLS sessions |
| 4 | **Transport** | Process-to-process delivery; reliability | **Segment** (TCP) / **Datagram** (UDP) | **Port** | TCP, UDP |
| 3 | **Network** | Host-to-host delivery across networks; routing | **Packet** | **IP address** | IP, ICMP, OSPF, BGP |
| 2 | **Data Link** | Node-to-node delivery on one link; framing; error detection | **Frame** | **MAC address** | Ethernet, Wi-Fi (802.11), ARP*, PPP |
| 1 | **Physical** | Bits as signals on the medium | **Bit** | — | Cables, fibre, radio, connectors, voltages |

\* ARP sits between layers 2 and 3: it serves IP but is carried directly in Ethernet frames.

> [!TIP]
> Mnemonics: top-down **"All People Seem To Need Data Processing"** (Application → Physical); bottom-up **"Please Do Not Throw Sausage Pizza Away"**.

## Why It Exists

Networking is too big to design as one piece. Layering gives:

- **Separation of concerns:** HTTP does not care whether the bits travel over Wi-Fi or fibre.
- **Independent evolution:** Wi-Fi 6 replaced Wi-Fi 5 without changing TCP; HTTP/2 replaced HTTP/1.1 without changing IP.
- **Interoperability:** vendors build one layer to a standard interface.
- **A shared vocabulary:** "it's a Layer 2 problem" instantly narrows a fault to frames, MACs, switches and VLANs.
- **Systematic troubleshooting:** test layer by layer.

The OSI model is a **teaching and troubleshooting model**. The Internet actually runs on the [TCP/IP model](../../tcp-ip-model/tcp-ip-model/content.md), which merges some OSI layers.

## How It Works

### Two groups of layers

```text
 7 Application   ┐
 6 Presentation  ├─ "upper layers": implemented in the application / libraries
 5 Session       ┘
 4 Transport     ── end-to-end: only in the two hosts (OS kernel)
 3 Network       ┐
 2 Data Link     ├─ "lower layers": also implemented in network devices
 1 Physical      ┘
```

- Layers **4–7 are end-to-end**: only the sending and receiving hosts process them.
- Layers **1–3 are hop-by-hop**: every router processes up to Layer 3; every switch up to Layer 2.

### Vertical and horizontal communication

- **Vertically**, on one host, each layer passes data to the layer below, which adds its own header ([encapsulation](../encapsulation-and-decapsulation/content.md)).
- **Horizontally**, each layer talks *logically* to the **same layer** on the other host (its **peer**) using its protocol: the client's TCP talks to the server's TCP; the browser's HTTP talks to the server's HTTP. Only Layer 1 is physically connected.

```text
Host A                                   Host B
HTTP  ◄────────── HTTP protocol ───────►  HTTP
TCP   ◄────────── TCP protocol ────────►  TCP
IP    ◄── IP ──► Router ◄── IP ──►        IP
Eth   ◄─ Eth ──► Router ◄─ Eth ──►        Eth
Phys  ═══════════ wire ═══════ wire ═══   Phys
```

### Which device works at which layer

| Layer | Devices |
|-------|---------|
| 7 | L7 load balancer, reverse proxy, API gateway, WAF |
| 4 | L4 load balancer, stateful firewall |
| 3 | Router, Layer 3 switch |
| 2 | Switch, bridge, access point, NIC |
| 1 | Hub, repeater, modem, cables |

The details of each layer: [Physical and Data Link](../osi-physical-and-data-link-layers/content.md) · [Network and Transport](../osi-network-and-transport-layers/content.md) · [Session, Presentation and Application](../osi-upper-layers/content.md).

## Using the OSI Model to Troubleshoot

Because each layer depends on those below, a failure at a low layer breaks everything above it. Three approaches:

| Approach | Start | Use when |
|----------|-------|----------|
| **Bottom-up** | Layer 1: cable, link light, Wi-Fi connected? | Nothing works at all, or a new setup |
| **Top-down** | Layer 7: does the app return an error? | One application fails, others work |
| **Divide and conquer** | A middle layer, e.g. `ping` (Layer 3) | Experienced guess; split the stack in half |

Example — "the website does not open":

| Layer | Check | Tool |
|-------|-------|------|
| 1 | Cable plugged in / Wi-Fi connected? | Link light, Wi-Fi icon |
| 2 | Interface up, has a MAC, gateway's MAC resolvable? | `ip link`, `arp -a` |
| 3 | Has an IP, gateway reachable, Internet reachable by IP? | `ipconfig` / `ip addr`, `ping`, `traceroute` |
| 4 | Port open? Connection refused or timed out? | `nc -zv host 443`, `curl -v` |
| 5–6 | TLS handshake OK? Certificate valid? | `curl -v`, browser warning |
| 7 | HTTP status, DNS answer correct? | `curl -I`, `nslookup` / `dig` |

The full method is in [Network Troubleshooting Methodology](../../troubleshooting/network-troubleshooting-methodology/content.md).

## Real World

Mapping an HTTPS request from a browser to a Spring Boot API:

| Layer | What happens |
|-------|--------------|
| 7 | Browser builds `GET /api/orders/7`; Spring MVC handles it |
| 6 | TLS encrypts it; JSON encodes the body in UTF-8 |
| 5 | TLS session / HTTP keep-alive keeps the dialogue open |
| 4 | TCP segment from port 52100 to port 443 |
| 3 | IP packet from `192.168.1.10` to `203.0.113.10` |
| 2 | Ethernet/Wi-Fi frame to the router's MAC |
| 1 | Radio waves, then light in fibre |

## Common Traps

- **"The OSI model is what the Internet uses."** It is a reference model; the Internet uses TCP/IP. OSI's own protocol suite never won.
- **"TLS is clearly Layer 6."** TLS does presentation-layer work (encryption) and session-like work, but runs on top of TCP and is often called "between 4 and 7". Say *"it performs presentation-layer functions"* and explain.
- **"Each layer is a separate program."** Layers 5–7 are usually one application plus libraries; layers 3–4 live in the OS kernel; layers 1–2 in the NIC and its driver.
- **PDU names:** frame (L2), packet (L3), segment/datagram (L4). Mixing these up is a common interview slip.

## Interview Follow-up

- *"OSI vs TCP/IP?"* → [OSI vs TCP/IP](../../tcp-ip-model/osi-vs-tcp-ip/content.md).
- *"At which layer does a router work? A switch? A load balancer?"* 3, 2, and 4 or 7.

## Key Takeaways

- Seven layers: Application, Presentation, Session, Transport, Network, Data Link, Physical.
- PDUs: data → segment/datagram → packet → frame → bits. Addresses: port (L4), IP (L3), MAC (L2).
- Layers 4–7 are end-to-end; layers 1–3 are processed at every hop.
- Each layer talks to its peer logically and to the layer below physically.
- Troubleshoot bottom-up, top-down, or divide and conquer.
