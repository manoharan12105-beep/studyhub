# VLANs, Trunk Ports and Spanning Tree — Practice

### P1. VLAN ID size

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** 802.1Q

How many bits does the 802.1Q VLAN ID field have?

- A) 8
- B) 10
- C) 12
- D) 16

<details>
<summary>Answer</summary>

**Answer:** C) 12

**Explanation:** 2¹² = 4,096 values; 1–4094 are usable.

</details>

### P2. Who receives the broadcast?

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** VLAN broadcast domains

On one switch, ports 1–4 are VLAN 10 and ports 5–8 VLAN 20. The PC on port 2 sends an ARP broadcast. Which ports receive it?

<details>
<summary>Answer</summary>

Ports 1, 3 and 4 only (VLAN 10, excluding the incoming port).

</details>

### P3. Port type

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** access vs trunk

Choose access or trunk: (a) a desk PC, (b) the link between two floor switches carrying VLANs 10, 20, 30, (c) a VMware host running VMs in three VLANs, (d) a network printer.

<details>
<summary>Answer</summary>

(a) access, (b) trunk, (c) trunk, (d) access.

</details>

### P4. Loop

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** STP, broadcast storm

Right after a cable was connected between two switches that were already linked, the whole office network freezes, switch LEDs blink constantly, and switch logs show the same MAC moving between ports. Diagnose and fix.

<details>
<summary>Answer</summary>

A Layer 2 loop causing a broadcast storm (MAC flapping is the tell-tale sign), probably because STP is disabled or the port was configured to skip it. Immediate fix: unplug the new cable. Prevention: enable STP/RSTP on all switches, use BPDU guard on edge ports, and use link aggregation if both links are meant to carry traffic.

</details>
