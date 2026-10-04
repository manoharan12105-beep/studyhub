# Interface Segregation Principle — Practice

### P1. Symptom

**Difficulty:** Easy · **Type:** MCQ

Which symptom most directly suggests an ISP violation?

- A) A class with many private methods
- B) Several implementations that throw `UnsupportedOperationException` for some interface methods
- C) An interface with exactly two methods
- D) A class implementing three interfaces

<details>
<summary>Answer</summary>

**Answer:** B

**Explanation:** Implementers refusing methods means the interface asks for more than they can provide.

</details>

### P2. Split it

**Difficulty:** Medium · **Type:** Design

```java
interface SmartDevice {
    void turnOn();
    void turnOff();
    void setTemperature(int celsius);
    void playMusic(String song);
    void recordVideo();
}
```

A smart bulb, a smart AC and a smart speaker must implement it. Propose segregated interfaces and show which device implements which.

<details>
<summary>Answer</summary>

**Answer:** `Switchable` (`turnOn`, `turnOff`), `TemperatureControl` (`setTemperature`), `MusicPlayer` (`playMusic`), `VideoRecorder` (`recordVideo`).

- Bulb: `Switchable`
- AC: `Switchable`, `TemperatureControl`
- Speaker: `Switchable`, `MusicPlayer`

**Explanation:** `turnOn`/`turnOff` stay together because every client that switches devices needs both.

</details>

### P3. Client-side view

**Difficulty:** Hard · **Type:** Scenario

A `ReportService` takes `UserRepository` (with 25 methods: CRUD, search, password reset, audit queries) only to read user names by id. A change to the password-reset method signature breaks the report module's tests. What would you change?

<details>
<summary>Answer</summary>

**Answer:** Give `ReportService` a narrow dependency such as `interface UserNameLookup { String nameOf(String userId); }`. The existing repository can implement it (or an adapter can delegate to the repository).

**Why:** the report module now depends only on what it uses, its tests fake a one-method interface, and unrelated changes to user management no longer affect it.

</details>
