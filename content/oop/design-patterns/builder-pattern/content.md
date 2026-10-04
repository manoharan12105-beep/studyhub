# Builder

**Category:** Creational · **Interview priority:** Core

## Intent

Separate the **construction** of a complex object from its **representation**, so the object can be assembled **step by step**, with readable code, optional parts and validation before the finished (often immutable) object is created.

## The Problem

An HTTP request object has a required URL and many optional settings: method, headers, query parameters, body, timeout, retries. Most callers set only a few. The finished request should be **immutable** (shared across threads, safe to retry) and **valid** (a POST needs a body; timeout must be positive).

## Why the Naive Solution Fails

**Telescoping constructors:**

```java
class HttpCall {
    HttpCall(String url) { this(url, "GET"); }
    HttpCall(String url, String method) { this(url, method, null); }
    HttpCall(String url, String method, String body) { this(url, method, body, 30); }
    HttpCall(String url, String method, String body, int timeoutSeconds) { this(url, method, body, timeoutSeconds, 0); }
    HttpCall(String url, String method, String body, int timeoutSeconds, int retries) { /* assign */ }
}

// new HttpCall("https://api.example.com/orders", "POST", json, 10, 3)   — which number is which?
```

- Unreadable calls: positional arguments of the same type are easy to swap.
- An explosion of constructors for every combination of optional values.

**JavaBean style** (`new HttpCall()` then setters):

- The object exists in an **incomplete, invalid** state between setter calls.
- It **cannot be immutable**, so it is not safe to share between threads.
- Validation across fields ("POST requires a body") has no natural place.

## The Pattern Idea

Use a separate **builder** object that collects the parts through named, chainable methods, then a final `build()` validates everything and creates the target object in one go — typically through a private constructor that takes the builder.

## Structure

```text
 Client ──▶ HttpCall.Builder ──build()──▶ HttpCall (immutable)
            ├ url (required, in constructor)
            ├ method(...)   ┐
            ├ header(...)   │ fluent setters returning this
            ├ body(...)     │
            ├ timeout(...)  ┘
            └ build()  → validates, calls private HttpCall(Builder)
```

| Participant | Role |
|-------------|------|
| Product | `HttpCall` — immutable, private constructor |
| Builder | `HttpCall.Builder` — mutable, collects parts, validates in `build()` |
| Client | Chains builder calls and calls `build()` |
| Director (classic GoF, optional) | Encapsulates a standard construction sequence (e.g. `Requests.jsonPost(url, body)`) |

The GoF book's original Builder emphasises a **Director** reusing one construction process for different representations (the same steps producing a PDF or an HTML document). In Java practice, the **fluent builder** shown here — popularised by *Effective Java* — is by far the most common form. Interviews usually mean the fluent builder.

## Java Implementation

```java
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

public class BuilderDemo {

    static final class HttpCall {
        private final String url;
        private final String method;
        private final Map<String, String> headers;
        private final String body;
        private final int timeoutSeconds;
        private final int retries;

        private HttpCall(Builder b) {                              // only the builder can construct
            this.url = b.url;
            this.method = b.method;
            this.headers = Map.copyOf(b.headers);                   // immutable copy
            this.body = b.body;
            this.timeoutSeconds = b.timeoutSeconds;
            this.retries = b.retries;
        }

        static Builder to(String url) {                            // required part up front
            return new Builder(url);
        }

        @Override
        public String toString() {
            return method + " " + url + " headers=" + headers + " body=" + body
                    + " timeout=" + timeoutSeconds + "s retries=" + retries;
        }

        static final class Builder {
            private final String url;
            private String method = "GET";                          // sensible defaults
            private final Map<String, String> headers = new LinkedHashMap<>();
            private String body;
            private int timeoutSeconds = 30;
            private int retries = 0;

            private Builder(String url) {
                this.url = Objects.requireNonNull(url, "url");
            }

            Builder method(String method) {
                this.method = method;
                return this;
            }

            Builder header(String name, String value) {
                headers.put(name, value);
                return this;
            }

            Builder body(String body) {
                this.body = body;
                return this;
            }

            Builder timeoutSeconds(int seconds) {
                this.timeoutSeconds = seconds;
                return this;
            }

            Builder retries(int retries) {
                this.retries = retries;
                return this;
            }

            HttpCall build() {                                      // cross-field validation in one place
                if (timeoutSeconds <= 0) {
                    throw new IllegalStateException("timeout must be positive");
                }
                if (("POST".equals(method) || "PUT".equals(method)) && body == null) {
                    throw new IllegalStateException(method + " requires a body");
                }
                return new HttpCall(this);
            }
        }
    }

    public static void main(String[] args) {
        HttpCall get = HttpCall.to("https://api.example.com/orders/7").build();

        HttpCall post = HttpCall.to("https://api.example.com/orders")
                .method("POST")
                .header("Content-Type", "application/json")
                .body("{\"item\":\"pen\"}")
                .timeoutSeconds(10)
                .retries(3)
                .build();

        System.out.println(get);
        System.out.println(post);

        try {
            HttpCall.to("https://api.example.com/orders").method("POST").build();
        } catch (IllegalStateException e) {
            System.out.println("Rejected: " + e.getMessage());
        }
    }
}
```

**Output:**

```text
GET https://api.example.com/orders/7 headers={} body=null timeout=30s retries=0
POST https://api.example.com/orders headers={Content-Type=application/json} body={"item":"pen"} timeout=10s retries=3
Rejected: POST requires a body
```

## Execution Flow

1. `HttpCall.to(url)` creates a builder with the required URL and defaults.
2. Each fluent call sets one part and returns the same builder.
3. `build()` checks all rules together, then passes the builder to the private constructor, which copies the values into final fields.
4. The client receives an immutable, valid `HttpCall`; the builder can be discarded (or reused to build similar objects).

## Real-World Examples

- `java.net.http.HttpRequest.newBuilder()` — a fluent builder for immutable HTTP requests.
- `StringBuilder` — builds a `String` step by step (a builder for an immutable product).
- `Stream.builder()`, `Locale.Builder`, `Calendar.Builder`.
- Spring's `UriComponentsBuilder`, `ResponseEntity.ok().header(...).body(...)`, and many test-data builders.
- Lombok's `@Builder` generates this pattern (a library convenience, not part of the JDK).

## When to Use

- Constructors would have **four or more** parameters, especially optional ones or several of the same type.
- The product should be **immutable** but is assembled from many parts.
- Validation involves **several fields together**.
- You want readable test-data creation (`anOrder().withItems(3).paid().build()`).

## When Not to Use

- Objects with two or three required fields — a constructor or a record is clearer.
- All fields are required and distinct in type — a constructor (or a parameter object) is enough.
- The object must be mutable anyway and has no cross-field rules — setters may suffice (e.g. a DTO).

## Advantages

- Readable, self-documenting construction; no argument-order mistakes.
- Supports immutability and thread safety of the product.
- Central validation; impossible to obtain a half-built product.
- Defaults for optional parts; the same builder can create variations.

## Disadvantages

- More code: a second class mirroring the product's fields.
- Required parameters are not enforced by the compiler unless placed in the builder's constructor or factory (`to(url)`).
- Over-applied to simple objects, it becomes ceremony.

## Related Patterns

- **Abstract Factory** returns families of objects immediately; Builder constructs **one** complex object step by step.
- **Factory Method** decides *which* class to create; Builder decides *how* to assemble one.
- **Composite** structures (trees) are often created with builders.
- **Fluent interfaces** (method chaining) are the API style builders typically use.

## SOLID Connection

- **SRP:** construction and validation logic is separated from the product's behaviour.
- Supports **immutability**, which simplifies reasoning and thread safety.
- Indirectly helps **OCP**: new optional parts can be added to the builder without breaking existing calls.

## Common Mistakes

- Leaving the product with a public constructor or setters, defeating immutability.
- Forgetting to copy mutable collections from the builder (later builder changes would leak into the product).
- Putting validation in each setter only, missing cross-field rules — validate in `build()`.
- Using a builder for every class "for consistency".

## Key Takeaways

- Builder assembles a complex object step by step and creates it, validated, in `build()`.
- It solves telescoping constructors and the half-built JavaBean problem.
- Typical Java shape: static nested `Builder`, fluent methods returning `this`, private product constructor, immutable product.
- Use it for many optional parameters or cross-field rules; use constructors or records for simple objects.
