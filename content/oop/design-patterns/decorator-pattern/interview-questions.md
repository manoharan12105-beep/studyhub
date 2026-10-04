# Decorator — Interview Questions

## Conceptual

### Q1. What is the Decorator pattern?

<details>
<summary>Answer</summary>

A structural pattern that adds responsibilities to an object dynamically by wrapping it in another object that implements the same interface, does extra work and delegates to the wrapped object. Because wrappers share the interface, they can be stacked in any combination — logging around caching around retrying around the real service.

</details>

### Q2. Why prefer Decorator over subclassing for adding features?

<details>
<summary>Answer</summary>

Subclassing fixes behaviour at compile time and needs a class for every combination of features (an explosion), and it cannot extend final classes. Decorators are composed at runtime, each feature is one small class, combinations need no new classes, and the original class is not modified.

</details>

### Q3. Explain how `java.io` uses Decorator.

<details>
<summary>Answer</summary>

`InputStream` is the component. `FileInputStream` is a concrete component. `FilterInputStream` subclasses such as `BufferedInputStream`, `DataInputStream` and `GZIPInputStream` wrap another `InputStream` and add buffering, typed reads or decompression. They can be chained: `new DataInputStream(new BufferedInputStream(new FileInputStream(path)))`. `InputStreamReader`, in contrast, is an adapter: it changes the interface from bytes to characters.

</details>

### Q4. Decorator vs Proxy?

<details>
<summary>Answer</summary>

Structurally the same — both implement the subject's interface and hold a reference to it. The intent differs: a decorator adds behaviour and is usually composed freely by clients, possibly many layers deep; a proxy controls access to the subject (lazy creation, remote access, permission checks, caching) and often creates or manages the subject itself, with clients unaware a proxy exists.

</details>

### Q5. What are the drawbacks of Decorator?

<details>
<summary>Answer</summary>

Many small objects and deeper call stacks make debugging harder; wrapping order matters and can be misconfigured; large interfaces require lots of forwarding code; and code that checks the concrete class or object identity of the wrapped object breaks.

</details>

## Applied

### Q6. Add GZIP compression and encryption to a `FileStorage.save(name, bytes)` that some customers need, in any combination. How?

<details>
<summary>Answer</summary>

Define `interface Storage { void save(String name, byte[] data); byte[] load(String name); }`. Implement `FileStorage`. Write `CompressingStorage` and `EncryptingStorage`, each wrapping a `Storage`: on save, transform the bytes and delegate; on load, delegate and reverse the transformation. Configure per customer: `new EncryptingStorage(new CompressingStorage(new FileStorage(dir)), key)` — compress first, then encrypt, since encrypted data does not compress well.

</details>
