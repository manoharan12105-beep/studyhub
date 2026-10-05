# HTTP Fundamentals: Requests and Responses

**Module:** HTTP · **Interview priority:** Core

## What Is It?

**HTTP** (HyperText Transfer Protocol) is the application protocol of the web and of most APIs. A **client** (browser, mobile app, `curl`, a Spring Boot service) sends a **request**; a **server** returns a **response**. HTTP runs over TCP (port 80), over TLS for HTTPS (port 443), and over QUIC for HTTP/3.

```text
Client ──── request:  GET /api/orders/7 HTTP/1.1 ───────────► Server
       ◄─── response: HTTP/1.1 200 OK  + JSON body ──────────
```

## Why It Exists

The web needed a simple, universal way to ask for a resource by name and get it back with metadata (type, size, caching rules, errors). HTTP's design — text-based (in 1.1), stateless, with extensible headers and standard methods and status codes — made it general enough to carry web pages, images, video, and nearly every modern API.

## How It Works

### The URL

```text
https://api.example.com:443/api/orders/7?include=items#summary
└─┬─┘   └──────┬──────┘└┬┘└─────┬──────┘└─────┬─────┘└──┬──┘
scheme       host      port    path         query     fragment (never sent to the server)
```

The host is resolved with [DNS](../../dns/dns-fundamentals/content.md); the port defaults to 80/443.

### Anatomy of a request

```http
POST /api/orders HTTP/1.1
Host: api.example.com
User-Agent: curl/8.5.0
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...
Content-Length: 34

{"productId": 7, "quantity": 2}
```

| Part | Content |
|------|---------|
| **Request line** | Method (`POST`), request target (`/api/orders`), version (`HTTP/1.1`) |
| **Headers** | `Name: value` lines — metadata: host, content type, auth, caching, cookies |
| **Empty line** | Ends the headers (`\r\n\r\n`) |
| **Body** (optional) | The payload — JSON, form data, a file. Its length is given by `Content-Length` or chunked encoding |

`Host` is mandatory in HTTP/1.1 — it lets one IP address serve many websites (virtual hosting).

### Anatomy of a response

```http
HTTP/1.1 201 Created
Date: Mon, 05 Oct 2026 10:15:30 GMT
Content-Type: application/json
Location: /api/orders/8
Content-Length: 25

{"id":8,"status":"NEW"}
```

| Part | Content |
|------|---------|
| **Status line** | Version, **status code** (`201`), reason phrase (`Created`) |
| **Headers** | Content type, length, caching, cookies to set, redirect location … |
| **Body** | The resource or an error description |

### Stateless

Each request carries everything the server needs; the server keeps **no memory** of previous requests at the protocol level. State (login sessions, carts) is layered on top with **cookies** or **tokens** ([Headers, Cookies and Sessions](../http-headers-cookies-and-sessions/content.md)). Statelessness is what lets a load balancer send consecutive requests to different servers.

### Connections

HTTP/1.1 keeps the TCP connection open for further requests by default (**persistent connections / keep-alive**). HTTP/2 multiplexes many requests on one connection; HTTP/3 uses QUIC ([HTTP Versions](../http-versions/content.md)).

### A complete exchange in Java

The JDK includes a small HTTP server (`com.sun.net.httpserver`) and a client (`java.net.http.HttpClient`). This program starts a server on a free local port and calls it three times:

```java
import com.sun.net.httpserver.HttpServer;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

public class HttpDemo {

    public static void main(String[] args) throws Exception {
        // A tiny HTTP server from the JDK (module jdk.httpserver) on any free local port.
        HttpServer server = HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
        server.createContext("/api/orders", exchange -> {
            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();
            System.out.println("Server got: " + method + " " + path);

            int status;
            String body;
            if (method.equals("GET") && path.equals("/api/orders/7")) {
                status = 200;
                body = "{\"id\":7,\"status\":\"SHIPPED\"}";
            } else if (method.equals("POST") && path.equals("/api/orders")) {
                status = 201;
                body = "{\"id\":8,\"status\":\"NEW\"}";
                exchange.getResponseHeaders().set("Location", "/api/orders/8");
            } else {
                status = 404;
                body = "{\"error\":\"not found\"}";
            }
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        String base = "http://127.0.0.1:" + server.getAddress().getPort();

        HttpClient client = HttpClient.newHttpClient();
        try {
            show(client.send(HttpRequest.newBuilder(URI.create(base + "/api/orders/7")).GET().build(),
                    HttpResponse.BodyHandlers.ofString()));
            show(client.send(HttpRequest.newBuilder(URI.create(base + "/api/orders"))
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString("{\"item\":\"book\"}")).build(),
                    HttpResponse.BodyHandlers.ofString()));
            show(client.send(HttpRequest.newBuilder(URI.create(base + "/api/orders/99")).GET().build(),
                    HttpResponse.BodyHandlers.ofString()));
        } finally {
            server.stop(0);
        }
    }

    static void show(HttpResponse<String> response) {
        System.out.println("Client got: " + response.statusCode() + " "
                + response.headers().firstValue("Content-Type").orElse("-")
                + response.headers().firstValue("Location").map(l -> " Location=" + l).orElse("")
                + " " + response.body());
    }
}
```

**Output:**

```text
Server got: GET /api/orders/7
Client got: 200 application/json {"id":7,"status":"SHIPPED"}
Server got: POST /api/orders
Client got: 201 application/json Location=/api/orders/8 {"id":8,"status":"NEW"}
Server got: GET /api/orders/99
Client got: 404 application/json {"error":"not found"}
```

Spring MVC does the same job at a higher level: `@GetMapping("/api/orders/{id}")` is matched against the request line, and `ResponseEntity.status(201).location(...)` builds the status line and headers.

### Seeing it on the wire

`curl -v` prints the request (`>`) and response (`<`) headers:

```bash
# Illustrative: needs network access
curl -v https://example.com -o /dev/null
```

Lines starting with `* ` describe DNS, TCP and TLS steps; `> GET / HTTP/2` is the request; `< HTTP/2 200` the response. See [Network Diagnostic Commands](../../troubleshooting/network-diagnostic-commands/content.md).

## Real World

- Browser → Spring Boot API → another service: every hop is an HTTP request/response, each with its own TCP (and usually TLS) connection.
- A reverse proxy or load balancer reads the request line and `Host` header to route the request.

## Common Traps

- **"HTTP is stateful because I stay logged in."** The protocol is stateless; cookies or tokens re-send identity on each request.
- **"The fragment (`#…`) is sent to the server."** It stays in the browser.
- **"GET requests cannot have a body."** HTTP allows it but gives it no defined meaning; many servers and proxies ignore or reject it — do not rely on it.
- **"HTTP means port 80."** HTTP can run on any port; Spring Boot uses 8080 by default.

## Interview Follow-up

- *"What are the parts of an HTTP request?"* Request line, headers, empty line, optional body.
- *"Why is HTTP stateless, and how do apps keep state?"* Simplicity and scalability; cookies, sessions, tokens.

## Key Takeaways

- Request = request line (method, target, version) + headers + blank line + optional body.
- Response = status line (version, code, reason) + headers + blank line + optional body.
- HTTP is stateless; state is added with cookies/sessions/tokens.
- HTTP rides on TCP (and TLS), or QUIC for HTTP/3.
