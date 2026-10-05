# Unicast, Broadcast, Multicast and Anycast

**Module:** Network Fundamentals · **Interview priority:** Frequently asked

## What Is It?

These four terms describe **how many receivers** a packet is addressed to and **which ones**:

| Mode | Sent to | Analogy |
|------|---------|---------|
| **Unicast** | Exactly one receiver | A phone call to one person |
| **Broadcast** | Every device on the local network | An announcement on the office loudspeaker |
| **Multicast** | Every device that joined a group | A WhatsApp group: only members receive |
| **Anycast** | The *nearest* one of several servers sharing one address | Dialling a national number that connects you to the closest branch |

```text
Unicast     A ──► B
Broadcast   A ──► everyone on the LAN
Multicast   A ──► {B, D}   (members of group 239.1.1.1)
Anycast     A ──► nearest of {S1, S2, S3}, all using 1.1.1.1
```

## Why It Exists

Some jobs need one receiver (loading a web page), some need everyone nearby (finding a DHCP server or a MAC address when you know nobody's address yet), some need many interested receivers without sending a copy to each (live video to thousands), and some need any one of many identical servers — the closest (DNS, CDNs).

## How It Works

### Unicast

The normal case: one source, one destination address. Almost all web, API, database and SSH traffic is unicast. If 1,000 users watch the same unicast stream, the server sends 1,000 copies.

### Broadcast

- **Layer 2 broadcast:** destination MAC `ff:ff:ff:ff:ff:ff`. Every device in the **broadcast domain** (the LAN/VLAN) receives it; switches flood it out of all ports.
- **IPv4 broadcast:** `255.255.255.255` (limited broadcast, this network) or the subnet's broadcast address such as `192.168.1.255` for `192.168.1.0/24`.
- **Routers do not forward broadcasts**, which is what keeps them local. A router therefore bounds a broadcast domain (see [Collision and Broadcast Domains](../../physical-and-data-link/collision-and-broadcast-domains/content.md)).
- Used by [ARP](../../arp-and-local-delivery/arp-address-resolution/content.md) requests ("who has 192.168.1.20?") and [DHCP](../../dhcp/dhcp-dora/content.md) Discover — both happen *before* the sender knows anyone's address.
- **IPv6 has no broadcast**; it uses multicast instead.

### Multicast

- The sender transmits **one** stream to a group address; the network copies it only where branches lead to members.
- IPv4 multicast range: `224.0.0.0/4` (`224.0.0.0`–`239.255.255.255`). IPv6 multicast: `ff00::/8`.
- Hosts join groups with IGMP (IPv4) or MLD (IPv6).
- Uses: IPTV inside ISP networks, stock-market data feeds, routing protocols (OSPF uses `224.0.0.5`), IPv6 neighbour discovery. Rarely available across the public Internet.

### Anycast

- The **same IP address** is announced from many locations. Internet routing ([BGP](../../routing/static-and-dynamic-routing/content.md)) delivers each packet to the topologically nearest one.
- Uses: public DNS resolvers (`8.8.8.8`, `1.1.1.1`), the DNS root servers (13 names, hundreds of anycast instances), CDNs, DDoS absorption (attack traffic is spread across many sites).
- The sender cannot tell; it is ordinary unicast from its point of view.

## Comparison

| | Unicast | Broadcast | Multicast | Anycast |
|---|---------|-----------|-----------|---------|
| Receivers | One | All on the LAN | Group members | Nearest of a group |
| Crosses routers? | Yes | No | Only with multicast routing | Yes |
| IPv4 example | `203.0.113.10` | `192.168.1.255`, `255.255.255.255` | `239.1.1.1` | `1.1.1.1` |
| IPv6 | Yes | **No** | Yes (`ff00::/8`) | Yes |
| Typical use | Web, APIs | ARP, DHCP Discover | IPTV, routing protocols | DNS, CDNs |

### Transmission direction (duplex)

A related but different classification is about **direction on a link**:

| Mode | Direction | Example |
|------|-----------|---------|
| Simplex | One way only | Keyboard to computer, TV broadcast |
| Half duplex | Both ways, one at a time | Walkie-talkie, hubs, classic Wi-Fi channel access |
| Full duplex | Both ways at once | Switched Ethernet, phone calls |

## Real World

- When your laptop joins Wi-Fi, its first packets are broadcasts (DHCP Discover), because it has no IP address yet and does not know the DHCP server's.
- `8.8.8.8` answers from a Google site near you — that is anycast, which is why public DNS is fast everywhere.

## Common Traps

- **"A broadcast reaches the whole Internet."** Routers stop broadcasts; they reach only the local broadcast domain.
- **"IPv6 uses broadcast for neighbour discovery."** IPv6 has no broadcast; it uses solicited-node multicast.
- **"Anycast is multicast."** Multicast delivers to *all* members; anycast delivers to *one* (the nearest).

## Interview Follow-up

- *"Why does ARP use broadcast?"* The sender does not yet know the target's MAC address, so it must ask everyone on the link.
- *"How do public DNS resolvers answer quickly worldwide?"* Anycast routes you to the nearest instance.

## Key Takeaways

- Unicast = one; broadcast = all on the LAN; multicast = subscribed group; anycast = nearest of many.
- Broadcasts stay inside a broadcast domain — routers stop them. IPv6 has no broadcast.
- ARP and DHCP Discover use broadcast; DNS root and public resolvers use anycast.
- Duplex (simplex/half/full) is about direction on a link, a separate idea.
