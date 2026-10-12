# Image, Transcription and Speech Models

**Module:** Spring AI: Advanced · **Interview priority:** Rarely asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Use Spring AI's `ImageModel`, `TranscriptionModel` and `TextToSpeechModel` abstractions.
- Build a feature that chains speech-to-text, chat and text-to-speech behind interfaces.
- Configure provider models with properties without hard-coding provider classes.
- Recognise the cost, latency, safety and storage concerns of generated media.

## Definition

Besides chat and embeddings, Spring AI defines portable model types for other modalities:

| Model | Input → output | Key types |
|-------|----------------|-----------|
| `ImageModel` | Text prompt → generated image (URL or base64) | `ImagePrompt`, `ImageOptionsBuilder`, `ImageResponse` → `Image.getUrl()` / `getB64Json()` |
| `TranscriptionModel` | Audio `Resource` → text | `transcribe(resource)`, `AudioTranscriptionPrompt` → `AudioTranscriptionResponse` |
| `TextToSpeechModel` | Text → audio bytes | `call(String)` → `byte[]`, `TextToSpeechPrompt`, `stream(...)` |
| `ModerationModel` | Text → category flags and scores | `ModerationPrompt` → `ModerationResponse` |

Providers implement these where they offer the capability; Spring Boot auto-configures them, selected with `spring.ai.model.image`, `spring.ai.model.audio.transcription` and `spring.ai.model.audio.speech`.

## Why It Matters

Voice interfaces (dictated questions, spoken answers), accessibility (reading answers aloud), meeting transcription and generated illustrations are common product requests. Coding against Spring AI interfaces keeps the feature testable offline and the provider replaceable — and keeps media-specific concerns (file sizes, formats, storage, content policy) in one place.

## How It Works

```text
recording.wav ─▶ TranscriptionModel.transcribe ─▶ "What is a Java record?"
              ─▶ ChatClient (tutor prompt, memory, RAG …) ─▶ answer text
              ─▶ TextToSpeechModel.call(answer) ─▶ audio bytes ─▶ browser
concept ─▶ ImageModel.call(ImagePrompt + ImageOptions) ─▶ image URL or base64
```

Configuration with the OpenAI module (2.0 property names; choose model names from the provider's current list):

```properties
spring.ai.model.image=openai
spring.ai.model.audio.transcription=openai
spring.ai.model.audio.speech=openai
spring.ai.openai.image.model=${AI_IMAGE_MODEL}
spring.ai.openai.image.size=1024x1024
spring.ai.openai.audio.transcription.model=${AI_TRANSCRIPTION_MODEL}
spring.ai.openai.audio.speech.model=${AI_SPEECH_MODEL}
spring.ai.openai.audio.speech.voice=${AI_SPEECH_VOICE}
```

## Example

A voice tutor depends only on the four interfaces; offline stand-ins replace the provider models so the flow is visible:

```java
import java.nio.charset.StandardCharsets;
import java.util.List;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.audio.transcription.AudioTranscription;
import org.springframework.ai.audio.transcription.AudioTranscriptionResponse;
import org.springframework.ai.audio.transcription.TranscriptionModel;
import org.springframework.ai.audio.tts.Speech;
import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import org.springframework.ai.audio.tts.TextToSpeechResponse;
import org.springframework.ai.audio.tts.TextToSpeechModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.image.Image;
import org.springframework.ai.image.ImageGeneration;
import org.springframework.ai.image.ImageModel;
import org.springframework.ai.image.ImageOptionsBuilder;
import org.springframework.ai.image.ImagePrompt;
import org.springframework.ai.image.ImageResponse;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import reactor.core.publisher.Flux;

public class VoiceTutorDemo {

    /** Speech in, speech out, plus a flashcard image — depends only on Spring AI interfaces. */
    static class VoiceTutor {
        private final TranscriptionModel transcription;
        private final ChatClient chat;
        private final TextToSpeechModel speech;
        private final ImageModel images;

        VoiceTutor(TranscriptionModel transcription, ChatClient chat, TextToSpeechModel speech, ImageModel images) {
            this.transcription = transcription;
            this.chat = chat;
            this.speech = speech;
            this.images = images;
        }

        byte[] answerAloud(Resource recording) {
            String question = transcription.transcribe(recording);
            System.out.println("transcribed: " + question);
            String answer = chat.prompt().user(question).call().content();
            System.out.println("answer:      " + answer);
            return speech.call(answer);
        }

        String flashcardImageUrl(String concept) {
            ImageResponse response = images.call(new ImagePrompt(
                    "A simple, labelled diagram explaining " + concept + " for a Java flashcard",
                    ImageOptionsBuilder.builder().n(1).width(1024).height(1024).build()));
            return response.getResult().getOutput().getUrl();
        }
    }

    // ---- offline stand-ins for provider models ---------------------------------------

    static class StubSpeech implements TextToSpeechModel {
        @Override
        public TextToSpeechResponse call(TextToSpeechPrompt prompt) {
            byte[] fakeAudio = ("AUDIO:" + prompt.getInstructions().getText()).getBytes(StandardCharsets.UTF_8);
            return new TextToSpeechResponse(List.of(new Speech(fakeAudio)));
        }

        @Override
        public Flux<TextToSpeechResponse> stream(TextToSpeechPrompt prompt) {
            return Flux.just(call(prompt));
        }
    }

    public static void main(String[] args) {
        TranscriptionModel stubTranscription = prompt ->
                new AudioTranscriptionResponse(new AudioTranscription("What is a Java record?"));
        ImageModel stubImages = prompt -> {
            System.out.println("image prompt: " + prompt.getInstructions().get(0).getText()
                    + " | size " + prompt.getOptions().getWidth() + "x" + prompt.getOptions().getHeight());
            return new ImageResponse(List.of(new ImageGeneration(new Image("https://images.example/record.png", null))));
        };
        ChatClient chat = ChatClient.create(new ScriptedChatModel()
                .reply("A record is a compact, immutable data carrier class."));

        VoiceTutor tutor = new VoiceTutor(stubTranscription, chat, new StubSpeech(), stubImages);
        byte[] audio = tutor.answerAloud(new ByteArrayResource(new byte[] {1, 2, 3}, "question.wav"));
        System.out.println("speech bytes: " + audio.length);
        System.out.println("image url:   " + tutor.flashcardImageUrl("Java records"));
    }
}
```

**Output:**

```text
transcribed: What is a Java record?
answer:      A record is a compact, immutable data carrier class.
speech bytes: 58
image prompt: A simple, labelled diagram explaining Java records for a Java flashcard | size 1024x1024
image url:   https://images.example/record.png
```

### Code walkthrough

- `VoiceTutor` never mentions a provider; with the properties above, Spring Boot injects the provider implementations instead of the stand-ins.
- `transcribe(resource)` and `call(String)` are convenience defaults on the interfaces; the full `*Prompt`/`*Response` types give access to options and metadata.
- The image call passes portable options (`n`, `width`, `height`); provider-specific options (quality, style) use the provider's options class.
- `image prompt` prints before `image url` because Java evaluates `tutor.flashcardImageUrl(...)` — where the stand-in prints — before `println` writes the finished line.
- The stand-in "audio" is 58 bytes of text; a real speech model returns encoded audio (for example MP3) for the browser to play.

## Common Mistakes and Troubleshooting

- **Uploading huge audio files.** Providers limit file size and duration; split long recordings and check formats (wav, mp3, m4a…).
- **Returning provider image URLs to users long-term.** Many generated-image URLs expire; download and store the image if you need it later.
- **Generating images from raw user text.** Apply content policies and moderation; generated images can violate them or include unwanted text.
- **Blocking request threads on long audio jobs.** Run transcription of long recordings asynchronously.
- **Assuming every provider supports every modality.** Check the provider's model support; switch implementations by configuration.

## Production Considerations

- Cost is per image, per audio minute or per character — different units from chat tokens; track them separately.
- Store generated media in object storage with retention rules; record the prompt and model for audit.
- Voice data is personal data; get consent, limit retention, and avoid logging transcripts verbatim.
- Stream text-to-speech audio for long answers (`stream(...)`) to start playback sooner where the provider supports it.

## Common Interview Traps

- **"ChatClient handles images and audio generation."** Chat models can *read* images; generation and speech use `ImageModel`, `TranscriptionModel` and `TextToSpeechModel`.
- **"Image URLs are permanent."** Often temporary; persist what you need.
- **"Transcription is exact."** Accents, noise and jargon cause errors; let users correct the transcribed question.

## Key Takeaways

- Portable interfaces: `ImageModel`, `TranscriptionModel`, `TextToSpeechModel`, `ModerationModel`.
- Select providers with `spring.ai.model.image` / `audio.transcription` / `audio.speech`; code against interfaces.
- Media has its own cost units, size limits, storage and privacy rules.
- Test flows offline with stand-in implementations.

## Official References

- [Image Model API](https://docs.spring.io/spring-ai/reference/api/imageclient.html)
- [Audio Models: Transcription and Text-to-Speech](https://docs.spring.io/spring-ai/reference/api/audio/transcriptions.html)
- Related: [Multimodal Input](../multimodal-input/content.md) · [Model Selection](../../spring-ai-production/model-selection-and-portability/content.md) · [Testing AI Services](../../spring-ai-production/testing-ai-services/content.md)
