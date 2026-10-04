# Parking Lot Design

## Requirements

**Functional**

1. A parking lot has several floors; each floor has spots of different sizes: **bike**, **compact** (cars) and **large** (vans, buses).
2. A vehicle entering is assigned a suitable free spot and receives a **ticket** (ticket id, spot, entry time).
3. A vehicle leaving presents the ticket; the system frees the spot and computes the **fee** from the duration and vehicle type.
4. The lot reports free spots per type.

**Assumptions / non-functional**

- A vehicle fits its own spot type; cars may also use large spots when compact spots are full (bikes stay in bike spots).
- Fees are charged per started hour, with rates per vehicle type.
- Multiple entry gates may assign spots concurrently — assignment must not give one spot to two vehicles.

**Out of scope:** payments processing details, reservations, EV charging, number-plate recognition.

## Entities and Responsibilities

| Class | Knows | Does |
|-------|-------|------|
| `Vehicle` (record) | registration, `VehicleType` | — (value object) |
| `ParkingSpot` | id, floor, `SpotType`, current vehicle | `canFit(type)`, `park`, `vacate` |
| `ParkingFloor` | its spots | find a free spot for a vehicle type |
| `ParkingLot` | floors, active tickets | `park(vehicle, time)`, `exit(ticketId, time)` — coordinates use cases |
| `Ticket` | id, vehicle, spot, entry time | — |
| `SpotAllocationStrategy` (interface) | — | choose a spot (nearest floor first, spread load…) |
| `PricingPolicy` (interface) | rates | compute fee from type and duration |

## Relationships

- `ParkingLot` ◆ `ParkingFloor` ◆ `ParkingSpot` — composition (spots exist only as part of the lot).
- `Ticket` → `Vehicle`, `Ticket` → `ParkingSpot` — associations.
- `ParkingLot` → `SpotAllocationStrategy`, `PricingPolicy` — dependencies on abstractions (injected).

## Class Diagram

```text
 ParkingLot ◆──── 1..* ParkingFloor ◆──── 1..* ParkingSpot ──── 0..1 Vehicle
   │  - activeTickets: Map<String, Ticket>                      (SpotType, VehicleType: enums)
   │
   ├──uses──▶ «interface» SpotAllocationStrategy ◁┄┄ LowestFloorFirst
   └──uses──▶ «interface» PricingPolicy           ◁┄┄ HourlyPricing

 Ticket ──▶ Vehicle, Ticket ──▶ ParkingSpot, entryTime
```

## Design Decisions

- **Enums** for `VehicleType` and `SpotType`; the "which spot fits which vehicle" rule lives in `SpotType.canFit(VehicleType)` (data and rule together).
- **Strategy** for spot allocation and for pricing: both vary by business (malls vs airports) and change over time — OCP.
- **Information Expert:** a spot knows whether it is free and what fits; a floor searches its spots; the lot coordinates.
- **Time is a parameter** (`LocalDateTime` passed in) so fee logic is deterministic and testable.
- **Concurrency:** `park` and `exit` are `synchronized` on the lot in this simple version; a real system would lock per floor/spot or use database transactions.

## Java Implementation

```java
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class ParkingLotDesign {

    enum VehicleType { BIKE, CAR, VAN }

    enum SpotType {
        BIKE, COMPACT, LARGE;

        boolean canFit(VehicleType type) {
            switch (this) {
                case BIKE: return type == VehicleType.BIKE;
                case COMPACT: return type == VehicleType.CAR;
                default: return type == VehicleType.CAR || type == VehicleType.VAN;
            }
        }
    }

    record Vehicle(String registration, VehicleType type) { }

    static final class ParkingSpot {
        private final String id;
        private final SpotType type;
        private Vehicle vehicle;

        ParkingSpot(String id, SpotType type) {
            this.id = id;
            this.type = type;
        }

        boolean isFreeFor(VehicleType vehicleType) {
            return vehicle == null && type.canFit(vehicleType);
        }

        void park(Vehicle v) {
            if (!isFreeFor(v.type())) {
                throw new IllegalStateException("spot " + id + " not available");
            }
            vehicle = v;
        }

        void vacate() {
            vehicle = null;
        }

        String id() {
            return id;
        }

        SpotType type() {
            return type;
        }
    }

    static final class ParkingFloor {
        private final int number;
        private final List<ParkingSpot> spots = new ArrayList<>();

        ParkingFloor(int number, int bikes, int compact, int large) {
            this.number = number;
            for (int i = 1; i <= bikes; i++) spots.add(new ParkingSpot(number + "-B" + i, SpotType.BIKE));
            for (int i = 1; i <= compact; i++) spots.add(new ParkingSpot(number + "-C" + i, SpotType.COMPACT));
            for (int i = 1; i <= large; i++) spots.add(new ParkingSpot(number + "-L" + i, SpotType.LARGE));
        }

        Optional<ParkingSpot> freeSpotFor(VehicleType type) {
            // prefer exact-size spots before larger ones (COMPACT before LARGE for cars)
            return spots.stream()
                    .filter(s -> s.isFreeFor(type))
                    .min((a, b) -> a.type().compareTo(b.type()));
        }

        long freeCount(SpotType type) {
            return spots.stream().filter(s -> s.type() == type && s.vehicle == null).count();
        }
    }

    interface SpotAllocationStrategy {
        Optional<ParkingSpot> choose(List<ParkingFloor> floors, VehicleType type);
    }

    static final class LowestFloorFirst implements SpotAllocationStrategy {
        public Optional<ParkingSpot> choose(List<ParkingFloor> floors, VehicleType type) {
            for (ParkingFloor floor : floors) {
                Optional<ParkingSpot> spot = floor.freeSpotFor(type);
                if (spot.isPresent()) {
                    return spot;
                }
            }
            return Optional.empty();
        }
    }

    interface PricingPolicy {
        long feeRupees(VehicleType type, Duration parked);
    }

    static final class HourlyPricing implements PricingPolicy {
        private final Map<VehicleType, Long> ratePerHour;

        HourlyPricing(Map<VehicleType, Long> ratePerHour) {
            this.ratePerHour = Map.copyOf(ratePerHour);
        }

        public long feeRupees(VehicleType type, Duration parked) {
            long minutes = Math.max(1, parked.toMinutes());
            long startedHours = (minutes + 59) / 60;               // charge per started hour
            return startedHours * ratePerHour.get(type);
        }
    }

    record Ticket(String id, Vehicle vehicle, ParkingSpot spot, LocalDateTime entry) { }

    static final class ParkingLot {
        private final List<ParkingFloor> floors;
        private final SpotAllocationStrategy allocation;
        private final PricingPolicy pricing;
        private final Map<String, Ticket> activeTickets = new HashMap<>();
        private int nextTicket = 1;

        ParkingLot(List<ParkingFloor> floors, SpotAllocationStrategy allocation, PricingPolicy pricing) {
            this.floors = List.copyOf(floors);
            this.allocation = allocation;
            this.pricing = pricing;
        }

        synchronized Optional<Ticket> park(Vehicle vehicle, LocalDateTime now) {
            Optional<ParkingSpot> spot = allocation.choose(floors, vehicle.type());
            if (spot.isEmpty()) {
                return Optional.empty();                             // lot full for this type
            }
            spot.get().park(vehicle);
            Ticket ticket = new Ticket("T" + nextTicket++, vehicle, spot.get(), now);
            activeTickets.put(ticket.id(), ticket);
            return Optional.of(ticket);
        }

        synchronized long exit(String ticketId, LocalDateTime now) {
            Ticket ticket = activeTickets.remove(ticketId);
            if (ticket == null) {
                throw new IllegalArgumentException("unknown or used ticket " + ticketId);
            }
            ticket.spot().vacate();
            return pricing.feeRupees(ticket.vehicle().type(), Duration.between(ticket.entry(), now));
        }

        long freeSpots(SpotType type) {
            return floors.stream().mapToLong(f -> f.freeCount(type)).sum();
        }
    }

    public static void main(String[] args) {
        ParkingLot lot = new ParkingLot(
                List.of(new ParkingFloor(0, 1, 1, 1), new ParkingFloor(1, 0, 1, 0)),
                new LowestFloorFirst(),
                new HourlyPricing(Map.of(VehicleType.BIKE, 10L, VehicleType.CAR, 40L, VehicleType.VAN, 80L)));

        LocalDateTime nine = LocalDateTime.of(2026, 5, 4, 9, 0);
        Ticket car1 = lot.park(new Vehicle("TN45AB1001", VehicleType.CAR), nine).orElseThrow();
        Ticket car2 = lot.park(new Vehicle("TN45AB1002", VehicleType.CAR), nine).orElseThrow();
        Ticket car3 = lot.park(new Vehicle("TN45AB1003", VehicleType.CAR), nine).orElseThrow();
        System.out.println(car1.spot().id() + " " + car2.spot().id() + " " + car3.spot().id());
        System.out.println("van gets a spot? " + lot.park(new Vehicle("TN45V9", VehicleType.VAN), nine).isPresent());
        System.out.println("free compact: " + lot.freeSpots(SpotType.COMPACT) + ", free large: " + lot.freeSpots(SpotType.LARGE));

        System.out.println("fee: Rs " + lot.exit(car1.id(), nine.plusMinutes(130)));   // 3 started hours
        System.out.println("free compact after exit: " + lot.freeSpots(SpotType.COMPACT));
    }
}
```

**Output:**

```text
0-C1 0-L1 1-C1
van gets a spot? false
free compact: 0, free large: 0
fee: Rs 120
free compact after exit: 1
```

The second car takes the large spot on floor 0 (allowed by `canFit`) because the lowest-floor-first strategy prefers floor 0; a different strategy could keep large spots for vans. That is exactly the kind of policy that should be swappable.

## Extension Scenarios

### Reserve large spots for vans unless the lot is nearly full

<details>
<summary>Approach</summary>

Write a new `SpotAllocationStrategy` (`SizeAwareAllocation`) that searches all floors for exact-size spots first and uses larger spots only when no exact spot exists anywhere. Inject it instead of `LowestFloorFirst`; no other class changes.

</details>

### Different prices on weekends, or a monthly pass

<details>
<summary>Approach</summary>

New `PricingPolicy` implementations: `WeekendAwarePricing` (wrapping hourly pricing with a multiplier — a decorator) and pass holders handled by a `PassAwarePricing` that checks a `PassRepository` and returns 0 for valid passes.

</details>

### Electric-vehicle charging spots

<details>
<summary>Approach</summary>

Add `SpotType.EV_CHARGING` (fits cars), an EV flag or `VehicleType.ELECTRIC_CAR`, and a charging fee component. Pricing becomes a composite: parking fee + charging fee from the charger's meter reading.

</details>

### Multiple gates updating the lot concurrently

<details>
<summary>Approach</summary>

Replace the coarse `synchronized` methods with finer-grained locking (per floor) or an atomic compare-and-set on each spot's occupant, and keep ticket ids unique (atomic counter or UUID). In a distributed deployment, the database (row locks / unique constraints on spot occupancy) is the source of truth.

</details>

## Interview Discussion

- Start by asking: vehicle and spot types? Payment at exit or entry? Multiple floors and gates? Real-time display boards?
- Explain **why** allocation and pricing are strategies (they vary per customer and over time).
- Mention concurrency for the last free spot, and lost/duplicate tickets.
- Discuss what lives where: the fit rule in `SpotType`, the search in `ParkingFloor`, the use case in `ParkingLot`.
- Possible follow-ups: display boards (Observer on spot changes), entry/exit gate classes, hourly vs flat pricing, persisting state.

## Key Takeaways

- Entities: lot ◆ floors ◆ spots, vehicles, tickets; enums for types with the fit rule inside.
- Strategy for allocation and pricing; time passed in for testability.
- Coordinate use cases in `ParkingLot`; keep rules with the data that owns them.
- Address concurrency for spot assignment explicitly.
