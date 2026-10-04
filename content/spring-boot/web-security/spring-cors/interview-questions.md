# CORS, Same-Origin Policy and Preflight — Interview Questions

## Beginner

### Q1. What is CORS?

<details>
<summary>Answer</summary>

Cross-Origin Resource Sharing: a standard that lets a server declare, through `Access-Control-*` response headers, which other origins may read its responses in a browser. It relaxes the browser's same-origin policy in a controlled way.

</details>

### Q2. What is an origin?

<details>
<summary>Answer</summary>

The combination of scheme, host and port, e.g. `https://shop.example.com:443`. Two URLs are same-origin only if all three match; `localhost:3000` and `localhost:8080` are different origins.

</details>

### Q3. What is a preflight request?

<details>
<summary>Answer</summary>

An `OPTIONS` request the browser sends before a non-simple cross-origin request (methods like PUT/DELETE, JSON content type, custom headers such as `Authorization`), asking with `Access-Control-Request-Method/Headers` whether the real request is allowed. The real request is sent only if the response permits it.

</details>

## Intermediate

### Q4. Why does an API call work in Postman but fail in the browser with a CORS error?

<details>
<summary>Answer</summary>

The same-origin policy and CORS are enforced only by browsers. Postman does not apply them. The server must return the correct CORS headers for the front end's origin (and allow the preflight) for the browser to let JavaScript read the response.

</details>

### Q5. How do you configure CORS in a Spring Boot application with Spring Security?

<details>
<summary>Answer</summary>

Define a `CorsConfigurationSource` bean (allowed origins, methods, headers, credentials, max age, exposed headers) and enable `http.cors(Customizer.withDefaults())` in the `SecurityFilterChain`. Spring Security then adds `CorsFilter` early so preflight requests are answered before authentication. `@CrossOrigin` or `WebMvcConfigurer.addCorsMappings` work at the MVC level.

</details>

### Q6. Why can't you use `allowedOrigins("*")` with `allowCredentials(true)`?

<details>
<summary>Answer</summary>

The CORS specification forbids `Access-Control-Allow-Origin: *` on credentialed responses, because it would let any website read user-specific data using the user's cookies. Spring rejects the combination; list exact origins or use `allowedOriginPatterns`.

</details>

## Advanced

### Q7. A preflight fails with 401 although CORS is configured in `WebMvcConfigurer`. Why?

<details>
<summary>Answer</summary>

Spring Security's filters run before Spring MVC. The `OPTIONS` preflight carries no credentials, so the security chain rejects it (401/403) before MVC's CORS handling is reached. Enable `http.cors()` in the security configuration (it reuses the MVC configuration or a `CorsConfigurationSource` bean) so `CorsFilter` handles preflights first.

</details>

### Q8. Does CORS prevent CSRF?

<details>
<summary>Answer</summary>

No. CORS controls whether a cross-origin page can read responses; CSRF exploits a browser sending credentials with a request whose response the attacker does not need to read. Simple cross-origin form posts are sent without preflight regardless of CORS. CSRF needs CSRF tokens, SameSite cookies or header-based tokens.

</details>
