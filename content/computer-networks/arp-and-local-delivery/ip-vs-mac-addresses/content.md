# IP Addresses vs MAC Addresses

**Module:** ARP and Local Delivery · **Interview priority:** Core

## What Is It?

Every packet on a LAN carries **two pairs** of addresses:

| | MAC address | IP address |
|---|-------------|------------|
| Layer | 2 — Data Link | 3 — Network |
| Size | 48 bits (`3c:22:fb:9a:10:4e`) | 32 bits IPv4 (`192.168.1.10`), 128 bits IPv6 |
| Assigned by | Manufacturer (burned into the NIC; changeable) | Network admin or DHCP (changes with the network) |
| Structure | Flat — no location information | Hierarchical — network part + host part |
| Scope | **One link** — the next hop | **End to end** — source to final destination |
| Changes along the path? | **Yes, at every router** | **No** (unless NAT) |
| Used by | Switches, NICs | Routers, hosts |
| Analogy | The name of the person who hands the parcel to the next courier | The address written on the parcel |

## Why It Exists

Why not just one address?

- **MAC alone cannot scale.** MACs are flat: a MAC says *who* a device is but nothing about *where* it is. A router would need a separate entry for every device on Earth. IP addresses are hierarchical, so one route (`10.20.0.0/16`) covers 65,536 hosts.
- **IP alone cannot deliver on the wire.** Ethernet and Wi-Fi hardware deliver frames by MAC. On a shared link, the frame must say *which* NIC should accept it.
- **Independence:** IP works over any link type (Ethernet, Wi-Fi, 5G, VPN tunnels); each link has its own Layer 2 addressing. And a laptop keeps its MAC but gets a different IP in every network it joins.

> [!TIP]
> One line for interviews: **"IP gets the packet to the right network and host; MAC gets the frame to the right device on the current link."**

## How It Works

### A packet crossing two routers

PC A (`192.168.1.10`) sends to server S (`203.0.113.10`) through routers R1 and R2:

```text
        Link 1                     Link 2                      Link 3
 [A] ─────────────► [R1] ─────────────────► [R2] ─────────────────► [S]

Link 1: src MAC = A        dst MAC = R1(in)    src IP = 192.168.1.10   dst IP = 203.0.113.10
Link 2: src MAC = R1(out)  dst MAC = R2(in)    src IP = 192.168.1.10   dst IP = 203.0.113.10
Link 3: src MAC = R2(out)  dst MAC = S         src IP = 192.168.1.10   dst IP = 203.0.113.10
```

- The **MAC pair changes on every link**: each router strips the incoming frame and builds a new one.
- The **IP pair stays the same** from A to S (NAT at a home router would change the source IP — see [NAT](../../nat/network-address-translation/content.md)).
- A never learns S's MAC address, and never needs it. On link 1, A only needs **R1's MAC** — the default gateway's.

### How the MAC for the next hop is found

The sender knows the destination **IP**. To build the frame it needs the **MAC of the next hop**:

- Destination in **my subnet** → next hop = the destination itself → find *its* MAC.
- Destination **outside** my subnet → next hop = my **default gateway** → find the *gateway's* MAC.

Finding a MAC from an IP is the job of **ARP** for IPv4 ([ARP](../arp-address-resolution/content.md)) and **NDP** for IPv6. Deciding local vs remote uses the subnet mask ([Local vs Remote Delivery](../local-vs-remote-delivery/content.md)).

## IP vs MAC vs Port

| Question | Identifier |
|----------|------------|
| Which device on this wire? | MAC |
| Which host on the Internet? | IP |
| Which application on that host? | Port |

A full delivery uses all three: frame to the next device (MAC), packet to the host (IP), segment to the process (port).

## Real World

- `ip neigh` (Linux) or `arp -a` (Windows) shows the IP ↔ MAC mappings your machine has learned.
- `traceroute` shows the IP of each router hop; you never see remote MACs because they exist only on links far away.
- Cloud networks: VMs have MACs, but you configure everything — security groups, routes — by IP.

## Common Traps

> [!WARNING]
> **Common trap:** "To send to a server on the Internet, my PC needs the server's MAC address." It needs only the **default gateway's** MAC. The server's MAC is never seen outside the server's own LAN.

- **"The MAC address is the device's permanent identity everywhere."** It matters only on the local link and can be randomised.
- **"The router changes the destination IP to the next router's IP."** The destination IP stays the final server; only the destination **MAC** points at the next router.

## Interview Follow-up

- *"Why do we need both IP and MAC addresses?"* Hierarchical routing (IP) + local delivery on the wire (MAC); see above.
- *"What changes in a packet hop by hop?"* MACs, TTL, IP header checksum, FCS.

## Key Takeaways

- MAC: 48-bit, flat, link-local, changes at every hop. IP: hierarchical, end to end, unchanged along the path (except NAT).
- To reach a remote host, a frame is addressed to the **gateway's MAC** with the **server's IP**.
- ARP (IPv4) / NDP (IPv6) find the MAC of the next hop.
