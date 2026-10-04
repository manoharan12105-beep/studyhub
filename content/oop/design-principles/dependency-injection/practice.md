# Dependency Injection and Inversion of Control — Practice

### P1. Which form?

**Difficulty:** Easy · **Type:** MCQ

A `ReportService` cannot work without a `DataSource`, and may optionally use a `Cache`. Which combination is most appropriate?

- A) Field injection for both
- B) Constructor injection for `DataSource`; setter (or optional constructor parameter) for `Cache`
- C) Setter injection for both
- D) `new` both inside the class

<details>
<summary>Answer</summary>

**Answer:** B

**Explanation:** Required dependencies belong in the constructor so the object is always valid; an optional dependency with a sensible default can be set later.

</details>

### P2. Write the composition root

**Difficulty:** Medium · **Type:** Coding

Given interfaces `SmsGateway` and `OtpStore`, implementations `ConsoleSmsGateway` and `InMemoryOtpStore`, and `class OtpService { OtpService(SmsGateway sms, OtpStore store) {...} }`, write a `main` that wires them and sends an OTP to one number. Where else in the code should `new ConsoleSmsGateway()` appear?

<details>
<summary>Answer</summary>

```java
import java.util.HashMap;
import java.util.Map;

interface SmsGateway {
    void send(String phone, String text);
}

interface OtpStore {
    void put(String phone, String otp);
    String get(String phone);
}

class ConsoleSmsGateway implements SmsGateway {
    public void send(String phone, String text) {
        System.out.println("SMS to " + phone + ": " + text);
    }
}

class InMemoryOtpStore implements OtpStore {
    private final Map<String, String> codes = new HashMap<>();

    public void put(String phone, String otp) {
        codes.put(phone, otp);
    }

    public String get(String phone) {
        return codes.get(phone);
    }
}

class OtpService {
    private final SmsGateway sms;
    private final OtpStore store;

    OtpService(SmsGateway sms, OtpStore store) {
        this.sms = sms;
        this.store = store;
    }

    void sendOtp(String phone) {
        String otp = "482913";                    // a real service would generate a random code
        store.put(phone, otp);
        sms.send(phone, "Your OTP is " + otp);
    }
}

public class App {
    public static void main(String[] args) {      // composition root
        SmsGateway sms = new ConsoleSmsGateway();
        OtpStore store = new InMemoryOtpStore();
        OtpService otpService = new OtpService(sms, store);
        otpService.sendOtp("+91-90000-00000");
    }
}
```

**Output:**

```text
SMS to +91-90000-00000: Your OTP is 482913
```

**Answer to the second part:** nowhere else. Concrete implementations are created only in the composition root (and in tests, which have their own wiring with fakes).

</details>

### P3. Refactor away from a singleton

**Difficulty:** Medium · **Type:** Code analysis

```java
class AuditLogger {
    private static final AuditLogger INSTANCE = new AuditLogger();

    static AuditLogger getInstance() {
        return INSTANCE;
    }

    void log(String event) {
        System.out.println(event);
    }
}

class TransferService {
    void transfer(String from, String to, long amount) {
        AuditLogger.getInstance().log("transfer " + amount + " from " + from + " to " + to);
    }
}
```

Why is `TransferService` hard to test, and how does DI fix it?

<details>
<summary>Answer</summary>

**Answer:** The dependency is hidden inside the method and fixed to one global instance, so a test cannot replace it to check what was audited (or to avoid real output).

**Fix:** define `interface AuditLog { void log(String event); }`, give `TransferService` a constructor parameter of that type, and keep a single instance by creating it once in the composition root (or as a Spring singleton bean) instead of enforcing it with a static `getInstance()`. Tests pass a recording fake.

</details>

### P4. Scenario: circular dependency

**Difficulty:** Hard · **Type:** Scenario

With constructor injection, startup fails: `OrderService` needs `InvoiceService`, and `InvoiceService` needs `OrderService`. A teammate suggests switching to field injection so it "just works". What do you recommend?

<details>
<summary>Answer</summary>

**Answer:** Treat the failure as a design signal, not a wiring problem. Mutual dependencies mean responsibilities are tangled. Options:

- Extract the shared logic both need into a third class that both depend on.
- Have one side publish an event (`OrderPlaced`) that the other listens to (Observer), removing the direct back-reference.
- Pass the needed data as a method argument instead of holding a reference.

Field injection only hides the cycle and allows partially initialised objects.

</details>
