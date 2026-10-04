# Library Management System Design

## Requirements

**Functional**

1. The library holds **books** (title, ISBN, author) and several physical **copies** of each.
2. **Members** borrow copies; students may hold at most 3 loans, staff at most 6.
3. A loan is due after 14 days; late returns incur a **fine** (₹5 per day for students, ₹2 for staff).
4. If all copies of a book are on loan, a member can **reserve** it; when a copy is returned, it is held for the first person in the reservation queue.
5. Search books by title.

**Assumptions:** one branch; fines are recorded, payment is out of scope; time is passed in.

## Entities and Responsibilities

| Class | Responsibility |
|-------|----------------|
| `Book` | Catalogue entry (ISBN, title, author); its copies; its reservation queue |
| `BookCopy` | A physical item with a barcode and status (AVAILABLE, ON_LOAN, ON_HOLD) |
| `Member` | Identity, `MemberType` (limits and fine policy), current loans |
| `Loan` | Copy + member + issue/due/return dates; knows if overdue and how many days late |
| `FinePolicy` | Computes a fine from days late (varies by member type) |
| `Library` | Use cases: issue, return, reserve, search — coordinates the above |

## Relationships

- `Book` ◆ `BookCopy` (composition: copies belong to their book record).
- `Member` 1 — 0..* `Loan` * — 1 `BookCopy` (a loan links them; history kept).
- `Book` — queue of `Member` (reservations, FIFO).
- `MemberType` (enum) holds loan limit and fine rate.

## Class Diagram

```text
 Library ──▶ catalogue: Map<isbn, Book>, members, loans
 Book ◆──── 1..* BookCopy (status)          Book ──── reservations: Deque<Member>
 Member 1 ──── 0..* Loan * ────▶ 1 BookCopy
 Member ──▶ MemberType {STUDENT(3, 5), STAFF(6, 2)}   ← limit, fine per day
 Loan: issuedOn, dueOn, returnedOn; daysLate(today)
```

## Design Decisions

- Loan rules belong to `Loan` (dates) and `MemberType` (limits, fine rate) — Information Expert; `Library` only coordinates.
- `MemberType` is an enum carrying data; if fine rules become complex (waivers, caps), move to a `FinePolicy` strategy.
- Reservation queue belongs to `Book` (it is about a title, not a specific copy).
- Copy status is an enum with explicit transitions (a small **State** machine).
- Returning a reserved book places the copy ON_HOLD for the next member — a natural place for an **Observer** (notify the member).

## Java Implementation

```java
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class LibraryDesign {

    enum MemberType {
        STUDENT(3, 5), STAFF(6, 2);

        final int maxLoans;
        final long finePerDay;

        MemberType(int maxLoans, long finePerDay) {
            this.maxLoans = maxLoans;
            this.finePerDay = finePerDay;
        }
    }

    enum CopyStatus { AVAILABLE, ON_LOAN, ON_HOLD }

    static final class Member {
        final String id;
        final String name;
        final MemberType type;
        final List<Loan> activeLoans = new ArrayList<>();

        Member(String id, String name, MemberType type) {
            this.id = id;
            this.name = name;
            this.type = type;
        }

        boolean canBorrow() {
            return activeLoans.size() < type.maxLoans;
        }
    }

    static final class BookCopy {
        final String barcode;
        final Book book;
        CopyStatus status = CopyStatus.AVAILABLE;
        Member heldFor;

        BookCopy(String barcode, Book book) {
            this.barcode = barcode;
            this.book = book;
        }
    }

    static final class Book {
        final String isbn;
        final String title;
        final List<BookCopy> copies = new ArrayList<>();
        final Deque<Member> reservations = new ArrayDeque<>();

        Book(String isbn, String title) {
            this.isbn = isbn;
            this.title = title;
        }

        BookCopy addCopy(String barcode) {
            BookCopy copy = new BookCopy(barcode, this);
            copies.add(copy);
            return copy;
        }

        Optional<BookCopy> copyFor(Member member) {
            for (BookCopy c : copies) {
                if (c.status == CopyStatus.AVAILABLE
                        || (c.status == CopyStatus.ON_HOLD && c.heldFor == member)) {
                    return Optional.of(c);
                }
            }
            return Optional.empty();
        }
    }

    static final class Loan {
        final BookCopy copy;
        final Member member;
        final LocalDate dueOn;

        Loan(BookCopy copy, Member member, LocalDate issuedOn) {
            this.copy = copy;
            this.member = member;
            this.dueOn = issuedOn.plusDays(14);
        }

        long daysLate(LocalDate returnedOn) {
            return Math.max(0, ChronoUnit.DAYS.between(dueOn, returnedOn));
        }
    }

    static final class Library {
        private final Map<String, Book> catalogue = new HashMap<>();

        void add(Book book) {
            catalogue.put(book.isbn, book);
        }

        String issue(Member member, String isbn, LocalDate today) {
            Book book = catalogue.get(isbn);
            if (!member.canBorrow()) {
                return member.name + ": loan limit reached";
            }
            Optional<BookCopy> copy = book.copyFor(member);
            if (copy.isEmpty()) {
                if (!book.reservations.contains(member)) {
                    book.reservations.addLast(member);
                }
                return member.name + ": all copies out, reserved (position " + book.reservations.size() + ")";
            }
            BookCopy c = copy.get();
            c.status = CopyStatus.ON_LOAN;
            c.heldFor = null;
            book.reservations.remove(member);
            Loan loan = new Loan(c, member, today);
            member.activeLoans.add(loan);
            return member.name + ": issued " + c.barcode + ", due " + loan.dueOn;
        }

        String giveBack(Member member, String barcode, LocalDate today) {
            Loan loan = member.activeLoans.stream()
                    .filter(l -> l.copy.barcode.equals(barcode))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("no such loan"));
            member.activeLoans.remove(loan);
            long fine = loan.daysLate(today) * member.type.finePerDay;
            Book book = loan.copy.book;
            Member next = book.reservations.peekFirst();
            if (next != null) {
                loan.copy.status = CopyStatus.ON_HOLD;           // keep it for the first reserver
                loan.copy.heldFor = next;
                return member.name + ": returned, fine Rs " + fine + "; held for " + next.name;
            }
            loan.copy.status = CopyStatus.AVAILABLE;
            return member.name + ": returned, fine Rs " + fine;
        }
    }

    public static void main(String[] args) {
        Library library = new Library();
        Book book = new Book("978-93", "Wings of Fire");
        book.addCopy("WF-1");
        library.add(book);

        Member priya = new Member("M1", "Priya", MemberType.STUDENT);
        Member suresh = new Member("M2", "Suresh", MemberType.STAFF);
        LocalDate day1 = LocalDate.of(2026, 6, 1);

        System.out.println(library.issue(priya, "978-93", day1));
        System.out.println(library.issue(suresh, "978-93", day1.plusDays(2)));
        System.out.println(library.giveBack(priya, "WF-1", day1.plusDays(18)));     // 4 days late
        System.out.println(library.issue(priya, "978-93", day1.plusDays(18)));      // held for Suresh
        System.out.println(library.issue(suresh, "978-93", day1.plusDays(19)));
    }
}
```

**Output:**

```text
Priya: issued WF-1, due 2026-06-15
Suresh: all copies out, reserved (position 1)
Priya: returned, fine Rs 20; held for Suresh
Priya: all copies out, reserved (position 2)
Suresh: issued WF-1, due 2026-07-04
```

## Extension Scenarios

### Notify members when their reserved book is held

<details>
<summary>Approach</summary>

Publish a `CopyHeld(member, book)` event from `giveBack`; a `ReservationNotifier` observer sends SMS/email. `Library` stays unaware of notification channels.

</details>

### Holds expire after 3 days

<details>
<summary>Approach</summary>

Store `heldUntil` on the copy; a scheduled job (or a check on each issue) releases expired holds to the next reserver. The copy status transitions become richer — consider a proper State pattern for `BookCopy`.

</details>

### Digital e-books with unlimited copies

<details>
<summary>Approach</summary>

Introduce an abstraction for "lendable item" with a `copyFor(member)` behaviour; e-books always return a licence instead of a physical copy. Keep physical-copy logic separate rather than adding `if (ebook)` checks to `Library`.

</details>

## Interview Discussion

- Clarify: copies vs titles, member types, reservations, fines, multiple branches.
- Key modelling insight: **Loan** is a first-class object (it holds dates and computes lateness), and **Book vs BookCopy** must be separate.
- Point out where rules live (limits in `MemberType`, lateness in `Loan`, queue in `Book`).
- Follow-ups: concurrency (two members issuing the last copy), search by author/subject (an index), audit history of loans.

## Key Takeaways

- Separate title (`Book`) from physical item (`BookCopy`); model `Loan` and reservations explicitly.
- Put rules with their data: limits/fines in `MemberType`, lateness in `Loan`.
- The `Library` service coordinates; events (Observer) handle notifications.
