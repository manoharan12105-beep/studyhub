# Public, Private and Special IP Addresses

**Module:** Network Layer and IP Addressing · **Interview priority:** Core

## What Is It?

Not every IPv4 address is usable on the Internet. Address space is divided into:

- **Public** addresses — globally unique, routable on the Internet, assigned through ISPs and regional registries.
- **Private** addresses (RFC 1918) — reusable inside any organisation, **never routed on the Internet**.
- **Special-purpose** addresses — loopback, link-local, "this host", broadcast, multicast, documentation and others.

## Why It Exists

There are only about 4.3 billion IPv4 addresses — fewer than the number of devices online. Private ranges let every home and company reuse the same addresses internally, with [NAT](../../nat/network-address-translation/content.md) translating to a few public addresses at the edge. Special ranges give fixed meanings that every OS understands (talk to myself, I have no address yet, everyone on this link).

## Private Addresses (RFC 1918)

| Range | CIDR | Size | Typical use |
|-------|------|------|-------------|
| `10.0.0.0` – `10.255.255.255` | `10.0.0.0/8` | 16,777,216 | Large companies, cloud VPCs (`10.0.0.0/16`) |
| `172.16.0.0` – `172.31.255.255` | `172.16.0.0/12` | 1,048,576 | Docker's default networks (`172.17.0.0/16`), companies |
| `192.168.0.0` – `192.168.255.255` | `192.168.0.0/16` | 65,536 | Home routers (`192.168.0.0/24`, `192.168.1.0/24`) |

- Internet routers drop packets **to** private destinations; ISPs filter them.
- A device with a private address reaches the Internet only through NAT.
- Two companies using `10.0.0.0/8` clash when their networks merge or connect over VPN — plan ranges to avoid overlaps.

> [!WARNING]
> **Common trap:** `172.16.0.0/12` covers `172.16.x.x` to **`172.31.x.x`** — not all of `172.x.x.x`. `172.32.0.1` is public.

## Special-Purpose Addresses

| Address / range | Name | Meaning |
|-----------------|------|---------|
| `127.0.0.0/8` (usually `127.0.0.1`) | **Loopback** | "This host". Never leaves the machine; `localhost` resolves to it |
| `169.254.0.0/16` | **Link-local / APIPA** | Self-assigned when DHCP fails (Windows calls it APIPA); works only on the local link |
| `0.0.0.0` | Unspecified / "this host" | As a source: "I have no address yet" (DHCP Discover). In a server bind: "listen on all interfaces". In a route: the default route `0.0.0.0/0` |
| `255.255.255.255` | **Limited broadcast** | Everyone on this link; never forwarded by routers |
| Network's last address (e.g. `192.168.1.255` in a /24) | **Directed broadcast** | Everyone on that subnet |
| `224.0.0.0/4` | **Multicast** | Group addresses (old Class D) |
| `240.0.0.0/4` | Reserved | Old Class E; not used |
| `100.64.0.0/10` | **Shared address space (CGNAT)** | ISPs' carrier-grade NAT between customer routers and the ISP |
| `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` | **Documentation** (TEST-NET-1/2/3) | For examples in books and docs — this course uses them |

### Loopback

```bash
ping -c 1 127.0.0.1
```

- Tests the **local TCP/IP stack** only — no NIC or cable involved.
- A Spring Boot app bound to `127.0.0.1:8080` accepts connections only from the same machine; bound to `0.0.0.0:8080` it accepts from any interface. Inside a Docker container, `localhost` is the **container itself**, not the host — a frequent cause of "connection refused" when a containerised app tries to reach a database on the host.

### APIPA / link-local

If a host gets `169.254.x.x`, **DHCP failed**: the cable/Wi-Fi works, but no DHCP server answered. The host can talk only to other link-local hosts; there is no gateway and no Internet. This is a strong troubleshooting clue.

## Static vs Dynamic Addresses

| | Static IP | Dynamic IP |
|---|-----------|------------|
| Assigned by | Manual configuration | [DHCP](../../dhcp/dhcp-dora/content.md) lease |
| Changes? | No | May change on renewal or reconnect |
| Used for | Servers, routers, printers, DNS servers, anything others must find | Laptops, phones, most clients |
| Risk | Manual errors, duplicate addresses | Address changes break hard-coded references |

A **DHCP reservation** gives a device the same address every time while keeping central management. Public IPs from home ISPs are usually dynamic; cloud providers sell static "elastic" public IPs.

## Comparison: Public vs Private

| | Public | Private |
|---|--------|---------|
| Uniqueness | Globally unique | Unique only within a network |
| Routable on the Internet | Yes | No |
| Who assigns | IANA → regional registries → ISPs | Your own network admin / DHCP |
| Cost | Scarce, paid | Free |
| Reachable from the Internet | Yes, if firewalls allow | Only via NAT/port forwarding or VPN |
| Example | `203.0.113.45` | `192.168.1.10` |

## Real World

- `ipconfig` on your laptop shows a private address; [what's-my-IP](https://ifconfig.me) sites show your router's **public** address — two different views of the same connection, joined by NAT.
- AWS VPCs use private ranges; Internet-facing load balancers get public addresses.

## Common Traps

- **"Private means secure."** Private addressing hides hosts behind NAT, but it is not an access control mechanism — firewalls and authentication are.
- **"127.0.0.1 tests the network card."** It tests only the software stack.
- **"0.0.0.0 is an invalid address."** It is a special address with clear meanings (unspecified source, all interfaces, default route).
- **"169.254.x.x means no cable."** It means the link is up but **DHCP** did not answer.

## Interview Follow-up

- *"Name the private ranges."* `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
- *"Your PC has 169.254.12.7. What does it tell you?"* DHCP failure — check the DHCP server, the VLAN, the cable/Wi-Fi association.

## Key Takeaways

- Private: `10/8`, `172.16/12` (16–31), `192.168/16` — reused everywhere, reach the Internet via NAT.
- Loopback `127.0.0.0/8`; link-local/APIPA `169.254.0.0/16` = DHCP failed; `0.0.0.0` = unspecified/all interfaces/default route; `255.255.255.255` = limited broadcast.
- Static for things others must find; dynamic (DHCP) for clients; reservations combine both.
