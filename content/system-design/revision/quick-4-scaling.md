# Block 4: Scaling and Consistency

Block 4 of 6, about ten minutes.

## 1. Load Balancing (2 min)

- LB = reverse proxy: choose a healthy server; active + passive health checks with thresholds; drain before removal; run redundant LBs.
- L4 = connections by IP/port (fast, any protocol); L7 = requests by HTTP content (routing, TLS termination).
- Round robin (uniform) · weighted (proportional shares) · least connections (long-lived) · least response time · hashing (affinity) · geo.

## 2. Replication (3 min)

- One primary takes writes; replicas serve reads and fail over. Two replicas is a common standard.
- Lag → eventual consistency → route a user's own reads to the primary (read-your-writes); pin users to one replica (monotonic reads).
- Sync (no loss, slow, fragile) · async (fast, may lose on failover) · **semi-sync** (one replica confirms).
- Failover: detect → pick freshest → promote → redirect; prevent split brain with quorum + fencing.
- **Replication is not a backup.**
- Multi-leader / leaderless: local writes, no failover, but conflicts (LWW drops writes; merge, CRDTs). Quorum: **W + R > N**.

## 3. Partitioning (3 min)

- Shard when data or writes exceed one primary — last. Range (hotspots on hot ranges) · hash (scatters ranges) · directory (control).
- Good shard key: even load, frequent queries on one shard, stable. Cross-shard queries, joins, transactions and uniqueness get hard.
- Hot keys need splitting or caching — hashing doesn't fix one hot key.
- Consistent hashing: next node clockwise on a ring of **hash values**; adding a node moves ~1/N keys; virtual nodes balance load.
- Capacity: plan for peak at 60–70 % utilisation, survive a zone loss; Little's law; find the bottleneck with USE; load-test.

## 4. Consistency and Coordination (2 min)

- **CAP:** during a partition choose consistency (refuse) or availability (answer, maybe stale). CA = not distributed. PACELC adds latency vs consistency otherwise.
- Strong where stale reads cause wrong decisions; eventual + session guarantees elsewhere.
- Locks are leases; protect resources with fencing tokens; use consensus systems; prefer idempotency.
- Across services: sagas with compensations + transactional outbox, not 2PC.
