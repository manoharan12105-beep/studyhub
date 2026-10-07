// Design decisions, one at a time: the learner chooses, the simulator explains.
//
//   scenario → stage → choose an option →
//     a sound choice: why it works, its trade-off, what an interviewer may ask next → next stage
//     a weak choice:  why it fails → same stage (try again)
//   "Show next decision" plays a recommended choice, so Next/Play walk a good path.
//
// Several options in a stage can be sound (for example random codes vs counter
// ranges); each records its own consequence. One module serves five interactions
// through options.scenario. Learner choices are replayed on the stepper, the same
// way the Linux troubleshooting simulator replays commands.

import { el } from '../util.js';
import { createStepper } from '../engagement/stepper.js';

const SCENARIOS = {
  'cap-partition': {
    title: 'A network partition',
    panel: 'Decisions so far',
    intro: 'Your data is replicated on Node 1 (Mumbai) and Node 2 (Frankfurt). The link between them fails: both nodes are up and receive requests, but they cannot talk to each other. Choose how each feature behaves.',
    stages: [
      {
        prompt: 'First, which statement about this situation is true?',
        choices: [
          { label: 'We can keep every node answering and still always return the latest data.', why: 'Impossible while the nodes cannot communicate: Node 2 cannot know about a write that just happened on Node 1. To answer it must risk staleness; to be sure it must wait or refuse.' },
          { label: 'For each feature we must choose: refuse or delay some requests (CP), or answer with possibly stale data (AP).', ok: true, adds: 'During a partition: choose C or A per feature', why: 'This is what the CAP theorem says. The trade-off appears only during a partition; when the network is healthy, a well-built system is both consistent and available.', next: '"Isn\'t CAP about picking two of three?"' },
          { label: 'We avoid the problem by choosing CA instead.', why: 'CA only describes a system that never partitions — a single node. A replicated system over a network cannot opt out of partitions.' },
        ],
      },
      {
        prompt: 'Bank: Alice withdraws ₹80 through Node 1 (balance 100 → 20). Bob asks Node 2 to approve another ₹80 withdrawal from the same account. Node 2 still sees ₹100.',
        choices: [
          { label: 'CP: Node 2 refuses or makes Bob wait until it can confirm the balance.', ok: true, adds: 'Account balance: CP', why: 'A brief "try again" is far cheaper than paying out money that is not there. Balances, inventory decrements and bookings are classic CP choices.', next: '"How long can the bank stay unavailable?" — discuss timeouts, a clear error, and keeping writes on one primary region.' },
          { label: 'AP: Node 2 answers with ₹100 and approves the withdrawal.', why: 'Both withdrawals succeed against ₹100 — the account is overdrawn (double spending). A wrong answer here costs real money.' },
        ],
      },
      {
        prompt: 'Social app: during the partition, users on Node 2 like posts and view like counts.',
        choices: [
          { label: 'AP: accept likes on both sides and show possibly slightly stale counts.', ok: true, adds: 'Likes and counts: AP', why: 'Nobody is harmed if a count is a little behind. Likes are (user, post) pairs, so the two sides merge cleanly after the partition (set union).', next: '"How do the counts become correct again?"' },
          { label: 'CP: reject likes on Node 2 until the partition heals.', why: 'Users get errors for a feature where staleness is harmless. Refusing service costs more than a slightly stale count.' },
        ],
      },
      {
        prompt: 'Shopping cart: a user adds items on their phone (routed to Node 1) and laptop (routed to Node 2) during the partition.',
        choices: [
          { label: 'AP with a merge: accept both and combine the carts (union of items) when the partition heals.', ok: true, adds: 'Cart: AP + merge', why: 'An always-writable cart keeps customers buying. Merging as a union never loses an added item (removals need extra tracking). Stock is still checked strictly at checkout.', next: '"What about an item removed on one device but added on the other?"' },
          { label: 'AP with last-write-wins on the whole cart.', why: 'Whichever device wrote last silently replaces the other cart, so items disappear — and clock differences can even pick the earlier write.' },
          { label: 'CP: refuse cart updates on the minority side.', why: 'Possible, but customers cannot shop; for carts the business usually prefers availability with a merge.' },
        ],
      },
      {
        prompt: 'A nightly payment batch must run on exactly one node, chosen by leader election.',
        choices: [
          { label: 'CP: only the side that can reach a majority may elect a leader; the other side runs nothing.', ok: true, adds: 'Leader election / locks: CP', why: 'Two leaders would run the batch twice (double payments). Consensus systems such as etcd and ZooKeeper are CP for exactly this reason.', next: '"What if the old leader was only paused, not dead?" — fencing tokens.' },
          { label: 'AP: let each side elect its own leader so the job always runs.', why: 'Split brain: both leaders run the batch. For coordination, no answer is better than two answers.' },
        ],
      },
      {
        prompt: 'The partition heals. What must the AP features do now?',
        choices: [
          { label: 'Nothing — the data is already consistent.', why: 'Both sides accepted different writes; the replicas now disagree until they exchange and reconcile them.' },
          { label: 'Reconcile: exchange the writes made on each side and merge them or resolve conflicts (union for sets, CRDT counters, last-write-wins only where losing a write is acceptable).', ok: true, adds: 'After the partition: reconcile', why: 'AP systems are eventually consistent: they converge once they can talk again, as long as conflicts have a defined resolution.', done: 'Summary: CAP is a per-feature choice made for partitions — CP where a wrong answer is costly (money, stock, locks), AP where availability matters more and data can be merged (likes, carts, feeds). Outside partitions, PACELC adds the everyday latency vs consistency trade-off.' },
          { label: 'Delete everything written during the partition.', why: 'That throws away real user actions (likes, cart items). Reconciliation keeps them.' },
        ],
      },
    ],
  },

  'url-shortener': {
    title: 'URL shortener builder',
    panel: 'Architecture so far',
    intro: 'Requirements: 100 M new links a month (~40 writes/s), ~4,000 redirects/s on average, links kept 10 years (~6 TB). Redirects must be fast and highly available. Make each decision.',
    stages: [
      {
        prompt: 'How will you generate the short codes?',
        choices: [
          { label: 'Each server reserves ranges of IDs (1,000 at a time) from a database sequence and encodes them in base 62.', ok: true, adds: 'IDs: counter ranges + base 62', why: 'No collisions and the shortest codes; the coordinator is hit once per range, not per link. Trade-off: codes are sequential and guessable — scramble the ID if that matters.', next: '"What happens if a server crashes with half a range unused?" (those IDs are simply skipped)' },
          { label: 'Random 7 base-62 characters, inserted with a unique key; retry on conflict.', ok: true, adds: 'IDs: random 7 chars + unique key', why: '62⁷ ≈ 3.5 trillion codes, so collisions are rare, and the database\'s unique constraint makes them safe. Codes are unguessable. Trade-off: an occasional retry.', next: '"How does the collision rate change as the table fills?"' },
          { label: 'The first 7 characters of an MD5 hash of the long URL.', ok: true, adds: 'IDs: hash prefix + collision handling', why: 'No coordination, and the same URL always gets the same code (deduplication). Trade-off: different URLs can collide — detect it and retry with a salt — and two users shortening one URL share stats.', next: '"Two different URLs produce the same 7 characters. Then what?"' },
          { label: 'Use a UUID as the code.', why: 'A UUID is 36 characters — not short. The whole point of the service is a short code.' },
        ],
      },
      {
        prompt: 'Where do you store code → long URL mappings?',
        choices: [
          { label: 'PostgreSQL with short_code as the primary key, plus read replicas.', ok: true, adds: 'PostgreSQL (code = primary key) + 2 replicas', why: '40 writes/s and 6 TB fit one primary easily; the primary key enforces unique codes; replicas serve cache misses and failover. Shard by code hash later if needed.', next: '"Why not a NoSQL store?"' },
          { label: 'A key-value store such as DynamoDB or Cassandra keyed by code.', ok: true, adds: 'Key-value store keyed by code', why: 'The only hot query is a lookup by key, which key-value stores partition and scale automatically. Trade-off: analytics by owner or date need another store.', next: '"How do you enforce unique codes?" (conditional put)' },
          { label: 'A graph database.', why: 'There are no relationships to traverse — just key lookups. A graph database adds cost without benefit.' },
          { label: 'Files on each app server\'s local disk.', why: 'Servers would no longer be stateless, and a disk failure would lose links — a single point of failure for data that must last years.' },
        ],
      },
      {
        prompt: 'Redirects are ~100× more frequent than writes and very repetitive. What do you add?',
        choices: [
          { label: 'A Redis cache (cache-aside): code → URL with a TTL and LRU eviction.', ok: true, adds: 'Redis cache-aside (TTL + LRU)', why: 'Links almost never change, so hit ratios are high and staleness is rare (delete the key on link deletion). The database then sees only a small share of redirects.', next: '"What hit ratio do you expect, and what if Redis goes down?"' },
          { label: 'More indexes on the urls table.', why: 'The lookup already uses the primary key. Every redirect would still be a database query.' },
          { label: 'Nothing — the database can handle 4,000 lookups/s.', why: 'Perhaps on average, but not at peaks (~12,000/s) or for viral links, and the database would be the single point of failure for every click.' },
        ],
      },
      {
        prompt: 'A link goes viral: 50,000 requests/s for ONE code, and the Redis node holding it is at 100 % CPU.',
        choices: [
          { label: 'Cache that hot key for a few seconds in each app server\'s memory (and optionally cache the redirect at the CDN).', ok: true, adds: 'Local hot-key cache (+ CDN for viral links)', why: 'A hot key lives on one cache node no matter how the cluster is sharded. A local copy on every server spreads the load; the URL does not change, so staleness is harmless.', next: '"How would you detect hot keys automatically?"' },
          { label: 'Shard the database.', why: 'The database is not the bottleneck here — one cache node is. Sharding does not split one key.' },
          { label: 'Increase the TTL of the key.', why: 'The key is already cached; a longer TTL does not move any load off the overloaded node.' },
        ],
      },
      {
        prompt: 'Which HTTP status should a redirect return?',
        choices: [
          { label: '302 Found, so every click reaches us.', ok: true, adds: 'Redirect: 302 (analytics, editable targets)', why: 'Accurate click analytics and the ability to change a link\'s target. Trade-off: more traffic, because browsers do not cache it.', next: '"How do you record clicks without slowing redirects?" (async events)' },
          { label: '301 Moved Permanently, to minimise traffic.', ok: true, adds: 'Redirect: 301 (cached by browsers)', why: 'Browsers cache it, so repeat clicks cost nothing. Trade-off: those clicks never reach us (no analytics), and the target cannot be changed for clients that cached it.', next: '"Marketing now wants exact click counts. What changes?"' },
          { label: '200 OK with the long URL in the response body.', why: 'Browsers would not navigate; the client would need custom code. Redirects are what 3xx statuses are for.' },
        ],
      },
      {
        prompt: 'The primary database fails at peak. What should still work?',
        choices: [
          { label: 'Redirects keep working from the cache and replicas; link creation pauses until automated failover promotes a replica.', ok: true, adds: 'Automated failover; reads survive primary loss', why: 'Graceful degradation protects the high-value read path. Semi-synchronous replication means no acknowledged link is lost.', next: '"How long does failover take, and what do clients see meanwhile?"' },
          { label: 'Everything stops until someone repairs the primary.', why: 'That makes the primary a single point of failure for every click on every short link ever created.' },
        ],
      },
      {
        prompt: 'Bots request millions of random, non-existent codes and the database CPU spikes.',
        choices: [
          { label: 'Negative caching of "not found", a Bloom filter of existing codes, and per-IP rate limiting.', ok: true, adds: 'Penetration protection: negative cache + Bloom filter + rate limits', why: 'Non-existent keys are never cached, so every probe hits the database (cache penetration). These three layers stop most probes before they reach it.', done: 'Final design: stateless servers behind a load balancer, code generation without collisions, a primary + replicas (or key-value store), Redis cache-aside with hot-key and penetration protection, and click events processed asynchronously. Compare with the case study\'s final architecture.' },
          { label: 'Make the cache bigger.', why: 'The probed keys do not exist, so they are never in the cache, however big it is.' },
        ],
      },
    ],
  },

  'url-shortener-interview': {
    title: 'Interview simulator: "Design a URL shortener"',
    panel: 'What you have covered',
    intro: 'The interviewer says: "Design a URL shortener like bit.ly." Choose what you would say or decide at each step of the interview.',
    stages: [
      {
        prompt: 'What do you do first?',
        choices: [
          { label: 'Ask about scale, read/write ratio, custom aliases, expiry, analytics and latency targets.', ok: true, adds: '1. Clarified requirements', why: 'The design depends on the answers. The interviewer replies: 100 M new links a month, 100 reads per write, analytics nice to have, links kept 10 years.', next: 'Interviewer: "Good. What matters most for this system?"' },
          { label: 'Draw a load balancer, microservices and Kafka.', why: 'Components without requirements have no reasons behind them. The first minutes are for questions.' },
          { label: 'Start writing the base-62 encoding function.', why: 'That is low-level design. Stay high-level until asked to zoom in.' },
        ],
      },
      {
        prompt: 'Which non-functional requirements do you prioritise?',
        choices: [
          { label: 'Fast, highly available redirects and durable links; click counts can be approximate.', ok: true, adds: '2–3. Requirements ranked: read latency + availability, durability', why: 'Every click passes through a redirect, and a broken printed link cannot be fixed. Analytics can be eventually consistent.', next: 'Interviewer: "How big is this, roughly?"' },
          { label: 'Strongly consistent click counts above everything.', why: 'Click counts are a secondary feature; making them strongly consistent would slow every redirect.' },
          { label: 'Maximum write throughput.', why: 'Writes are only ~40 per second. Optimising them first misses the real load.' },
        ],
      },
      {
        prompt: 'Estimate the scale.',
        choices: [
          { label: '~40 writes/s, ~4,000 reads/s (peak ~12,000), 12 billion links × 500 B ≈ 6 TB over 10 years — so the read path and code generation are the challenge.', ok: true, adds: '4. Estimates: 40 w/s, 4k r/s, 6 TB', why: 'Correct order of magnitude, and you turned it into a conclusion. Writes fit one database; reads need caching.', next: 'Interviewer: "What would the API look like?"' },
          { label: '~4,000 writes/s, so we must shard from day one.', why: '100 M per month is about 40 per second. A 100× error leads to a needlessly complex design.' },
          { label: 'Skip it; numbers don\'t matter at this stage.', why: 'Numbers decide whether you need caching, sharding or a CDN. Interviewers expect a quick estimate.' },
        ],
      },
      {
        prompt: 'Define the main API.',
        choices: [
          { label: 'POST /api/v1/urls {longUrl} → 201 {shortCode}; GET /{code} → 301/302 with Location; DELETE /api/v1/urls/{code}.', ok: true, adds: '5. API: POST create, GET redirect, DELETE', why: 'Resource-oriented, correct status codes, and the redirect uses HTTP\'s own mechanism.', next: 'Interviewer: "How would you store this?"' },
          { label: 'GET /createShortUrl?url=…', why: 'A verb in the path, a GET with side effects (crawlers and prefetchers would create links), and the long URL in query strings and logs.' },
          { label: 'POST /{code} to perform the redirect.', why: 'Browsers follow links with GET. A redirect is a read.' },
        ],
      },
      {
        prompt: 'Data model and database?',
        choices: [
          { label: 'urls(short_code PK, long_url, owner_id, created_at, expires_at) in PostgreSQL, replicas for reads; shard by code hash later if needed.', ok: true, adds: '6–8. Data model + PostgreSQL (or key-value)', why: 'One hot access pattern — lookup by code — served by the primary key. The scale fits one primary; you named the growth path.', next: 'Interviewer: "Why not NoSQL?" — answer: either works; a key-value store scales out more easily, we give up ad-hoc queries.' },
          { label: 'Store everything in Redis only.', why: 'Links must last 10 years; an in-memory store as the only copy risks data loss and costs far more per terabyte. Redis belongs in front as a cache.' },
        ],
      },
      {
        prompt: 'How are short codes generated across many servers?',
        choices: [
          { label: 'Counter ranges per server encoded in base 62 — or random codes with a unique-key retry.', ok: true, adds: 'ID generation: ranges or random + unique key', why: 'Both avoid duplicates without a per-link bottleneck. You can name the trade-off: guessable vs occasional retries.', next: 'Interviewer: "How long should codes be?" — 7 base-62 characters ≈ 3.5 trillion codes.' },
          { label: 'Each server keeps its own counter starting at 1.', why: 'Every server would hand out code "1", "2", … — duplicates across servers.' },
        ],
      },
      {
        prompt: 'How do you make redirects fast?',
        choices: [
          { label: 'Redis cache-aside in front of the database, plus local caches for hot links and negative caching for unknown codes.', ok: true, adds: '9. Caching: Redis + hot-key + negative caching', why: 'Repetitive, rarely changing data is ideal for caching; you also covered hot keys and penetration.', next: 'Interviewer: "What if the cache cluster fails?"' },
          { label: 'Add more database indexes.', why: 'The lookup already uses the primary key; each redirect would still be a database round trip.' },
        ],
      },
      {
        prompt: 'How does the application tier scale and stay available?',
        choices: [
          { label: 'Stateless servers in several zones behind a redundant load balancer, autoscaled on request rate.', ok: true, adds: '10. Stateless app tier + redundant LB + autoscaling', why: 'Stateless servers are interchangeable, so scaling and failures are routine. A redundant balancer avoids a new single point of failure.', next: 'Interviewer: "And the data tier?"' },
          { label: 'One large server with sticky sessions.', why: 'A single point of failure, a hard ceiling, and there are no sessions to stick to anyway.' },
        ],
      },
      {
        prompt: 'How is the database made reliable?',
        choices: [
          { label: 'Primary + two replicas across zones, semi-synchronous replication, automated failover, point-in-time backups.', ok: true, adds: '11. Replication, failover and backups', why: 'Replicas give read capacity and failover; semi-sync avoids losing acknowledged links; backups cover mistakes that replicas would copy.', next: 'Interviewer: "What breaks first as traffic grows?"' },
          { label: 'Nightly backups only.', why: 'A failure would mean hours of downtime and up to a day of lost links.' },
          { label: 'Multi-leader across three regions with last-write-wins.', why: 'Overkill for 40 writes/s, and concurrent writers risk conflicting codes. Single primary + replicas is enough.' },
        ],
      },
      {
        prompt: 'A cache node fails at peak and misses surge into the database. What is your plan?',
        choices: [
          { label: 'Replicated cache shards fail over; request coalescing and rate limits protect the database; shed load if needed.', ok: true, adds: '12. Failure plan for cache loss', why: 'You protected the database from a stampede and named the degradation path.', next: 'Interviewer: "What would you change at 10× scale?"' },
          { label: 'Clients retry immediately until it works.', why: 'Immediate retries multiply load on an already struggling database — a retry storm.' },
        ],
      },
      {
        prompt: 'Final question: what changes at 10× scale?',
        choices: [
          { label: 'Shard by code hash (or managed key-value), larger cache cluster and more edge caching, decentralised ID ranges, multi-region read replicas, streaming analytics.', ok: true, adds: '13–14. Trade-offs and 10× plan', why: 'Each change follows from a bottleneck you can name.', done: 'Interview complete. You covered requirements, estimates, API, data model, storage, ID generation, caching, scaling, reliability, failures, trade-offs and future work — the full framework.' },
          { label: 'Rewrite everything as microservices.', why: 'Microservices do not address any specific bottleneck here; the design is already horizontally scalable.' },
        ],
      },
    ],
  },

  'photo-sharing': {
    title: 'Photo-sharing app: one failure at a time',
    panel: 'Architecture so far',
    intro: 'The app runs on one $10/month server: web app, PostgreSQL and uploaded photos on its disk. It gets featured and 10,000 people arrive in a day. Fix each failure as it appears.',
    stages: [
      {
        prompt: 'Failure 1: CPU and memory are maxed out; pages take 10 seconds. (Indexes and a bigger machine already helped a little.)',
        choices: [
          { label: 'Add app servers behind a load balancer.', ok: true, adds: 'Load balancer + several app servers', why: 'Horizontal scaling: the balancer spreads requests and skips unhealthy servers; DNS now points to the balancer.', next: 'New problem coming: what was stored inside each server?' },
          { label: 'Shard the database.', why: 'The bottleneck is the web tier\'s CPU, not database size. Sharding would add huge complexity for nothing.' },
        ],
      },
      {
        prompt: 'Failure 2: users are logged out at random.',
        choices: [
          { label: 'Move sessions to a shared Redis store so servers are stateless.', ok: true, adds: 'Redis session store (stateless servers)', why: 'Sessions lived in each server\'s memory; the next request landed on another server. Now any server can serve anyone.', next: '"Why not sticky sessions?" — uneven load and sessions lost when a server dies.' },
          { label: 'Enable sticky sessions on the load balancer.', why: 'It hides the problem: load becomes uneven and users are still logged out when their server dies or is redeployed.' },
        ],
      },
      {
        prompt: 'Failure 3: photos still live on one server\'s disk. If it dies, they are gone.',
        choices: [
          { label: 'Store photos in object storage (uploaded with presigned URLs); keep metadata in PostgreSQL.', ok: true, adds: 'Object storage for photos + PostgreSQL for metadata', why: 'Object storage is durable and cheap; the database row keeps only the object key. Servers hold nothing.', next: 'Preferences and behaviour events could go to a document store.' },
          { label: 'Store the photos as BLOBs in PostgreSQL.', why: 'It bloats the database, slows backups and replication, and cannot be served efficiently through a CDN.' },
        ],
      },
      {
        prompt: 'Failure 4: heading toward a million users, the feed slows from 200 ms to 500 ms. The database is scanning photos.',
        choices: [
          { label: 'Add an index on photos(posted_by, upload_time).', ok: true, adds: 'Index (posted_by, upload_time)', why: 'The feed query filters by author and sorts by time; the composite index serves both directly.', next: '"Why not index every column?" — every index slows writes.' },
          { label: 'Add more app servers.', why: 'The time is spent in the database scanning rows; more app servers just send more slow queries.' },
        ],
      },
      {
        prompt: 'Failure 5: a celebrity posts; millions request the same photo and like count.',
        choices: [
          { label: 'Cache hot data in Redis (with TTLs/invalidation) and serve images through a CDN.', ok: true, adds: 'Redis cache for hot data + CDN for images', why: 'Repeated reads are served from memory; image bytes come from edges near users. Protect hot keys with local caches.', next: '"How do you keep cached captions fresh after an edit?"' },
          { label: 'Increase the database instance size.', why: 'It buys a little time, but millions of identical reads should never reach the database at all.' },
        ],
      },
      {
        prompt: 'Failure 6: the single database is a single point of failure and a read hotspot.',
        choices: [
          { label: 'Add two read replicas with automated failover, and keep point-in-time backups.', ok: true, adds: 'PostgreSQL primary + 2 replicas + backups', why: 'Reads spread over three copies; a replica is promoted if the primary dies; backups cover mistakes that replicas copy. Route users\' own recent reads to the primary.', next: '"A user can\'t see their new photo — why?" (replication lag)' },
          { label: 'Rely on nightly backups.', why: 'A failure would mean hours of downtime and up to a day of lost uploads.' },
        ],
      },
      {
        prompt: 'Failure 7: 50 million users and billions of photo rows outgrow one primary.',
        choices: [
          { label: 'Shard by user_id with consistent hashing — as late as possible.', ok: true, adds: 'Shards by user_id (consistent hashing)', why: 'A user\'s photos stay together, so profile and upload queries hit one shard; adding shards moves only a fraction of the data.', next: '"What becomes harder after sharding?" (cross-shard queries, feeds)' },
          { label: 'Shard by upload_time ranges.', why: 'All new uploads would land on the newest shard — a permanent hotspot.' },
        ],
      },
      {
        prompt: 'Last: the home feed is the most frequent and expensive query. How do you build it?',
        choices: [
          { label: 'Hybrid fan-out: push new photo IDs into followers\' feed lists, but merge celebrities\' posts at read time.', ok: true, adds: 'Hybrid feed fan-out (queue + workers)', why: 'Reads become a fast list lookup for most users, without writing 50 million entries whenever a celebrity posts.', done: 'Every component exists because a failure or requirement demanded it: load balancer, stateless servers with Redis sessions, object storage, PostgreSQL with indexes, cache and CDN, replicas and backups, shards, and a hybrid feed.' },
          { label: 'Fan-out on write for everyone, including celebrities.', why: 'A celebrity post would trigger tens of millions of writes at once.' },
          { label: 'Compute every feed at read time.', why: 'Every feed view would query hundreds of followees and merge — too slow at this scale.' },
        ],
      },
    ],
  },

  'video-streaming': {
    title: 'Video streaming platform builder',
    panel: 'Pipeline so far',
    intro: 'Creators upload thousands of hours of video a day; millions watch on phones, laptops and TVs worldwide. Build the path from upload to playback.',
    stages: [
      {
        prompt: 'How do creators upload multi-gigabyte files?',
        choices: [
          { label: 'Presigned multipart uploads directly to object storage.', ok: true, adds: 'Presigned multipart upload → object storage', why: 'Bytes bypass the API servers; parts upload in parallel and failed parts retry on their own, so uploads resume on flaky networks.', next: '"What triggers processing once the upload completes?"' },
          { label: 'Upload through the API servers into a database column.', why: 'Gigabytes per request would tie up API servers, and databases are the wrong place for large binary files.' },
        ],
      },
      {
        prompt: 'How do you process (transcode) each upload?',
        choices: [
          { label: 'Publish an event to a priority queue; autoscaled workers transcode chunks in parallel.', ok: true, adds: 'Queue (priority) + chunk-parallel transcoding workers', why: 'Transcoding is compute-intensive and slow; the queue absorbs bursts, workers scale on queue depth, and failed chunks are retried. Low resolutions first, so the video becomes playable sooner.', next: '"Why a priority queue?"' },
          { label: 'Transcode synchronously inside the upload request.', why: 'Transcoding a long video takes minutes to hours; the request would time out and block a server.' },
        ],
      },
      {
        prompt: 'What does processing produce?',
        choices: [
          { label: 'A bitrate ladder (240p–1080p, 4K where useful), each cut into 2–6 s segments with HLS/DASH manifests.', ok: true, adds: 'Bitrate ladder + segments + manifests', why: 'Several renditions let every network and screen get a suitable quality; segments let playback start fast and switch quality mid-stream.', next: '"How long should a segment be?"' },
          { label: 'One high-quality 1080p MP4 file.', why: 'Slow networks would stall constantly and phones would download far more than they can show. No adaptation is possible.' },
        ],
      },
      {
        prompt: 'How do segments reach millions of viewers (terabits per second)?',
        choices: [
          { label: 'CDN edges near viewers, an origin shield, and object storage as the origin.', ok: true, adds: 'CDN edges + origin shield', why: 'Popular segments are served from nearby caches; the shield collapses misses so the origin sends each segment once.', next: '"What happens when a brand-new episode goes viral?"' },
          { label: 'Serve segments from the API servers in one region.', why: 'No single region can push terabits per second worldwide, and distant viewers would buffer constantly.' },
        ],
      },
      {
        prompt: 'Which protocol do players use for on-demand playback?',
        choices: [
          { label: 'HLS or MPEG-DASH over ordinary HTTP.', ok: true, adds: 'HLS / MPEG-DASH over HTTP', why: 'They deliver segment files over plain HTTP, so every CDN can cache them, and they support adaptive bitrate.', next: '"Where is RTMP still used?" (ingest of live streams)' },
          { label: 'RTMP from the origin to every viewer.', why: 'RTMP is mainly used to ingest live streams from encoders; it does not use plain HTTP caching, so it does not scale to millions of viewers through CDNs.' },
        ],
      },
      {
        prompt: 'How does the player choose the quality of the next segment?',
        choices: [
          { label: 'Adaptive bitrate: pick the highest rendition the measured throughput and buffer level allow, per segment.', ok: true, adds: 'Adaptive bitrate in the player', why: 'Quality follows the network: down when it slows, up when it recovers — fewer stalls, faster start (begin low, step up).', next: '"What about screen size?" (a phone does not need 4K)' },
          { label: 'Always request the highest quality.', why: 'On a weak connection, each segment downloads slower than real time and playback stalls.' },
        ],
      },
      {
        prompt: 'A new episode is released and the CDN sees a surge of misses for its first segments.',
        choices: [
          { label: 'Pre-warm the CDN, rely on the origin shield and request collapsing.', ok: true, adds: 'Pre-warming + request collapsing', why: 'The origin serves each segment once per shield instead of once per edge per viewer.', done: 'Pipeline complete: presigned upload → object storage → priority queue → chunk-parallel transcoding into a bitrate ladder → segments + HLS/DASH manifests → origin shield → CDN edges → adaptive-bitrate players.' },
          { label: 'Add more transcoding workers.', why: 'Transcoding finished long ago; the bottleneck is delivery of cache misses, not processing.' },
        ],
      },
    ],
  },
};

export function mount(root, { options }) {
  const scenario = SCENARIOS[options.scenario] || SCENARIOS['url-shortener'];
  const prompt = el('p', { class: 'trouble-prompt', tabindex: -1 });
  const choices = el('div', { class: 'trouble-choices sd-choices', role: 'group', 'aria-label': 'Choose an option' });
  const panelList = el('ol', { class: 'sd-arch' });
  const followUp = el('p', { class: 'sd-followup' });
  const progress = el('p', { class: 'viz-note' });
  root.append(el('div', { class: 'viz-stage sd-decision' },
    el('div', {}, prompt, choices, progress),
    el('aside', { class: 'sd-arch-panel', 'aria-label': scenario.panel }, el('p', { class: 'tree-side-title' }, scenario.panel), panelList, followUp)));
  const stepper = createStepper(root, { render, playDelay: 2600, nextLabel: 'Show next decision' });

  let current = null;
  function start(picks = []) {
    const first = { stage: 0, picks: [], arch: [], kind: 'intro', next: null, text: scenario.intro };
    stepper.load(first, (frame, index) => advance(scenario, frame, picks[index]));
    for (let i = 0; i < picks.length; i += 1) stepper.next();
  }

  function render(frame) {
    current = frame;
    const done = frame.stage >= scenario.stages.length;
    prompt.textContent = done ? 'Scenario complete.' : scenario.stages[frame.stage].prompt;
    choices.replaceChildren(...(done ? [] : scenario.stages[frame.stage].choices.map((c, i) => el('button', {
      type: 'button', class: 'btn btn-secondary btn-sm trouble-choice', 'data-choice': i,
    }, c.label))));
    panelList.replaceChildren(...(frame.arch.length ? frame.arch.map((a) => el('li', {}, a)) : [el('li', { class: 'muted' }, 'Nothing yet.')]));
    followUp.textContent = frame.next ? `Likely follow-up: ${frame.next}` : '';
    followUp.hidden = !frame.next;
    progress.textContent = `Step ${Math.min(frame.stage + 1, scenario.stages.length)} of ${scenario.stages.length}${frame.kind === 'wrong' ? ' · that choice does not work — read why, then try another' : ''}`;
  }

  choices.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-choice]');
    if (!button || !current) return;
    const index = Number(button.dataset.choice);
    const keyboard = button === document.activeElement;
    start([...current.picks, index]);
    // The choices were re-rendered: keep keyboard users in place — on the same option
    // after a weak choice (to try another), on the new prompt after a sound one.
    if (keyboard) {
      const again = current.kind === 'wrong' ? choices.querySelector(`button[data-choice="${index}"]`) : null;
      (again || prompt).focus();
    }
  });

  start();
  return stepper;
}

/** Next frame: the given pick at the current stage, or the first sound choice when none is given. */
export function advance(scenario, frame, pick) {
  if (frame.stage >= scenario.stages.length) return null;
  const stage = scenario.stages[frame.stage];
  const index = pick ?? stage.choices.findIndex((c) => c.ok);
  const choice = stage.choices[index];
  const picks = [...frame.picks, index];
  if (choice.ok) {
    const last = frame.stage === scenario.stages.length - 1;
    return {
      stage: frame.stage + 1, picks, kind: 'ok',
      arch: [...frame.arch, choice.adds],
      next: last ? null : choice.next || null,
      text: `✓ ${choice.why}${last && choice.done ? ` ${choice.done}` : ''}`,
    };
  }
  return { stage: frame.stage, picks, arch: frame.arch, kind: 'wrong', next: null, text: `✗ ${choice.why}` };
}
