# Lab Setup: The orderdesk Project

**Lab:** Setup · **Module:** Practical Labs · **Difficulty:** Beginner · **Verification:** Locally tested

> [!IMPORTANT]
> **You run everything in your own terminal.** StudyHub is a static website: it never runs Claude Code, calls a model, connects to GitHub or executes commands. Interactive boxes in lessons are labelled simulations. Every lab step is something **you** do on your machine, in a practice folder you can delete.

## Objective

Create **orderdesk**, the small Spring Boot project every lab and the capstone use, build it once, and learn how the labs are written. The project contains deliberate problems for you to find and fix with Claude Code.

## Prerequisites

| Tool | Needed from | Check |
|------|-------------|-------|
| JDK 21 | Setup | `java -version` |
| Git | Setup | `git --version` |
| Claude Code | Lab 01 (installed in Lab 02) | `claude --version` |
| jq | Lab 09 (hooks) | `jq --version` |
| A Claude account or API key | Labs with a model session | `/status` inside Claude Code |
| GitHub CLI `gh` (optional) | Labs 13–14 | `gh --version` |

Maven doesn't need to be installed: the project uses the **Maven Wrapper** (`./mvnw`), which downloads Maven 3.9.16 on first use. Windows users run the labs in Git Bash or WSL (hook scripts are Bash), or use `mvnw.cmd` in PowerShell for builds.

## Scenario

orderdesk is a minimal order API for a support team: create an order, read it with its discounted total, search a customer's orders. It was written in a hurry. The labs use its real problems:

| Id | Problem | Where you meet it |
|----|---------|-------------------|
| BUG-101 | Orders without a discount code fail with HTTP 500 — and failed creates are still stored | Labs 05, 13, capstone |
| FEAT-7 | "Mark as paid" endpoint requested | Labs 06, 12, capstone |
| SEC-3 | Support search is injectable (`x' OR '1'='1` returns every order) | Lab 12, capstone |
| — | `CLAUDE.md` says only "Write good code and add tests" | Lab 04 |
| — | No regression tests for these bugs | Labs 05, 13, capstone |

## Starting State

```text
orderdesk/
├── pom.xml                          Spring Boot 4.1.1 parent, Java 21
├── mvnw, mvnw.cmd, .mvn/wrapper/    Maven Wrapper (generated in step 2)
├── README.md
├── CLAUDE.md                        deliberately weak (Lab 04 improves it)
├── .gitignore
├── docs/issues/BUG-101.md
├── docs/issues/FEAT-7.md
└── src/
    ├── main/java/com/example/orderdesk/
    │   ├── OrderDeskApplication.java
    │   └── order/  CreateOrderRequest, Order, OrderController, OrderRepository,
    │               OrderResponse, OrderSearchDao, OrderStatus, PriceCalculator
    ├── main/resources/application.yml
    ├── main/resources/db/migration/V1__create_orders.sql
    └── test/java/com/example/orderdesk/order/  OrderControllerTest, PriceCalculatorTest
```

### pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.1.1</version>
    <relativePath/>
  </parent>

  <groupId>com.example</groupId>
  <artifactId>orderdesk</artifactId>
  <version>0.1.0</version>
  <name>orderdesk</name>

  <properties>
    <java.version>21</java.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-webmvc</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-flyway</artifactId>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>

    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-webmvc-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
```

### README.md

````markdown
# orderdesk

A small order management REST API used by the StudyHub Claude Code labs.

- Spring Boot 4.1, Java 21, Maven Wrapper
- H2 in-memory database, schema managed by Flyway
- JUnit 5 and MockMvc tests

## Build and test

```bash
./mvnw -B verify
```

## Run

```bash
./mvnw spring-boot:run
```

The API listens on port 8080:

- `POST /api/orders` — create an order (`customerEmail`, `subtotalCents`, optional `discountCode`)
- `GET /api/orders/{id}` — read an order with its total
- `GET /api/orders/search?email=...` — order ids for a customer (support dashboard)
````

### CLAUDE.md

```markdown
# orderdesk

Java project. Write good code and add tests.
```

### .gitignore

```text
target/
.env
.env.*
!.env.example
.claude/settings.local.json
.claude/worktrees/
CLAUDE.local.md
*.iml
.idea/
.vscode/
```

### docs/issues/BUG-101.md

```markdown
# BUG-101: Orders without a discount code fail

**Reported by:** support team · **Severity:** high

## What happens

Creating or opening an order without a discount code fails with HTTP 500. Orders created with `SAVE10` or `SAVE20` work.

Support also noticed that the failed create request still seems to store the order: it later shows up in the support dashboard search.

## Steps to reproduce

1. Start the app: `./mvnw spring-boot:run`
2. `POST /api/orders` with `{"customerEmail":"ravi@example.com","subtotalCents":2500}` — returns HTTP 500
3. `GET /api/orders/1` on a fresh database — also returns HTTP 500

## Expected

HTTP 201 for the create and HTTP 200 for the read, with `totalCents` equal to `subtotalCents` (2500).

## Notes

The test `PriceCalculatorTest.orderWithoutDiscountCodeCostsTheSubtotal` fails on main.
```

### docs/issues/FEAT-7.md

```markdown
# FEAT-7: Mark an order as paid

**Requested by:** finance team

Support staff need to mark an order as paid after the payment provider confirms it.

## Acceptance criteria

- `POST /api/orders/{id}/pay` changes a `NEW` order to `PAID` and returns the order (HTTP 200).
- Paying an order that is already `PAID` changes nothing and returns HTTP 200 (the payment provider may send the same confirmation twice).
- Paying a `CANCELLED` or `SHIPPED` order returns HTTP 409.
- Paying an unknown order returns HTTP 404.
- No database schema change is needed.
```

### src/main/resources/application.yml

```yaml
spring:
  application:
    name: orderdesk
  datasource:
    url: jdbc:h2:mem:orderdesk;DB_CLOSE_DELAY=-1
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
```

### src/main/resources/db/migration/V1__create_orders.sql

```sql
CREATE TABLE orders (
    id             BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    customer_email VARCHAR(255) NOT NULL,
    status         VARCHAR(20)  NOT NULL,
    subtotal_cents BIGINT       NOT NULL,
    discount_code  VARCHAR(20),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### OrderDeskApplication.java

```java
package com.example.orderdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrderDeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderDeskApplication.class, args);
    }
}
```

### order/CreateOrderRequest.java

```java
package com.example.orderdesk.order;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateOrderRequest(
        @NotBlank @Email String customerEmail,
        @Positive long subtotalCents,
        @Size(max = 20) String discountCode) {
}
```

### order/Order.java

```java
package com.example.orderdesk.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private long subtotalCents;

    private String discountCode;

    @Column(nullable = false)
    private Instant createdAt;

    protected Order() {
    }

    public Order(String customerEmail, long subtotalCents, String discountCode) {
        this.customerEmail = customerEmail;
        this.subtotalCents = subtotalCents;
        this.discountCode = discountCode;
        this.status = OrderStatus.NEW;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getCustomerEmail() { return customerEmail; }
    public OrderStatus getStatus() { return status; }
    public long getSubtotalCents() { return subtotalCents; }
    public String getDiscountCode() { return discountCode; }
    public Instant getCreatedAt() { return createdAt; }
}
```

### order/OrderStatus.java

```java
package com.example.orderdesk.order;

public enum OrderStatus {
    NEW, PAID, SHIPPED, CANCELLED
}
```

### order/OrderRepository.java

```java
package com.example.orderdesk.order;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}
```

### order/OrderResponse.java

```java
package com.example.orderdesk.order;

public record OrderResponse(
        long id,
        String customerEmail,
        OrderStatus status,
        long subtotalCents,
        String discountCode,
        long totalCents) {

    static OrderResponse from(Order order, long totalCents) {
        return new OrderResponse(order.getId(), order.getCustomerEmail(), order.getStatus(),
                order.getSubtotalCents(), order.getDiscountCode(), totalCents);
    }
}
```

### order/PriceCalculator.java

```java
package com.example.orderdesk.order;

import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class PriceCalculator {

    private static final Map<String, Integer> PERCENT_OFF = Map.of("SAVE10", 10, "SAVE20", 20);

    /** Total in cents after the discount code, if any. Discounts are rounded down to whole cents. */
    public long totalCents(long subtotalCents, String discountCode) {
        int percent = PERCENT_OFF.getOrDefault(discountCode.trim().toUpperCase(Locale.ROOT), 0);
        long discount = subtotalCents * percent / 100;
        return subtotalCents - discount;
    }
}
```

### order/OrderSearchDao.java

```java
package com.example.orderdesk.order;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OrderSearchDao {

    private final JdbcTemplate jdbc;

    public OrderSearchDao(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Used by the support dashboard to find a customer's orders. */
    public List<Long> findIdsByCustomerEmail(String email) {
        String sql = "SELECT id FROM orders WHERE customer_email = '" + email + "' ORDER BY id";
        return jdbc.queryForList(sql, Long.class);
    }
}
```

### order/OrderController.java

```java
package com.example.orderdesk.order;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orders;
    private final PriceCalculator prices;
    private final OrderSearchDao search;

    public OrderController(OrderRepository orders, PriceCalculator prices, OrderSearchDao search) {
        this.orders = orders;
        this.prices = prices;
        this.search = search;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        Order order = orders.save(new Order(request.customerEmail(), request.subtotalCents(), request.discountCode()));
        return ResponseEntity.created(URI.create("/api/orders/" + order.getId())).body(toResponse(order));
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable long id) {
        Order order = orders.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order " + id + " not found"));
        return toResponse(order);
    }

    @GetMapping("/search")
    public List<Long> searchByEmail(@RequestParam String email) {
        return search.findIdsByCustomerEmail(email);
    }

    private OrderResponse toResponse(Order order) {
        return OrderResponse.from(order, prices.totalCents(order.getSubtotalCents(), order.getDiscountCode()));
    }
}
```

### test/…/PriceCalculatorTest.java

```java
package com.example.orderdesk.order;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class PriceCalculatorTest {

    private final PriceCalculator calculator = new PriceCalculator();

    @Test
    void appliesTenPercentCode() {
        assertEquals(9_000, calculator.totalCents(10_000, "SAVE10"));
    }

    @Test
    void codeIsCaseInsensitiveAndTrimmed() {
        assertEquals(8_000, calculator.totalCents(10_000, " save20 "));
    }

    @Test
    void unknownCodeGivesNoDiscount() {
        assertEquals(10_000, calculator.totalCents(10_000, "BOGUS"));
    }

    @Test
    void orderWithoutDiscountCodeCostsTheSubtotal() {
        assertEquals(2_500, calculator.totalCents(2_500, null));
    }
}
```

### test/…/OrderControllerTest.java

```java
package com.example.orderdesk.order;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void createsAndReadsAnOrder() throws Exception {
        String location = mvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"customerEmail":"asha@example.com","subtotalCents":10000,"discountCode":"SAVE10"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andReturn().getResponse().getHeader("Location");

        mvc.perform(get(location))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCents").value(9000))
                .andExpect(jsonPath("$.status").value("NEW"));
    }

    @Test
    void unknownOrderIs404() throws Exception {
        mvc.perform(get("/api/orders/999999")).andExpect(status().isNotFound());
    }

    @Test
    void rejectsInvalidEmail() throws Exception {
        mvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"customerEmail":"not-an-email","subtotalCents":500}
                                """))
                .andExpect(status().isBadRequest());
    }
}
```

## Instructions

### Step 1: Create the files

Create a practice folder (for example `~/cc-labs/orderdesk`) and save every file above at its path. Keep the folder outside your real work projects.

**Expected result:** the tree under *Starting State*, without `mvnw` yet.

### Step 2: Generate the Maven Wrapper

With Maven installed once (any 3.9.x), run in the project folder:

```bash
mvn -N wrapper:wrapper -Dmaven=3.9.16
```

Without Maven, generate any Spring Boot project on start.spring.io and copy its `mvnw`, `mvnw.cmd` and `.mvn/wrapper/` into orderdesk, then set `distributionUrl` in `.mvn/wrapper/maven-wrapper.properties` to Maven 3.9.16.

**Output** (`.mvn/wrapper/maven-wrapper.properties` created by the command):

```properties
wrapperVersion=3.3.4
distributionType=only-script
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.16/apache-maven-3.9.16-bin.zip
```

On macOS/Linux, make sure the script is executable: `chmod +x mvnw`.

### Step 3: Build once — it fails, on purpose

```bash
./mvnw -B verify
```

**Output** (summary lines):

```text
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 5.671 s -- in com.example.orderdesk.order.OrderControllerTest
[ERROR] Tests run: 4, Failures: 0, Errors: 1, Skipped: 0, Time elapsed: 0.034 s <<< FAILURE! -- in com.example.orderdesk.order.PriceCalculatorTest
[ERROR]   PriceCalculatorTest.orderWithoutDiscountCodeCostsTheSubtotal:28 » NullPointer Cannot invoke "String.trim()" because "discountCode" is null
[ERROR] Tests run: 7, Failures: 0, Errors: 1, Skipped: 0
[INFO] BUILD FAILURE
```

That failing test is BUG-101 — Lab 05 fixes it. The first run also downloads Maven and the dependencies, which takes a few minutes.

### Step 4: Put it under Git

```bash
git init -b main
git add .
git commit -m "orderdesk starter"
```

**Expected result:** one commit; `git status --short` prints nothing. Every lab starts from a clean tree so Claude's changes stand alone.

## Verification

- ☐ `java -version` reports 21.
- ☐ `./mvnw -B verify` reports `Tests run: 7, Failures: 0, Errors: 1` and `BUILD FAILURE`.
- ☐ `git log --oneline` shows the starter commit.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `./mvnw: Permission denied` | Script not executable | `chmod +x mvnw` |
| `release version 21 not supported` | Older JDK on `PATH` | Install JDK 21; set `JAVA_HOME` |
| Many compilation errors | A file saved at the wrong path or package | Compare with the tree; the package must match the folder |
| `/bin/sh^M: bad interpreter` | `mvnw` saved with Windows line endings | Convert to LF (`git config core.autocrlf input` before committing) |

## Security Notes

- orderdesk contains a real SQL injection on purpose. Run it only locally; never deploy it.
- No lab needs real secrets. Where a lab mentions an API key, keep it in an environment variable or a secret store — never in files or prompts.
- Keep the practice folder separate from repositories that hold credentials.

## Cleanup

Delete the folder when you finish the subject. Each lab says how to reset to a clean state (usually `git restore .` and `git clean -fd` **inside the practice folder only**, after checking `git status`).

## Completion Checklist

- ☐ Project created and builds with the expected single failure.
- ☐ Committed to a local Git repository.
- ☐ You know which labs need a model session, `jq` or `gh`.

## Follow-up Challenges

- Read `OrderController`, `PriceCalculator` and `OrderSearchDao` and write down every problem you can see before Lab 01 — then compare with what Claude finds.
- Start the app (`./mvnw spring-boot:run`) and reproduce BUG-101 with `curl`.
