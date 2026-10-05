# Network Types: PAN, LAN, MAN, WAN, Internet, Intranet and Extranet

**Module:** Network Fundamentals · **Interview priority:** Core

## What Is It?

Networks are classified in two independent ways:

- **By size (geographic scope):** PAN → LAN → MAN → WAN.
- **By who may use them (access):** Internet (everyone), intranet (only the organisation), extranet (the organisation plus chosen partners).

## Why It Exists

Size decides the technology, cost, speed and owner of a network. A LAN is cheap, fast and yours; a WAN crosses public land and is leased from carriers. Access type decides security: an intranet application can trust the network far less than you might think, but it is never exposed to the whole Internet.

## Networks by Size

| Type | Scope | Typical technology | Owner | Example |
|------|-------|--------------------|-------|---------|
| **PAN** — Personal Area Network | A few metres around one person | Bluetooth, USB, NFC | You | Phone ↔ earbuds ↔ smartwatch |
| **LAN** — Local Area Network | A room, home, floor or building | Ethernet, Wi-Fi | The organisation/home | Office network, home Wi-Fi |
| **MAN** — Metropolitan Area Network | A city or campus group | Fibre rings, metro Ethernet | ISP, city, university | City-wide fibre linking a university's campuses |
| **WAN** — Wide Area Network | Countries and continents | Leased lines, MPLS, SD-WAN, submarine fibre, the Internet | Carriers (leased) | A bank linking branches across India |

```text
PAN (metres) ⊂ LAN (building) ⊂ MAN (city) ⊂ WAN (country / world)
```

Characteristics change with size:

| | LAN | WAN |
|---|-----|-----|
| Speed | High (1–10 Gbit/s common) | Lower and more expensive per Mbit/s |
| Latency | Under 1 ms | Tens to hundreds of ms |
| Error rate | Very low | Higher |
| Ownership | Private | Leased from service providers |
| Connects | Hosts | LANs (via routers) |

**WLAN** is a wireless LAN (Wi-Fi). **SAN** (storage area network) is a specialised high-speed network for storage, not a size class.

> [!TIP]
> The Internet is the largest WAN. A router is the device that joins a LAN to a WAN — the box at home is exactly that.

## Networks by Access

| Type | Who can access | Example |
|------|----------------|---------|
| **Internet** | Anyone | Public websites and APIs |
| **Intranet** | Only members of the organisation (on site or via [VPN](../../network-security/vpns-and-tunneling/content.md)) | HR portal, internal wiki, internal dashboards |
| **Extranet** | The organisation plus authorised outsiders | Supplier portal, dealer ordering system |

Intranets and extranets usually use the **same** technologies as the Internet (TCP/IP, HTTP, DNS) — they differ in **who is allowed in**, enforced by firewalls, VPNs, private addressing and authentication.

## Real World

- Your home: PAN (phone + earbuds), LAN (Wi-Fi + Ethernet behind the router), WAN link (fibre to the ISP), then the Internet.
- A company: LANs in each office, joined by a WAN (SD-WAN or VPN over the Internet), an intranet for employees, and an extranet portal for partners.
- Cloud: a VPC (virtual private cloud) is a private network you define in a provider's data centre — conceptually a LAN you rent.

## Common Traps

- **"An intranet is not TCP/IP."** It is usually exactly TCP/IP and HTTP, just not reachable by the public.
- **"WAN means the Internet."** The Internet is one WAN; companies also lease private WAN links (MPLS) that never touch the public Internet.
- **"Wi-Fi is a WAN because it is wireless."** Wi-Fi is a wireless LAN; wireless says nothing about scope.

## Interview Follow-up

- *"Which device connects a LAN to a WAN?"* A router (often combined with a modem at home) — see [Routers, Modems and Access Points](../../network-devices/routers-modems-and-access-points/content.md).
- *"How do remote employees reach the intranet?"* Through a VPN that makes their laptop behave as if it were inside the company network.

## Key Takeaways

- By size: PAN < LAN < MAN < WAN. The Internet is the biggest WAN.
- LAN: fast, private, low latency. WAN: long distance, leased, slower and costlier.
- By access: Internet (public), intranet (members only), extranet (members + partners) — same protocols, different access control.
