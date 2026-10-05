# DHCP — Practice

### P1. First message

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** DORA

What is the first DHCP message a new client sends?

- A) Request
- B) Offer
- C) Discover
- D) Acknowledge

<details>
<summary>Answer</summary>

**Answer:** C) Discover

</details>

### P2. Addresses on the wire

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** DHCP Discover addressing

Give the source IP, destination IP, source port, destination port and destination MAC of a DHCP Discover.

<details>
<summary>Answer</summary>

Source IP `0.0.0.0`, destination IP `255.255.255.255`, UDP source port 68, destination port 67, destination MAC `ff:ff:ff:ff:ff:ff`.

</details>

### P3. Renewal timing

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** T1, T2

A lease of 8 hours is obtained at 09:00. When does the client first try to renew, and when does it rebind?

<details>
<summary>Answer</summary>

T1 = 50 % = 4 h → **13:00** (unicast renew). T2 = 87.5 % = 7 h → **16:00** (broadcast rebind). Expiry at 17:00.

</details>

### P4. Rogue server

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** rogue DHCP, snooping

Some office PCs suddenly get `192.168.0.x` addresses with gateway `192.168.0.1`, while the company uses `10.20.0.0/16`. Those PCs have no Internet. What happened and how do you prevent it?

<details>
<summary>Answer</summary>

A rogue DHCP server — typically a home Wi-Fi router plugged in by someone — answers Discovers faster than the real server. Find and remove it (look up its MAC in switch tables), and enable DHCP snooping so only trusted ports (towards the real server/relay) may send DHCP Offers/ACKs.

</details>
