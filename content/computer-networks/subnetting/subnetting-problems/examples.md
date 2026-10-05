# Subnetting Interview Problems — Worked Examples

### E1. Network and broadcast in the 4th octet

**Difficulty:** Easy

Find the network address, broadcast address and host range of `192.168.3.77/25`.

```text
/25 → 4th octet, mask 128, block size 256 − 128 = 128
Multiples of 128: 0, 128.  77 lies in [0, 128)
Network:    192.168.3.0
Broadcast:  192.168.3.127
Hosts:      192.168.3.1 – 192.168.3.126   (2⁷ − 2 = 126)
```

### E2. A /27

**Difficulty:** Easy

Find the network, broadcast and host range of `10.10.10.200/27`.

```text
/27 → mask 224, block 32.  Multiples: … 160, 192, 224.  200 lies in [192, 224)
Network:    10.10.10.192
Broadcast:  10.10.10.223
Hosts:      10.10.10.193 – 10.10.10.222   (30)
```

### E3. Valid host or not?

**Difficulty:** Easy

Can `172.16.50.19/30` be assigned to a router interface?

```text
/30 → block 4.  Multiples: … 12, 16, 20.  19 lies in [16, 20)
Network 172.16.50.16, broadcast 172.16.50.19, hosts .17 and .18
```

**No** — `.19` is the broadcast address. Use `.17` and `.18` for the two ends of the link.

### E4. Host count from a prefix

**Difficulty:** Easy

How many usable hosts are in a `/21`, and what is its mask?

```text
Host bits = 32 − 21 = 11  →  2¹¹ − 2 = 2,046 usable hosts
Mask: 3rd octet has 21 − 16 = 5 network bits → 248  →  255.255.248.0
```

### E5. Same subnet?

**Difficulty:** Medium

Are `192.168.8.33/28` and `192.168.8.47/28` in the same subnet? Can both be hosts?

```text
/28 → block 16.  33 and 47 both lie in [32, 48)
Both are in 192.168.8.32/28 (broadcast 192.168.8.47)
```

They are in the same subnet, but **only `.33` is a valid host**: `.47` is the broadcast address.

### E6. Third octet

**Difficulty:** Medium

Find the network, broadcast and host range of `10.30.130.5/21`.

```text
/21 → 3rd octet, mask 248, block 8.  Multiples: … 120, 128, 136.  130 lies in [128, 136)
Network:    10.30.128.0
Broadcast:  10.30.135.255
Hosts:      10.30.128.1 – 10.30.135.254   (2,046)
```

Note: `10.30.129.0` and `10.30.131.255` are ordinary hosts in this subnet.

### E7. Which subnet number?

**Difficulty:** Medium

`172.16.200.0/24` is divided into `/29` subnets. Which subnet (counting from 1) contains `172.16.200.37`, and what is its usable range?

```text
/29 → block 8.  37 lies in [32, 40)  → network 172.16.200.32
Subnet index = 32 ÷ 8 = 4 counting from 0  →  the 5th subnet
Hosts .33 – .38, broadcast .39
```

### E8. Divide for departments

**Difficulty:** Medium

Divide `172.20.0.0/16` into at least 6 equal subnets. Give the prefix, hosts per subnet and the list of subnets.

```text
2ˢ ≥ 6  →  s = 3 (8 subnets)   new prefix /19   host bits 13 → 2¹³ − 2 = 8,190 hosts
/19 → 3rd octet, block 256 − 224 = 32
172.20.0.0/19     172.20.32.0/19    172.20.64.0/19    172.20.96.0/19
172.20.128.0/19   172.20.160.0/19   172.20.192.0/19   172.20.224.0/19
```

Six are used; two are spare for growth.

### E9. Mask from a host requirement

**Difficulty:** Medium

A data-centre segment needs 1,500 hosts. Which prefix and mask?

```text
2ʰ − 2 ≥ 1,500  →  2¹⁰ − 2 = 1,022 (too small), 2¹¹ − 2 = 2,046 ✓  →  h = 11
Prefix = 32 − 11 = /21   →  mask 255.255.248.0
```

### E10. Second octet

**Difficulty:** Hard

Find the network, broadcast and usable host count of `10.77.200.200/13`.

```text
/13 → 2nd octet, network bits in it = 13 − 8 = 5 → mask 248, block 8
Multiples of 8: … 64, 72, 80.  77 lies in [72, 80)
Network:    10.72.0.0
Broadcast:  10.79.255.255
Usable:     2¹⁹ − 2 = 524,286
```

### E11. Debug a configuration

**Difficulty:** Hard

A host is configured as `192.168.10.65/26` with default gateway `192.168.10.62`. It reaches local hosts but not the Internet. Why?

```text
/26 → block 64. 65 lies in [64, 128) → host's network 192.168.10.64/26 (hosts .65 – .126)
Gateway .62 lies in [0, 64) → a different subnet (192.168.10.0/26)
```

The gateway is not on the host's subnet, so the host cannot reach it directly (most OSes reject the route). Fix: use a router address inside `192.168.10.64/26`, such as `192.168.10.126` or `.65` — whichever the router actually has.
