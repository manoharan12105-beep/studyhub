# Message Ordering, Partitions and Consumer Groups

**Module:** Messaging and Event-Driven Systems · **Interview priority:** Frequently asked

> [!NOTE]
> **Advanced topic.** Builds on [Message Queues](../message-queues/content.md) and [Queues vs Pub/Sub](../queues-vs-pub-sub/content.md). The model below is Kafka's; other brokers have similar ideas (SQS FIFO message groups, RabbitMQ single-active consumers).

## What Is It?

- **Ordering:** whether consumers see messages in the order they were produced.
- **Partition:** a topic is split into ordered, append-only **partitions**. Messages with the same **key** go to the same partition (`partition = hash(key) % partitions`), and order is guaranteed **within** a partition.
- **Consumer group:** a set of consumer instances that share a topic's work. Each partition is assigned to **exactly one** consumer in the group at a time; different groups read the same topic independently.

```text
Topic "orders" (3 partitions), key = order_id
 P0: [o7:created][o7:paid][o3:created] ...   ──► consumer A  ┐
 P1: [o2:created][o2:paid][o2:shipped] ...   ──► consumer B  ├ group "billing"
 P2: [o9:created][o5:created][o9:paid] ...   ──► consumer C  ┘
                                             ──► (all 3 partitions) group "analytics" reads independently
```

## Why It Exists

**Global ordering does not scale.** If every message must be processed in one total order, only one consumer can work at a time, and one slow message blocks all others. But most systems only need order **per entity**: an order's events (created → paid → shipped), a user's chat messages, an account's transactions. Partitioning by key gives per-key order with parallelism across keys.

## How It Works

### Choosing the message key

| Use case | Key | Ordering you get |
|----------|-----|------------------|
| Order lifecycle events | `order_id` | Each order's events in sequence |
| Bank transactions | `account_id` | Each account's transactions in sequence |
| Chat messages | `conversation_id` | Each conversation in sequence |
| Click analytics | None (round robin) | No ordering; maximum spread |

A key with a few very hot values (one celebrity, one huge tenant) creates a **hot partition** — the same problem as [hot shards](../../scaling-and-distribution/hot-partitions-and-resharding/content.md).

### Consumer groups and parallelism

- The number of partitions is the **maximum parallelism** of a group: with 6 partitions, a 7th consumer in the group sits idle.
- When consumers join or leave, the group **rebalances** partitions among members; processing pauses briefly.
- Each group tracks its own **offsets** (position per partition), so analytics can be days behind billing without affecting it, and a group can **replay** by resetting offsets.

### What breaks ordering

- **Retries that skip ahead:** processing message 5 while message 4 waits in a retry queue reorders them. For strictly ordered keys, retry in place (blocking that partition) or park the whole key's later messages.
- **Parallel processing inside a consumer:** a consumer that processes a partition's messages on a thread pool loses order unless it groups by key.
- **Changing the number of partitions:** `hash(key) % partitions` changes, so new messages for a key may go to a different partition than its older ones.
- **Producer retries without idempotence:** a resent batch can land after later messages (Kafka's idempotent producer prevents this).

**Think about it:** a topic has 4 partitions and a consumer group of 4 consumers is falling behind. You add 4 more consumers. What happens?

<details>
<summary>Answer</summary>

Nothing improves: each partition can be consumed by only one member of the group, so 4 consumers stay idle. Increase the partition count (planning for the key-to-partition remapping) and then scale consumers, or make each consumer faster (batching, async I/O while preserving per-key order).

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "Kafka guarantees message order." It guarantees order within a partition. Messages with different keys in different partitions have no defined order relative to each other.

## Interview Follow-up

- *"How do you guarantee that 'paid' is processed after 'created' for an order, at scale?"* Use the order ID as the message key so both go to the same partition, consume each partition with one consumer at a time, and avoid out-of-order retries; make handlers idempotent.

## Key Takeaways

- Order is guaranteed within a partition; the message key decides the partition.
- Choose keys so events that must stay ordered share a key, while load still spreads.
- A consumer group shares partitions: one consumer per partition; partitions cap parallelism.
- Retries, internal parallelism and repartitioning can break ordering.
