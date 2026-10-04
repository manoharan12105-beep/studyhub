# Entity Relationships, Owning Side and mappedBy — Practice

### P1. Who owns it?

**Difficulty:** Easy · **Type:** MCQ

`Order` has `@OneToMany(mappedBy = "order") List<OrderItem> items`; `OrderItem` has `@ManyToOne @JoinColumn(name = "order_id") Order order`. Which side is the owning side?

- A) `Order.items`
- B) `OrderItem.order`
- C) Both
- D) Neither; the join table owns it

<details>
<summary>Answer</summary>

**Answer:** B) `OrderItem.order`

**Explanation:** It has no `mappedBy` and maps the `order_id` foreign key.

</details>

### P2. Write the mapping

**Difficulty:** Medium · **Type:** Coding

Map `Post` (1) — `Comment` (many) bidirectionally, lazily, with a helper to add comments.

<details>
<summary>Answer</summary>

```java
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;

@Entity
class Post {
    @Id
    @GeneratedValue
    private Long id;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    void addComment(Comment comment) {
        comments.add(comment);
        comment.setPost(this);
    }
}

@Entity
class Comment {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    void setPost(Post post) {
        this.post = post;
    }
}
```

</details>

### P3. Unexpected table

**Difficulty:** Medium · **Type:** Debugging

After adding `@OneToMany List<OrderItem> items` to `Order` (and `@ManyToOne Order order` already exists in `OrderItem`), Hibernate creates a table `orders_items`. Why?

<details>
<summary>Answer</summary>

`mappedBy = "order"` is missing, so Hibernate treats the collection as a separate unidirectional one-to-many and maps it with a join table. Add `mappedBy = "order"`.

</details>

### P4. Many-to-many with data

**Difficulty:** Hard · **Type:** Design

Students enrol in courses, and each enrolment has an enrolment date and a grade. Design the mapping.

<details>
<summary>Answer</summary>

An `Enrollment` entity with its own id (or an embedded id of student+course), `@ManyToOne Student student`, `@ManyToOne Course course`, `LocalDate enrolledOn`, `String grade`, and a unique constraint on `(student_id, course_id)`. `Student` and `Course` may have `@OneToMany(mappedBy = …)` collections of enrolments if navigation is needed. No `@ManyToMany`.

</details>
