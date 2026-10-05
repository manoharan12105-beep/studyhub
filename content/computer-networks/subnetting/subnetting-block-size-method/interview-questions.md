# Subnetting by Hand: The Block-Size Method — Interview Questions

## Beginner

### Q1. How do you find the network address of `192.168.1.130/25` quickly?

<details>
<summary>Answer</summary>

/25 → mask 128 in the 4th octet → block size 128. Multiples: 0, 128. 130 is in the 128 block, so the network is `192.168.1.128`, broadcast `192.168.1.255`, hosts `.129`–`.254` (126).

</details>

## Intermediate

### Q2. Find the network, broadcast and host range for `172.30.200.10/21`.

**Style:** Output/prediction

<details>
<summary>Answer</summary>

/21 → 3rd octet, mask 248, block 8. 200 is a multiple of 8, so network `172.30.200.0`, broadcast `172.30.207.255`, hosts `172.30.200.1`–`172.30.207.254` (2,046 usable).

</details>

### Q3. Is `10.0.0.95/27` usable as a host address?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. Block size 32; 95 is in the 64–95 block, and 95 = 96 − 1 is that subnet's broadcast address. Usable hosts there are `10.0.0.65`–`10.0.0.94`.

</details>

### Q4. Explain why the block-size method works.

**Style:** Why

<details>
<summary>Answer</summary>

In the interesting octet the mask is some 1s followed by 0s; the value of its lowest 1 bit is 256 − mask, the block size. ANDing with the mask keeps the higher bits and clears the lower ones — the same as rounding the octet down to a multiple of the block size. Setting the cleared host bits to 1 gives the broadcast, which is the next multiple minus one.

</details>

## Advanced

### Q5. Are `10.45.130.17/18` and `10.45.190.1/18` in the same subnet?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

/18 → 3rd octet, mask 192, block 64: blocks 0–63, 64–127, 128–191, 192–255. Both 130 and 190 fall in 128–191, so both are in `10.45.128.0/18` (broadcast `10.45.191.255`). Yes, same subnet.

</details>

### Q6. Is `172.16.31.255/20` a host address?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

No. /20 → 3rd octet, block 16: 31 lies in 16–31, so the network is `172.16.16.0` and the broadcast is `172.16.31.255` — this address is the broadcast.

</details>
