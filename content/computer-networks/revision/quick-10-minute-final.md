# Block 3: 10-Minute Final Sheet

Block 3 of 3. The last thing to read before the interview.

## Numbers

| Fact | Value |
|------|-------|
| OSI layers | 7: Physical, Data Link, Network, Transport, Session, Presentation, Application |
| MAC / IPv4 / IPv6 / port | 48 / 32 / 128 / 16 bits |
| Ethernet MTU / TCP MSS | 1,500 / 1,460 bytes |
| Headers | Ethernet 14 (+4 FCS) · IPv4 20 · IPv6 40 · TCP 20 · UDP 8 |
| Usable hosts | 2ʰ − 2 (/24 → 254, /26 → 62, /30 → 2) |
| Private IPv4 | 10/8 · 172.16/12 · 192.168/16 |
| Linux TIME_WAIT | 60 s |
| DHCP renew / rebind | 50 % / 87.5 % of lease |
| TTL start | Linux 64 · Windows 128 |

## One-Liners

- Switch = collision domains; router = broadcast domains.
- Destination IP = final target; destination MAC = next hop.
- MACs change every link, TTL every router, IPs/ports only at NAT.
- Longest prefix wins; default route `0.0.0.0/0` loses to everything.
- TCP seq counts bytes; ACK = next byte expected.
- Refused = RST; timeout = silence.
- Flow control = receiver (rwnd); congestion control = network (cwnd).
- 401 = who are you; 403 = not allowed.
- 502 bad response · 503 unavailable · 504 too slow.
- Idempotent = same state, not same response.
- TLS: asymmetric to authenticate and agree keys, symmetric to encrypt.
- DNS changes wait for TTL; nothing is pushed.
- NAT is not a firewall; VPN is not zero trust.
- Ping tests ICMP only — test the real port.

## The Answers You Must Not Fumble

1. **What happens when you type a URL** — DHCP/ARP done → DNS → TCP → TLS → HTTP → LB → app → back → render.
2. **TCP vs UDP** — reliability/order/congestion vs speed/simplicity; examples.
3. **Three-way handshake and four-way close** — with states and TIME_WAIT's purpose.
4. **OSI vs TCP/IP** — model vs suite, layer mapping.
5. **No internet / ping IP but not domain** — the ladder; DNS.
6. **L4 vs L7 load balancer** — connections by IP/port vs requests by HTTP content.
