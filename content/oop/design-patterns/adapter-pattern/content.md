# Adapter

**Category:** Structural · **Interview priority:** Core

## Intent

Convert the interface of an existing class into **another interface that clients expect**, so classes with incompatible interfaces can work together. Also known as a **Wrapper**.

## The Problem

Your notification module depends on your own interface:

```java
interface SmsSender {
    boolean send(String phoneNumber, String message);
}
```

The company signs up with a new SMS vendor whose SDK class has a completely different API — different method name, a request object, country code as a separate field, and a status code instead of a boolean. You **cannot change** the vendor's class, and you do not want vendor types spreading through your code.

## Why the Naive Solution Fails

- **Change every caller** to use the vendor API directly: vendor types leak everywhere; switching vendors later means rewriting all callers.
- **Edit the vendor's class:** impossible (it is a library), and you would lose upgrades.
- **Copy conversion code** into each caller: duplicated, inconsistent error handling.

## The Pattern Idea

Write a small class — the **adapter** — that **implements the interface your code expects** (the *target*) and **translates** each call into calls on the existing class (the *adaptee*). Callers keep using the target; only the adapter knows the vendor.

## Structure

```text
 Client ──uses──▶ «interface» SmsSender (Target)
                          ▲
                          ┆ implements
                  VendorSmsAdapter (Adapter) ──has-a──▶ AcmeSmsClient (Adaptee, third-party)
                  send(phone, msg):
                    build AcmeSmsRequest, call dispatch(...), map status code → boolean
```

| Participant | In the example |
|-------------|----------------|
| Target | `SmsSender` — what the client expects |
| Adaptee | `AcmeSmsClient` — existing, incompatible class |
| Adapter | `AcmeSmsAdapter` — implements target, delegates to adaptee |
| Client | `OtpService` |

## Java Implementation

```java
public class AdapterDemo {

    // ---------- Target: your application's interface ----------
    interface SmsSender {
        boolean send(String phoneNumber, String message);
    }

    // ---------- Adaptee: third-party SDK you cannot modify ----------
    static class AcmeSmsRequest {
        final String countryCode;
        final String nationalNumber;
        final String text;

        AcmeSmsRequest(String countryCode, String nationalNumber, String text) {
            this.countryCode = countryCode;
            this.nationalNumber = nationalNumber;
            this.text = text;
        }
    }

    static class AcmeSmsClient {
        int dispatch(AcmeSmsRequest request) {               // returns 202 when accepted
            System.out.println("[Acme] to +" + request.countryCode + " " + request.nationalNumber
                    + ": " + request.text);
            return request.text.length() <= 160 ? 202 : 413;
        }
    }

    // ---------- Adapter: translates target calls to adaptee calls ----------
    static class AcmeSmsAdapter implements SmsSender {
        private final AcmeSmsClient client;                  // object adapter: composition

        AcmeSmsAdapter(AcmeSmsClient client) {
            this.client = client;
        }

        @Override
        public boolean send(String phoneNumber, String message) {
            String digits = phoneNumber.replaceAll("[^0-9]", "");      // "+91 98765-43210" → "919876543210"
            String countryCode = digits.substring(0, digits.length() - 10);
            String national = digits.substring(digits.length() - 10);
            int status = client.dispatch(new AcmeSmsRequest(countryCode, national, message));
            return status == 202;                                      // map vendor status to our contract
        }
    }

    // ---------- Client: knows only SmsSender ----------
    static class OtpService {
        private final SmsSender sms;

        OtpService(SmsSender sms) {
            this.sms = sms;
        }

        String sendOtp(String phone) {
            return sms.send(phone, "Your OTP is 731904") ? "OTP sent" : "OTP failed";
        }
    }

    public static void main(String[] args) {
        OtpService otp = new OtpService(new AcmeSmsAdapter(new AcmeSmsClient()));
        System.out.println(otp.sendOtp("+91 98765-43210"));
    }
}
```

**Output:**

```text
[Acme] to +91 9876543210: Your OTP is 731904
OTP sent
```

Switching vendors means writing another adapter; `OtpService` and every other caller stay unchanged.

### Object adapter vs class adapter

| | Object adapter (composition) | Class adapter (inheritance) |
|--|------------------------------|-----------------------------|
| How | Adapter **holds** an adaptee and implements the target | Adapter **extends** the adaptee and implements the target |
| Works with | Any adaptee, including subclasses and final classes | Only a non-final adaptee class; one adaptee only |
| Exposes adaptee's methods | No | Yes (inherited public methods leak) |
| Preferred in Java | **Yes** | Rarely |

## Execution Flow

1. `OtpService` calls `sms.send(phone, text)` on what it sees as an `SmsSender`.
2. The adapter parses the phone number, builds the vendor's request object and calls `dispatch`.
3. It converts the vendor's status code into the boolean the target contract promises and returns it.

## Real-World Examples

- `java.io.InputStreamReader` adapts a byte stream (`InputStream`) to a character stream (`Reader`); `OutputStreamWriter` does the reverse.
- `java.util.Arrays.asList(array)` adapts an array to the `List` interface (a fixed-size view).
- `Collections.enumeration(collection)` adapts a collection to the legacy `Enumeration` interface.
- Spring MVC's `HandlerAdapter` lets the dispatcher call different kinds of handlers through one interface.
- Payment, SMS and email integrations wrapped behind your own interfaces (the "anti-corruption layer" idea).

## When to Use

- You want to use an existing class (library, legacy code, vendor SDK) whose interface does not match the one your code needs.
- You want to **isolate** third-party APIs so they can be replaced and so your domain does not depend on them.
- Several existing classes with different interfaces must be used through one common interface.

## When Not to Use

- You control both sides and can simply change one interface to match.
- The adaptation is so complex that it is really a new subsystem (consider a **Facade** or a dedicated integration service).
- The interfaces already match — an adapter would be a pointless pass-through.

## Advantages

- Reuses existing code without modifying it.
- Keeps vendor/legacy details in one class (SRP); clients depend on your abstraction (DIP).
- Makes integrations replaceable and testable (fake `SmsSender` in tests).

## Disadvantages

- An extra layer of indirection and another class per adaptee.
- Some features may not map cleanly; the adapter may have to approximate or reject them.
- Long chains of adapters make debugging harder.

## Related Patterns

- **Facade** defines a **new, simpler** interface over a whole subsystem; **Adapter** makes one existing interface match an **existing expected** interface.
- **Decorator** keeps the **same** interface and adds behaviour; Adapter **changes** the interface.
- **Proxy** keeps the same interface and controls access.
- **Bridge** is designed up front to let abstraction and implementation vary; Adapter is usually applied afterwards to make existing things fit.

## SOLID Connection

- **DIP:** business code depends on its own `SmsSender` abstraction; the adapter (a detail) depends on both.
- **SRP:** translation logic lives in one class.
- **OCP:** new vendors are new adapters, not edits to clients.
- **ISP:** the target can be a narrow interface tailored to your needs, even if the vendor API is huge.

## Common Mistakes

- Letting vendor types (request/response classes, vendor exceptions) appear in the target interface — the abstraction then leaks.
- Putting business logic in the adapter; it should only translate.
- Using class adapters (inheritance) and accidentally exposing the adaptee's whole API.
- Forgetting to translate errors (vendor exceptions → your domain exceptions).

## Key Takeaways

- Adapter = implement the interface clients expect by delegating to an incompatible existing class.
- Prefer object adapters (composition).
- Ideal for wrapping third-party SDKs and legacy code behind your own interfaces.
- Adapter changes an interface; Decorator and Proxy keep it; Facade simplifies a subsystem.
