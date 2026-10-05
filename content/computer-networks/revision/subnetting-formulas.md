# Subnetting Formulas

Everything needed to solve subnetting questions by hand.

## Formulas

```text
Addresses in a network     = 2^(32 − prefix)
Usable hosts               = 2^(32 − prefix) − 2          (not for /31, /32)
Subnets from borrowing s   = 2^s       where s = new prefix − old prefix
Host bits for H hosts      = smallest h with 2^h − 2 ≥ H  → prefix = 32 − h
Subnet bits for N subnets  = smallest s with 2^s ≥ N
Block size                 = 256 − mask value in the interesting octet
Network address            = IP AND mask  (round down to a multiple of the block)
Broadcast address          = next network − 1  (host bits all 1)
First host / last host     = network + 1 / broadcast − 1
k-th subnet (from 1)       = (k − 1) × block size
Wildcard mask              = 255.255.255.255 − mask
```

## The Mask Table

| Bits in the octet | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|-------------------|---|---|---|---|---|---|---|---|
| Mask value | 128 | 192 | 224 | 240 | 248 | 252 | 254 | 255 |
| Block size | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

## Prefix Reference

| Prefix | Mask | Block (octet) | Addresses | Usable |
|--------|------|---------------|-----------|--------|
| /8 | 255.0.0.0 | — | 16,777,216 | 16,777,214 |
| /16 | 255.255.0.0 | — | 65,536 | 65,534 |
| /17 | 255.255.128.0 | 128 (3rd) | 32,768 | 32,766 |
| /18 | 255.255.192.0 | 64 (3rd) | 16,384 | 16,382 |
| /19 | 255.255.224.0 | 32 (3rd) | 8,192 | 8,190 |
| /20 | 255.255.240.0 | 16 (3rd) | 4,096 | 4,094 |
| /21 | 255.255.248.0 | 8 (3rd) | 2,048 | 2,046 |
| /22 | 255.255.252.0 | 4 (3rd) | 1,024 | 1,022 |
| /23 | 255.255.254.0 | 2 (3rd) | 512 | 510 |
| /24 | 255.255.255.0 | — | 256 | 254 |
| /25 | 255.255.255.128 | 128 (4th) | 128 | 126 |
| /26 | 255.255.255.192 | 64 (4th) | 64 | 62 |
| /27 | 255.255.255.224 | 32 (4th) | 32 | 30 |
| /28 | 255.255.255.240 | 16 (4th) | 16 | 14 |
| /29 | 255.255.255.248 | 8 (4th) | 8 | 6 |
| /30 | 255.255.255.252 | 4 (4th) | 4 | 2 |
| /31 | 255.255.255.254 | — | 2 | 2 (point-to-point, RFC 3021) |
| /32 | 255.255.255.255 | — | 1 | single host route |

Interesting octet: **/8–/15 → 2nd · /16–/23 → 3rd · /24–/30 → 4th**.

## Five-Step Method

```text
1. Interesting octet from the prefix
2. Mask value → block size = 256 − mask
3. Network: round the octet down to a multiple of the block; octets to the right → 0
4. Broadcast: next multiple − 1; octets to the right → 255
5. Hosts: network + 1 … broadcast − 1
```

Worked check: `10.128.77.33/20` → 3rd octet, mask 240, block 16 → 77 in 64–79 → network `10.128.64.0`, broadcast `10.128.79.255`, 4,094 hosts.

## VLSM and Summarisation

- **VLSM:** sort needs largest first; give each the smallest block with 2ʰ − 2 ≥ hosts; start each block at a multiple of its size.
- **Summarise:** count common leading bits of the networks → prefix; valid cleanly when the count is a power of two and the first network is on that boundary. Example: `192.168.16.0/24`–`192.168.19.0/24` → `192.168.16.0/22`.

## Powers of Two

| n | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 16 |
|---|---|---|---|---|---|---|---|---|---|----|----|----|----|----|----|
| 2ⁿ | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1,024 | 2,048 | 4,096 | 8,192 | 16,384 | 65,536 |
