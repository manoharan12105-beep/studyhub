# IPv4 Addressing — Interview Questions

## Beginner

### Q1. What is the structure of an IPv4 address?

<details>
<summary>Answer</summary>

A 32-bit number written as four octets in dotted decimal (each 0–255), e.g. `192.168.1.10`. It is split into a network portion, shared by all hosts on the same network, and a host portion that identifies the interface; the subnet mask or prefix length defines the split.

</details>

### Q2. What are the IPv4 address classes?

<details>
<summary>Answer</summary>

Class A (first octet 1–126, default /8), B (128–191, /16), C (192–223, /24), D (224–239, multicast) and E (240–255, experimental). `127.0.0.0/8` is loopback. Classes are historical: since 1993 CIDR allows any prefix length, so the class no longer determines the mask.

</details>

## Intermediate

### Q3. Why was classful addressing replaced by CIDR?

**Style:** Why

<details>
<summary>Answer</summary>

Classes offered only three network sizes (16 million, 65,534 or 254 hosts), so organisations received far more addresses than they needed (a 2,000-host company got a whole Class B) and the address space ran out quickly; routing tables also exploded with many Class C routes. CIDR allows any prefix length (`/21` for ~2,000 hosts) and lets routes be aggregated.

</details>

### Q4. Why do we subtract 2 when counting usable hosts?

<details>
<summary>Answer</summary>

The address with all host bits 0 identifies the network itself, and the address with all host bits 1 is the directed broadcast address of that network; neither can be assigned to a host. So a network with h host bits has 2ʰ − 2 usable addresses. (`/31` point-to-point links and `/32` host routes are exceptions.)

</details>

## Advanced

### Q5. Is `192.168.1.0/24` "a Class C network"? Is every Class C address private?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Its first octet falls in the old Class C range, and a /24 is the old Class C size, so people still say that informally. But classes no longer define networks, and "Class C" does not mean private: only `192.168.0.0/16` within that range is private; most of `192.0.0.0`–`223.255.255.255` is public.

</details>
