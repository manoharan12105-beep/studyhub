# Open/Closed Principle — Practice

### P1. Spot the violation

**Difficulty:** Easy · **Type:** MCQ

Which code most clearly violates OCP?

- A) A `List<NotificationChannel>` iterated to send a message through each channel
- B) `area(Shape s)` with `if (s instanceof Circle) ... else if (s instanceof Square) ...`, edited for every new shape
- C) `Collections.sort(list, comparator)`
- D) An interface `TaxRule` with two implementations

<details>
<summary>Answer</summary>

**Answer:** B

**Explanation:** Every new shape requires modifying `area`. Moving `area()` into each shape class makes the calculation open for extension.

</details>

### P2. Refactor to OCP

**Difficulty:** Medium · **Type:** Coding

```java
class ReportExporter {
    String export(String format, String data) {
        if (format.equals("CSV")) {
            return data.replace(' ', ',');
        } else if (format.equals("JSON")) {
            return "{\"data\":\"" + data + "\"}";
        }
        throw new IllegalArgumentException(format);
    }
}
```

Refactor so a new XML format can be added without editing existing classes.

<details>
<summary>Answer</summary>

```java
import java.util.Map;

interface ExportFormat {
    String export(String data);
}

class CsvFormat implements ExportFormat {
    public String export(String data) {
        return data.replace(' ', ',');
    }
}

class JsonFormat implements ExportFormat {
    public String export(String data) {
        return "{\"data\":\"" + data + "\"}";
    }
}

class ReportExporter {
    private final Map<String, ExportFormat> formats;

    ReportExporter(Map<String, ExportFormat> formats) {    // registered from outside
        this.formats = Map.copyOf(formats);
    }

    String export(String format, String data) {
        ExportFormat exporter = formats.get(format);
        if (exporter == null) {
            throw new IllegalArgumentException("unsupported format " + format);
        }
        return exporter.export(data);
    }
}
```

**Explanation:** XML becomes `class XmlFormat implements ExportFormat`, registered where the map is built (configuration). `ReportExporter`, `CsvFormat` and `JsonFormat` stay unchanged.

</details>

### P3. Decide

**Difficulty:** Hard · **Type:** Scenario

A startup's checkout supports only UPI today. A developer proposes a `PaymentProvider` interface, a `PaymentProviderFactory`, and a plugin registry before any second provider is planned. The lead says "just write `UpiPayment`". Who is right?

<details>
<summary>Answer</summary>

**Answer:** Mostly the lead, with a nuance. Without a second provider, the factory and registry are speculative. However, an interface at the **boundary** to an external payment system is cheap and useful for testing (a fake provider) and for isolating vendor code — that part is justified even with one implementation.

**Balanced approach:** keep a small `PaymentGateway` interface with `UpiPayment` behind it; add registries and factories when the second provider becomes real.

</details>
