# File Upload and Multipart Requests — Practice

### P1. Default limit

**Difficulty:** Easy · **Type:** MCQ

With Spring Boot defaults, what happens when a user uploads a 3 MB image?

- A) It succeeds
- B) It fails because `max-file-size` defaults to 1 MB
- C) It fails because `max-request-size` defaults to 2 MB
- D) It succeeds but is truncated

<details>
<summary>Answer</summary>

**Answer:** B) It fails because `max-file-size` defaults to 1 MB

</details>

### P2. Path traversal

**Difficulty:** Medium · **Type:** Code analysis

```java
file.transferTo(Path.of("/data/uploads/" + file.getOriginalFilename()));
```

What is the risk and the fix?

<details>
<summary>Answer</summary>

A filename such as `../../app/config/application.yml` writes outside the upload directory (path traversal), and duplicate names overwrite each other. Generate a name (`UUID.randomUUID() + ".png"`), resolve it against the base directory, verify `resolved.normalize().startsWith(base)`, and keep the original name only as metadata.

</details>

### P3. JSON plus file

**Difficulty:** Medium · **Type:** Coding

Write a handler signature that accepts an image file and a JSON part `meta` with `alt` text in one request.

<details>
<summary>Answer</summary>

```java
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

record ImageMeta(String alt, boolean primary) {
}

@RestController
class ImageController {
    @PostMapping(path = "/api/products/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    String upload(@RequestPart("file") MultipartFile file, @RequestPart("meta") ImageMeta meta) {
        return meta.alt();
    }
}
```

The `meta` part must be sent with `Content-Type: application/json`.

</details>
