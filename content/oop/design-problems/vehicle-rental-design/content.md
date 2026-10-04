# Vehicle Rental System Design

## Requirements

**Functional**

1. The company has **branches**; each branch has a fleet of **vehicles** of different types: scooter, bike, hatchback, SUV, van.
2. A customer **searches** for available vehicles of a type at a branch for a date range.
3. A customer **books** a specific vehicle for a date range; a vehicle cannot be double-booked.
4. **Price** depends on vehicle type: two-wheelers are charged per day; cars per day; vans per day plus a per-km charge (estimated km given at booking).
5. Bookings can be cancelled.

**Assumptions:** whole days; pick-up and drop at the same branch; payment out of scope.

## Entities and Responsibilities

| Class | Responsibility |
|-------|----------------|
| `Branch` | Owns its fleet; searches available vehicles |
| `Vehicle` | Registration, `VehicleType`, its bookings; knows whether it is free for a date range |
| `VehicleType` (enum) | Category and the pricing policy for that type |
| `DateRange` (value object) | Start/end, number of days, overlap test |
| `Booking` | Vehicle, customer, date range, price, status |
| `PricingPolicy` (interface) | Per-day, per-day + per-km, … |
| `RentalService` | Use cases: search, book, cancel |

## Relationships

- `Branch` ◆ `Vehicle` (a vehicle belongs to one branch at a time; in a real system it may be transferred — aggregation).
- `Vehicle` 1 — 0..* `Booking`.
- `VehicleType` → `PricingPolicy` (each type is configured with a strategy).

## Class Diagram

```text
 RentalService ──▶ Branch ◇──── 0..* Vehicle 1 ──── 0..* Booking ──▶ DateRange
                                   │
                                   └──▶ VehicleType ──▶ «interface» PricingPolicy
                                                          ◁┄ PerDayPricing
                                                          ◁┄ PerDayPlusKmPricing
```

## Design Decisions

- **Vehicle types as data, not subclasses:** scooters and vans differ in pricing and category, not in behaviour, so an enum plus a pricing **Strategy** avoids a `Scooter`/`Bike`/`Hatchback`… class hierarchy.
- **`DateRange` value object** owns the overlap rule (`a.start < b.end && b.start < a.end`), used by `Vehicle.isFreeFor`.
- **Availability is the vehicle's responsibility** (it holds its bookings); the branch filters its fleet.
- **Double booking** must be prevented atomically: `book` re-checks availability inside a synchronised section (a database uniqueness/locking check in production).

## Java Implementation

```java
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class VehicleRentalDesign {

    record DateRange(LocalDate start, LocalDate endExclusive) {
        DateRange {
            if (!endExclusive.isAfter(start)) {
                throw new IllegalArgumentException("end must be after start");
            }
        }

        long days() {
            return ChronoUnit.DAYS.between(start, endExclusive);
        }

        boolean overlaps(DateRange other) {
            return start.isBefore(other.endExclusive) && other.start.isBefore(endExclusive);
        }
    }

    interface PricingPolicy {
        long price(DateRange range, int estimatedKm);
    }

    record PerDayPricing(long perDay) implements PricingPolicy {
        public long price(DateRange range, int km) {
            return range.days() * perDay;
        }
    }

    record PerDayPlusKmPricing(long perDay, long perKm) implements PricingPolicy {
        public long price(DateRange range, int km) {
            return range.days() * perDay + km * perKm;
        }
    }

    enum VehicleType {
        SCOOTER(new PerDayPricing(400)),
        HATCHBACK(new PerDayPricing(1_800)),
        SUV(new PerDayPricing(3_500)),
        VAN(new PerDayPlusKmPricing(2_500, 12));

        final PricingPolicy pricing;

        VehicleType(PricingPolicy pricing) {
            this.pricing = pricing;
        }
    }

    enum BookingStatus { CONFIRMED, CANCELLED }

    static final class Booking {
        final String id;
        final Vehicle vehicle;
        final String customer;
        final DateRange range;
        final long price;
        BookingStatus status = BookingStatus.CONFIRMED;

        Booking(String id, Vehicle vehicle, String customer, DateRange range, long price) {
            this.id = id;
            this.vehicle = vehicle;
            this.customer = customer;
            this.range = range;
            this.price = price;
        }
    }

    static final class Vehicle {
        final String registration;
        final VehicleType type;
        private final List<Booking> bookings = new ArrayList<>();

        Vehicle(String registration, VehicleType type) {
            this.registration = registration;
            this.type = type;
        }

        boolean isFreeFor(DateRange range) {
            return bookings.stream()
                    .noneMatch(b -> b.status == BookingStatus.CONFIRMED && b.range.overlaps(range));
        }

        void addBooking(Booking booking) {
            bookings.add(booking);
        }
    }

    static final class Branch {
        final String city;
        private final List<Vehicle> fleet = new ArrayList<>();

        Branch(String city) {
            this.city = city;
        }

        void add(Vehicle vehicle) {
            fleet.add(vehicle);
        }

        List<Vehicle> available(VehicleType type, DateRange range) {
            List<Vehicle> result = new ArrayList<>();
            for (Vehicle v : fleet) {
                if (v.type == type && v.isFreeFor(range)) {
                    result.add(v);
                }
            }
            return result;
        }
    }

    static final class RentalService {
        private int nextId = 1;

        synchronized Optional<Booking> book(Vehicle vehicle, String customer, DateRange range, int estimatedKm) {
            if (!vehicle.isFreeFor(range)) {                      // re-check inside the lock
                return Optional.empty();
            }
            long price = vehicle.type.pricing.price(range, estimatedKm);
            Booking booking = new Booking("BK" + nextId++, vehicle, customer, range, price);
            vehicle.addBooking(booking);
            return Optional.of(booking);
        }

        synchronized void cancel(Booking booking) {
            booking.status = BookingStatus.CANCELLED;
        }
    }

    public static void main(String[] args) {
        Branch trichy = new Branch("Trichy");
        Vehicle van = new Vehicle("TN45VN0001", VehicleType.VAN);
        trichy.add(van);
        trichy.add(new Vehicle("TN45SC0007", VehicleType.SCOOTER));

        RentalService service = new RentalService();
        DateRange tour = new DateRange(LocalDate.of(2026, 4, 10), LocalDate.of(2026, 4, 13));
        DateRange overlapping = new DateRange(LocalDate.of(2026, 4, 12), LocalDate.of(2026, 4, 14));

        System.out.println("vans free: " + trichy.available(VehicleType.VAN, tour).size());
        Booking first = service.book(van, "Selva", tour, 450).orElseThrow();
        System.out.println(first.id + " price Rs " + first.price);
        System.out.println("second booking ok? " + service.book(van, "Hari", overlapping, 100).isPresent());
        service.cancel(first);
        System.out.println("after cancel, vans free: " + trichy.available(VehicleType.VAN, overlapping).size());
        System.out.println("scooter 3 days: Rs " + VehicleType.SCOOTER.pricing.price(tour, 0));
    }
}
```

**Output:**

```text
vans free: 1
BK1 price Rs 12900
second booking ok? false
after cancel, vans free: 1
scooter 3 days: Rs 1200
```

(Van: 3 days × 2,500 + 450 km × 12 = 7,500 + 5,400 = 12,900.)

## Extension Scenarios

### Weekend surcharge or seasonal pricing

<details>
<summary>Approach</summary>

Wrap a type's pricing in a decorator (`SeasonalSurcharge(PricingPolicy inner, multiplier, season)`), or move pricing configuration out of the enum into a `PricingCatalog` loaded from configuration so prices change without code changes.

</details>

### One-way rentals (pick up in Trichy, drop in Madurai)

<details>
<summary>Approach</summary>

Add drop branch to `Booking`, an inter-branch fee component in pricing, and a fleet-transfer operation that moves the vehicle to the destination branch on return (aggregation, not composition, is why this is easy).

</details>

### Search across all branches in a city

<details>
<summary>Approach</summary>

A `Fleet` or `BranchDirectory` service aggregates `available(...)` across branches; for scale, maintain an availability index in a database rather than scanning bookings in memory.

</details>

## Interview Discussion

- Clarify vehicle types, pricing models, booking granularity (hours vs days) and branches.
- Defend "types as data + pricing strategy" over a deep vehicle class hierarchy.
- Show the overlap rule and explain how you prevent double booking under concurrency.
- A follow-up interviewers like: model the reservation lifecycle (reserved → picked up → returned → closed) with the State pattern, and optional add-ons (insurance, GPS, child seat) as decorators on the price.

## Key Takeaways

- Use enums + strategies when types differ in configuration rather than behaviour.
- A `DateRange` value object centralises overlap logic.
- Vehicles know their bookings; branches search; the service books atomically.
