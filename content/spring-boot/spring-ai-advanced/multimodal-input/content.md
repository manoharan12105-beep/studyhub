# Multimodal Input: Images and Files in Prompts

**Module:** Spring AI: Advanced · **Interview priority:** Sometimes asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Send images (and other media) to a model together with text using `Media`.
- Validate uploads before they reach the model.
- Combine multimodal input with structured output.
- Know the provider-dependent limits: supported types, size, cost and privacy.

## Definition

**Multimodal input** means a prompt contains more than text — typically images, sometimes PDFs or audio — for models that accept them ("vision" or multimodal models). In Spring AI a `UserMessage` carries a list of `Media` objects (MIME type + data as bytes, a `Resource` or a URL). `ChatClient` adds them with `.user(u -> u.text(...).media(mimeType, resource))`.

**Framework vs provider:** Spring AI transports the media in a portable way; whether a model accepts a type, how large it may be, how it is billed and how well it understands it are provider- and model-specific.

## Why It Matters

Many real inputs are not text: screenshots of errors, photos of receipts, whiteboard diagrams, scanned forms. Multimodal models can describe, classify and extract data from them, turning manual data entry and triage into an API call. They also bring new risks: large uploads, personal data in photos, and instructions hidden in images.

## How It Works

```text
upload ─▶ validate (type, size, real image) ─▶ UserMessage(text + Media) ─▶ multimodal model
                                                          └─ provider encodes the media (for example base64 or URL)
```

| Option | Use when |
|--------|----------|
| `media(MimeType, Resource)` | Bytes you hold (uploads, files) |
| `media(MimeType, URL)` | Public URLs the provider can fetch — only if the provider supports URLs and the content may leave your network |
| `Media.builder().mimeType(..).data(..).name(..).build()` | Full control, several media items |

Images consume input tokens (provider-specific formulas, usually growing with resolution). Resize large photos before sending; most tasks do not need full resolution.

## Example

A learner uploads a class diagram; the service validates the file, sends it with instructions and maps the answer to a record:

```java
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Set;

import javax.imageio.ImageIO;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.content.Media;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.MimeType;
import org.springframework.util.MimeTypeUtils;

public class MultimodalDemo {

    record DiagramReview(String diagramType, List<String> issues) {
    }

    static final Set<MimeType> ALLOWED = Set.of(MimeTypeUtils.IMAGE_PNG, MimeTypeUtils.IMAGE_JPEG);
    static final int MAX_BYTES = 5 * 1024 * 1024;

    /** Validate uploads before they reach the model: type, size, and that the bytes really are an image. */
    static void validate(byte[] bytes, MimeType declared) throws Exception {
        if (!ALLOWED.contains(declared)) {
            throw new IllegalArgumentException("Unsupported type " + declared);
        }
        if (bytes.length > MAX_BYTES) {
            throw new IllegalArgumentException("Image too large: " + bytes.length + " bytes");
        }
        if (ImageIO.read(new java.io.ByteArrayInputStream(bytes)) == null) {
            throw new IllegalArgumentException("Not a readable image");
        }
    }

    public static void main(String[] args) throws Exception {
        // A tiny PNG standing in for a learner's uploaded class diagram
        var image = new BufferedImage(64, 32, BufferedImage.TYPE_INT_RGB);
        var out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        byte[] png = out.toByteArray();
        validate(png, MimeTypeUtils.IMAGE_PNG);

        ScriptedChatModel model = new ScriptedChatModel().reply("""
                {"diagramType": "UML class diagram", "issues": ["Order has no relationship to Customer"]}""");
        DiagramReview review = ChatClient.create(model).prompt()
                .user(u -> u.text("Review this class diagram for a Java course. List design issues.")
                        .media(MimeTypeUtils.IMAGE_PNG, new ByteArrayResource(png)))
                .call()
                .entity(DiagramReview.class);

        var sent = model.lastPrompt().getUserMessage();
        for (Media media : sent.getMedia()) {
            System.out.println("media sent: " + media.getMimeType() + ", " + media.getDataAsByteArray().length + " bytes");
        }
        System.out.println("review: " + review);

        try {
            validate("not an image".getBytes(), MimeTypeUtils.IMAGE_PNG);
        }
        catch (IllegalArgumentException e) {
            System.out.println("rejected upload: " + e.getMessage());
        }
    }
}
```

**Output:**

```text
media sent: image/png, 85 bytes
review: DiagramReview[diagramType=UML class diagram, issues=[Order has no relationship to Customer]]
rejected upload: Not a readable image
```

The review is a scripted reply; what reached the model (text plus one `image/png` media item) and the validation are real.

### Code walkthrough

- `validate` checks the declared type against an allow-list, enforces a size limit and confirms the bytes decode as an image — never trust the browser's `Content-Type`.
- `.media(MimeTypeUtils.IMAGE_PNG, new ByteArrayResource(png))` attached the image to the user message; the model received text and image together.
- `entity(DiagramReview.class)` works exactly as with text-only prompts: format instructions are added and the reply is parsed ([Structured Output](../../spring-ai-chat-client/spring-ai-structured-output/content.md)).
- With a real provider, choose a model that supports image input; sending media to a text-only model fails or is ignored, depending on the provider.

### From a multipart upload

```java
// Illustrative fragment
@PostMapping(value = "/api/diagram-review", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
DiagramReview review(@RequestParam MultipartFile file) throws Exception {
    MimeType type = MimeType.valueOf(file.getContentType());
    byte[] bytes = file.getBytes();
    validate(bytes, type);
    return reviewClient.prompt()
            .user(u -> u.text("Review this class diagram. List design issues.")
                    .media(type, new ByteArrayResource(bytes)))
            .call().entity(DiagramReview.class);
}
```

Set `spring.servlet.multipart.max-file-size` as an outer limit ([File Upload](../../production/file-upload-multipart/content.md)).

## Common Mistakes and Troubleshooting

- **Text-only model.** Check the model's capabilities; vision is a per-model feature.
- **Huge photos.** 12-megapixel images cost many tokens and add latency; downscale first.
- **Trusting the declared MIME type.** Decode or sniff the content.
- **Ignoring text inside images.** A screenshot can contain "ignore your instructions…" — image text is untrusted input like any document ([Prompt Injection](../../spring-ai-prompts-and-memory/prompt-injection-and-untrusted-input/content.md)).
- **URL media for private files.** The provider must fetch the URL, so it must be reachable — and the content leaves your control.

## Production Considerations

- Personal data in images (faces, ID cards, addresses): decide what may be sent to the provider; strip EXIF metadata such as GPS.
- Store uploads only as long as needed; don't keep them in chat memory unless required.
- Evaluate extraction accuracy on real samples (lighting, handwriting, rotation) before automating decisions.
- For documents, compare multimodal extraction with text extraction (PDF readers) — text is cheaper when it exists.

## Common Interview Traps

- **"Every model can read images."** Only multimodal models; check per model.
- **"Images are free context."** They are billed as input tokens, often heavily.
- **"OCR output is reliable."** Accuracy varies; validate extracted fields like any model output.

## Key Takeaways

- `UserMessage` + `Media` (MIME type + data); in `ChatClient`, `.user(u -> u.text(..).media(..))`.
- Validate type, size and content before sending; downscale large images.
- Multimodal works with structured output and the rest of the ChatClient features.
- Capabilities, limits and pricing are provider- and model-specific.

## Official References

- [Multimodality API](https://docs.spring.io/spring-ai/reference/api/multimodality.html)
- [ChatClient](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- Related: [Image and Audio Models](../image-and-audio-models/content.md) · [Structured Output](../../spring-ai-chat-client/spring-ai-structured-output/content.md) · [AI Application Security](../../spring-ai-production/ai-application-security/content.md)
