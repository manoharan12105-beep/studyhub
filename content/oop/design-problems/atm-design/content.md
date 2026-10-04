# ATM Design

## Requirements

**Functional**

1. A customer inserts a **card**, enters a **PIN**, and after successful authentication can **check balance**, **withdraw cash** and **eject** the card.
2. Three wrong PIN attempts retain the card.
3. Withdrawal must be a multiple of ₹100, within the account balance and the ATM's available cash; the ATM dispenses the **fewest notes** possible from ₹500, ₹200 and ₹100 notes.
4. Operations not valid in the current step (withdraw before PIN, PIN with no card) are rejected.

**Assumptions:** the bank's account system is an external service; one session at a time per ATM; daily limits and receipts are out of scope.

## Entities and Responsibilities

| Class | Responsibility |
|-------|----------------|
| `Atm` | Context of the session: current state, inserted card, failed attempts; delegates actions to its state |
| `AtmState` (interface) + `Idle`, `CardInserted`, `Authenticated`, `CardRetained` | What each action does in each step and which step comes next |
| `Card` (record) | Card number, linked account number |
| `BankService` (interface) | Verify PIN, read balance, debit account — the external bank |
| `CashDispenser` | Note inventory; plans and dispenses a withdrawal with the fewest notes |

## Relationships

- `Atm` ◆ `CashDispenser` (the dispenser is part of the machine).
- `Atm` → `BankService` (dependency on an abstraction; injected).
- `Atm` → `AtmState` (current state; states switch it).
- `Atm` — 0..1 `Card` (the card currently inserted).

## Class Diagram

```text
 Atm (Context) ── state ──▶ «interface» AtmState
   │  - card, failedPins                ◁┄ Idle ◁┄ CardInserted ◁┄ Authenticated ◁┄ CardRetained
   │
   ├◆─▶ CashDispenser (notes: Map<denomination, count>)
   └──▶ «interface» BankService ◁┄ InMemoryBank (test double / real adapter in production)
```

```text
 State machine:
   Idle ──insertCard──▶ CardInserted ──correct PIN──▶ Authenticated ──eject──▶ Idle
                          │  └──3 wrong PINs──▶ CardRetained
                          └──eject──▶ Idle
```

## Design Decisions

- **State pattern** for the session: each step allows different actions, and the step changes over time. Default methods reject everything; each state implements only what is valid.
- **Dependency Inversion:** the ATM talks to the bank through `BankService`, so the session logic is testable with an in-memory bank and independent of the bank's protocol (an **Adapter** in production).
- **Withdrawal ordering:** plan notes first, then debit the account, then dispense — so the account is never debited when the ATM cannot dispense the amount. (A real ATM also needs reversal if dispensing fails mechanically.)
- **Fewest notes:** for ₹500/₹200/₹100 a greedy choice can fail when a larger note is short (e.g. no ₹100 notes), so the planner tries combinations with a small search over the counts instead of pure greedy.

## Java Implementation

```java
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

public class AtmDesign {

    record Card(String number, String accountNumber) { }

    interface BankService {
        boolean verifyPin(Card card, String pin);
        long balance(String accountNumber);
        void debit(String accountNumber, long amount);
    }

    static final class InMemoryBank implements BankService {
        private final Map<String, String> pins = new LinkedHashMap<>();
        private final Map<String, Long> balances = new LinkedHashMap<>();

        void open(Card card, String pin, long balance) {
            pins.put(card.number(), pin);
            balances.put(card.accountNumber(), balance);
        }

        public boolean verifyPin(Card card, String pin) {
            return pin.equals(pins.get(card.number()));
        }

        public long balance(String accountNumber) {
            return balances.get(accountNumber);
        }

        public void debit(String accountNumber, long amount) {
            balances.merge(accountNumber, -amount, Long::sum);
        }
    }

    // Plans the fewest notes for an amount, considering what is actually in the machine
    static final class CashDispenser {
        private final Map<Integer, Integer> notes = new LinkedHashMap<>();   // denomination → count

        CashDispenser(int fiveHundreds, int twoHundreds, int hundreds) {
            notes.put(500, fiveHundreds);
            notes.put(200, twoHundreds);
            notes.put(100, hundreds);
        }

        Optional<Map<Integer, Integer>> plan(long amount) {
            Map<Integer, Integer> best = null;
            int bestCount = Integer.MAX_VALUE;
            for (int a = Math.min(notes.get(500), (int) (amount / 500)); a >= 0; a--) {
                long left = amount - 500L * a;
                for (int b = Math.min(notes.get(200), (int) (left / 200)); b >= 0; b--) {
                    long rest = left - 200L * b;
                    if (rest % 100 == 0 && rest / 100 <= notes.get(100) && a + b + rest / 100 < bestCount) {
                        bestCount = a + b + (int) (rest / 100);
                        best = Map.of(500, a, 200, b, 100, (int) (rest / 100));
                    }
                }
            }
            return Optional.ofNullable(best);
        }

        void dispense(Map<Integer, Integer> plan) {
            plan.forEach((note, count) -> notes.merge(note, -count, Integer::sum));
        }
    }

    interface AtmState {
        default void insertCard(Atm atm, Card card) {
            System.out.println("rejected: cannot insert card now");
        }

        default void enterPin(Atm atm, String pin) {
            System.out.println("rejected: insert a card first");
        }

        default void withdraw(Atm atm, long amount) {
            System.out.println("rejected: authenticate first");
        }

        default void eject(Atm atm) {
            System.out.println("rejected: no card to eject");
        }
    }

    static final class Idle implements AtmState {
        public void insertCard(Atm atm, Card card) {
            atm.card = card;
            atm.failedPins = 0;
            System.out.println("card read, enter PIN");
            atm.state = new CardInserted();
        }
    }

    static final class CardInserted implements AtmState {
        public void enterPin(Atm atm, String pin) {
            if (atm.bank.verifyPin(atm.card, pin)) {
                System.out.println("PIN ok");
                atm.state = new Authenticated();
            } else if (++atm.failedPins == 3) {
                System.out.println("3 wrong PINs: card retained");
                atm.card = null;
                atm.state = new CardRetained();
            } else {
                System.out.println("wrong PIN (" + atm.failedPins + "/3)");
            }
        }

        public void eject(Atm atm) {
            atm.ejectCard();
        }
    }

    static final class Authenticated implements AtmState {
        public void withdraw(Atm atm, long amount) {
            if (amount <= 0 || amount % 100 != 0) {
                System.out.println("amount must be a positive multiple of 100");
                return;
            }
            if (amount > atm.bank.balance(atm.card.accountNumber())) {
                System.out.println("insufficient balance");
                return;
            }
            Optional<Map<Integer, Integer>> plan = atm.dispenser.plan(amount);
            if (plan.isEmpty()) {
                System.out.println("ATM cannot dispense " + amount);
                return;
            }
            atm.bank.debit(atm.card.accountNumber(), amount);     // debit only after a plan exists
            atm.dispenser.dispense(plan.get());
            System.out.println("dispensed " + amount + " as 500x" + plan.get().get(500)
                    + " 200x" + plan.get().get(200) + " 100x" + plan.get().get(100));
        }

        public void eject(Atm atm) {
            atm.ejectCard();
        }
    }

    static final class CardRetained implements AtmState {
        // everything rejected until a technician resets the machine
    }

    static final class Atm {
        final BankService bank;
        final CashDispenser dispenser;
        AtmState state = new Idle();
        Card card;
        int failedPins;

        Atm(BankService bank, CashDispenser dispenser) {
            this.bank = bank;
            this.dispenser = dispenser;
        }

        void insertCard(Card c) { state.insertCard(this, c); }
        void enterPin(String pin) { state.enterPin(this, pin); }
        void withdraw(long amount) { state.withdraw(this, amount); }
        void eject() { state.eject(this); }

        void ejectCard() {
            card = null;
            System.out.println("card ejected");
            state = new Idle();
        }
    }

    public static void main(String[] args) {
        InMemoryBank bank = new InMemoryBank();
        Card card = new Card("4000-11", "SB-77");
        bank.open(card, "2580", 5_000);
        Atm atm = new Atm(bank, new CashDispenser(4, 2, 0));        // no 100-rupee notes

        atm.withdraw(500);
        atm.insertCard(card);
        atm.enterPin("1111");
        atm.enterPin("2580");
        atm.withdraw(1_400);
        atm.withdraw(300);                                          // impossible without 100s
        atm.withdraw(9_000);
        System.out.println("balance: " + bank.balance("SB-77"));
        atm.eject();
    }
}
```

**Output:**

```text
rejected: authenticate first
card read, enter PIN
wrong PIN (1/3)
PIN ok
dispensed 1400 as 500x2 200x2 100x0
ATM cannot dispense 300
insufficient balance
balance: 3600
card ejected
```

Why not pure greedy? Suppose the machine holds ₹500 and ₹200 notes but no ₹100 notes. For ₹600, greedy takes one ₹500 note and then cannot make the remaining ₹100, although 3 × ₹200 works. The small search over note counts finds a valid combination whenever one exists, and among valid ones keeps the fewest notes.

## Extension Scenarios

### Deposit cash and mini-statement

<details>
<summary>Approach</summary>

Add `deposit(amount)` and `miniStatement()` to `AtmState` with "rejected" defaults, implement them only in `Authenticated`, and add the corresponding operations to `BankService`. `Idle` and `CardInserted` are untouched.

</details>

### Mechanical failure after debiting

<details>
<summary>Approach</summary>

Make the withdrawal a two-step transaction: reserve (hold) the amount at the bank, dispense, then confirm; if dispensing fails, release the hold. Model the steps as **Command** objects with `undo()` so failures can be reversed and logged.

</details>

### Daily withdrawal limit per card

<details>
<summary>Approach</summary>

Add a `WithdrawalLimitPolicy` (Strategy) consulted in `Authenticated.withdraw`; limits may differ per card type. The bank usually enforces this, so it may simply be another `BankService` check.

</details>

## Interview Discussion

- Draw the state machine first; it drives the class design.
- Explain the ordering of plan → debit → dispense and what happens on failures.
- Discuss why the bank is behind an interface (testing, different bank networks).
- Typical follow-ups: concurrency between the ATM and other channels on the same account (the bank serialises debits), denominations configuration, cash refill and low-cash alerts (Observer).

## Key Takeaways

- The State pattern models the ATM session cleanly; invalid actions are rejected by default.
- Keep the bank behind an abstraction; keep note planning in `CashDispenser`.
- Never debit before you know the cash can be dispensed; plan for failure and reversal.
