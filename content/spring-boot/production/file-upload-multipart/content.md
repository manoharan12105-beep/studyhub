# File Upload and Multipart Requests

**Module:** Production Spring Boot · **Interview priority:** Frequently asked

## Definition

**File upload** sends binary files from a client to the server. Browsers and HTTP clients use **`multipart/form-data`**: one request body split into **parts**, each with its own headers (name, filename, content type). Spring MVC exposes uploaded files as **`MultipartFile`** parameters, bound with **`@RequestParam`** or **`@RequestPart`**.

## Why It Matters

- Product images, documents (KYC, invoices) and imports are common features — and common security holes (path traversal, malicious files, huge uploads).
- "How would you handle product images?" is a typical project question.

## Multipart Requests

```http
POST /api/products/42/images HTTP/1.1
Content-Type: multipart/form-data; boundary=----X

------X
Content-Disposition: form-data; name="file"; filename="keyboard.png"
Content-Type: image/png

<binary bytes>
------X
Content-Disposition: form-data; name="meta"
Content-Type: application/json

{"alt":"Black mechanical keyboard","primary":true}
------X--
```

Spring Boot auto-configures multipart handling (servlet container parsing). Limits:

```properties
spring.servlet.multipart.max-file-size=5MB          # default 1MB per file
spring.servlet.multipart.max-request-size=20MB      # default 10MB per request
spring.servlet.multipart.file-size-threshold=1MB    # larger parts are written to temp files
```

Exceeding them raises `MaxUploadSizeExceededException` → map to **413 Content Too Large**.

## File Upload

```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;

import java.io.IOException;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

public class FileUploadDemo {

    @RestController
    static class ProductImageController {
        private static final Set<String> ALLOWED = Set.of("image/png", "image/jpeg", "image/webp");
        private static final long MAX_BYTES = 5 * 1024 * 1024;

        @PostMapping("/api/products/{id}/images")
        ResponseEntity<String> upload(@PathVariable long id, @RequestParam("file") MultipartFile file)
                throws IOException {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("empty file");
            }
            if (file.getSize() > MAX_BYTES) {
                return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE).body("too large");   // Spring 6: PAYLOAD_TOO_LARGE
            }
            byte[] bytes = file.getBytes();
            if (!ALLOWED.contains(file.getContentType()) || !looksLikePng(bytes) && !looksLikeJpeg(bytes)) {
                return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body("only PNG/JPEG images");
            }
            // never trust file.getOriginalFilename() for paths: generate your own key
            String key = "products/" + id + "/" + java.util.UUID.nameUUIDFromBytes(bytes) + ".img";
            return ResponseEntity.status(HttpStatus.CREATED).body("stored as " + key.substring(0, 12) + "...");
        }

        private static boolean looksLikePng(byte[] b) {          // magic number check, not just the header
            return b.length > 4 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
        }

        private static boolean looksLikeJpeg(byte[] b) {
            return b.length > 2 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8;
        }
    }

    public static void main(String[] args) throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new ProductImageController()).build();
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 13, 10, 26, 10};
        byte[] script = "<script>alert(1)</script>".getBytes();

        upload(mvc, "real PNG          ", new MockMultipartFile("file", "keyboard.png", "image/png", png));
        upload(mvc, "HTML named .png   ", new MockMultipartFile("file", "evil.png", "image/png", script));
        upload(mvc, "PDF content type  ", new MockMultipartFile("file", "a.pdf", "application/pdf", png));
        upload(mvc, "empty file        ", new MockMultipartFile("file", "x.png", "image/png", new byte[0]));
    }

    static void upload(MockMvc mvc, String label, MockMultipartFile file) throws Exception {
        var response = mvc.perform(multipart("/api/products/42/images").file(file)).andReturn().getResponse();
        System.out.println(label + " -> " + response.getStatus() + " " + response.getContentAsString());
    }
}
```

**Output:**

```text
real PNG           -> 201 stored as products/42/...
HTML named .png    -> 415 only PNG/JPEG images
PDF content type   -> 415 only PNG/JPEG images
empty file         -> 400 empty file
```

The client-supplied `Content-Type` and filename are **untrusted** — the second upload claimed `image/png` but contained HTML; checking the file's magic bytes caught it.

## Storing Files

| Option | Pros | Cons |
|--------|------|------|
| **Object storage** (S3, GCS, Azure Blob, MinIO) + key/URL in the database | Scalable, cheap, CDN-friendly, works with many app instances | Another service; access control via signed URLs |
| Local disk / mounted volume | Simple | Not shared between instances; lost with ephemeral containers; backups |
| Database BLOB | Transactional with the row | Bloats the database, backups and memory; slow |

Recommended for product images: object storage, generated keys (`products/{id}/{uuid}.webp`), metadata row in the database, thumbnails generated asynchronously, served through a CDN. For large files, let clients upload **directly to object storage** with a **pre-signed URL** so the bytes never pass through your API.

### Downloading

```java
import java.nio.file.Path;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

class InvoiceDownload {
    ResponseEntity<Resource> download(Path stored, String displayName) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(displayName).build().toString())
                .body(new FileSystemResource(stored));               // streamed, not loaded into memory
    }
}
```

## Security Checklist

- Enforce size limits (multipart properties + per-endpoint checks).
- Validate type by **content** (magic bytes / a library such as Apache Tika), not just extension or `Content-Type`.
- **Never** use the original filename in a filesystem path (`../../etc/passwd` → path traversal); generate names.
- Store outside the web root; serve with `Content-Disposition: attachment` or a safe `Content-Type`, and `X-Content-Type-Options: nosniff`.
- Scan for malware where required (documents from users).
- Authorise both upload and download (object-level checks).
- Re-encode images to strip metadata (EXIF location) and neutralise malformed files.

## Common Mistakes

- Trusting `getOriginalFilename()` / `getContentType()`.
- Loading huge files fully into memory with `getBytes()` (stream large files instead: `getInputStream()`, `transferTo`).
- Storing images in the database by default.
- Forgetting to map `MaxUploadSizeExceededException` (the default response is unhelpful).
- `@RequestBody` with a file — files come as multipart parts, not JSON.

## Common Interview Traps

- **"The Content-Type header tells you the file type."** The client controls it.
- **"Multipart is only for files."** It can carry any parts, including JSON (`@RequestPart("meta") ImageMeta meta`).
- **"Uploads must go through the backend."** Pre-signed URLs let clients upload directly to storage.

## Key Takeaways

- `multipart/form-data` → `MultipartFile` via `@RequestParam`/`@RequestPart`; limits via `spring.servlet.multipart.*` (defaults 1 MB/10 MB).
- Validate size and real content type; generate storage keys; never use client filenames in paths.
- Store files in object storage, keep metadata in the database, serve via CDN/signed URLs.
