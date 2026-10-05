# How Switches Work: MAC Learning, Forwarding and Flooding

**Module:** Physical and Data Link Layers · **Interview priority:** Core

## What Is It?

A **switch** forwards Ethernet frames between devices in the same LAN. It builds a **MAC address table** (also called CAM table) that maps each MAC address to the port where it lives, and uses it to send each frame **only** to the port it needs.

## Why It Exists

A hub sends every frame to every device: wasted bandwidth, collisions and no privacy. A switch learns where each device is — automatically, with no configuration — so that most frames go to exactly one port, every port runs full duplex, and many conversations happen at once.

## How It Works

For every frame that arrives, the switch does two independent things:

### 1. Learn (from the source MAC)

Record "source MAC → incoming port" in the table, with a timestamp. If the MAC was known on another port, update it (the device moved).

### 2. Forward (using the destination MAC)

| Destination | Action | Name |
|-------------|--------|------|
| Known, on a **different** port | Send out that one port | **Forwarding** |
| Known, on the **same** port it came in | Drop it (the destination already saw it on that segment) | **Filtering** |
| **Unknown** (not in the table) | Send out every port except the incoming one | **Flooding** (unknown unicast) |
| Broadcast `ff:ff:ff:ff:ff:ff` | Send out every port except the incoming one | **Flooding** |
| Multicast | Flood, unless IGMP snooping limits it to member ports | — |

### 3. Age

Entries expire if a MAC is not seen for a while (commonly **300 seconds**), so the table follows devices that move or leave.

### Walk-through

Four PCs on a fresh switch (empty table). A = port 1, B = port 2, C = port 3, D = port 4.

```text
Step 1: A → C   table: {A:1}            C unknown → FLOOD to ports 2,3,4 (only C accepts)
Step 2: C → A   table: {A:1, C:3}       A known   → FORWARD to port 1 only
Step 3: A → C   table: {A:1, C:3}       C known   → FORWARD to port 3 only
Step 4: B → ff:ff:ff:ff:ff:ff (ARP)     table: {A:1, C:3, B:2}  broadcast → FLOOD to 1,3,4
```

The first frame of a conversation is often flooded; after the reply, both directions are forwarded precisely. In practice the first frame is usually an ARP broadcast, and the ARP reply teaches the switch the target's port.

## Under the Hood

- The table lives in **CAM** (content-addressable memory), so lookups happen at line rate in hardware.
- **Store-and-forward** switches receive the whole frame, check the FCS and drop bad frames before forwarding. **Cut-through** switches start forwarding after reading the destination MAC — lower latency, but they may forward corrupted frames.
- A switch **does not change** the frame: same source and destination MAC, same payload. (A router, in contrast, rewrites the Layer 2 header.)
- **VLANs** split one switch into several isolated LANs; flooding then stays inside the VLAN ([VLANs, Trunks and STP](../vlans-trunks-and-stp/content.md)).

## Real World

- `bridge fdb show` on Linux or `show mac address-table` on a Cisco switch prints the table.
- Docker and Kubernetes nodes run **software switches** (Linux bridges, Open vSwitch) that learn MACs of containers exactly the same way.
- **MAC flooding attack:** an attacker sends frames with thousands of fake source MACs to fill the table; the switch then floods all traffic like a hub, letting the attacker sniff it. Defence: **port security** (limit MACs per port).

## Common Traps

- **"A switch learns from the destination MAC."** It learns from the **source** MAC; the destination is only looked up.
- **"An unknown destination is dropped."** It is **flooded**. (Routers drop unknown destinations without a default route; switches flood.)
- **"Switches stop broadcasts."** They flood them to all ports in the VLAN.
- **"The switch needs the MAC table to be configured."** It is learned automatically; manual (static) entries are optional.

## Interview Follow-up

- *"What does a switch do when the table is full?"* It cannot learn new MACs, so frames to them are flooded — the basis of the MAC flooding attack.
- *"What if two ports report the same MAC?"* The entry flaps between ports; a symptom of a loop or a duplicate MAC.

## Key Takeaways

- Learn from the source MAC; forward by the destination MAC.
- Known → forward to one port; same port → filter; unknown or broadcast → flood.
- Entries age out (≈ 300 s). The frame itself is never modified.
- Store-and-forward checks the CRC; cut-through is faster.
