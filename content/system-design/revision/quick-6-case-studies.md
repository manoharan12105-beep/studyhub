# Block 6: Case Studies and the Interview

Block 6 of 6, about ten minutes.

## 1. The Interview Flow (3 min)

1. Clarify · 2. functional · 3. non-functional (numbers) · 4. estimate · 5. APIs · 6. data model · 7. simplest architecture · 8. storage · 9. caching · 10. scaling · 11. reliability · 12. bottlenecks · 13. trade-offs · 14. future work.

Say reasoning aloud; tie each box to a requirement; name what you give up; let the interviewer steer depth.

## 2. URL Shortener (2 min)

- ~40 writes/s, ~4,000 reads/s, 6 TB over 10 years → reads and code generation are the challenge.
- Codes: counter ranges + base 62 (short, guessable) · random + unique key (retry) · hash prefix (dedupe, collisions). 62⁷ ≈ 3.5 trillion.
- Cache-aside in Redis + local hot cache + negative caching/Bloom filter; replicas; redirects survive a primary outage.
- 301 (cached, cheaper, no analytics) vs 302 (every click counted). Clicks → event stream, not counter rows.

## 3. Photo Sharing (2 min)

- One $10 server → LB + servers → stateless (Redis sessions) → object storage + Postgres → indexes → cache + CDN → replicas + backups → shards by user.
- 250 : 1 reads; images dominate storage and bandwidth.
- Feed: **hybrid fan-out** — push photo IDs to followers' lists, pull celebrities' posts at read time; cache photo objects separately.

## 4. Video Streaming (2 min)

- Presigned multipart upload → queue (priority) → chunk-parallel transcoding into a bitrate ladder → segments + manifests → object storage → origin shield → CDN.
- Players pull segments over HTTP (**HLS/DASH**) and adapt bitrate per segment; RTMP is for live ingest.
- Terabits of egress → CDN; keep originals for re-encoding.

## 5. Chat (1 min)

- WebSocket gateways + connection registry; route by registry via pub/sub.
- **Persist before ack**; client message IDs dedupe resends; per-conversation sequence numbers for order, gap detection and resume.
- Wide-column store partitioned by conversation; small groups fan out on write, huge ones on read; throttled presence via heartbeats + TTL.
