# Idempotency

**Module:** Reliability and Resilience · **Interview priority:** Core

## What Is It?

An operation is **idempotent** if performing it once or many times has the same effect. "Set the email to `a@x.com`" is idempotent; "add ₹500 to the balance" is not — doing it twice adds ₹1,000.

In distributed systems, idempotency is what makes **retries and duplicate messages safe**.

## Why It Exists

Networks fail ambiguously. When a request times out, the client cannot tell whether:

1. the request never arrived,
2. it arrived and is still running, or
3. it completed and only the **response** was lost.

The only way to recover is to retry — and if case 3 happened, a non-idempotent retry does the work twice: a double charge, a duplicate order, two shipments. Message queues add the same problem: most deliver **at least once**, so consumers will see some messages twice ([Delivery Semantics](../../messaging/delivery-semantics/content.md)).

## How It Works

### Naturally idempotent operations

- HTTP `GET`, `PUT` (replace with a full value), `DELETE` (deleting twice leaves it deleted) are idempotent by definition; `POST` is not.
- **Set** operations are idempotent; **increment/append** operations are not. Prefer "set status to SHIPPED" over "advance status".
- **Conditional writes** are idempotent: `UPDATE orders SET status = 'PAID' WHERE id = 77 AND status = 'PENDING'` — a second run changes nothing.

### Idempotency keys for non-idempotent actions

For actions like payments and orders, the client generates a unique **idempotency key** (a UUID) for each logical attempt and sends it with every retry:

```http
POST /payments
Idempotency-Key: 4f1c2a9e-7d3b-4c55-9a0e-21f5b3c8e6d1
Content-Type: application/json

{"orderId": 77, "amount": 49900}
```

The server stores `key → result`. A new key is processed; a repeated key returns the **stored result** without repeating the side effect.

```java
import java.util.HashMap;
import java.util.Map;

public class IdempotencyKeyDemo {

    record PaymentResult(String paymentId, long amountPaise) { }

    /** Remembers the result of each idempotency key, so a retried request gets the original result. */
    static final class PaymentService {
        private final Map<String, PaymentResult> resultsByKey = new HashMap<>();
        private int charges = 0;
        private int nextId = 1000;

        synchronized PaymentResult pay(String idempotencyKey, long amountPaise) {
            PaymentResult previous = resultsByKey.get(idempotencyKey);
            if (previous != null) {
                System.out.println("  key " + idempotencyKey + " seen before: returning stored result, no new charge");
                return previous;
            }
            charges++;                                        // the real side effect happens once per key
            PaymentResult result = new PaymentResult("pay-" + nextId++, amountPaise);
            resultsByKey.put(idempotencyKey, result);         // in a database: same transaction as the charge record
            System.out.println("  key " + idempotencyKey + " is new: charged " + amountPaise + " paise");
            return result;
        }

        int charges() {
            return charges;
        }
    }

    public static void main(String[] args) {
        PaymentService service = new PaymentService();

        System.out.println("First attempt (response lost on the way back):");
        service.pay("order-77-attempt", 49_900);

        System.out.println("Client retries with the SAME key:");
        PaymentResult retried = service.pay("order-77-attempt", 49_900);
        System.out.println("  client receives " + retried);

        System.out.println("A different order uses a new key:");
        service.pay("order-78-attempt", 12_000);

        System.out.println("Total charges made: " + service.charges());
    }
}
```

**Output:**

```text
First attempt (response lost on the way back):
  key order-77-attempt is new: charged 49900 paise
Client retries with the SAME key:
  key order-77-attempt seen before: returning stored result, no new charge
  client receives PaymentResult[paymentId=pay-1000, amountPaise=49900]
A different order uses a new key:
  key order-78-attempt is new: charged 12000 paise
Total charges made: 2
```

In production the key store is durable and shared by all instances:

- Insert the key with a **unique constraint** in the same database transaction as the business change, so "check" and "record" are atomic — two concurrent retries cannot both pass the check.
- Store the response (status code and body) to replay it exactly.
- Handle a retry that arrives **while the first attempt is still running** (status `IN_PROGRESS` → return 409 or wait).
- Reject a reused key with a **different** request body (a client bug).
- Expire keys after a retention window (for example 24 hours to a few days).

### Idempotent consumers

A message consumer records the IDs of processed messages (or uses the business key, such as the order ID, with a unique constraint) and skips duplicates — ideally in the same transaction as its own writes:

```text
BEGIN;
  INSERT INTO processed_messages(message_id) VALUES ('evt-881');   -- fails if already processed
  UPDATE inventory SET reserved = reserved + 1 WHERE sku = 'X';
COMMIT;
```

**Think about it:** "reserve 1 unit of SKU X" is not idempotent. How can you make the reservation idempotent without a separate processed-messages table?

<details>
<summary>Answer</summary>

Model the reservation as a record keyed by the business identity — `reservations(order_id, sku)` with a unique constraint — instead of an increment. Inserting the same reservation twice fails or is ignored; reserved quantity is derived from (or updated together with) the reservation rows.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** generating the idempotency key on the server, or a new key per retry. The key must identify the **logical operation** and be created by the client before the first attempt, then reused for every retry.

## Interview Follow-up

- *"How do you avoid double charges when clients retry payments?"* Client-generated idempotency keys stored with a unique constraint atomically with the payment record; replay the stored result for repeated keys; the payment provider call itself also carries an idempotency key.

## Key Takeaways

- Idempotent = same effect whether done once or many times; it makes retries and duplicate messages safe.
- Timeouts are ambiguous: the operation may have succeeded, so retries require idempotency.
- Prefer set/conditional operations; use client-generated idempotency keys for payments and orders, stored atomically with the change.
- Consumers deduplicate by message ID or business key.
