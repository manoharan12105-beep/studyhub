# Subnetting by Hand: The Block-Size Method

**Module:** Subnetting · **Interview priority:** Core

## What Is It?

A fast, binary-free way to answer the classic question: **given an IP address and prefix, find the network address, broadcast address and valid host range**. It works for any prefix from `/8` to `/30` in under a minute.

## Why It Exists

Interviewers and placement tests ask subnetting questions under time pressure. Converting everything to binary is slow and error-prone. The block-size method uses one observation: **subnets are blocks of a fixed size that start at multiples of that size.**

## How It Works

### The method in five steps

1. **Find the interesting octet** — the octet where the mask is neither 255 nor 0:
   - /8 to /15 → 2nd octet · /16 to /23 → 3rd octet · /24 to /32 → 4th octet.
2. **Find the mask value** in that octet (from the table below).
3. **Block size = 256 − mask value.**
4. **Network:** the largest multiple of the block size that is ≤ the address's value in the interesting octet. Octets to the right become **0**.
5. **Broadcast:** next network − 1 in the interesting octet; octets to the right become **255**. Hosts are everything between.

### The table to memorise

| Prefix in the octet (bits) | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|----------------------------|---|---|---|---|---|---|---|---|
| Mask value | 128 | 192 | 224 | 240 | 248 | 252 | 254 | 255 |
| Block size (256 − mask) | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

### Full prefix reference: /8 to /30

| Prefix | Mask | Interesting octet | Block | Addresses | Usable hosts |
|--------|------|-------------------|-------|-----------|--------------|
| /8 | 255.0.0.0 | 1st (full) | — | 16,777,216 | 16,777,214 |
| /12 | 255.240.0.0 | 2nd | 16 | 1,048,576 | 1,048,574 |
| /16 | 255.255.0.0 | 2nd (full) | — | 65,536 | 65,534 |
| /19 | 255.255.224.0 | 3rd | 32 | 8,192 | 8,190 |
| /20 | 255.255.240.0 | 3rd | 16 | 4,096 | 4,094 |
| /21 | 255.255.248.0 | 3rd | 8 | 2,048 | 2,046 |
| /22 | 255.255.252.0 | 3rd | 4 | 1,024 | 1,022 |
| /23 | 255.255.254.0 | 3rd | 2 | 512 | 510 |
| /24 | 255.255.255.0 | 3rd (full) | — | 256 | 254 |
| /25 | 255.255.255.128 | 4th | 128 | 128 | 126 |
| /26 | 255.255.255.192 | 4th | 64 | 64 | 62 |
| /27 | 255.255.255.224 | 4th | 32 | 32 | 30 |
| /28 | 255.255.255.240 | 4th | 16 | 16 | 14 |
| /29 | 255.255.255.248 | 4th | 8 | 8 | 6 |
| /30 | 255.255.255.252 | 4th | 4 | 4 | 2 |

### Worked example 1 — 4th octet: `192.168.20.200/26`

```text
Interesting octet: 4th     mask value: 192     block size: 256 − 192 = 64
Multiples of 64: 0, 64, 128, 192, (256)
200 lies in [192, 256)
Network:    192.168.20.192
Broadcast:  192.168.20.255   (256 − 1)
Hosts:      192.168.20.193 – 192.168.20.254   (62 usable)
```

### Worked example 2 — 3rd octet: `10.128.77.33/20`

```text
Interesting octet: 3rd     mask value: 240     block size: 16
Multiples of 16: 0, 16, 32, 48, 64, 80 …   77 lies in [64, 80)
Network:    10.128.64.0       (4th octet → 0)
Broadcast:  10.128.79.255     (3rd: 80 − 1 = 79; 4th → 255)
Hosts:      10.128.64.1 – 10.128.79.254   (2¹² − 2 = 4,094 usable)
```

> [!TIP]
> When the interesting octet is the 3rd, the host range crosses several values of that octet: `10.128.64.255` and `10.128.65.0` are **ordinary hosts** in this /20, not broadcast or network addresses.

### Worked example 3 — 2nd octet: `10.200.13.5/12`

```text
Interesting octet: 2nd     mask value: 240     block size: 16
Multiples of 16 … 192, 208 …   200 lies in [192, 208)
Network:    10.192.0.0
Broadcast:  10.207.255.255
Hosts:      10.192.0.1 – 10.207.255.254   (2²⁰ − 2 = 1,048,574 usable)
```

### Finding subnet boundaries

All subnets of a given prefix start at multiples of the block size in the interesting octet:

```text
/27 in the 4th octet:  .0  .32  .64  .96  .128  .160  .192  .224
/22 in the 3rd octet:  x.x.0.0  x.x.4.0  x.x.8.0  …  x.x.252.0
```

To check whether an address is a **network** address: interesting-octet value is a multiple of the block size **and** all octets to the right are 0. A **broadcast** address: next multiple − 1 **and** all octets to the right are 255.

## Under the Hood

The block-size method is the binary AND in disguise. The mask value 224 = `11100000`; its lowest 1 bit has value 32 — the block size. ANDing with the mask clears the lower 5 bits, which is exactly "round down to a multiple of 32".

### Check your answers with code

A small Java 17 program doing the same calculation with bit operations:

```java
public class SubnetCalculator {

    // An IPv4 address is just a 32-bit number; keep it in a long to avoid sign problems.
    static long toNumber(String ip) {
        long n = 0;
        for (String octet : ip.split("\\.")) {
            n = n * 256 + Integer.parseInt(octet);
        }
        return n;
    }

    static String toDotted(long n) {
        return ((n >> 24) & 255) + "." + ((n >> 16) & 255) + "." + ((n >> 8) & 255) + "." + (n & 255);
    }

    static void describe(String cidr) {
        String[] parts = cidr.split("/");
        long ip = toNumber(parts[0]);
        int prefix = Integer.parseInt(parts[1]);
        long size = 1L << (32 - prefix);              // addresses in the block
        long mask = (0xFFFFFFFFL << (32 - prefix)) & 0xFFFFFFFFL;
        long network = ip & mask;                      // host bits -> 0
        long broadcast = network + size - 1;           // host bits -> 1
        System.out.println(cidr);
        System.out.println("  mask       " + toDotted(mask));
        System.out.println("  network    " + toDotted(network));
        System.out.println("  broadcast  " + toDotted(broadcast));
        System.out.println("  hosts      " + toDotted(network + 1) + " - " + toDotted(broadcast - 1)
                + " (" + (size - 2) + " usable)");
    }

    public static void main(String[] args) {
        describe("192.168.20.200/26");
        describe("10.128.77.33/20");
    }
}
```

**Output:**

```text
192.168.20.200/26
  mask       255.255.255.192
  network    192.168.20.192
  broadcast  192.168.20.255
  hosts      192.168.20.193 - 192.168.20.254 (62 usable)
10.128.77.33/20
  mask       255.255.240.0
  network    10.128.64.0
  broadcast  10.128.79.255
  hosts      10.128.64.1 - 10.128.79.254 (4094 usable)
```

## Common Traps

- **Using the wrong octet** — for `/20`, the work is in the 3rd octet, not the 4th.
- **Broadcast = network + block size** — it is network + block size **− 1**.
- **Forgetting to zero / fill the octets to the right** of the interesting octet.
- **Treating `.0` or `.255` as always invalid** — inside a /22, `x.x.5.0` and `x.x.5.255` can be valid hosts.

## Interview Follow-up

- *"Is `192.168.1.64/26` a valid host address?"* No — it is the network address (64 is a multiple of 64).
- *"What is the broadcast of `172.16.31.255/20`'s network?"* The address itself: block 16 → network `172.16.16.0`, broadcast `172.16.31.255`.

## Key Takeaways

- Block size = 256 − mask value in the interesting octet.
- Network = largest multiple of the block ≤ the address; broadcast = next multiple − 1; octets to the right become 0 / 255.
- /8–/15: 2nd octet; /16–/23: 3rd; /24–/30: 4th.
- Memorise 128, 192, 224, 240, 248, 252, 254, 255 and their blocks 128 … 1.
