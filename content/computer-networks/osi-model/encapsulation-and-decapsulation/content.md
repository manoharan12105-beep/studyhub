# Encapsulation and Decapsulation

**Module:** OSI Model · **Interview priority:** Core

## What Is It?

**Encapsulation** is how data is wrapped on its way **down** the layers at the sender: each layer takes the data from the layer above (its **payload**) and adds its own **header** (and, at Layer 2, a **trailer**). **Decapsulation** is the reverse at the receiver: each layer reads and removes its own header, then passes the payload **up**.

```text
SENDER (encapsulation, going down)

L7  Application                              [ HTTP data ]
L4  Transport                       [ TCP hdr | HTTP data ]                    = segment
L3  Network               [ IP hdr | TCP hdr | HTTP data ]                     = packet
L2  Data Link   [ Eth hdr | IP hdr | TCP hdr | HTTP data | FCS ]               = frame
L1  Physical    0101100101110100101 ...                                        = bits

RECEIVER (decapsulation, going up): the same steps in reverse —
NIC checks FCS → removes Eth header → IP checks address → removes IP header →
TCP checks port, orders bytes → removes TCP header → application gets HTTP data
```

## Why It Exists

Each layer needs its own control information — ports for transport, IP addresses for routing, MAC addresses for the link — but it must not depend on the others. Wrapping keeps layers independent: IP carries a TCP segment without understanding it, and Ethernet carries an IP packet without understanding it. A layer's header is read only by the **same layer** on the other side (its peer).

## How It Works

### What each header contains

| Layer | Header adds | Key fields | Size |
|-------|-------------|------------|------|
| Application | Application message | `GET /api/orders/7 HTTP/1.1`, `Host:` … | Varies |
| (Presentation) | Encryption by TLS | TLS record header + encrypted data | +5 bytes header + tag |
| Transport (TCP) | TCP header | Source port, destination port, sequence number, ACK number, flags, window, checksum | 20–60 bytes |
| Network (IP) | IP header | Source IP, destination IP, TTL, protocol (6 = TCP), total length | 20 bytes (IPv4, no options) / 40 (IPv6) |
| Data Link (Ethernet) | Header **and trailer** | Destination MAC, source MAC, EtherType (`0x0800`); trailer: FCS (CRC-32) | 14 + 4 bytes |
| Physical | Signal | Preamble and start delimiter for synchronisation | 8 bytes on Ethernet |

**Only the Data Link layer adds a trailer.** The CRC must be computed over the whole frame, so it is easiest to append it at the end as the bits go out.

### The journey of one request (an HTTP GET)

1. **Application:** the browser produces `GET /index.html HTTP/1.1 …` (about 400 bytes).
2. **TLS** (if HTTPS) encrypts it into a TLS record.
3. **Transport:** TCP adds a header — source port `52100`, destination port `443`, sequence number — making a **segment**.
4. **Network:** IP adds a header — source `192.168.1.10`, destination `203.0.113.10`, TTL 64, protocol 6 — making a **packet**.
5. **Data Link:** Ethernet/Wi-Fi adds a header — source = the laptop's MAC, destination = **the default gateway's MAC** (found by [ARP](../../arp-and-local-delivery/arp-address-resolution/content.md)) — and a FCS trailer, making a **frame**.
6. **Physical:** the NIC sends the bits as radio or electrical signals.

### What happens in between: routers re-encapsulate

A router decapsulates **only up to Layer 3**, then encapsulates again for the next link:

```text
frame in:  [Eth: laptop MAC → router MAC][IP 192.168.1.10 → 203.0.113.10, TTL 64][TCP][data][FCS]
router:    check FCS, strip Eth → read IP dst → route lookup → TTL 64 → 63
frame out: [Eth: router MAC → next-hop MAC][IP 192.168.1.10 → 203.0.113.10, TTL 63][TCP][data][FCS]
```

The TCP header and data are carried untouched. A switch is even simpler: it reads only the destination MAC and forwards the same frame.

### Overhead

For a full Ethernet frame carrying 1,460 bytes of TCP data: 14 (Ethernet) + 20 (IP) + 20 (TCP) + 4 (FCS) = 58 bytes of headers and trailer, about 4 % overhead (more with preamble, inter-frame gap, TCP options and TLS). Small messages pay proportionally much more — a 1-byte keystroke in SSH still needs ~58+ bytes on the wire.

**MTU** (Maximum Transmission Unit) is the largest payload a link can carry — 1,500 bytes for Ethernet. Inside it: 20 (IP) + 20 (TCP) + 1,460 (data). That 1,460 is the typical TCP **MSS** (maximum segment size).

## Real World

- VPNs and tunnels encapsulate a whole packet **inside another** packet (IP-in-IP, VXLAN in data centres, WireGuard), which reduces the usable MTU — a classic source of "small requests work, big ones hang" bugs.
- Wireshark shows exactly this nesting: Frame → Ethernet II → Internet Protocol → TCP → TLS → HTTP.

## Common Traps

- **"Every layer adds a trailer."** Only the Data Link layer does.
- **"Routers decapsulate up to the application."** They stop at Layer 3; the TCP segment and data pass through unchanged (unless NAT or a proxy is involved).
- **"The IP header contains the port."** Ports are in the TCP/UDP header, *inside* the IP payload.

## Interview Follow-up

- *"What changes in the headers at each hop?"* Ethernet header and FCS (new MACs), IP TTL and header checksum. Not the IPs, ports or data.
- *"Why does a VPN sometimes break large transfers?"* The extra headers exceed the path MTU, and if ICMP "fragmentation needed" messages are blocked, large packets silently disappear.

## Key Takeaways

- Encapsulation: data → segment (+TCP) → packet (+IP) → frame (+Ethernet header and FCS trailer) → bits.
- Decapsulation reverses it; each layer reads only its peer's header.
- Routers decapsulate to Layer 3 and re-encapsulate with new MACs; switches forward frames as they are.
- Headers cost bytes: ~58 per full Ethernet frame; MTU 1,500 → MSS 1,460.
