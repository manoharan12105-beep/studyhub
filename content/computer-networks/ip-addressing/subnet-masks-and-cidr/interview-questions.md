# Subnet Masks and CIDR — Interview Questions

## Beginner

### Q1. What is a subnet mask?

<details>
<summary>Answer</summary>

A 32-bit value with contiguous 1s followed by 0s that marks the network bits (1s) and host bits (0s) of an IPv4 address. ANDing an address with the mask gives its network address. Hosts use it to decide whether a destination is local; for example `255.255.255.0` (/24) means the first three octets are the network.

</details>

### Q2. What is CIDR notation?

<details>
<summary>Answer</summary>

Writing the mask as a prefix length after a slash: `192.168.1.0/24` means the first 24 bits are the network. CIDR (Classless Inter-Domain Routing) also means any prefix length is allowed, replacing the fixed Class A/B/C sizes and allowing route aggregation.

</details>

## Intermediate

### Q3. Find the network, broadcast and host range of `172.16.45.200/27`.

**Style:** Output/prediction

<details>
<summary>Answer</summary>

/27 → mask `255.255.255.224`, block size 32 in the 4th octet. Blocks: 0, 32, …, 192, 224. 200 lies in the 192 block. Network `172.16.45.192`, broadcast `172.16.45.223`, hosts `172.16.45.193`–`172.16.45.222` (30 usable).

</details>

### Q4. Is `255.255.0.255` a valid subnet mask?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. Masks must be a contiguous run of 1s followed by 0s; `255.255.0.255` has 0s between 1s. Valid octet values in a mask are only 0, 128, 192, 224, 240, 248, 252, 254 and 255, and once an octet is below 255, all later octets must be 0.

</details>

## Advanced

### Q5. Why does a larger prefix length mean a smaller network?

**Style:** Why

<details>
<summary>Answer</summary>

The prefix length counts network bits; the remaining 32 − n bits are host bits, and the network has 2^(32−n) addresses. Each extra prefix bit halves the size: /24 has 256 addresses, /25 has 128, /30 has 4.

</details>

### Q6. A security group allows `10.0.0.0/8` on port 5432. Your colleague says that is "just our subnet". What is the risk?

**Style:** Scenario

<details>
<summary>Answer</summary>

`/8` covers 16.7 million addresses — every private `10.x.x.x` network, which may include other VPCs, VPN users and peered networks, not just the app subnet. Database access should be limited to the application subnet (e.g. `10.0.1.0/24`) or, better, to the application's security group.

</details>
