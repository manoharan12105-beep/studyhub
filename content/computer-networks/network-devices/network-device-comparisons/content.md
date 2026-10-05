# Network Device Comparisons

**Module:** Network Devices · **Interview priority:** Core

## What Is It?

Interviewers love "X vs Y" device questions because the answer shows whether you understand **layers**. Every comparison below reduces to: *what does the device read, and what does it decide?*

| Device | Layer | Reads | Decides |
|--------|-------|-------|---------|
| Repeater, hub | 1 | Nothing (signals) | Nothing — repeat everywhere |
| Modem | 1 | Nothing (signals) | Nothing — convert signal types |
| Bridge, switch, access point | 2 | MAC address | Which port (or flood) |
| Router | 3 | IP address | Which next hop |
| L4 load balancer, stateful firewall | 4 | Ports, connection state | Which server / allow or deny |
| L7 load balancer, reverse proxy, API gateway, WAF | 7 | HTTP method, path, headers | Which service / allow or deny |

## Why It Exists

When something breaks, the device's layer tells you what it *could* be responsible for: a switch cannot drop traffic because of a wrong port number; a router cannot fix a wrong MAC table; an L4 load balancer cannot route by URL path.

## Hub vs Switch

| | Hub | Switch |
|---|-----|--------|
| Layer | 1 | 2 |
| Forwards to | All ports | Only the destination port (floods unknown/broadcast) |
| Uses MAC table | No | Yes |
| Collision domains | 1 for all ports | 1 per port |
| Broadcast domains | 1 | 1 (per VLAN) |
| Duplex | Half | Full |
| Bandwidth | Shared | Dedicated per port |
| Security | Every host sees all traffic | Hosts see only their own + broadcasts |

## Switch vs Router

| | Switch | Router |
|---|--------|--------|
| Layer | 2 | 3 |
| Address | MAC | IP |
| Connects | Devices **within** one network | **Different** networks |
| Table | MAC address table (learned automatically) | Routing table (configured or from routing protocols) |
| Broadcasts | Forwards (floods) them | Stops them — each interface is a broadcast domain |
| Unknown destination | Floods | Drops (or uses the default route) |
| Changes the frame? | No | Yes — new Layer 2 header at every hop; TTL decremented |
| Typical use | Office/home LAN | LAN ↔ Internet, between subnets |

**Switching vs routing** in one line: *switching* delivers frames within a network using MAC addresses; *routing* delivers packets between networks using IP addresses.

## Modem vs Router

| | Modem | Router |
|---|-------|--------|
| Layer | 1 | 3 |
| Job | Converts signals for the ISP line | Forwards packets between your LAN and the ISP |
| Knows IP addresses | No (pure modem) | Yes |
| Extra functions | — | NAT, DHCP, firewall, Wi-Fi (home routers) |
| Without it | No physical connection to the ISP | Only one device could connect; no private LAN |

## Router vs Gateway

- **Router:** a device type — forwards IP packets between networks.
- **Gateway:** a role — the exit point to another network. The *default gateway* is usually a router; a *protocol gateway* (email, VoIP, API gateway) also translates or inspects at higher layers.
- Every default gateway is a router (or a device acting as one); not every gateway is a plain router.

## Layer 2 vs Layer 3 Devices

| | Layer 2 (switch, bridge, AP) | Layer 3 (router, L3 switch) |
|---|------------------------------|-----------------------------|
| Address | MAC (flat, local meaning) | IP (hierarchical, global meaning) |
| Scope | One broadcast domain | Between broadcast domains |
| Loop protection | STP (blocks redundant links) | TTL in every packet |
| Forwarding table | Learned from source MACs | Routes from configuration/protocols |

A **Layer 3 switch** combines both: switch ports plus hardware routing between VLANs. It is common in enterprise networks; it usually lacks WAN features such as NAT and VPN that edge routers have.

## Access Point vs Router

An access point bridges Wi-Fi clients onto the existing LAN (Layer 2, same subnet). A router creates a boundary between networks (Layer 3). A home "Wi-Fi router" is both — which causes the confusion.

## Real World

- Plugging a second home "router" into the first one in router mode creates a second subnet with double NAT; in **access point mode** it just extends the same LAN. Knowing the layer explains the difference.
- In the cloud, the "switch" and "router" are virtual (VPC networking), but the same rules hold: subnets talk through route tables, not through MAC flooding.

## Common Traps

> [!WARNING]
> **Common trap:** "Switches separate broadcast domains." They separate **collision** domains. Only routers (and VLANs) separate broadcast domains.

- **"A router forwards by MAC address."** It forwards by IP; it *uses* MAC addresses only to deliver the frame to the next hop.
- **"The source IP changes at each router."** Only the MAC addresses change (unless NAT is involved).

## Interview Follow-up

- *"How many broadcast domains in: 3 switches connected to one router with 3 interfaces?"* Three — one per router interface.
- *"Why can't we connect the whole world with switches?"* MAC addresses are flat (no hierarchy to summarise), unknown destinations are flooded and broadcasts reach everyone; IP routing scales by aggregating prefixes.

## Key Takeaways

- Layer decides capability: L1 repeats, L2 switches by MAC, L3 routes by IP, L4 decides by port, L7 by HTTP content.
- Hub vs switch: everyone vs only the destination. Switch vs router: within a network vs between networks.
- Modem converts signals; router forwards packets. Router is a device; gateway is a role.
- Switches split collision domains; routers split broadcast domains.
