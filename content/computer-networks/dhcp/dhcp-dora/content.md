# DHCP: How a Device Gets Its IP Configuration

**Module:** DHCP · **Interview priority:** Core

## What Is It?

**DHCP** (Dynamic Host Configuration Protocol) automatically gives a device everything it needs to use an IP network:

| Item | Example | DHCP option |
|------|---------|-------------|
| **IP address** | `192.168.1.23` | (yiaddr field) |
| **Subnet mask** | `255.255.255.0` | 1 |
| **Default gateway** (router) | `192.168.1.1` | 3 |
| **DNS servers** | `192.168.1.1`, `1.1.1.1` | 6 |
| **Lease time** | 86,400 s (24 h) | 51 |
| Domain name, NTP servers … | `corp.example.com` | 15, 42 … |

It runs over **UDP**: server port **67**, client port **68**.

## Why It Exists

Configuring every laptop, phone and VM by hand is slow and error-prone (typos, **duplicate IPs**, wrong gateways). DHCP hands out addresses from a central **pool**, reclaims them when devices leave, and lets an administrator change the gateway or DNS servers for everyone in one place.

## How It Works

### DORA: Discover → Offer → Request → Acknowledge

A new device has **no IP address** and does not know where the DHCP server is, so the first messages are broadcasts.

```text
 Client (no IP, MAC aa:bb:..)                         DHCP server (192.168.1.1)
   │ 1. DISCOVER   src 0.0.0.0:68 → dst 255.255.255.255:67   (broadcast)
   │ ───────────────────────────────────────────────────────────►│ picks a free address
   │ 2. OFFER      "you can have 192.168.1.23, mask /24,         │
   │               gw 192.168.1.1, DNS 192.168.1.1, lease 24h"   │
   │ ◄───────────────────────────────────────────────────────────│
   │ 3. REQUEST    broadcast: "I take 192.168.1.23 from 192.168.1.1"
   │ ───────────────────────────────────────────────────────────►│ (other servers withdraw offers)
   │ 4. ACK        "confirmed, lease 24h"                         │ records lease: MAC ↔ IP
   │ ◄───────────────────────────────────────────────────────────│
   │ client configures the interface; often checks the address is free (ARP probe)
```

| Step | Sender | Sent to | Why that way |
|------|--------|---------|--------------|
| **Discover** | Client | Broadcast `255.255.255.255` from `0.0.0.0` | Client has no IP and does not know the server |
| **Offer** | Server | Client (broadcast or unicast to the offered address/MAC) | Proposes an address and options; several servers may offer |
| **Request** | Client | **Broadcast** | Accepts one offer *and* tells every other server their offers were declined |
| **Acknowledge** | Server | Client | Commits the lease; client may now use the address |

The client identifies itself with its **MAC address** (client hardware address field) and a transaction ID.

If the server rejects the request (address taken, wrong network), it sends **NAK** and the client starts again. If the client finds the address already in use (ARP reply), it sends **DECLINE**. When leaving cleanly it may send **RELEASE**.

### Leases and renewal

Addresses are **leased**, not owned:

| Time | Action |
|------|--------|
| **T1 = 50 %** of the lease | Client **renews**: unicast REQUEST to its server → ACK extends the lease |
| **T2 = 87.5 %** | If renewal failed, client **rebinds**: broadcast REQUEST to any server |
| Lease expiry | Client must stop using the address and start DORA again |

Renewals are invisible to the user; an address usually stays the same while the device stays on the network.

### DHCP relay

Broadcasts do not cross routers, so a DHCP server in a central data centre cannot hear Discovers from other subnets. A **DHCP relay agent** (`ip helper-address` on the router) receives the broadcast, forwards it as unicast to the server, and adds the subnet it came from (`giaddr`) so the server picks an address from the right pool.

### Reservations

A **reservation** (static lease) always gives the same IP to a given MAC — good for printers and servers, while still configured centrally.

## Real World

```bash
# Windows (Command Prompt)
ipconfig /release
ipconfig /renew
ipconfig /all        # shows "DHCP Enabled", "DHCP Server", "Lease Obtained", "Lease Expires"
```

```bash
# Illustrative: Linux (systemd-networkd / NetworkManager vary)
nmcli device show eth0 | grep -i dhcp
```

- Home routers run a DHCP server; cloud VPCs give instances their private IPs through DHCP.
- If DHCP fails, Windows/macOS assign themselves a **169.254.x.x** (APIPA/link-local) address — no gateway, no Internet ([Special Addresses](../../ip-addressing/public-private-and-special-ip-addresses/content.md)).
- **Pool exhaustion** (more devices than addresses, long leases on guest Wi-Fi) means new devices get nothing.
- **Rogue DHCP server** (someone plugs in a home router): clients may get wrong gateways/DNS. Switches defend with **DHCP snooping** (only trusted ports may send Offers).

## DNS vs DHCP

| | DHCP | DNS |
|---|------|-----|
| Answers | "What is **my** IP configuration?" | "What is the IP of **that name**?" |
| When | When joining a network, then at renewals | Before connecting to a named host |
| Transport | UDP 67/68, broadcast at first | UDP/TCP 53, unicast |
| Relation | DHCP tells the device **which DNS servers** to use | — |

## Common Traps

- **"DHCP Request is unicast."** In the initial DORA the Request is broadcast, so other servers learn their offers were not taken (renewal requests are unicast).
- **"DHCP gives only an IP address."** It also gives mask, gateway, DNS servers, lease time and more.
- **"169.254.x.x means no cable."** It means the link works but no DHCP answer arrived.
- **"DHCP works across routers by itself."** It needs a relay agent.

## Interview Follow-up

- *"What is DORA?"* Discover, Offer, Request, Acknowledge.
- *"What happens when the lease expires?"* Renew at 50 %, rebind at 87.5 %, start over at expiry.

## Key Takeaways

- DHCP provides IP, mask, gateway, DNS servers and lease time over UDP 67/68.
- DORA: broadcast Discover → Offer → broadcast Request → Ack.
- Leases renew at T1 (50 %) and rebind at T2 (87.5 %); reservations pin an IP to a MAC.
- Relays forward DHCP across routers; DHCP snooping blocks rogue servers; failure → 169.254.x.x.
