# Coupling and Cohesion — Practice

### P1. Best combination

**Difficulty:** Easy · **Type:** MCQ

Which combination should good OO design aim for?

- A) High coupling, high cohesion
- B) Low coupling, low cohesion
- C) Low coupling, high cohesion
- D) High coupling, low cohesion

<details>
<summary>Answer</summary>

**Answer:** C) Low coupling, high cohesion

**Explanation:** Focused classes connected by narrow interfaces keep changes local.

</details>

### P2. Name the coupling

**Difficulty:** Medium · **Type:** Conceptual

Classify: (a) `invoice.items.add(x)` from outside `Invoice`; (b) `static Config SETTINGS` read and written by many classes; (c) `render(report, 2)` where 2 means "landscape"; (d) `notifier.send(event)` through an interface.

<details>
<summary>Answer</summary>

**Answer:** (a) content coupling; (b) common (global) coupling; (c) control coupling; (d) message coupling.

**Explanation:** Only (d) is the loose kind to aim for.

</details>

### P3. Improve cohesion

**Difficulty:** Medium · **Type:** Design

```java
class StudentManager {
    void enroll(String studentId, String courseId) { }
    double gpa(String studentId) { return 0; }
    String hostelRoom(String studentId) { return ""; }
    void sendFeeReminder(String studentId) { }
    byte[] idCardPdf(String studentId) { return new byte[0]; }
}
```

Split `StudentManager` into cohesive classes.

<details>
<summary>Answer</summary>

**Answer:** `EnrollmentService` (`enroll`), `GradeCalculator` or `AcademicRecord` (`gpa`), `HostelAllocation` (`hostelRoom`), `FeeReminderService` (`sendFeeReminder`, depending on a notifier interface), `IdCardGenerator` (`idCardPdf`).

**Explanation:** Each area changes for a different department (academics, hostel, accounts, administration). Clients now depend only on the area they need.

</details>

### P4. Tight to loose

**Difficulty:** Hard · **Type:** Coding

```java
class WeatherAlert {
    String check() {
        double temp = new ImdHttpClient().fetchCurrentTemperature("Trichy");
        return temp > 40 ? "Heat alert" : "Normal";
    }
}

class ImdHttpClient {
    double fetchCurrentTemperature(String city) {
        return 0;   // calls a remote API in real code
    }
}
```

Refactor so `WeatherAlert` is loosely coupled and testable, and the city is not hard-coded.

<details>
<summary>Answer</summary>

```java
interface TemperatureSource {
    double currentCelsius(String city);
}

class WeatherAlert {
    private final TemperatureSource source;
    private final String city;

    WeatherAlert(TemperatureSource source, String city) {
        this.source = source;
        this.city = city;
    }

    String check() {
        return source.currentCelsius(city) > 40 ? "Heat alert" : "Normal";
    }
}
```

**Explanation:** `ImdHttpClient` (or an adapter around it) implements `TemperatureSource`. Tests use `city -> 42.0` to check the alert rule without any network call.

</details>
