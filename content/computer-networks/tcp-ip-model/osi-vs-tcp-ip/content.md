# OSI vs TCP/IP

**Module:** TCP/IP Model · **Interview priority:** Core

## What Is It?

Two layered models of networking. **OSI** (7 layers, ISO) is a reference model used for teaching and troubleshooting. **TCP/IP** (4 or 5 layers, IETF) is the model of the protocols the Internet actually runs.

## Why It Exists

Interviewers ask this to check that you know the difference between a **conceptual model** and a **working protocol suite**, and that you can map one onto the other — engineers say "Layer 7 load balancer" (OSI numbering) about systems that run TCP/IP.

## Layer Mapping

```text
          OSI (7)                    TCP/IP (5)              TCP/IP (4, RFC 1122)
   ┌──────────────────┐
 7 │ Application      │       ┌──────────────────┐      ┌──────────────────┐
 6 │ Presentation     │  ───► │ Application      │ ───► │ Application      │
 5 │ Session          │       └──────────────────┘      └──────────────────┘
   ├──────────────────┤       ┌──────────────────┐      ┌──────────────────┐
 4 │ Transport        │  ───► │ Transport        │ ───► │ Transport        │
   ├──────────────────┤       ├──────────────────┤      ├──────────────────┤
 3 │ Network          │  ───► │ Network          │ ───► │ Internet         │
   ├──────────────────┤       ├──────────────────┤      ├──────────────────┤
 2 │ Data Link        │  ───► │ Data Link        │ ─┐   │                  │
 1 │ Physical         │  ───► │ Physical         │ ─┴─► │ Link             │
   └──────────────────┘       └──────────────────┘      └──────────────────┘
```

## Comparison

| | OSI | TCP/IP |
|---|-----|--------|
| Layers | 7 | 4 (RFC) or 5 (textbook) |
| Created by | ISO (standard published 1984) | DARPA researchers / IETF (1970s–80s) |
| Approach | Model first, protocols later | Protocols first, model describes them |
| Nature | Reference / conceptual model | Practical, implemented suite |
| Upper layers | Separate Session, Presentation, Application | One Application layer does all three |
| Protocol dependence | Protocol-independent | Built around TCP, UDP and IP |
| Network layer service | Connection-oriented and connectionless | Connectionless only (IP) |
| Transport layer | Connection-oriented emphasis | TCP (connection-oriented) and UDP (connectionless) |
| Use today | Teaching, troubleshooting, vocabulary ("L4", "L7") | Runs the Internet and almost every network |

## Practical Differences

1. **Where things go:** in OSI, encryption is a presentation-layer job; in TCP/IP, TLS is part of the Application layer. In OSI, session handling is its own layer; in TCP/IP, each application handles it.
2. **Strictness:** OSI defines clean service interfaces between layers; TCP/IP is looser — e.g. ARP and ICMP do not fit a single layer neatly.
3. **Numbering survives from OSI:** "Layer 2 switch", "Layer 3 router", "L4 vs L7 load balancer" all use OSI numbers even in TCP/IP networks.

## Why TCP/IP Won

- It **already worked**: TCP/IP was running on ARPANET (switched over in 1983) and shipped free with BSD Unix, while OSI protocols were still being specified.
- **Simplicity:** fewer layers, a simple best-effort IP core.
- **Openness:** RFCs were free to read and implement; OSI documents were costly and complex.
- **Network effects:** once the Internet grew, every new device had to speak TCP/IP.

OSI's lasting contribution is the **vocabulary and the 7-layer thinking**, not its protocols.

## Real World

| Phrase you will hear | Meaning |
|----------------------|---------|
| "It's a Layer 1 issue" | Cable, signal, port physically down |
| "L2 adjacency" | Hosts in the same VLAN/broadcast domain |
| "L3 routing" | IP routing between subnets |
| "L4 load balancer" | Balances TCP/UDP connections by IP and port |
| "L7 load balancer" | Balances HTTP requests by path, host, headers |

## Common Traps

- **"The Internet uses OSI."** It uses TCP/IP; OSI is the reference model.
- **"TCP/IP has no session or presentation functions."** It has them — inside the Application layer (TLS, compression, encodings, keep-alive).
- **"OSI is useless."** It is the shared language for troubleshooting and for naming devices and load balancers.

## Interview Follow-up

- *"Which model do you use when troubleshooting?"* OSI's layers as a checklist, while knowing the real protocols are TCP/IP.
- *"Map TLS, HTTP, TCP, IP, Ethernet to both models."* HTTP: OSI 7 / TCP/IP Application; TLS: OSI 6 (approx.) / Application; TCP: 4 / Transport; IP: 3 / Network; Ethernet: 2 (+1) / Data Link (+Physical).

## Key Takeaways

- OSI: 7 layers, a reference model. TCP/IP: 4 or 5 layers, the real Internet suite.
- OSI's Session + Presentation + Application = TCP/IP Application; OSI's Data Link + Physical = TCP/IP Link (4-layer view).
- TCP/IP won because it worked first, was simpler and was open.
- OSI numbering (L2, L3, L4, L7) is still the everyday vocabulary.
