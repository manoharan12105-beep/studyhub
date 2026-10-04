# File Upload and Multipart Requests — Interview Questions

## Beginner

### Q1. How do you upload a file in Spring Boot?

<details>
<summary>Answer</summary>

Accept a `multipart/form-data` request with a `MultipartFile` parameter: `@PostMapping(consumes = MULTIPART_FORM_DATA_VALUE) upload(@RequestParam("file") MultipartFile file)`. Use `getInputStream()`/`transferTo()` to store it, and `@RequestPart` to receive additional JSON parts alongside the file.

</details>

### Q2. How do you limit upload sizes?

<details>
<summary>Answer</summary>

With `spring.servlet.multipart.max-file-size` (default 1 MB) and `spring.servlet.multipart.max-request-size` (default 10 MB), plus per-endpoint checks. Exceeding them throws `MaxUploadSizeExceededException`, which should be mapped to 413.

</details>

## Intermediate

### Q3. Why must you not trust `getOriginalFilename()` and `getContentType()`?

<details>
<summary>Answer</summary>

Both come from the client. A filename like `../../config/app.yml` can cause path traversal if used to build a path, and the content type can claim `image/png` for an HTML or executable file. Generate your own storage names and validate actual content (magic bytes or a detection library).

</details>

### Q4. Where would you store product images, and why?

<details>
<summary>Answer</summary>

In object storage (S3/GCS/Azure Blob) under generated keys, with metadata (key, product id, size, type, alt text) in the database, and serve them through a CDN or signed URLs. It scales across instances, keeps the database small, and offloads bandwidth. Generate thumbnails asynchronously.

</details>

## Advanced

### Q5. How would you handle very large uploads (e.g. 2 GB videos)?

<details>
<summary>Answer</summary>

Avoid streaming them through the API: issue a pre-signed upload URL (or multipart-upload credentials) so the client uploads directly to object storage, then the client notifies the API (or a storage event triggers processing). If they must pass through the server, stream with `getInputStream()` without buffering in memory, raise limits only for that endpoint, and use resumable/chunked uploads.

</details>

### Q6. What security checks would you apply to uploaded documents in a KYC flow?

<details>
<summary>Answer</summary>

Authentication and ownership checks, size limits, content-based type detection (PDF/JPEG only), generated filenames, storage in a private bucket with encryption at rest, malware scanning before use, metadata stripping, access via short-lived signed URLs, audit logging of access, and retention/deletion policies for personal data.

</details>
