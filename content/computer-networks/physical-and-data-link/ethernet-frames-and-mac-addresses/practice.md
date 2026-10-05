# Ethernet Frames, MAC Addresses and Error Detection — Practice

### P1. MAC size

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** MAC address

How many bits are in a MAC address?

- A) 32
- B) 48
- C) 64
- D) 128

<details>
<summary>Answer</summary>

**Answer:** B) 48

</details>

### P2. Read the MAC

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** OUI, broadcast

For `00:1a:2b:3c:4d:5e`, which part identifies the manufacturer? What is special about `ff:ff:ff:ff:ff:ff`?

<details>
<summary>Answer</summary>

`00:1a:2b` is the OUI (manufacturer). `ff:ff:ff:ff:ff:ff` is the broadcast address: every device on the LAN accepts the frame.

</details>

### P3. EtherType

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** EtherType

A frame has EtherType `0x86DD`. What is in its payload?

<details>
<summary>Answer</summary>

An IPv6 packet.

</details>

### P4. Parity

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** parity

With even parity, what parity bit is added to `1011001`? If two bits flip in transit, will parity detect it?

<details>
<summary>Answer</summary>

`1011001` has four 1s (even), so the parity bit is **0**. Two flipped bits keep the count even, so parity **does not** detect it.

</details>

### P5. CRC remainder

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** CRC

Using generator `1011`, compute the 3-bit CRC for data `1001`.

<details>
<summary>Answer</summary>

Append three zeros: `1001000`, then XOR-divide by `1011`, skipping steps whose leading bit is 0:

```text
1001 XOR 1011 = 0010 → keep 010, bring down 0 → 0100  (leading 0: skip)
                        keep 100, bring down 0 → 1000
1000 XOR 1011 = 0011 → keep 011, bring down 0 → 0110  (leading 0: skip)
                        no bits left → remainder 110
```

CRC = **`110`**. Transmitted: `1001110`. Check: dividing `1001110` by `1011` leaves remainder `000`.

</details>
