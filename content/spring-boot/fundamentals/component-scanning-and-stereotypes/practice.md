# Component Scanning and Stereotype Annotations — Practice

### P1. The one with behaviour

**Difficulty:** Easy · **Type:** MCQ

Which stereotype adds behaviour beyond registering a bean?

- A) `@Service`
- B) `@Component`
- C) `@Repository`
- D) None — all are identical

<details>
<summary>Answer</summary>

**Answer:** C) `@Repository`

**Explanation:** `@Repository` beans get a proxy that translates persistence exceptions into `DataAccessException` subclasses.

</details>

### P2. Not scanned

**Difficulty:** Easy · **Type:** Debugging

The main class is `com.shop.app.ShopApplication`. Startup fails: "required a bean of type 'com.shop.payment.PaymentService' that could not be found", although `PaymentService` has `@Service`. Explain and give two fixes.

<details>
<summary>Answer</summary>

Scanning starts at `com.shop.app`; `com.shop.payment` is a sibling package, not a sub-package. Fixes: move `ShopApplication` up to `com.shop`, or use `@SpringBootApplication(scanBasePackages = "com.shop")`.

</details>

### P3. Interface annotated

**Difficulty:** Medium · **Type:** Code analysis

```java
@Service
public interface NotificationService {
    void notify(String userId, String message);
}

public class EmailNotificationService implements NotificationService {
    public void notify(String userId, String message) {
    }
}
```

Injection of `NotificationService` fails. Why?

<details>
<summary>Answer</summary>

Scanning skips interfaces (they cannot be instantiated), and the implementation class has no stereotype, so no bean of type `NotificationService` exists. Move `@Service` to `EmailNotificationService`.

</details>

### P4. View or body?

**Difficulty:** Medium · **Type:** Behavior

```java
@Controller
class GreetingController {
    @GetMapping("/hello")
    String hello() {
        return "hello";
    }
}
```

In an application with Thymeleaf and a template `templates/hello.html`, what does `/hello` return? What changes with `@RestController`?

<details>
<summary>Answer</summary>

With `@Controller`, `"hello"` is a view name, so the `hello.html` template is rendered. With `@RestController`, the literal text `hello` is written to the response body.

</details>
