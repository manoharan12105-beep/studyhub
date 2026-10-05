# Local vs Remote Delivery: The Default Gateway in Action

**Module:** ARP and Local Delivery · **Interview priority:** Core

## What Is It?

Before sending any IP packet, a host makes one decision: **is the destination on my own subnet (local) or not (remote)?**

- **Local:** deliver directly — ARP for the destination, frame addressed to the destination's MAC.
- **Remote:** deliver via the **default gateway** — ARP for the gateway, frame addressed to the **gateway's MAC**, IP packet still addressed to the final destination.

This single decision ties together subnet masks, ARP, switches and routers.

## Why It Exists

A host can put frames only on its own link. Hosts on that link can be reached directly; everything else must be handed to a router that connects to other networks. The **subnet mask** tells the host where its link's addresses end, and the **default gateway** tells it which router to hand everything else to.

## How It Works

### The decision: AND with the subnet mask

The host ANDs its own IP and the destination IP with **its own** subnet mask and compares the results (the network addresses):

```text
My IP:        192.168.1.10   mask 255.255.255.0 (/24)   → my network 192.168.1.0
Destination:  192.168.1.20   AND 255.255.255.0          → 192.168.1.0   SAME → local
Destination:  203.0.113.10   AND 255.255.255.0          → 203.0.113.0   DIFFERENT → remote
```

(The binary AND is explained in [Subnet Masks and CIDR](../../ip-addressing/subnet-masks-and-cidr/content.md).) In practice the OS does this through its routing table: the connected route `192.168.1.0/24` matches local destinations; the default route `0.0.0.0/0 via 192.168.1.1` matches everything else.

### Case 1 — same subnet

A (`192.168.1.10`) → B (`192.168.1.20`):

```text
1. Decide: 192.168.1.20 is in 192.168.1.0/24 → local, next hop = B
2. ARP cache lookup for 192.168.1.20 → miss → broadcast "Who has 192.168.1.20?"
3. B replies "192.168.1.20 is at BB:BB…"
4. Frame:  dst MAC = B   src MAC = A   |  IP: 192.168.1.10 → 192.168.1.20
5. The switch forwards it to B's port. The router is never involved.
```

### Case 2 — remote network

A (`192.168.1.10`) → server S (`203.0.113.10`), default gateway R = `192.168.1.1`:

```text
1. Decide: 203.0.113.10 is NOT in 192.168.1.0/24 → remote, next hop = gateway 192.168.1.1
2. ARP for 192.168.1.1 (not for 203.0.113.10!) → R replies "192.168.1.1 is at RR:RR…"
3. Frame:  dst MAC = R   src MAC = A   |  IP: 192.168.1.10 → 203.0.113.10
4. Switch forwards to R's port.
5. R strips the frame, reads dst IP 203.0.113.10, looks up its routing table,
   decrements TTL, and builds a new frame for its next hop (its own ARP or NDP lookup).
6. Each router repeats step 5 until the last router ARPs for S on S's LAN and delivers it.
```

### Router MAC vs destination MAC

| In the first frame A sends | Local case | Remote case |
|----------------------------|-----------|-------------|
| Destination **IP** | B | S (the final server) |
| Destination **MAC** | B | **R (the gateway)** |
| ARP target | B | **the gateway** |

This is the most important table in this module: **the destination IP names the final target; the destination MAC names the next hop.**

## What Goes Wrong

| Misconfiguration | Symptom |
|------------------|---------|
| **Wrong default gateway** (an address with no router) | Local hosts work; nothing outside the subnet works (Internet, other subnets, external DNS) |
| **No default gateway** | Same: "Network is unreachable" for remote IPs |
| **Wrong subnet mask (too large)**, e.g. `/16` instead of `/24` | Host thinks some remote hosts are local, ARPs for them, gets no reply → those destinations fail |
| **Wrong subnet mask (too small)**, e.g. `/25` instead of `/24` | Some local hosts are treated as remote and sent via the gateway — may work (extra hop) or fail if the router refuses |
| **Gateway outside the host's subnet** | OS rejects the route or the gateway is unreachable |

Investigation steps: [Troubleshooting Connectivity Problems](../../troubleshooting/troubleshooting-connectivity-problems/content.md).

## Real World

```bash
# Illustrative: the routing table that makes this decision (Linux)
ip route
```

**Output (varies):**

```text
default via 172.19.208.1 dev eth0 proto kernel
172.19.208.0/20 dev eth0 proto kernel scope link src 172.19.220.201
```

- The second line is the **connected route**: destinations in `172.19.208.0/20` are local (`scope link`).
- The first line is the **default route**: everything else goes to the gateway `172.19.208.1`.
- `ip route get 8.8.8.8` shows which route and next hop the kernel would use for one destination.

On Windows, `route print` and `ipconfig` show the same information.

## Common Traps

> [!WARNING]
> **Common trap:** "When I send to a remote server, the destination IP of the first frame is the router." No — the destination **IP** is the server; only the destination **MAC** is the router's.

- **"Hosts in the same switch always talk directly."** Only if they are in the same subnet/VLAN. Two hosts on one switch in different subnets talk via the router.
- **"The gateway forwards local traffic too."** Local traffic goes straight through the switch.

## Interview Follow-up

- *"How does a host know whether to use the gateway?"* It compares network addresses using its subnet mask (its routing table).
- *"Can you ping the gateway but not the Internet?"* Then the problem is beyond the gateway: its uplink, NAT, the ISP, or a firewall.

## Key Takeaways

- Same subnet → ARP for the destination, deliver directly through the switch.
- Different subnet → ARP for the default gateway, frame to the gateway's MAC, packet to the final IP.
- The subnet mask decides local vs remote; the routing table encodes it (connected route + default route).
- Destination IP = final target; destination MAC = next hop.
