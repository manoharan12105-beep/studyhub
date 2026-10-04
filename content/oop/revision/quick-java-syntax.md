# Java OOP Syntax

Snippets to recall exact syntax quickly.

## Class, Constructor Chaining, this/super

```java
class Account {
    private final String id;
    private long balance;

    Account(String id) {
        this(id, 0);                         // chain to another constructor
    }

    Account(String id, long opening) {
        this.id = java.util.Objects.requireNonNull(id);
        this.balance = opening;
    }
}

class Savings extends Account {
    Savings(String id) {
        super(id);                           // must be first
    }
}
```

## Interface With Default, Static and Private Methods

```java
interface Formatter {
    String format(String s);                       // abstract

    default String bold(String s) {                // default
        return wrap("**", format(s));
    }

    static Formatter upper() {                     // static factory
        return String::toUpperCase;
    }

    private String wrap(String m, String s) {      // private helper (Java 9)
        return m + s + m;
    }
}
```

## Abstract Class With a Template Method

```java
abstract class Exporter {
    final String export(String data) {             // template method
        return header() + body(data);
    }

    protected String header() {                    // hook
        return "";
    }

    protected abstract String body(String data);   // step
}
```

## equals, hashCode, toString

```java
final class Point {
    private final int x;
    private final int y;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point)) return false;
        Point p = (Point) o;
        return x == p.x && y == p.y;
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(x, y);
    }

    @Override
    public String toString() {
        return "(" + x + ", " + y + ")";
    }
}
```

## Record, Enum, Sealed Interface

```java
record Money(long paise, String currency) {
    Money {                                         // compact constructor
        if (paise < 0) throw new IllegalArgumentException("negative");
    }
}

enum Status {
    ACTIVE("A"), BLOCKED("B");
    private final String code;
    Status(String code) { this.code = code; }
    String code() { return code; }
}

sealed interface Result permits Ok, Failed { }
record Ok(String value) implements Result { }
record Failed(String reason) implements Result { }
```

## Pattern Matching instanceof, Casting

```java
static String describe(Object o) {
    if (o instanceof String s && !s.isEmpty()) {
        return "text of length " + s.length();
    }
    return "other";
}
```

## Comparable and Comparator

```java
record Employee(String name, long salary) implements Comparable<Employee> {
    public int compareTo(Employee other) {
        return Long.compare(salary, other.salary);
    }
}

// list.sort(Comparator.comparing(Employee::name).thenComparingLong(Employee::salary));
```

## Generics With Bounds and PECS

```java
static <T extends Comparable<T>> T max(java.util.List<T> items) {
    T best = items.get(0);
    for (T item : items) {
        if (item.compareTo(best) > 0) best = item;
    }
    return best;
}

static <T> void copy(java.util.List<? extends T> src, java.util.List<? super T> dst) {
    dst.addAll(src);
}
```

## Singleton (Holder Idiom) and Builder Skeleton

```java
final class Config {
    private Config() { }
    private static final class Holder { static final Config INSTANCE = new Config(); }
    static Config get() { return Holder.INSTANCE; }
}

final class Pizza {
    private final String size;
    private Pizza(Builder b) { this.size = b.size; }

    static final class Builder {
        private String size = "medium";
        Builder size(String s) { this.size = s; return this; }
        Pizza build() { return new Pizza(this); }
    }
}
```

## Custom Exception With Cause

```java
class StorageException extends RuntimeException {
    StorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
```
