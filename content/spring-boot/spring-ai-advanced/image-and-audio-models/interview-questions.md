# Image, Transcription and Speech Models — Interview Questions

## Beginner

### Q1. Which Spring AI interfaces cover image generation, speech-to-text and text-to-speech?

**Style:** Direct

<details>
<summary>Answer</summary>

`ImageModel` (text → image URL or base64), `TranscriptionModel` (audio → text) and `TextToSpeechModel` (text → audio bytes). `ModerationModel` classifies text against content categories.

</details>

### Q2. Can a `ChatClient` generate images?

**Style:** Scenario

<details>
<summary>Answer</summary>

No. Multimodal chat models can *read* images passed as `Media`; generating images uses an `ImageModel` (and audio uses the audio models).

</details>

## Intermediate

### Q3. How do you build a voice question-and-answer feature?

**Style:** Design

<details>
<summary>Answer</summary>

Upload/stream the recording → `TranscriptionModel.transcribe` → show the text to the user for correction → `ChatClient` with the usual prompt, memory, RAG and guardrails → `TextToSpeechModel` (streaming if available) → audio to the browser. Validate file size and format, run long transcriptions asynchronously, track per-minute and per-character costs, and treat recordings and transcripts as personal data.

</details>

### Q4. Why should you download generated images instead of storing the provider URL?

**Style:** Why

<details>
<summary>Answer</summary>

Provider URLs are often temporary and hosted outside your control; links break and you cannot enforce your retention or access rules. Store the image in your own storage with the prompt and model for audit.

</details>

## Advanced

### Q5. How would you keep a media-heavy AI feature testable and portable?

**Style:** Design

<details>
<summary>Answer</summary>

Depend only on Spring AI interfaces (`ImageModel`, `TranscriptionModel`, `TextToSpeechModel`, `ChatClient`) in services; select providers with `spring.ai.model.*` properties; keep provider-specific options in configuration or one adapter; write unit tests with stand-in implementations (lambdas or small classes); run integration tests against a stub HTTP server or a sandbox; evaluate transcription accuracy and image policy compliance on representative samples.

</details>
