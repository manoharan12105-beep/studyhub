# Longest Prefix Match

**Module:** Routing · **Interview priority:** Core

## What Is It?

When a destination IP matches **several** routes in a routing table, the router chooses the route with the **longest prefix** — the most specific one. This rule is called **longest prefix match (LPM)**.

```text
Routing table:
  0.0.0.0/0        via 203.0.113.1    (default)
  10.0.0.0/8       via 10.255.0.1
  10.1.0.0/16      via 10.255.0.2
  10.1.2.0/24      via 10.255.0.3

Destination 10.1.2.77 matches /0, /8, /16 and /24  →  /24 wins  →  via 10.255.0.3
Destination 10.1.9.9  matches /0, /8, /16          →  /16 wins  →  via 10.255.0.2
Destination 10.9.9.9  matches /0, /8               →  /8 wins   →  via 10.255.0.1
Destination 8.8.8.8   matches only /0              →  default   →  via 203.0.113.1
```

## Why It Exists

Routing tables contain overlapping routes on purpose: a broad summary route (`10.0.0.0/8` to the core) plus exceptions (`10.1.2.0/24` to a specific site), and a default route that matches everything. The most specific route carries the most precise information about where that destination is, so it should win. Without LPM, summarisation and default routes could not coexist with exceptions.

## How It Works

### Matching a route

A destination matches a route `P/n` if the **first n bits** of the destination equal the first n bits of P. Equivalently: `destination AND mask(n) == P`.

```text
Destination 10.1.2.77   = 00001010.00000001.00000010.01001101
Route 10.1.0.0/16       = 00001010.00000001 │ ...    first 16 bits equal → match
Route 10.1.2.0/24       = 00001010.00000001.00000010 │ ...  first 24 equal → match (longer)
Route 10.2.0.0/16       = 00001010.00000010 │ ...    bit 15 differs → no match
```

### Step by step

1. Collect every route whose prefix matches the destination.
2. Pick the one with the **largest prefix length**.
3. (Only if two routes have the **same** prefix — e.g. learned from different protocols — compare administrative distance, then metric. Equal-cost routes may be load-shared: ECMP.)

`0.0.0.0/0` has length 0, so it matches everything but always loses to any other match — exactly what a default route should do.

### Prefix length beats metric

A `/24` with a terrible metric still beats a `/16` with a perfect metric, because they are **different destinations**. Metrics and administrative distance only break ties between routes for the **same** prefix.

### Under the hood

Routers do not scan the table linearly. Software routers use a **trie** (prefix tree, e.g. Patricia/radix trie) walked bit by bit, remembering the last matching node; hardware routers use **TCAM** (ternary content-addressable memory) that compares a destination against all prefixes in parallel in one clock cycle, with longer prefixes given priority.

## Real World

- **Host routes (`/32`)** override everything for one address — used for VPN servers, load balancer VIPs, or blackholing an attacker.
- **VPN split tunnelling:** the VPN client installs `10.0.0.0/8 via tunnel` while the default route stays on your home router — company traffic uses the VPN, everything else goes direct. A "full tunnel" VPN instead installs `0.0.0.0/1` and `128.0.0.0/1` — two /1s that together cover everything and beat the existing /0 by LPM, without deleting it.
- **BGP hijacks:** announcing a more specific prefix (`/24` inside someone's `/22`) attracts their traffic everywhere, because LPM prefers it.

## Common Traps

> [!WARNING]
> **Common trap:** "The route with the best metric wins." Only among routes for the **same** prefix. Between different matching prefixes, the **longest** prefix always wins.

- **"The default route is used when the network is unknown — so it is checked first."** It is the **last** resort: any more specific match wins.
- **Misjudging prefix boundaries:** `172.16.5.9` **does** match `172.16.4.0/23`, because a /23 covers 4–5 in the 3rd octet. Check boundaries with the [block-size method](../../subnetting/subnetting-block-size-method/content.md).

## Interview Follow-up

- *"Why does a VPN's full tunnel use 0.0.0.0/1 and 128.0.0.0/1?"* They are more specific than 0.0.0.0/0, so they override the existing default route without removing it.
- *"How do routers do LPM fast?"* Tries in software, TCAM in hardware.

## Key Takeaways

- Of all matching routes, the longest prefix (most specific) wins.
- A destination matches `P/n` when its first n bits equal P's.
- The default route `/0` matches everything and loses to everything.
- Administrative distance and metric only decide between routes for the same prefix.
