# Ethernet Frames, MAC Addresses and Error Detection — Interview Questions

## Beginner

### Q1. What is a MAC address?

<details>
<summary>Answer</summary>

A 48-bit hardware address of a network interface, written as six hex pairs (`3c:22:fb:9a:10:4e`). The first 24 bits identify the manufacturer (OUI), the rest the device. It is used to deliver frames on the local link; `ff:ff:ff:ff:ff:ff` is the broadcast address.

</details>

### Q2. What fields does an Ethernet frame contain?

<details>
<summary>Answer</summary>

Destination MAC (6 bytes), source MAC (6), EtherType (2, which protocol is inside), payload (46–1,500 bytes) and the FCS trailer (4 bytes, CRC-32). On the wire a 7-byte preamble and 1-byte start delimiter come first for synchronisation.

</details>

## Intermediate

### Q3. How does CRC detect errors?

<details>
<summary>Answer</summary>

The sender treats the frame's bits as a polynomial, divides it by an agreed generator polynomial using XOR arithmetic, and appends the remainder (the FCS). The receiver divides the received data plus FCS by the same generator; a non-zero remainder means the frame was corrupted and it is dropped. CRC-32 detects all burst errors up to 32 bits and nearly all others.

</details>

### Q4. What is the difference between a checksum and a CRC?

**Style:** Comparison

<details>
<summary>Answer</summary>

A checksum adds the data in fixed-size words (IP, TCP and UDP use a 16-bit one's-complement sum); it is cheap but misses some errors, such as swapped words. A CRC uses polynomial division and is much stronger against burst errors; Ethernet and Wi-Fi use CRC-32, usually computed in hardware.

</details>

### Q5. Why is the destination MAC the first field in the frame?

**Style:** Why

<details>
<summary>Answer</summary>

So a switch can look up the output port as soon as the first 6 bytes arrive. Cut-through switches start forwarding before the whole frame has been received, reducing latency.

</details>

## Advanced

### Q6. Can two devices have the same MAC address? What happens if they are on the same LAN?

**Style:** Scenario

<details>
<summary>Answer</summary>

Yes — through manufacturing errors, cloned VMs or manual changes. On the same LAN, the switch's MAC table keeps moving the address between the two ports (MAC flapping), so frames go to whichever device sent last; both see intermittent connectivity, and ARP caches on other hosts become inconsistent. Across different LANs it does not matter, because MACs are only used locally.

</details>
