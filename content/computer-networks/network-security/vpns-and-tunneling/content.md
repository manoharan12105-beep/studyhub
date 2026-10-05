# VPNs and Tunnelling

**Module:** Network Security · **Interview priority:** Frequently asked

## What Is It?

A **VPN** (Virtual Private Network) creates an **encrypted tunnel** across an untrusted network (usually the Internet) so that two endpoints can communicate as if they were on the same private network. **Tunnelling** means carrying one packet **inside** another: the original packet (with private addresses) becomes the payload of an outer packet addressed between the tunnel endpoints.

```text
Original packet:   [IP 10.8.0.5 → 10.0.2.20][TCP 5432][data]
In the tunnel:     [IP 198.51.100.7 → 203.0.113.50][UDP 51820][ encrypted( original packet ) ]
                    └── outer header: home router → company VPN gateway ──┘
```

## Why It Exists

Companies need remote employees and branch offices to reach internal systems (intranet, databases, file shares) **without exposing those systems to the Internet**, and without trusting the networks in between (home Wi-Fi, hotel, ISP). A VPN provides confidentiality, integrity and authentication for that path, and makes private address ranges reachable across the public Internet.

## How It Works

### Types of VPN

| Type | Connects | Example |
|------|----------|---------|
| **Remote-access VPN** | One device ↔ a network | An employee's laptop to the company network |
| **Site-to-site VPN** | Network ↔ network, router to router | Branch office LAN to head-office LAN; on-premises data centre to a cloud VPC |
| Consumer / privacy VPN | Device ↔ the VPN provider, then the Internet | Hides traffic from the local network/ISP; sites see the provider's IP |

### What happens when a remote user connects

1. The VPN client authenticates to the VPN gateway (password + MFA, certificate, SSO).
2. Keys are agreed (like TLS/SSH: asymmetric for authentication and key exchange, symmetric for data).
3. The client gets a **virtual interface** with an internal address (e.g. `10.8.0.5`) and **routes**:
   - **Full tunnel:** all traffic (`0.0.0.0/0`) goes through the VPN — central inspection, more load.
   - **Split tunnel:** only company ranges (e.g. `10.0.0.0/8`) go through the VPN; everything else goes directly — via [longest prefix match](../../routing/longest-prefix-match/content.md).
4. Internal DNS servers are configured so internal names (`git.corp.internal`) resolve.
5. Packets to internal addresses are encapsulated, encrypted and sent to the gateway, which decrypts them and forwards them inside.

### Common VPN protocols

| Protocol | Layer / transport | Notes |
|----------|-------------------|-------|
| **IPsec** | Layer 3 (ESP, IP protocol 50; IKE on UDP 500/4500) | Standard for site-to-site and cloud VPN gateways |
| **WireGuard** | UDP (default 51820) | Modern, small, fast; fixed modern cryptography |
| **OpenVPN** | TLS-based, UDP or TCP (often 1194 or 443) | Flexible, works through restrictive firewalls |
| **TLS/SSL VPNs** | HTTPS (443) | Browser- or client-based corporate access |

### Other tunnels you will meet

| Tunnel | Purpose |
|--------|---------|
| SSH port forwarding | Ad-hoc encrypted tunnel to one service ([SSH](../../application-layer/ssh-protocol/content.md)) |
| GRE | Unencrypted generic encapsulation between routers (often combined with IPsec) |
| VXLAN | Layer 2 networks over Layer 3 in data centres and Kubernetes overlays |
| 6in4 | IPv6 over IPv4 during the transition |

### Costs of tunnelling

- **MTU:** each extra header reduces room for the inner packet; large packets may be fragmented or silently dropped if ICMP is blocked ([Encapsulation](../../osi-model/encapsulation-and-decapsulation/content.md)). VPNs clamp the TCP MSS to avoid this.
- **Latency:** a full tunnel routes traffic via the gateway, possibly far away.
- **Gateway capacity:** all remote traffic funnels through it.

## Real World

- Cloud **site-to-site VPN** (IPsec) or dedicated links (AWS Direct Connect, Azure ExpressRoute) connect corporate networks to VPCs.
- Developers often reach staging databases through the company VPN or an SSH bastion instead of public endpoints.
- **Zero-trust network access** (identity-aware proxies) increasingly replaces broad VPN access: each application is reachable only after per-request authentication, instead of the VPN granting access to an entire network.

## Common Traps

- **"A VPN makes you anonymous and secure everywhere."** It protects the path to the VPN endpoint; after that, traffic is as secure as its own protocol (use HTTPS), and the VPN provider sees your traffic.
- **"Connected to the VPN = trusted."** That is the perimeter model's weakness; a compromised laptop on the VPN can reach everything the network allows. Apply least privilege.
- **"Split tunnelling is always insecure / always better."** It is a trade-off: less load and latency vs less central visibility.

## Interview Follow-up

- *"Site-to-site vs remote-access VPN?"* Network-to-network between gateways vs device-to-network for individual users.
- *"Why do some websites break on the VPN?"* MTU problems, DNS settings (internal resolvers), or full-tunnel routing through a filtered gateway.

## Key Takeaways

- VPN = encrypted tunnel over an untrusted network; tunnelling = packet inside a packet.
- Remote-access (user ↔ network) vs site-to-site (network ↔ network).
- Full tunnel vs split tunnel is a routing decision (longest prefix match).
- IPsec, WireGuard, OpenVPN/TLS VPNs; extra headers reduce the effective MTU.
- Zero-trust access is replacing "on the VPN = trusted".
