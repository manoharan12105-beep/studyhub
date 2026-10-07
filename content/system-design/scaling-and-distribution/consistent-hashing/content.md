# Consistent Hashing

**Module:** Scaling and Distribution · **Interview priority:** Core

## What Is It?

**Consistent hashing** assigns keys to nodes so that when a node is **added or removed, only a small share of keys move** — about `1/N` of them — instead of almost all of them.

Both nodes and keys are hashed onto the same circular number space, the **hash ring** (for example 0 to 2³² − 1, wrapping around). Each key belongs to the **first node found clockwise** from the key's position.

```text
                 0 / 2³²
            node A ●
                 ╱     ╲         key k1 → walk clockwise → node B
      node D ●           ● node B
                 ╲     ╱         key k2 → walk clockwise → node C
            node C ●
```

## Why It Exists

The naive rule `node = hash(key) % N` spreads keys evenly, but changing N changes the remainder for most keys. Going from 4 to 5 cache nodes remaps about 80 % of keys: the cache is effectively emptied and the database is flooded; in a sharded database, most data must be copied. Consistent hashing keeps nearly every key where it was.

## How It Works

### Adding and removing nodes

- **Add a node E** between D and A: E takes over only the keys between D and E that used to belong to A. Every other key stays put.
- **Remove node B:** only B's keys move — to the next node clockwise, C.

So adding the 4th node moves about 1/4 of the keys, all of them to the new node.

### Virtual nodes

With one point per node, nodes own arcs of random lengths — one node might get 50 % of the keys — and when a node leaves, its whole load lands on one neighbour. The fix is **virtual nodes**: place each physical node at many points on the ring (A#0, A#1, … A#99). Each node then owns many small arcs, so:

- load is spread evenly (more points → smaller variance),
- a departing node's keys are shared among **many** remaining nodes,
- bigger machines can get more virtual nodes (weighting).

### A hash ring in Java

```java
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;

public class ConsistentHashingDemo {

    /** A hash ring: each node is placed at many points (virtual nodes) to even out its share. */
    static final class HashRing {
        private final TreeMap<Long, String> ring = new TreeMap<>();
        private final int virtualNodes;

        HashRing(int virtualNodes) {
            this.virtualNodes = virtualNodes;
        }

        void addNode(String node) {
            for (int i = 0; i < virtualNodes; i++) {
                ring.put(hash(node + "#" + i), node);
            }
        }

        void removeNode(String node) {
            for (int i = 0; i < virtualNodes; i++) {
                ring.remove(hash(node + "#" + i));
            }
        }

        /** The owner is the first node clockwise from the key's position (wrapping around). */
        String nodeFor(String key) {
            SortedMap<Long, String> tail = ring.tailMap(hash(key));
            return tail.isEmpty() ? ring.firstEntry().getValue() : tail.get(tail.firstKey());
        }
    }

    /** Ring position: the first 4 bytes of the key's MD5 digest, as an unsigned 32-bit number. */
    static long hash(String s) {
        try {
            byte[] d = MessageDigest.getInstance("MD5").digest(s.getBytes(StandardCharsets.UTF_8));
            return ((d[0] & 0xFFL) << 24) | ((d[1] & 0xFFL) << 16) | ((d[2] & 0xFFL) << 8) | (d[3] & 0xFFL);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public static void main(String[] args) {
        int keys = 10_000;
        HashRing ring = new HashRing(100);
        for (String n : List.of("A", "B", "C")) {
            ring.addNode(n);
        }

        String[] before = new String[keys];
        Map<String, Integer> counts = new TreeMap<>();
        for (int k = 0; k < keys; k++) {
            before[k] = ring.nodeFor("user:" + k);
            counts.merge(before[k], 1, Integer::sum);
        }
        System.out.println("3 nodes:   " + counts);

        ring.addNode("D");
        int moved = 0;
        counts.clear();
        for (int k = 0; k < keys; k++) {
            String now = ring.nodeFor("user:" + k);
            counts.merge(now, 1, Integer::sum);
            if (!now.equals(before[k])) {
                moved++;
            }
        }
        System.out.println("4 nodes:   " + counts);
        System.out.printf("Consistent hashing moved %.1f%% of keys%n", 100.0 * moved / keys);

        int movedModulo = 0;
        for (int k = 0; k < keys; k++) {
            long h = hash("user:" + k);
            if (h % 3 != h % 4) {
                movedModulo++;
            }
        }
        System.out.printf("hash %% N would move    %.1f%% of keys%n", 100.0 * movedModulo / keys);
    }
}
```

**Output:**

```text
3 nodes:   {A=3232, B=3370, C=3398}
4 nodes:   {A=2577, B=2466, C=2509, D=2448}
Consistent hashing moved 24.5% of keys
hash % N would move    73.9% of keys
```

A `TreeMap` keeps ring positions sorted, so finding the next node clockwise (`tailMap` + first key, wrapping to the first entry) costs O(log V) for V virtual nodes. With 100 virtual nodes each, the three nodes share keys almost evenly, and adding D moves about a quarter of the keys — all to D — while modulo hashing would move about three quarters.

### Where it is used

- Distributed caches (Memcached client libraries, many proxies) choose a cache node per key.
- Dynamo-style stores (Cassandra, Riak, DynamoDB's design ancestry) place data and replicas: a key's replicas are the next N distinct nodes clockwise.
- Load balancers use it for cache-friendly affinity ("requests for this key go to the same server").

A precise note: nodes own ranges of **hash values** on the ring, not ranges of raw IDs. User 1,000 and user 1,001 usually land far apart.

**Think about it:** without virtual nodes, node B leaves a 4-node ring. Where do B's keys go, and why is that a problem?

<details>
<summary>Answer</summary>

All of them go to the single next node clockwise (C), which suddenly carries its own load plus B's — possibly double — and may overload and fail, pushing even more load to the next node (a cascade). With virtual nodes, B's many small arcs are spread across all remaining nodes.

</details>

## Comparison

| | `hash % N` | Consistent hashing | Fixed logical partitions (hash slots) |
|---|------------|-------------------|----------------------------------------|
| Keys moved when adding a node | ~(N)/(N+1) of all keys | ~1/(N+1) | Only the partitions reassigned |
| Balance | Even | Even with virtual nodes | Even (partitions are small) |
| Lookup | O(1) | O(log V) | O(1) via slot table |
| Examples | Naive sharding | Memcached clients, Cassandra, Dynamo | Redis Cluster (16,384 slots), Kafka partitions |

## Common Traps

> [!WARNING]
> **Common trap:** "Consistent hashing gives each node a range of user IDs." It gives each node ranges of **hash values**; consecutive IDs are scattered across nodes.

## Interview Follow-up

- *"Why not modulo hashing for a cache cluster?"* Changing the node count remaps most keys, causing a mass cache miss; consistent hashing remaps only about 1/N.

## Key Takeaways

- Nodes and keys are hashed onto a ring; a key belongs to the next node clockwise.
- Adding or removing a node moves only about 1/N of the keys (to or from that node).
- Virtual nodes balance load and spread a failed node's keys across many nodes.
- Used by distributed caches, Dynamo-style databases and affinity load balancing.
