# NIC, Repeater, Hub, Bridge and Switch — Practice

### P1. Device by behaviour

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** hub

A device copies every incoming bit to all other ports without reading any address. It is a:

- A) Switch
- B) Bridge
- C) Hub
- D) Router

<details>
<summary>Answer</summary>

**Answer:** C) Hub

</details>

### P2. Count collision domains

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** collision domains

Eight PCs are connected to one 8-port switch. How many collision domains and broadcast domains are there? What if the switch is replaced by a hub?

<details>
<summary>Answer</summary>

Switch: **8 collision domains** (one per port), **1 broadcast domain**. Hub: **1 collision domain**, **1 broadcast domain**.

</details>

### P3. Who sees the frame?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** switch forwarding, flooding

A switch has just been powered on (empty MAC table). PC A sends a frame to PC C. Which PCs receive it? Then C replies to A. Which PCs receive the reply?

<details>
<summary>Answer</summary>

First frame: C's MAC is unknown, so the switch floods it to every port except A's — all other PCs receive it (only C accepts it). The switch also learns A's port. Reply: the switch knows A's port, so only A receives it; it also learns C's port.

</details>

### P4. Bandwidth sharing

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** shared vs dedicated bandwidth

Four PCs on a 100 Mbit/s hub all download at once. Roughly what is each PC's maximum share? On a 100 Mbit/s switch, with each PC talking to a different server port?

<details>
<summary>Answer</summary>

Hub: the 100 Mbit/s is shared, so at most about **25 Mbit/s each** (less, because of collisions). Switch: each port has its own **100 Mbit/s** full-duplex link.

</details>
