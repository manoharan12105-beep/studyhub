# How the Internet Is Built

**Module:** Network Fundamentals · **Interview priority:** Awareness

## What Is It?

The Internet has no single owner or centre. It is tens of thousands of independently run networks — called **autonomous systems (AS)** — such as ISPs, mobile carriers, cloud providers, CDNs, universities and large companies, connected to each other by routers, fibre and agreements.

## Why It Exists

No single company could build or pay for a global network. Instead, each network handles its own part and connects to others. This explains several things you will see as a developer: why latency depends on geography, why a cable cut can slow a whole region, and why CDNs place servers close to users.

## How It Works

### The layers of the Internet

```text
                 Tier 1 networks (global backbones, peer with each other)
                ╱                │                 ╲
   Tier 2 / regional ISPs   Tier 2 ISPs        Large clouds & CDNs
          │                      │                    │
   Access ISPs (home fibre, mobile carriers)    Data centres
          │                      │
     Homes, offices, phones   (the "last mile")
```

| Part | Role |
|------|------|
| **Access network / last mile** | Connects you to your ISP: fibre (FTTH), cable, DSL, 4G/5G |
| **Access (Tier 3) ISP** | Sells Internet access to homes and businesses; buys transit from bigger ISPs |
| **Tier 2 / regional ISP** | Regional network; buys some transit, peers with others |
| **Tier 1 network** | Global backbone that reaches every other network without paying anyone for transit |
| **IXP** (Internet Exchange Point) | A building where many networks connect directly to swap traffic cheaply and with lower latency |
| **Data centres, clouds, CDNs** | Where servers live; CDNs place copies of content near users |

Two kinds of agreement connect networks:

- **Transit:** a smaller network *pays* a bigger one to carry its traffic to the rest of the Internet.
- **Peering:** two networks exchange traffic between their own customers directly, usually without payment, often at an IXP.

Which path traffic takes between autonomous systems is decided by [BGP](../../routing/static-and-dynamic-routing/content.md), the Internet's inter-domain routing protocol.

### Submarine cables: the physical backbone

About 99 % of intercontinental data travels through **submarine optical fibre cables** on the ocean floor — not satellites. A cable is roughly the thickness of a garden hose, holds several fibre pairs, and carries terabits per second. Landing stations connect them to land networks (India has major landing points in Mumbai and Chennai).

Why fibre and not satellites for the backbone?

| | Submarine fibre | Geostationary satellite |
|---|-----------------|--------------------------|
| Capacity | Hundreds of Tbit/s per cable | Far lower |
| Latency | ≈ 5 ms per 1,000 km | ≈ 240 ms one way (36,000 km up and down) |
| Cost per bit | Low | High |

Low-earth-orbit constellations (around 550 km altitude) have much lower latency than geostationary satellites and serve remote areas, but the backbone remains fibre.

### Following one request

Opening a site hosted in another country might go: phone → mobile carrier → Tier 2 ISP → submarine cable → Tier 1 backbone → the hosting provider's data centre. A CDN can shorten this to: phone → carrier → CDN server in your city.

## Real World

- **Choosing a cloud region** close to your users reduces round-trip time on every request; latency is largely geography.
- A **cable cut** reroutes traffic over longer paths, raising latency for a whole region — the network survives (packet switching) but gets slower.
- `traceroute` shows the routers along this path (see [TTL and ICMP](../../routing/ttl-and-icmp/content.md)).

## Common Traps

- **"The Internet is run by one organisation."** No one owns it; ICANN/IANA coordinate names and numbers, and the IETF writes standards, but each network is run independently.
- **"Most international traffic goes via satellites."** Almost all of it goes through submarine fibre.
- **"Wireless means no cables."** Wi-Fi and 5G cover only the last few hundred metres; behind them is fibre.

## Interview Follow-up

- *"Why do CDNs make websites faster?"* They shorten the distance (and number of networks) between user and content — see [Caching and CDNs](../../performance/caching-and-cdns/content.md).

## Key Takeaways

- The Internet is a network of autonomous systems (ISPs, clouds, CDNs) connected by transit and peering, often at IXPs.
- Tier 1 backbones → regional ISPs → access ISPs → the last mile to users.
- Submarine fibre carries almost all intercontinental traffic; distance sets a floor on latency.
- BGP chooses paths between networks.
