# Banker's Algorithm — Fundamentals

**Module:** Deadlocks · **Interview priority:** Core

## Concept

The **Banker's algorithm** (Dijkstra) is the deadlock-**avoidance** algorithm for resources with **multiple instances**. Like a bank that never lends out cash in a way that could leave it unable to satisfy every customer's credit limit, the OS grants a request only if the system stays in a **safe state**.

It has two parts:

1. **Safety algorithm** — is the current state safe? If yes, find a safe sequence.
2. **Resource-request algorithm** — should this particular request be granted now?

## Why It Matters

It is the standard "show your working" deadlock question: compute the Need matrix, run the safety check, and decide a request. Getting the matrices and the order of steps right is all that is needed.

## How It Works

### Data structures (n processes, m resource types)

| Name | Shape | Meaning |
|------|-------|---------|
| **Available** | m | Free instances of each resource type now |
| **Max** | n × m | Maximum each process may ever request |
| **Allocation** | n × m | Instances currently held by each process |
| **Need** | n × m | Still may request: **Need = Max − Allocation** |

Vector comparison: X ≤ Y means X[j] ≤ Y[j] for **every** resource type j.

### Safety algorithm

```pseudocode
Work = Available
Finish[i] = false for all i
repeat:
    find a process i with Finish[i] == false and Need[i] ≤ Work
    if found:
        Work = Work + Allocation[i]      // i finishes and returns everything
        Finish[i] = true
        append i to the safe sequence
until no such process exists
safe  ⇔  Finish[i] == true for all i
```

StudyHub scans P0, P1, … in order and, after a process finishes, continues with the next process (wrapping around), until a full pass finds nobody. Any valid safe sequence is a correct answer; different scan orders can give different sequences.

### Resource-request algorithm (process i requests vector Request)

1. If Request > Need[i] → **error**: the process exceeded its declared maximum.
2. If Request > Available → the process **waits**: resources are not free.
3. **Pretend** to allocate: Available −= Request; Allocation[i] += Request; Need[i] −= Request.
4. Run the safety algorithm. **Safe → grant.** **Unsafe → restore the old state; the process waits.**

Complexity: the safety algorithm takes O(m × n²) time.

## Example

Three resource types A, B, C. Totals: A = 8, B = 5, C = 5.

| Process | Allocation (A B C) | Max (A B C) | Need = Max − Allocation |
|---------|--------------------|-------------|-------------------------|
| P0 | 1 1 0 | 4 3 2 | 3 2 2 |
| P1 | 2 0 1 | 3 2 2 | 1 2 1 |
| P2 | 1 0 2 | 5 1 3 | 4 1 1 |
| P3 | 0 1 1 | 2 2 2 | 2 1 1 |
| P4 | 2 1 0 | 4 2 1 | 2 1 1 |

Allocated totals = (6, 3, 4), so **Available = (8, 5, 5) − (6, 3, 4) = (2, 2, 1)**.

### Safety check

| Step | Process | Need ≤ Work? | Work after |
|------|---------|--------------|------------|
| start | — | — | (2, 2, 1) |
| 1 | P0 | (3,2,2) ≤ (2,2,1)? **No** — A: 3 > 2 | (2, 2, 1) |
| 2 | P1 | (1,2,1) ≤ (2,2,1)? **Yes** | (2,2,1) + (2,0,1) = (4, 2, 2) |
| 3 | P2 | (4,1,1) ≤ (4,2,2)? **Yes** | + (1,0,2) = (5, 2, 4) |
| 4 | P3 | (2,1,1) ≤ (5,2,4)? **Yes** | + (0,1,1) = (5, 3, 5) |
| 5 | P4 | (2,1,1) ≤ (5,3,5)? **Yes** | + (2,1,0) = (7, 4, 5) |
| 6 | P0 | (3,2,2) ≤ (7,4,5)? **Yes** | + (1,1,0) = (8, 5, 5) |

All finish: **safe**, sequence **⟨P1, P2, P3, P4, P0⟩**. The final Work equals the totals — a useful check.

### Two requests (each checked against the original state)

**P1 requests (1, 0, 1).** Request ≤ Need (1,2,1) ✓; Request ≤ Available (2,2,1) ✓. Pretend: Available = (1, 2, 0), P1 Allocation = (3, 0, 2), Need = (0, 2, 0). Safety: P0 no; P1 (0,2,0) ≤ (1,2,0) → Work (4, 2, 2); then P2, P3, P4, P0 as before. **Safe → grant.**

**P0 requests (1, 1, 1).** Request ≤ Need (3,2,2) ✓; ≤ Available (2,2,1) ✓. Pretend: Available = (1, 1, 0), P0 Need = (2, 1, 1). Every process's Need includes at least one C, and no C is left: no Need ≤ (1, 1, 0). **Unsafe → P0 must wait**, although the resources are free.

### Banker's algorithm in Java

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class BankersAlgorithm {

    static final int[][] ALLOCATION = {{1, 1, 0}, {2, 0, 1}, {1, 0, 2}, {0, 1, 1}, {2, 1, 0}};
    static final int[][] MAX = {{4, 3, 2}, {3, 2, 2}, {5, 1, 3}, {2, 2, 2}, {4, 2, 1}};
    static final int[] AVAILABLE = {2, 2, 1};

    public static void main(String[] args) {
        int[][] need = need(ALLOCATION);
        for (int i = 0; i < need.length; i++) {
            System.out.println("Need P" + i + " = " + Arrays.toString(need[i]));
        }
        System.out.println("Initial state: " + safety(ALLOCATION, need, AVAILABLE));
        request(1, new int[] {1, 0, 1});
        request(0, new int[] {1, 1, 1});
    }

    static int[][] need(int[][] allocation) {
        int[][] need = new int[MAX.length][];
        for (int i = 0; i < MAX.length; i++) {
            need[i] = new int[MAX[i].length];
            for (int r = 0; r < MAX[i].length; r++) {
                need[i][r] = MAX[i][r] - allocation[i][r];
            }
        }
        return need;
    }

    static boolean fits(int[] request, int[] limit) {
        for (int r = 0; r < request.length; r++) {
            if (request[r] > limit[r]) {
                return false;
            }
        }
        return true;
    }

    /** Safety algorithm: scan in order, continuing after the last process that finished. */
    static String safety(int[][] allocation, int[][] need, int[] available) {
        int n = allocation.length;
        int[] work = available.clone();
        boolean[] finished = new boolean[n];
        List<String> sequence = new ArrayList<>();
        int i = 0;
        int failedInRow = 0;
        while (sequence.size() < n && failedInRow < n) {
            if (!finished[i] && fits(need[i], work)) {
                for (int r = 0; r < work.length; r++) {
                    work[r] += allocation[i][r];          // P_i finishes and returns everything
                }
                finished[i] = true;
                sequence.add("P" + i);
                failedInRow = 0;
            } else {
                failedInRow++;
            }
            i = (i + 1) % n;
        }
        return sequence.size() == n ? "safe, sequence " + String.join(", ", sequence) : "unsafe";
    }

    /** Resource-request algorithm, checked against the initial state. */
    static void request(int p, int[] req) {
        int[][] need = need(ALLOCATION);
        String label = "P" + p + " requests " + Arrays.toString(req) + ": ";
        if (!fits(req, need[p])) {
            System.out.println(label + "error, exceeds its maximum claim");
            return;
        }
        if (!fits(req, AVAILABLE)) {
            System.out.println(label + "wait, not enough available");
            return;
        }
        int[][] allocation = new int[ALLOCATION.length][];
        for (int i = 0; i < ALLOCATION.length; i++) {
            allocation[i] = ALLOCATION[i].clone();
        }
        int[] available = AVAILABLE.clone();
        for (int r = 0; r < req.length; r++) {             // pretend to grant
            allocation[p][r] += req[r];
            available[r] -= req[r];
        }
        String result = safety(allocation, need(allocation), available);
        System.out.println(label + (result.startsWith("safe")
                ? "grant, new state is " + result
                : "wait, granting it would leave an unsafe state"));
    }
}
```

**Output:**

```text
Need P0 = [3, 2, 2]
Need P1 = [1, 2, 1]
Need P2 = [4, 1, 1]
Need P3 = [2, 1, 1]
Need P4 = [2, 1, 1]
Initial state: safe, sequence P1, P2, P3, P4, P0
P1 requests [1, 0, 1]: grant, new state is safe, sequence P1, P2, P3, P4, P0
P0 requests [1, 1, 1]: wait, granting it would leave an unsafe state
```

## Important Points

- Need = Max − Allocation; Available = Total − sum of Allocation.
- Safety: repeatedly pick an unfinished process with Need ≤ Work, add its Allocation to Work.
- Request: check ≤ Need (else error), ≤ Available (else wait), pretend, run safety, grant only if safe.
- There may be several safe sequences; any one proves safety.
- Final Work must equal the total resources — a quick self-check.
- Limitations: maximum needs must be known in advance, the number of processes and resources must be fixed, and processes must eventually return resources.

## Common Confusion

> [!WARNING]
> **Adding Need instead of Allocation.** When a process finishes, it returns what it **holds** (Allocation), not what it needed. Work += Allocation[i].

- **Comparing only one resource type.** Need ≤ Work must hold for **every** type; one larger component means the process cannot run yet.
- **"Request ≤ Available, so grant."** That is only step 2; the safety check decides.

## Interview Perspective

- *"Explain the Banker's algorithm."* — the four structures, safety algorithm, request algorithm.
- *"Given Allocation, Max and Available, find Need and a safe sequence."* — show a Work table like the one above.
- *"Can request X be granted immediately?"* — three checks in order.
- *"Why is it rarely used in real OSes?"* — needs maximum claims in advance; fixed process set; O(m·n²) per request.

## Quick Revision

- Need = Max − Allocation.
- Safety: find Need ≤ Work → Work += Allocation → repeat; all finish = safe.
- Request: ≤ Need? ≤ Available? Pretend → safe? → grant, else wait.
- Final Work = total resources. Several safe sequences may exist.
