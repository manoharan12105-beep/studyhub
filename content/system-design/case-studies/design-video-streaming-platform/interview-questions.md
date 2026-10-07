# Case Study: Design a Video Streaming Platform — Interview Questions

## Beginner

### Q1. Why are videos split into segments?

**Style:** Why

<details>
<summary>Answer</summary>

So playback can start after downloading only the first few seconds, only the parts actually watched are downloaded, seeking jumps directly to the right segment, and quality can change at every segment boundary to follow the viewer's network (adaptive bitrate). Segments are ordinary files, so CDNs cache them easily.

</details>

### Q2. What is adaptive bitrate streaming?

**Style:** Direct

<details>
<summary>Answer</summary>

Each video is encoded at several bitrates and resolutions (a ladder), all cut into aligned segments. The player measures throughput and buffer level and, for each next segment, picks the highest rendition it can download in time — stepping down when the network slows and up when it improves — so playback continues without stalling.

</details>

## Intermediate

### Q3. Why is a CDN essential for video delivery?

**Style:** Why

<details>
<summary>Answer</summary>

Video egress is enormous (terabits per second for a large platform); serving it from a central origin would be impossibly expensive and slow for distant viewers. CDN edges near viewers cache popular segments, cut latency and rebuffering, and absorb most of the bandwidth; video popularity is skewed, so cache hit ratios are high.

</details>

### Q4. Describe the upload-to-playback pipeline.

**Style:** How

<details>
<summary>Answer</summary>

The client uploads the original directly to object storage with presigned multipart URLs; an upload event goes into a (priority) queue; transcoding workers split the video into chunks and produce each rendition in parallel, cut segments and write manifests (HLS/DASH) to object storage; the video is marked READY; players fetch the manifest and segments through the CDN.

</details>

### Q5. HLS/DASH vs RTMP — which is used for what?

**Style:** Comparison

<details>
<summary>Answer</summary>

HLS and MPEG-DASH deliver segmented video over standard HTTP with adaptive bitrate, and are what players use for on-demand and most live playback because every CDN can cache them. RTMP is an older TCP-based protocol still widely used to ingest live streams from encoders into platforms, but not for delivery to viewers.

</details>

### Q6. Why use a priority queue for transcoding jobs?

**Style:** Design

<details>
<summary>Answer</summary>

To process the most valuable work first: low-resolution renditions so a video becomes playable quickly while higher ones continue; popular or time-sensitive creators' uploads; retries versus new jobs. It keeps user-visible latency low when the queue is backed up.

</details>

## Advanced

### Q7. How do you make transcoding a 2-hour film fast?

**Style:** Design

<details>
<summary>Answer</summary>

Split the source into chunks at keyframes (for example one-minute pieces), transcode chunks and renditions in parallel across many workers (possibly GPUs), then concatenate outputs and generate manifests. Autoscale workers on queue depth and use preemptible capacity because chunk jobs are idempotent and retryable.

</details>

### Q8. A newly released episode causes a spike of cache misses at the CDN. How do you protect the origin?

**Style:** What happens if

<details>
<summary>Answer</summary>

Use an origin shield (a mid-tier cache that collapses edge misses into one origin fetch per segment), enable request collapsing at edges, pre-warm the CDN with the episode's first segments before release, serve the origin from object storage designed for high read throughput, and use multiple CDNs for very large events.

</details>
