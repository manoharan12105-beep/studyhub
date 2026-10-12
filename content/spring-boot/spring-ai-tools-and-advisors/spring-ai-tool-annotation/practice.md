# Defining Tools with @Tool and @ToolParam — Practice

### P1. Default name

**Difficulty:** Easy · **Type:** MCQ

What tool name does `@Tool(description = "Find a course") Course findCourse(String id)` get?

- A) `Find a course`
- B) `findCourse`
- C) `FindCourse`
- D) The class name

<details>
<summary>Answer</summary>

**Answer:** B) `findCourse`

</details>

### P2. Hidden parameter

**Difficulty:** Easy · **Type:** MCQ

Which parameter type is left out of the generated JSON Schema?

- A) `LocalDate`
- B) An enum
- C) `ToolContext`
- D) A record

<details>
<summary>Answer</summary>

**Answer:** C) `ToolContext`

</details>

### P3. Predict the schema

**Difficulty:** Medium · **Type:** Behavior

```java
// Illustrative fragment
@Tool(description = "Book a mentoring slot")
String bookSlot(@ToolParam(description = "Mentor id") String mentorId,
                @ToolParam(description = "Preferred day", required = false) DayOfWeek day) { ... }
```

Which properties and which `required` list does the schema contain?

<details>
<summary>Answer</summary>

Properties `mentorId` (string) and `day` (string with an `enum` of `MONDAY` … `SUNDAY`); `"required": ["mentorId"]`.

</details>

### P4. Fix the tool

**Difficulty:** Medium · **Type:** Debugging

```java
// Illustrative fragment
@Tool(description = "Get grades")
List<Grade> grades(String studentId) {
    return gradeRepository.findByStudentId(studentId);
}
```

Users can get other students' grades by asking for them. Fix it.

<details>
<summary>Answer</summary>

Remove `studentId` from the model-controlled parameters and read it from `ToolContext` (set by the service from the authenticated user):

```java
// Illustrative fragment
@Tool(description = "Get the current learner's grades. Use it when the learner asks about their results.")
List<Grade> myGrades(ToolContext toolContext) {
    String studentId = (String) toolContext.getContext().get("studentId");
    return gradeRepository.findByStudentId(studentId);
}
```

</details>

### P5. Write a tool class

**Difficulty:** Hard · **Type:** Coding

Write a `@Component` tool class with `upcomingDeadlines(int days)` that returns the current learner's assignment deadlines within `days` (1–30), using a `DeadlineService` and `ToolContext` key `learnerId`. Reject invalid input.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
@Component
class DeadlineTools {

    private final DeadlineService deadlineService;

    DeadlineTools(DeadlineService deadlineService) {
        this.deadlineService = deadlineService;
    }

    @Tool(description = "List the current learner's assignment deadlines in the next N days. "
            + "Use it when the learner asks what is due soon.")
    List<Deadline> upcomingDeadlines(@ToolParam(description = "Number of days ahead, 1 to 30") int days,
                                     ToolContext toolContext) {
        if (days < 1 || days > 30) {
            throw new IllegalArgumentException("days must be between 1 and 30");
        }
        String learnerId = (String) toolContext.getContext().get("learnerId");
        return deadlineService.upcoming(learnerId, days);
    }
}
```

The exception message is sent back to the model by default, so it can retry with a valid value.

</details>
