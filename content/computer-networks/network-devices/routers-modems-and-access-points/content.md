# Routers, Gateways, Modems and Access Points

**Module:** Network Devices · **Interview priority:** Core

## What Is It?

These devices connect a local network to **other** networks and to wireless clients:

| Device | Layer | Job |
|--------|-------|-----|
| **Router** | 3 — Network | Forwards **packets between different networks** using IP addresses and a routing table |
| **Gateway** | Role (often 3, can be up to 7) | The exit point from one network to another; a **default gateway** is the router a host sends non-local traffic to |
| **Modem** | 1 — Physical | **Mo**dulates and **dem**odulates: converts digital data to the signal used by the ISP's line (DSL, cable, fibre ONT, 4G/5G) and back |
| **Access point (AP)** | 2 — Data Link | Connects **wireless** devices to a wired LAN (a wireless bridge to Ethernet) |

## Why It Exists

A switch connects devices **inside** one network. To reach anything outside — another subnet, the Internet — packets must cross into a different network with different addressing. That needs a device that understands IP addresses and paths: the router. The modem exists because the ISP's line uses a different physical signal than your Ethernet, and the access point exists because phones and laptops have no cable.

## Router

A router has interfaces in two or more networks. For each packet:

1. Receive the frame; check it is addressed to the router's MAC; strip the Layer 2 header.
2. Read the **destination IP address**.
3. Look it up in the **routing table** — the most specific matching route wins ([longest prefix match](../../routing/longest-prefix-match/content.md)).
4. Decrease **TTL** by 1; drop the packet if it reaches 0 (and send an ICMP Time Exceeded message).
5. Build a **new frame** for the outgoing link, addressed to the next hop's MAC, and send it.

```text
LAN 192.168.1.0/24                          ISP network
[PC] ──► [switch] ──► [ROUTER] ──────────► [ISP router] ──► Internet
                     eth0: 192.168.1.1      wan0: 203.0.113.45
```

Key properties:

- **Each router interface is a separate broadcast domain** — routers do not forward broadcasts.
- Routers connect *different* networks (subnets); hosts in the same subnet talk through switches without the router.
- Routers learn routes statically (configured) or dynamically ([routing protocols](../../routing/static-and-dynamic-routing/content.md)).
- Home routers also do [NAT](../../nat/network-address-translation/content.md), DHCP, DNS forwarding and firewalling.

## Gateway and Default Gateway

**Gateway** means "a node that connects one network to another". Two common uses:

1. **Default gateway** — the IP address of the router a host sends packets to when the destination is **not in its own subnet**. On a home network it is usually `192.168.1.1` or `192.168.0.1`, given by [DHCP](../../dhcp/dhcp-dora/content.md). Without a correct default gateway, a host can reach its own subnet but nothing else.
2. **Protocol / application gateway** — a device that translates between different protocols or inspects at higher layers: an email gateway, an API gateway, a VoIP gateway converting SIP to the phone network.

> [!TIP]
> In everyday networking "gateway" and "router" are often used for the same box. The precise difference: *router* is the device type (Layer 3 forwarding); *gateway* is the role of being the exit to another network — which may also involve protocol translation.

## Modem

Your Ethernet speaks digital frames; the ISP's line uses a different physical signal — electrical DSL tones over phone wire, radio frequencies on coaxial cable, light pulses on fibre, or cellular radio. The modem converts between them.

- It has no IP routing logic of its own (in its pure form) and does not know about your LAN devices.
- Fibre-to-the-home uses an **ONT** (optical network terminal) in the modem role.

## Access Point

An **AP** connects Wi-Fi clients to the wired network. It bridges 802.11 frames to Ethernet frames, so wireless and wired devices are on the same LAN and subnet. Wi-Fi is a shared medium: devices take turns (half duplex) using CSMA/CA (collision **avoidance**).

## The "Wi-Fi Router" at Home

The single box from your ISP usually contains all of them:

```text
┌───────────────────── home "router" ─────────────────────┐
│  modem/ONT  →  router (NAT, firewall, DHCP, DNS proxy)    │
│                   │                                       │
│              switch (4 LAN ports)   +   Wi-Fi access point │
└───────────────────────────────────────────────────────────┘
```

## Comparison

| | Modem | Router | Switch | Access point |
|---|-------|--------|--------|--------------|
| Layer | 1 | 3 | 2 | 2 |
| Address used | None | IP | MAC | MAC |
| Connects | Your network to the ISP line | Different networks | Devices in one network | Wireless devices to the LAN |
| Broadcasts | — | Stops them | Floods them | Forwards them |

## Real World

- In AWS, every subnet's route table has a target for `0.0.0.0/0` (an Internet gateway or NAT gateway) — that is the default gateway idea in the cloud.
- A Spring Boot app in Kubernetes reaches PostgreSQL in another subnet through routers you never see; the node's default gateway is the first of them.

## Common Traps

- **"The router is needed for two PCs on the same subnet to talk."** No — same-subnet traffic goes directly through the switch; the router is used only for other networks (see [Local vs Remote Delivery](../../arp-and-local-delivery/local-vs-remote-delivery/content.md)).
- **"A modem gives you an IP address."** The ISP's equipment (via DHCP/PPPoE) assigns the public address, usually to your router's WAN side; your devices get private addresses from the router.
- **"The default gateway must be the first address of the subnet."** It is a convention (`.1`), not a rule. It must be an address *in the host's own subnet*.

## Interview Follow-up

- *"Router vs switch?"*, *"Modem vs router?"*, *"Router vs gateway?"* → [Network Device Comparisons](../network-device-comparisons/content.md).
- *"What happens if the default gateway is wrong?"* The host reaches its own subnet but nothing beyond it — see [Troubleshooting Connectivity Problems](../../troubleshooting/troubleshooting-connectivity-problems/content.md).

## Key Takeaways

- Router: Layer 3, forwards packets between networks by destination IP, decrements TTL, rewrites the Layer 2 header at every hop, stops broadcasts.
- Default gateway: the router address in your subnet that receives all non-local traffic.
- Modem: converts signals for the ISP's medium. Access point: bridges Wi-Fi to the wired LAN.
- The home "router" = modem + router + switch + AP + NAT + DHCP + firewall in one box.
