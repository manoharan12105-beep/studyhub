# Object and Blob Storage

**Module:** Data and Storage · **Interview priority:** Core

## What Is It?

**Object storage** (also called **blob storage**) keeps files — images, videos, backups, logs, documents — as **objects** in a flat namespace of **buckets**. Each object has a **key** (`photos/2026/10/7f3a.jpg`), its bytes, and metadata (content type, size, custom tags). You read and write whole objects over HTTP APIs. Amazon S3, Google Cloud Storage and Azure Blob Storage are the common services; MinIO and Ceph are self-hosted options.

## Why It Exists

Large files do not belong in a database or on an application server's disk:

- **In the database** they bloat tables, slow backups and replication, and use the most expensive storage and I/O.
- **On a server's local disk** they disappear when the server dies and cannot be shared by other servers — a single point of failure and a stateful server.

Object storage is cheap per gigabyte, scales to practically unlimited size, is extremely durable, and serves files over HTTP, which makes it a natural CDN origin.

## How It Works

### Durability and availability

Managed object stores replicate each object across several devices and facilities. Amazon S3, for example, is designed for 99.999999999 % ("eleven nines") durability of objects per year and provides strong read-after-write consistency for new and overwritten objects. Losing a disk — the failure that took down the single-server photo app — no longer loses data.

### The upload pattern: presigned URLs

Routing uploads through application servers wastes their bandwidth and memory. Instead:

```text
1. Client  ──"I want to upload a 4 MB photo"──►  API server
2. API     checks auth, creates a photo record (status = PENDING),
           returns a presigned PUT URL valid for 10 minutes
3. Client  ──PUT bytes directly──►  object storage
4. Storage emits an "object created" event ──► queue ──► worker: validate, resize, thumbnails
5. Worker  marks the photo READY; clients load it through the CDN
```

A **presigned URL** embeds the operation, the object key, an expiry and a signature, so the client can upload (or download) one object without having storage credentials. Large files use **multipart upload**: parts upload in parallel and failed parts are retried individually.

### Downloads

Public content is served through a **CDN** with the bucket as origin. Private content uses presigned GET URLs or CDN signed URLs, issued after an authorisation check.

### Storage classes and lifecycle

| Class | Use | Trade-off |
|-------|-----|-----------|
| Standard / hot | Frequently read objects | Highest storage price, no retrieval fee |
| Infrequent access | Read occasionally (old photos) | Cheaper storage, per-GB retrieval fee |
| Archive / cold | Backups, compliance archives | Cheapest storage, retrieval takes minutes to hours |

**Lifecycle rules** move objects between classes by age or delete them ("move to infrequent access after 90 days, delete temporary uploads after 1 day").

### What object storage is not

- Not a file system: no in-place edits (you rewrite whole objects), no cheap renames, directory listing is a prefix scan.
- Not a database: no queries over contents; keep searchable metadata (owner, caption, upload time) in a database row that stores the object key.
- Latency per request is tens of milliseconds — fine for files, wrong for small, hot records.

**Think about it:** why store the object **key** rather than the full URL in the database?

<details>
<summary>Answer</summary>

The URL depends on things that change — the bucket name, the CDN domain, signing, the region. Storing the key lets the application build the right URL at read time (public CDN URL, or a presigned URL with an expiry), and makes migrations between buckets, CDNs or providers a configuration change instead of a data migration.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** making a bucket public "to make the CDN work" and exposing private files. Keep buckets private; let the CDN access them with its own identity and use signed URLs for private content.

## Interview Follow-up

- *"How do users upload large videos?"* Presigned multipart uploads directly to object storage, resumable and parallel, followed by an event that triggers asynchronous processing.

## Key Takeaways

- Object storage holds large files as objects (key + bytes + metadata) in buckets: cheap, scalable, highly durable, HTTP-accessible.
- Databases keep the metadata and the object key; servers stay stateless.
- Upload directly with presigned URLs (multipart for large files); serve through a CDN; process asynchronously on upload events.
- Use storage classes and lifecycle rules to control cost.
