# Multimodal Input: Images and Files in Prompts — Interview Questions

## Beginner

### Q1. How do you send an image to a model with Spring AI?

**Style:** How

<details>
<summary>Answer</summary>

Attach it as `Media` to the user message: `chatClient.prompt().user(u -> u.text("Describe this").media(MimeTypeUtils.IMAGE_PNG, resource)).call().content()`. The provider module encodes it for the API. The model must support image input.

</details>

### Q2. Which parts of multimodal behaviour depend on the provider?

**Style:** Direct

<details>
<summary>Answer</summary>

Which media types are accepted, maximum sizes and counts, whether URLs are allowed, how images are billed in tokens, and the quality of understanding. Spring AI only provides the portable `Media` transport.

</details>

## Intermediate

### Q3. What do you validate before sending an uploaded image to a model?

**Style:** How

<details>
<summary>Answer</summary>

An allow-list of MIME types, a size limit (and pixel dimensions), that the bytes really decode as an image (don't trust `Content-Type`), and policy checks for personal data. Downscale large images and strip metadata such as GPS location.

</details>

### Q4. How can an image carry a prompt injection?

**Style:** Scenario

<details>
<summary>Answer</summary>

Text inside the image — a screenshot, a sign, a document photo — is read by the model like any input; it can say "ignore your instructions and…". Treat image content as untrusted: keep tools authorised and narrow, validate output, and never let extracted text trigger actions without checks.

</details>

## Advanced

### Q5. Design an expense-receipt extraction feature with a multimodal model.

**Style:** Design

<details>
<summary>Answer</summary>

Upload endpoint with type/size/content validation and EXIF stripping; resize; prompt with structured output to a `Receipt` record (merchant, date, currency, total, line items); validate fields (date range, currency code, sum of lines vs total); low-confidence or inconsistent results go to human review; store originals per retention policy; evaluation set of real receipts (blurry, rotated, foreign) measuring field accuracy; budget per user; consider text extraction first for digital PDFs because it is cheaper and more reliable.

</details>
