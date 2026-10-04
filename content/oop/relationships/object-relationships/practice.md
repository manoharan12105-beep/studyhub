# Association, Aggregation and Composition — Practice

### P1. Pick the relationship

**Difficulty:** Easy · **Type:** MCQ

A `Hospital` has `Ward`s. Wards cannot exist without the hospital and are never shared between hospitals. Which relationship?

- A) Inheritance
- B) Association
- C) Aggregation
- D) Composition

<details>
<summary>Answer</summary>

**Answer:** D) Composition

**Explanation:** Exclusive ownership and a lifetime bound to the whole are the defining properties of composition.

</details>

### P2. IS-A or HAS-A?

**Difficulty:** Easy · **Type:** Conceptual

Classify: (a) `SavingsAccount` and `Account`; (b) `Laptop` and `Battery`; (c) `ArrayList` and `List`; (d) `Employee` and `Address`.

<details>
<summary>Answer</summary>

**Answer:** (a) IS-A; (b) HAS-A; (c) IS-A (implements); (d) HAS-A.

**Explanation:** Use the sentence test: "a savings account is an account", "a laptop has a battery".

</details>

### P3. Find the composition leak

**Difficulty:** Medium · **Type:** Code analysis

```java
import java.util.ArrayList;
import java.util.List;

class Room {
    String name;

    Room(String name) {
        this.name = name;
    }
}

class House {
    private final List<Room> rooms = new ArrayList<>();

    House() {
        rooms.add(new Room("Kitchen"));
        rooms.add(new Room("Hall"));
    }

    List<Room> getRooms() {
        return rooms;
    }
}
```

The design intends composition. What breaks it?

<details>
<summary>Answer</summary>

**Answer:** `getRooms()` returns the internal list, and `Room` is mutable and publicly constructible. Outside code can add or remove rooms, rename a room, or keep references to rooms and put them into another house — so parts are no longer exclusively owned.

**Fix:** return an unmodifiable view of read-only information (for example room names via `List.copyOf`), make `Room` immutable or private to `House`, and expose house operations (`addRoom(String name)`) instead of the parts.

</details>

### P4. Model it

**Difficulty:** Medium · **Type:** Design

Model doctors and patients: a patient can visit many doctors; a doctor sees many patients; each visit has a date, a diagnosis and a fee. Which classes and relationships would you use?

<details>
<summary>Answer</summary>

**Answer:** `Doctor`, `Patient` and an association class `Appointment` (or `Visit`) with `date`, `diagnosis`, `fee`, and references to one `Doctor` and one `Patient`. `Doctor` 1 — * `Appointment` * — 1 `Patient`.

**Explanation:** The many-to-many relationship has its own data, so it deserves a class. Doctors and patients exist independently of any visit (association, not composition).

</details>

### P5. Keep both sides consistent

**Difficulty:** Hard · **Type:** Coding

`Author` has a list of `Book`s; each `Book` has one `Author`. Write `Author.addBook(Book book)` so that both sides stay consistent even if the book previously belonged to another author.

<details>
<summary>Hint</summary>

Remove the book from its old author's list before adding it to the new one, and guard against infinite mutual calls.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.ArrayList;
import java.util.List;

class Author {
    private final List<Book> books = new ArrayList<>();

    void addBook(Book book) {
        if (books.contains(book)) {
            return;
        }
        Author previous = book.author();
        if (previous != null) {
            previous.books.remove(book);      // same class, so the private list is accessible
        }
        books.add(book);
        book.assignAuthor(this);
    }

    List<Book> books() {
        return List.copyOf(books);
    }
}

class Book {
    private Author author;

    Author author() {
        return author;
    }

    void assignAuthor(Author author) {        // package-private: called only by Author
        this.author = author;
    }
}
```

**Explanation:** One method (`addBook`) owns the whole update, so the two sides cannot drift apart. Making `assignAuthor` package-private discourages other code from changing only one side.

</details>
