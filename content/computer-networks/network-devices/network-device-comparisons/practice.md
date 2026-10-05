# Network Device Comparisons — Practice

### P1. Layer of the device

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** device layers

Which device makes decisions using IP addresses?

- A) Hub
- B) Switch
- C) Router
- D) Repeater

<details>
<summary>Answer</summary>

**Answer:** C) Router

</details>

### P2. Match the device

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** device roles

Match: (a) converts fibre light to Ethernet, (b) sends a frame only to the destination port, (c) forwards a packet to another subnet, (d) routes `/api` to one server pool and `/web` to another.

<details>
<summary>Answer</summary>

(a) Modem/ONT, (b) switch, (c) router, (d) L7 load balancer (reverse proxy).

</details>

### P3. Broadcast domains

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** broadcast domains

A router has 4 interfaces. Interface 1 connects to a switch with 3 VLANs routed by the router via sub-interfaces; interfaces 2–4 each connect to a single-VLAN switch. How many broadcast domains?

<details>
<summary>Answer</summary>

3 (the VLANs) + 3 (interfaces 2–4) = **6** broadcast domains. Each VLAN is its own broadcast domain.

</details>

### P4. Diagnose with layers

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** device responsibilities

PCs on the same switch can talk to each other, but none can reach the Internet. Which device is the most likely suspect and why not the switch?

<details>
<summary>Answer</summary>

The router/default gateway (or its upstream link/ISP). Same-switch communication works, so the switch forwards frames correctly; Internet traffic is the only traffic that must cross the router. Check the gateway address, ping the gateway, then beyond it.

</details>

### P5. AP or router mode?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** access point vs router

You add a second Wi-Fi box to extend coverage. In router mode, your phone on it gets `192.168.0.x`; on the main box it gets `192.168.1.x`. What does that tell you, and which mode should you use?

<details>
<summary>Answer</summary>

In router mode the second box creates a separate subnet with its own DHCP and NAT (double NAT), so devices on the two boxes are in different networks and discovery features (casting, printers) may break. Use access point mode, which bridges Wi-Fi onto the existing LAN so all devices share `192.168.1.0/24`.

</details>
