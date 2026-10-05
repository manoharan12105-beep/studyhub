# VLANs, Trunk Ports and Spanning Tree — Interview Questions

## Beginner

### Q1. What is a VLAN and why is it used?

<details>
<summary>Answer</summary>

A Virtual LAN divides a switched network into separate logical LANs. Each VLAN is its own broadcast domain, usually mapped to its own IP subnet. VLANs reduce broadcast traffic, isolate groups for security (guests, finance, servers) and let you group devices by function without rewiring.

</details>

### Q2. What is the difference between an access port and a trunk port?

**Style:** Comparison

<details>
<summary>Answer</summary>

An access port belongs to a single VLAN and carries untagged frames to an end device. A trunk port carries frames for many VLANs, adding an 802.1Q tag with the VLAN ID, and connects switches to each other or to routers and hypervisors.

</details>

## Intermediate

### Q3. How do two PCs in different VLANs on the same switch communicate?

<details>
<summary>Answer</summary>

Through a router or Layer 3 switch (inter-VLAN routing). Each VLAN has a gateway interface; the PC sends traffic for the other subnet to its gateway, which routes it into the other VLAN — and can apply ACLs/firewall rules on the way.

</details>

### Q4. Why does a Layer 2 loop cause a broadcast storm?

**Style:** Why

<details>
<summary>Answer</summary>

Switches flood broadcasts to all ports, and Ethernet frames have no TTL. In a loop, each switch floods the broadcast to the others, which flood it back; copies multiply and circulate forever, consuming all bandwidth and CPU, while MAC tables flap between ports. IP packets in a routing loop die when TTL reaches 0, but frames do not.

</details>

## Advanced

### Q5. How does STP create a loop-free topology?

<details>
<summary>Answer</summary>

Switches exchange BPDUs and elect the root bridge (lowest bridge ID: priority, then MAC). Each non-root switch chooses one root port (lowest cost path to the root); each segment gets one designated port. All remaining ports go into blocking state. If a forwarding link fails, BPDUs stop arriving and a blocked port transitions to forwarding. RSTP (802.1w) does this in seconds instead of 30–50 s.

</details>

### Q6. What is the native VLAN, and why is a mismatch dangerous?

**Style:** Follow-up

<details>
<summary>Answer</summary>

The native VLAN is the VLAN whose frames cross a trunk untagged. If the two ends disagree (VLAN 1 on one side, VLAN 99 on the other), untagged frames from one VLAN are placed into a different VLAN on the other switch, leaking traffic between VLANs — a misconfiguration and a security risk (VLAN hopping attacks exploit native-VLAN behaviour).

</details>
