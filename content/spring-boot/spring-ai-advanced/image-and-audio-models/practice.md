# Image, Transcription and Speech Models — Practice

### P1. Which interface?

**Difficulty:** Easy · **Type:** MCQ

You need to turn a lecture recording into text. Which interface do you inject?

- A) `ImageModel`
- B) `TranscriptionModel`
- C) `TextToSpeechModel`
- D) `EmbeddingModel`

<details>
<summary>Answer</summary>

**Answer:** B) `TranscriptionModel`

</details>

### P2. Stand-in

**Difficulty:** Easy · **Type:** Coding

Write a `TranscriptionModel` lambda for tests that always returns "Explain HashMap".

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
TranscriptionModel stub = prompt -> new AudioTranscriptionResponse(new AudioTranscription("Explain HashMap"));
```

`TranscriptionModel` has one abstract method, `call(AudioTranscriptionPrompt)`, so a lambda works; `TextToSpeechModel` also requires `stream(...)`, so it needs a small class.

</details>

### P3. Generate an image

**Difficulty:** Medium · **Type:** Coding

Generate one 1024 × 1024 image for "a diagram of a binary search tree" and return its URL.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
ImageResponse response = imageModel.call(new ImagePrompt("A diagram of a binary search tree",
        ImageOptionsBuilder.builder().n(1).width(1024).height(1024).build()));
String url = response.getResult().getOutput().getUrl();
```

Some providers return base64 instead (`getB64Json()`), depending on the response format option.

</details>

### P4. Broken images

**Difficulty:** Medium · **Type:** Debugging

Flashcards generated last month now show broken images. The database stores the URL returned by the image model. Why, and how do you fix it?

<details>
<summary>Answer</summary>

Generated-image URLs are often temporary. Download the image right after generation (or request base64), store it in your own object storage, and save your own URL plus the prompt and model.

</details>

### P5. Voice privacy

**Difficulty:** Hard · **Type:** Scenario

A voice tutor stores every recording and transcript forever "for quality". What would you change?

<details>
<summary>Answer</summary>

Ask for consent, store recordings only as long as needed (often not at all after transcription), keep transcripts with a defined retention, exclude them from logs, allow deletion, review the provider's audio retention terms, and use sampled, consented data for quality evaluation instead of keeping everything.

</details>
