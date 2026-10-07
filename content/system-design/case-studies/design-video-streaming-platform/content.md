# Case Study: Design a Video Streaming Platform

**Module:** Case Studies · **Interview priority:** Frequently asked

How to use this case study: think out loud, name trade-offs, and add a component only for a reason — each costs money. Try each **Think about it** before reading on.

## Problem

Design a YouTube- or Netflix-like service: creators upload videos; viewers anywhere watch them smoothly on phones, laptops and TVs. Scope: getting a video from the uploader to the viewer's screen. Out of scope: accounts, comments, ratings, recommendations and payments.

## Requirements

**Functional:** upload a video; process it for playback; stream it on demand with seek; adapt quality to the viewer's network and screen.

**Non-functional:**

- **Playback starts fast** (about 1–2 s) and rarely stalls (**rebuffering**) — viewers leave quickly otherwise.
- Works worldwide, on slow and fast networks and many device types.
- Uploads may take minutes to process — latency on the write path is relaxed.
- Massive read bandwidth at reasonable cost; videos are never lost.

## Assumptions

- 10,000 hours of new video uploaded per day; 50 million daily viewers watching about 1 hour each.
- Videos are stored in a **bitrate ladder** of renditions (approximate, typical H.264 values):

| Rendition | Bitrate | Storage per hour (bitrate × 3,600 s ÷ 8) |
|-----------|---------|-------------------------------------------|
| 2160p (4K) | ~16 Mbps | ~7.2 GB |
| 1080p | ~5 Mbps | ~2.25 GB |
| 720p | ~3 Mbps | ~1.35 GB |
| 480p | ~1.5 Mbps | ~0.68 GB |
| 360p | ~0.8 Mbps | ~0.36 GB |
| 240p | ~0.4 Mbps | ~0.18 GB |

## Scale Estimation

```text
Renditions (240p–1080p) ≈ 4.8 GB per hour of video (≈ 12 GB with 4K)
New storage ≈ 10,000 h/day × 4.8 GB ≈ 48 TB/day  (+ originals, + 4K for some videos)
Average concurrent viewers ≈ 50 M × 1 h ÷ 24 h ≈ 2.1 M
Average egress ≈ 2.1 M × ~3 Mbps ≈ 6 Tbps   (peaks several times higher in the evening)
```

**Think about it:** what do 6 Tbps of egress and 48 TB/day of new data imply?

<details>
<summary>Answer</summary>

No origin data centre can or should serve terabits per second to the whole world: delivery must come from a **CDN** with edge caches near viewers, and popularity is skewed (a small share of videos gets most views), so caches are effective. Tens of terabytes per day means **object storage** with tiering for old, rarely watched videos. Processing 10,000 hours a day into six renditions is a large **compute-intensive** batch workload — a worker fleet fed by a queue.

</details>

## APIs

```http
POST /api/v1/videos                       → { videoId, uploadUrl (presigned, multipart) }
PUT  <uploadUrl part N>                    (client uploads parts directly to object storage)
POST /api/v1/videos/{id}/complete          → 202 Accepted   status: PROCESSING
GET  /api/v1/videos/{id}                   → { title, status: READY, manifestUrl: "https://cdn…/v/{id}/master.m3u8" }
GET  https://cdn…/v/{id}/720p/segment-00042.ts      (served by the CDN, not the API)
```

## Data Model

```text
videos     (id, owner_id, title, status [UPLOADING|PROCESSING|READY|FAILED], duration_s, created_at)
renditions (video_id, resolution, bitrate_kbps, codec, manifest_key)
Object storage:  originals/{videoId}            (source file)
                 v/{videoId}/master.m3u8        (lists the renditions)
                 v/{videoId}/{res}/index.m3u8   (lists that rendition's segments)
                 v/{videoId}/{res}/segment-NNNNN.ts|.m4s
```

## Basic Architecture

### Why not just serve the file?

A video is a sequence of frames (30 or 60 per second; 60 is smoother and larger) plus audio. One hour at a modest quality is ~2 GB. Downloading the whole file before playing wastes time; downloading it while playing at one fixed quality stalls on slow networks and wastes data if the viewer leaves after 10 seconds.

### Segments and adaptive bitrate (ABR)

1. **Transcode** each upload into several renditions (the ladder above).
2. **Cut** each rendition into short **segments** (typically 2–6 seconds), aligned across renditions.
3. Publish **manifests** listing renditions and segments.
4. The **player pulls** segments one by one over plain HTTP and, before each, picks the rendition that fits current throughput, buffer level and screen size: 4K on a big TV with fast Wi-Fi, 480p on a phone on a weak mobile signal.

```text
network:   300 Mbps   300   10 Mbps   150    50    300
segment:   seg1 4K   seg2 4K  seg3 480p seg4 1080p seg5 720p seg6 4K     ← quality follows the network
```

This is what "Auto" quality does. Start-up is fast because the player begins with a low-bitrate segment and steps up.

### Protocols: HLS and MPEG-DASH over HTTP

Modern playback uses **HLS** (HTTP Live Streaming, `.m3u8` manifests) and **MPEG-DASH** (`.mpd` manifests). Both deliver ordinary files over HTTP, so every CDN and cache can serve them. **RTMP** (over TCP) and **RTSP** are older protocols; RTMP is still common for **ingesting** live streams from broadcasters to a platform, but not for delivery to viewers.

### The pipeline

```text
Uploader ──presigned multipart──► Object storage (original)
                                         │ "uploaded" event
                                         ▼
                                  Queue (priority) ──► Transcoding workers (per rendition / per chunk, CPU or GPU)
                                                              │ segments + manifests
                                                              ▼
                                                   Object storage (renditions) ──► CDN edges ──► Viewers
                                  status → READY in the videos table
```

**Think about it:** why put a queue (often a priority queue) between upload and transcoding?

<details>
<summary>Answer</summary>

Transcoding is slow and compute-heavy; uploads arrive in bursts. The queue decouples them: uploads finish quickly, workers process at their own pace and autoscale on queue depth, failures are retried, and a **priority** queue lets important work go first — for example short or popular creators' videos, or the low resolutions (so a video becomes playable quickly while 4K is still processing).

</details>

## Bottlenecks

Egress bandwidth (solved by CDN), transcoding compute (solved by parallel workers), and the origin during cache misses for newly popular videos (solved by an origin shield and pre-warming).

## Scaling Strategy

- **Parallel transcoding:** split long videos into chunks (for example 1-minute pieces), transcode chunks and renditions in parallel across many workers, then stitch manifests — a 2-hour film finishes in minutes, not hours.
- **Autoscale workers** on queue depth; use spot/preemptible capacity because jobs are retryable.
- **CDN with regional edges**; an origin shield tier to collapse misses; pre-position content expected to be popular.
- **Tiered storage:** recent and popular videos in standard storage; the long tail moved to cheaper infrequent-access classes.

## Caching

- CDN edges cache segments and manifests (segments are immutable — long TTLs; VOD manifests also immutable).
- Players keep a **buffer** of upcoming segments (tens of seconds) — itself a client-side cache that hides network jitter.
- Metadata (titles, status, manifest URLs) in Redis for the watch page.

## Database Strategy

Video metadata is small and relational (videos, renditions, owners) — a relational database with replicas is plenty; view counts and watch events go to an event stream and analytics store, not counter rows.

## Reliability

Originals are kept (re-transcode when codecs improve or a bug is found); object storage durability protects data; the transcoding queue retries failed jobs and dead-letters corrupt uploads; multiple CDNs or CDN failover for critical events; playback degrades to lower renditions rather than stopping.

## Failure Scenarios

| Scenario | Effect | Handling |
|----------|--------|----------|
| Transcoding worker dies mid-job | Job unacknowledged | Redelivered; idempotent outputs (deterministic keys) |
| Corrupt or unsupported upload | Repeated failures | Validate early; dead-letter; notify uploader |
| Viewer's bandwidth drops | Risk of stalling | ABR switches to a lower rendition; buffer absorbs the dip |
| A video goes viral in one region | Edge misses hit the origin | Origin shield, request collapsing, pre-warming |
| CDN provider outage | Playback fails | Multi-CDN with DNS or player-side failover |

## Trade-offs

- **Segment length:** short segments adapt faster and start quicker; long segments are more efficient (fewer requests, better compression) — 2–6 s is the usual compromise.
- **Number of renditions:** more renditions fit more networks but cost more compute and storage; long-tail videos may get fewer.
- **Per-title encoding:** tuning the ladder per video saves bandwidth at more compute.
- **Pre-transcoding vs just-in-time:** transcode everything up front (simple, more storage) or transcode rare renditions on demand (less storage, first viewer waits).

## Final Architecture

```text
Uploader → API (presigned multipart) → Object storage (originals)
           → Queue (priority) → transcoding workers (chunked, parallel, autoscaled)
           → Object storage (segments + HLS/DASH manifests, tiered)
           → Origin shield → regional CDN edges → Players (ABR, buffering)
Metadata: relational DB + replicas + Redis; analytics: event stream → warehouse; monitoring everywhere
```

## What Changes at 10x Scale

Own or contract edge capacity inside ISPs (embedded caches), multiple CDNs, smarter per-title and per-scene encoding with newer codecs (AV1/HEVC) to cut bandwidth, popularity-based placement of content at edges, GPU or specialised hardware for transcoding, and live streaming as a separate low-latency pipeline (RTMP or SRT ingest → real-time transcoding → low-latency HLS/DASH).

## Key Takeaways

- Video is the most bandwidth-heavy workload on the Internet: delivery must come from CDN edges, with object storage as the origin.
- Transcode uploads asynchronously into a bitrate ladder; cut renditions into segments; publish manifests.
- Players pull segments over HTTP (HLS/DASH) and adapt quality per segment (ABR) to network and screen.
- Queue + autoscaled, chunk-parallel workers handle the compute-intensive pipeline; originals are kept for re-processing.
