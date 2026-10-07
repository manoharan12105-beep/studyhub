# Visualizer Registry

Interactive visualizations that topics are **candidates** for. A topic opts in by setting its metadata `visualizer` to one of these ids. The app shows a visualizer once its module exists in `js/visualizers/<id>.js` (or `js/simulators/`) **and** it is registered in `metadata/interactions/<category>.json` — see [extending.md](extending.md).

**Implemented (Phase 3):** `percentage-bar-model`, `interest-growth-chart`, `binary-search-steps`, `sorting-visualizer` (bubble, selection, insertion, merge, quick, heap), `tree-traversal`, `reference-type-vs-object-type`, `http-request-lifecycle` (simulator), `join-visualizer`, `ranking-functions-comparison`; Phase 2F (Linux): `permission-calculator`, `process-state-visualizer`, `find-command-builder`, `sed-substitution-explorer`, `hard-vs-symbolic-links`, and the simulators `pipeline-simulator`, `redirection-simulator`, `signal-simulator`, `linux-troubleshooting-simulator` (shared by the `disk-full-investigation` and `port-in-use-investigation` interactions); Phase 2G (Computer Networks): every id in the Computer Networks table; Phase 2H (System Design): every id in the System Design table; CS Concepts (Excel): every id in the Excel table. All other ids below are still candidates.

Rules for every visualizer (see also `.claude/skills/ui-ux/SKILL.md`):

- The topic must be fully understandable without it — it is an enhancement.
- Controls: Step · Play/Pause · Reset, plus custom input where listed. Keyboard operable.
- A text description of the current step is always visible (screen readers, reduced motion).
- Several topics may share one id.

## Aptitude

| Id | Topics | What it shows | Custom input |
|----|--------|---------------|--------------|
| `unit-digit-cycles` | number-system | The repeating cycle of last digits of aⁿ for a chosen base, highlighting which position n lands on (n mod cycle length, with 0 → last position). | base, exponent |
| `percentage-bar-model` | percentages | A bar for the base value; increases/decreases drawn as segments, successive changes applied to the *new* bar so the "base changes" idea is visible. | base, changes |
| `ratio-bar-model` | ratio-and-proportion | Equal-sized unit blocks split between parties; dividing a total by ratio and how ratios change when quantities are added. | ratio, total |
| `alligation-cross` | mixtures-and-alligation | The alligation cross: two component values, the mean, and the differences that give the mixing ratio, with a slider for the mean. | two values, mean |
| `interest-growth-chart` | simple-interest, compound-interest | Year-by-year bars of simple vs. compound interest on the same principal, showing interest-on-interest growing. | P, R, T, compounding |
| `work-units-timeline` | time-and-work | Total work as LCM units; each worker/pipe as a per-day rate filling (or emptying) the tank day by day. | workers' days, leaves/joins |
| `relative-motion-track` | time-speed-distance | Two objects on a track: same/opposite directions, trains crossing poles/platforms/each other, boats with stream speed, race head starts. | speeds, lengths, direction |
| `arrangement-builder` | permutation-and-combination | Filling slots one by one, showing choices per slot (multiplication principle), and how order-not-mattering divides by r!. | n, r, constraints |
| `sample-space-explorer` | probability | Full sample space for coins/dice/cards as a grid, highlighting favourable outcomes for a chosen event. | experiment, event |
| `di-chart-explorer` | data-interpretation | One dataset shown as table / bar / line / pie; selecting values shows the percentage-change and share calculations. | dataset |
| `family-tree-builder` | blood-relations | Builds the family tree from statements one at a time using the standard symbols (gender, generation levels). | statements |
| `direction-tracer` | direction-sense | Draws the path on a grid step by step, then shows the straight-line distance and final direction from the start. | moves |
| `seating-arrangement-builder` | seating-arrangement | Linear and circular seats filled clue by clue, with left/right resolved relative to facing direction. | clues |
| `puzzle-elimination-grid` | puzzles | Elimination grid (people × attributes) where each clue ticks or crosses cells. | clues |
| `venn-builder` | syllogisms, logical-venn-diagrams | Draws the minimal diagrams for statements and tests each conclusion against all possible diagrams. | statements |
| `clock-angle` | clocks | An analogue clock; hands move with time and the angle between them is shown with the 30H − 5.5M calculation. | time |

## Data Structures & Algorithms

| Id | Topics | What it shows | Custom input |
|----|--------|---------------|--------------|
| `array-operations` | arrays | Cells with indices; insert, delete and search animate the shifting of elements and count the moves, contrasting access O(1) with middle insertion O(n). | array, operation, index |
| `two-pointer-scan` | two-pointers | Left and right pointers over a sorted array; each step shows the comparison with the target and which pointer moves and why. | array, target |
| `sliding-window` | sliding-window | A highlighted window expanding and shrinking over an array or string, with the running summary (sum, counts) and the best window so far. | array or string, condition |
| `linked-list-pointers` | linked-list, linked-list-techniques, fast-and-slow-pointers | Nodes and arrows; each step of insertion, deletion, reversal or fast/slow traversal redraws the changed pointers and highlights prev/curr/next. | values, operation |
| `stack-operations` | stack | A vertical stack with push, pop and peek, and a bracket-matching or monotonic-stack trace that shows each push and pop. | operations or input array |
| `queue-operations` | queue | A circular array with front and rear indices wrapping around, plus deque operations at both ends. | operations, capacity |
| `binary-search-steps` | binary-search, binary-search-variations, binary-search-pattern | lo, mid and hi markers over a sorted array; the discarded half greys out each step until the boundary is found. | sorted array, target or predicate |
| `sorting-visualizer` | bubble-sort, selection-sort, insertion-sort, merge-sort, quick-sort, heap-sort, counting-sort, radix-sort, bucket-sort | Bars for the array with the comparisons, swaps or writes of the chosen sort, step by step, with counters for comparisons and moves and a stability marker for equal keys. | array, algorithm |
| `recursion-tree` | recursion | The call tree of a recursive function growing and returning, with the call stack beside it and repeated subcalls highlighted. | function, n |
| `backtracking-tree` | backtracking, backtracking-problems, backtracking-pattern | The decision tree of choose/explore/unchoose with pruned branches marked, alongside the current partial solution (subset, permutation or board). | problem, size |
| `tree-traversal` | tree-traversals | A binary tree with the visit order of preorder, inorder, postorder or level order, showing the stack or queue at each step. | tree values, traversal |
| `bst-operations` | binary-search-tree | Search, insert and delete in a BST, highlighting the comparison path and the three deletion cases (leaf, one child, two children). | keys, operation |
| `heap-operations` | heap | The heap as both a tree and an array; offer and poll show sift-up and sift-down swaps, and heapify works bottom-up. | values, operation |
| `trie-builder` | trie | Words inserted character by character into a trie, end-of-word marks, and prefix search following edges. | words, query |
| `graph-traversal` | bfs, dfs, bfs-pattern, dfs-pattern | A graph or grid explored by BFS (queue, distance layers) or DFS (stack, discovery order), with visited marks and the traversal tree. | graph, start, algorithm |
| `dijkstra-steps` | dijkstra, shortest-path-pattern | Tentative distances, the priority queue and settled vertices; each relaxation updates a distance and the shortest-path tree. | weighted graph, source |
| `mst-builder` | prims-algorithm, kruskals-algorithm | Kruskal (edges in sorted order, cycle check with components) or Prim (growing tree, cheapest crossing edge) building a minimum spanning tree. | weighted graph, algorithm |
| `union-find-forest` | disjoint-set-union, union-find-pattern | The parent-pointer forest during union by rank and path compression, alongside the parent array. | elements, unions |
| `topological-sort-steps` | topological-sort, topological-sort-pattern | In-degrees updating as Kahn's algorithm removes vertices, the queue of ready vertices and the growing order; cycles leave vertices behind. | DAG |
| `dp-table` | dynamic-programming, dp-2d-grid, knapsack-dp, subsequence-dp, string-dp, dp-pattern | A DP table filled cell by cell, highlighting the cells each value depends on and the reconstructed optimal path at the end. | problem, inputs |

## Object-Oriented Programming

| Id | Topics | What it shows | Custom input |
|----|--------|---------------|--------------|
| `object-reference-model` | classes-and-objects, object-lifecycle-and-memory, java-object-class | Stack frames and heap objects with reference arrows; assignment, parameter passing, `null`, `==` vs `equals`, and objects becoming unreachable (including cycles). | short statement sequence |
| `constructor-chain` | constructors-and-initialization | Static blocks, field initialisers, instance blocks and constructor bodies firing in order across a class hierarchy, including `this(...)`/`super(...)` hops. | class hierarchy, `new` expression |
| `class-hierarchy-explorer` | inheritance, abstraction, interfaces | A class/interface tree; selecting a class shows its inherited, overridden, hidden and default members and which declaration each comes from. | hierarchy definition |
| `dynamic-dispatch` | polymorphism, method-overriding, binding-and-method-resolution | Two panels for a call: the compiler's view (declared types, candidate overloads, chosen signature) and the runtime's view (object's class, upward search for the override). | receiver, arguments, hierarchy |
| `reference-type-vs-object-type` | upcasting-and-downcasting | One object viewed through different reference types; which members are callable, which override runs, and whether a cast compiles, succeeds or throws. | object type, cast target |
| `relationship-diagram` | object-relationships, composition-over-inheritance, uml-class-diagrams | UML relationships (association, aggregation, composition, inheritance, realization, dependency) with multiplicities, and what happens to parts when a whole is deleted. | classes and relationships |
| `hash-bucket-explorer` | equals-and-hashcode, oop-with-collections | Hash buckets of a `HashMap`/`HashSet`: where keys land, equals checks during lookup, and how a mutated key becomes unreachable. | keys, equals/hashCode choice |
| `solid-refactoring-stepper` | single-responsibility-principle, open-closed-principle, liskov-substitution-principle, interface-segregation-principle, dependency-inversion-principle, code-smells-and-refactoring | A before/after class diagram stepping through a refactoring, highlighting dependencies removed and responsibilities moved. | example selection |
| `pattern-structure` | singleton-pattern, factory-method-pattern, abstract-factory-pattern, builder-pattern, adapter-pattern, decorator-pattern, facade-pattern, proxy-pattern, command-pattern, observer-pattern, state-pattern, strategy-pattern, template-method-pattern | A pattern's participants as a diagram plus an animated call sequence for the example, showing which object delegates to which. | pattern, scenario |
| `design-problem-class-diagram` | designing-classes, parking-lot-design, library-management-design, vehicle-rental-design, atm-design, food-ordering-design | The problem's class diagram built step by step (entities → responsibilities → relationships → interfaces), with a use-case walk-through highlighting collaborating objects. | use case |

## Spring Boot

| Id | Topics | What it shows | Custom input |
|----|--------|---------------|--------------|
| `spring-bean-lifecycle` | spring-bean-lifecycle | One bean moving through instantiation, injection, Aware callbacks, BeanPostProcessor before/after, `@PostConstruct`, init methods, proxy creation, use and destruction, with the callback that fires at each step. | callbacks to include, scope |
| `spring-di-wiring` | spring-ioc-and-di, autowiring-and-bean-resolution, circular-dependencies | Beans as boxes and injection points as arrows; resolution by type, then `@Qualifier`, `@Primary` and name, ending in success, `NoSuchBeanDefinitionException`, `NoUniqueBeanDefinitionException` or a detected cycle. | beans, annotations, injection point |
| `spring-boot-auto-configuration` | auto-configuration | Auto-configuration candidates evaluated condition by condition (class present, bean missing, property set), showing which configurations apply and which back off for a user-defined bean. | classpath entries, user beans, properties |
| `http-request-lifecycle` | spring-mvc-architecture, filters-and-interceptors | The full path of an HTTP request: client → Tomcat → filters → security chain → `DispatcherServlet` → interceptors → controller → service → repository → database, and the response travelling back. | request, filters/interceptors present |
| `spring-mvc-request-flow` | spring-mvc-request-lifecycle, response-handling | Inside `DispatcherServlet`: handler mapping, adapter, argument resolution and validation, controller call, return-value handling and message conversion, with the object at each step. | method, URL, headers, body |
| `exception-resolution-flow` | spring-exception-basics, global-exception-handling | Where an exception is thrown (filter, controller, service) and which component handles it: local `@ExceptionHandler`, `@RestControllerAdvice`, default resolvers, security entry point or `/error`, with the resulting status and body. | throw location, exception type, handlers present |
| `jpa-entity-lifecycle` | entity-lifecycle-and-persistence-context, dirty-checking-and-flush | An entity moving between new, managed, detached and removed; the persistence context with snapshots, dirty checking at flush and the SQL issued at flush and commit. | sequence of operations (persist, find, modify, merge, remove, flush) |
| `n-plus-one-queries` | fetching-and-lazy-loading, n-plus-one-problem | A query log filling up as a loop touches lazy associations, compared side by side with fetch join, entity graph and batch fetching, with the statement count for each. | number of parents, fetch strategy, batch size |
| `transaction-lifecycle` | transactional-annotation, transaction-propagation | A call through the transactional proxy: begin, join or suspend per propagation, inner failures marking rollback-only, and the final commit or rollback with the connection used. | call chain, propagation per method, exception thrown |
| `transaction-isolation-anomalies` | transaction-isolation, jpa-locking, postgresql-isolation-levels | Two transactions on a timeline reading and writing the same rows; dirty, non-repeatable and phantom reads and lost updates appear or are prevented depending on isolation level and locking. | isolation level, locking mode, interleaving |
| `spring-proxy-call` | spring-proxies, spring-aop, transactional-pitfalls | A caller, the proxy and the target object; external calls pass through advice (transaction, cache, security, async) while `this.method()` calls skip it. | annotations, call path |
| `security-filter-chain` | spring-security-introduction, security-filter-chain, authentication-architecture | A request passing through the ordered security filters; authentication via manager, provider, `UserDetailsService` and `PasswordEncoder`, the `SecurityContext` being filled, and authorization producing 200, 401 or 403. | credentials, URL, user roles |
| `jwt-authentication-flow` | jwt-authentication-flow, access-and-refresh-tokens | Login issuing an access and refresh token, the JWT filter validating each request, expiry, refresh with rotation and reuse detection, and logout. | token lifetimes, events (login, call, expire, refresh, reuse) |
| `cors-preflight` | spring-cors | The browser's preflight `OPTIONS` request and the server's CORS headers, then the actual request; shows when the browser blocks the response and why. | origin, method, headers, credentials, server CORS config |

## DBMS and PostgreSQL

| Id | Topics | What it shows | Custom input |
|----|--------|---------------|--------------|
| `null-three-valued-logic` | null-and-three-valued-logic | Truth tables for AND, OR and NOT with unknown, and a `WHERE` clause evaluated row by row, showing which rows are kept (true only) and why `= NULL` and `NOT IN` with a `NULL` keep none. | expression, sample rows |
| `join-visualizer` | sql-join-types | Two small tables; each join type pairs rows step by step, highlighting matches, `NULL`-extended rows and the effect of moving a condition from `ON` to `WHERE`. | two tables, join type, condition |
| `correlated-subquery-evaluation` | correlated-subqueries | The outer query's rows one at a time, with the correlated subquery re-evaluated for each and its result deciding whether the row is kept. | outer table, subquery |
| `group-by-buckets` | group-by-and-having | Rows sorted into groups by key, aggregates computed per group, then `HAVING` removing whole groups — contrasted with `WHERE` removing rows before grouping. | rows, grouping key, aggregate, filters |
| `sql-logical-execution-order` | logical-query-processing-order | A query's clauses lit up in logical order (`FROM` → `WHERE` → `GROUP BY` → `HAVING` → windows → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`) with the intermediate rows after each step. | query |
| `cte-pipeline` | common-table-expressions | Each CTE as a stage producing an intermediate result that the next stage reads, and whether PostgreSQL inlines or materializes it. | CTE chain, `MATERIALIZED` option |
| `recursive-cte-iteration` | recursive-ctes | The anchor rows, then each iteration's working table joined to produce the next level, until an iteration returns no rows; cycles flagged. | hierarchy data, start node |
| `window-function-frames` | window-functions-basics | Rows of a partition with the current row and its frame highlighted (`ROWS`, `RANGE` with peers, `GROUPS`) as the current row moves, and the resulting aggregate. | rows, `PARTITION BY`, `ORDER BY`, frame |
| `ranking-functions-comparison` | ranking-window-functions | `ROW_NUMBER`, `RANK` and `DENSE_RANK` computed side by side over the same values, with ties highlighted. | values |
| `set-operations-venn` | sql-set-operations | Two result sets as Venn regions; `UNION`, `UNION ALL`, `INTERSECT` and `EXCEPT` select regions and show duplicate handling. | two lists of rows, operation |
| `er-to-table-mapping` | er-modeling | An ER diagram converted relationship by relationship into tables, foreign keys and junction tables. | entities, relationships, cardinalities |
| `normalization-stepper` | database-normalization | A table with its functional dependencies decomposed step by step into 1NF, 2NF, 3NF and BCNF, showing which dependency each step removes. | table, functional dependencies |
| `transaction-timeline` | database-transactions | One transaction's statements on a timeline with `BEGIN`, `SAVEPOINT`, `ROLLBACK TO` and `COMMIT`, showing which changes become permanent and which are undone. | statements, failure point |
| `lock-wait-deadlock` | locking-and-deadlocks | Sessions acquiring row locks; waits drawn as arrows in a wait-for graph until a cycle forms and one transaction is aborted. | sessions, lock order |
| `mvcc-row-versions` | postgresql-mvcc | Row versions with `xmin`/`xmax` as transactions insert, update and delete, each session's snapshot deciding which version it sees, and vacuum removing dead versions. | transactions, isolation level |
| `btree-index-lookup` | index-fundamentals | A B-tree descending from root to leaf for equality and range searches, the leaf-chain scan, and composite keys showing why the leading column matters. | keys (single or composite), search |
| `query-plan-tree` | explain-and-query-plans | An `EXPLAIN` plan as a tree of nodes with estimated vs actual rows, loops and time, highlighting the most expensive node and large misestimates. | plan text |
| `partition-pruning` | table-partitioning | A partitioned table with its partitions; a `WHERE` clause greys out partitions that cannot match, and a function on the key shows why pruning stops. | partition scheme, `WHERE` clause |

## Linux

All implemented. Outputs shown by the modules were captured from real runs in the practice lab (`~/linux-lab`); the servers in the troubleshooting simulator are simulated and labelled as such.

| Id | Topics | What it shows | Custom input |
|----|--------|---------------|--------------|
| `permission-calculator` | file-permissions, special-permissions | Octal ↔ symbolic mode (including SUID/SGID/sticky as s/S/t/T) and the kernel's access check step by step: identify the user, use exactly one class, test one bit — with directory semantics for r/w/x. | mode or checkboxes, file/directory, who, operation |
| `pipeline-simulator` (simulator) | pipes-and-command-chaining, sort-uniq-and-wc | A pipeline on the lab files stage by stage, with the exact intermediate output flowing into each next command. | pipeline |
| `redirection-simulator` (simulator) | standard-streams-and-redirection | The file descriptor table as the shell applies redirections left to right, then where each stdout/stderr line lands (terminal, files, /dev/null, pipe). | redirection |
| `process-state-visualizer` | linux-processes | One process moving between R, S, D, T and Z and being reaped, with its `ps` line at each event (normal run, job control, disk I/O, zombie and orphan). | scenario |
| `signal-simulator` (simulator) | linux-signals | Signals sent to a plain process, a trapping script, an ignoring script and a zombie: caught, ignored or default action, pending signals while stopped, 128 + N exit statuses. | process kind, signal sequence |
| `find-command-builder` | find-command | A find command built from name, type, size and age tests, evaluated entry by entry against the lab tree (GNU rounding for `-size`, whole days for `-mtime`). | pattern, type, size, age, action |
| `sed-substitution-explorer` | sed-command | `sed -E 's/…/…/'` applied line by line: address selection, highlighted matches, the substituted line and the output. | file, address, pattern, replacement, flags |
| `hard-vs-symbolic-links` | inodes-and-links | Directory entries, inodes and link counts while a hard link and a symlink are created and the original is edited, deleted and recreated. | — |
| `linux-troubleshooting-simulator` (simulator) | troubleshooting-disk-and-files, disk-usage-df-du, troubleshooting-processes-and-services, ports-and-http-tools | A guided investigation on a simulated server: choose the next command; right choices show output and advance, wrong ones explain why. Scenarios (`options.scenario`): `disk-full`, `port-in-use`. | scenario, command choices |

## Computer Networks

All implemented. Machines, addresses and zone data in the modules are invented (documentation and private ranges); protocol behaviour, field names, message order and command output formats follow the real protocols and tools. `js/simulators/network-common.js` holds the shared message-sequence and table views (it is not an interaction).

| Id | Topics | What it shows | Custom input |
|----|--------|---------------|--------------|
| `osi-encapsulation-journey` | osi-model-overview, encapsulation-and-decapsulation, tcp-ip-model | An HTTPS request gaining a header per layer (and the Ethernet trailer), crossing a router that rebuilds only Layer 2 and decrements TTL, and being decapsulated at the server. | model (OSI / TCP/IP) |
| `subnet-calculator` | subnet-masks-and-cidr, subnetting-fundamentals, subnetting-block-size-method | Binary octets with network and host bits, the AND with the mask, network and broadcast addresses, host range and count, then the block-size shortcut. | IPv4 address, prefix |
| `routing-table-lookup` | routing-fundamentals, longest-prefix-match | Every route tested against the destination; the longest matching prefix wins, including a full-tunnel VPN's two /1 routes beating the default route. | routing table, destination IP |
| `tcp-connection-simulator` (simulator) | tcp-three-way-handshake, tcp-connection-termination | Each segment's flags, seq/ack numbers and both endpoints' states: handshake, refused (RST), filtered (SYN retransmissions → timeout), four-way close with TIME_WAIT, combined close, reset. Shared through `options.group` (`open` / `close`). | scenario, client ISN |
| `arp-simulator` (simulator) | ip-vs-mac-addresses, arp-address-resolution, local-vs-remote-delivery | The local/remote decision with the mask, cache lookup, broadcast request, unicast reply, cache entry and the data frame — showing that remote traffic ARPs for the gateway. | destination, cache state |
| `dns-resolution-simulator` (simulator) | dns-resolution-process | Stub → resolver → root → TLD → authoritative with referrals, a CNAME chain, NXDOMAIN, and the resolver cache filling with TTLs. | name, cache state |
| `dhcp-dora-simulator` (simulator) | dhcp-dora | Discover, Offer, Request, Ack with addresses and ports, two competing servers, renewal at T1, and APIPA when no server answers. | scenario |
| `packet-journey-simulator` (simulator) | ip-vs-mac-addresses, packet-journey-across-networks | MACs, IPs, ports and TTL on every link of a same-LAN delivery, an Internet request through NAT, and the translated reply. | scenario |
| `http-exchange-simulator` (simulator) | http-fundamentals, http-status-codes | A raw request, a status-class prediction, the checks a Spring Boot API applies in order, and the raw response with the reason for its status. | request scenario |
| `tls-handshake-simulator` (simulator) | tls-handshake-and-https | The TLS 1.3 handshake with round-trip count and the point where traffic becomes encrypted; expired and wrong-host certificates; TLS 1.2 and resumption for comparison. | scenario |
| `nat-translation-simulator` (simulator) | network-address-translation | Two devices sharing one public IP: mappings created, replies translated back, unsolicited inbound dropped or port-forwarded, idle mappings expiring. | port forwarding on/off |
| `load-balancer-simulator` (simulator) | load-balancing-l4-vs-l7 | Requests from three client connections through an L4 or L7 balancer: connection pinning vs per-request path routing, round robin vs least connections, an unhealthy backend skipped. | mode, algorithm, backend health |
| `network-troubleshooting-simulator` (simulator) | network-troubleshooting-methodology, troubleshooting-connectivity-problems, troubleshooting-connection-errors, dns-caching-ttl-and-failures | A guided investigation: choose the next command; right choices show output and advance, wrong ones explain why. Scenarios (`options.scenario`): `no-internet` (wrong gateway), `dns-failure`, `api-timeout` (security group). Reuses the Linux troubleshooting state machine. | scenario, command choices |

## System Design

All implemented. Servers, users and traffic in the modules are invented, and latencies are illustrative orders of magnitude; algorithm behaviour (load balancing, eviction, hashing, quorums, rate limiting, backoff, breaker states) follows the real algorithms. "Random" choices use a seeded generator so every run replays identically. `js/simulators/system-design-common.js` holds the shared stats, bars, node-card, checkbox and seeded-random helpers (it is not an interaction). Interaction ids in `metadata/interactions/system-design.json` are given in brackets where one module serves several.

| Id | Topics | What it shows | Custom input |
|----|--------|---------------|--------------|
| `request-journey-simulator` (simulator) | request-journey | One request hop by hop (client → DNS → load balancer → API server → cache → database → back), each hop adding its typical latency to a running total: cache hit, cache miss, first visit with DNS and handshakes, cache down. | scenario |
| `load-balancing-algorithms-simulator` (simulator) | load-balancing-algorithms, load-balancing-fundamentals | Requests to three servers of different weights, one at a time: which server round robin, weighted round robin, least connections or IP hash picks and why, open connections per server, and health checks marking a crashed server unhealthy after two failures. | algorithm, server crash |
| `cache-behaviour-simulator` (simulator) [`cache-hits-and-ttl`, `cache-staleness`, `cache-stampede`] | caching-fundamentals, cache-aside-and-read-through, cache-invalidation-and-ttl, cache-stampede-penetration-and-hot-keys | A cache over a fixed timeline: hits, misses, TTL expiry and LRU eviction; stale reads vs active invalidation; a stampede of identical database queries vs request coalescing. Scenarios (`options.scenario`): `basics`, `stale`, `stampede`. | scenario, invalidation on/off, coalescing on/off |
| `cache-eviction-visualizer` | cache-eviction-policies | Slots ordered by each policy's next victim (LRU, LFU, FIFO, MRU) for a request sequence, hit or miss per request, and a final comparison of hit counts showing no policy wins everywhere. | sequence, capacity, policy |
| `replication-simulator` (simulator) | database-replication, sync-async-replication-and-lag | Primary and replicas through write → read → catch-up → write → primary crash → failover, under async, semi-sync or sync replication: stale reads, lost acknowledged writes, and read-your-writes routing. | mode, read-your-writes routing |
| `sharding-simulator` (simulator) | sharding-fundamentals, hot-partitions-and-resharding | Users placed on shards by the chosen key, then rows and requests per shard (including one celebrity user), ending with the hottest shard and why that key made it hot. | shard key, shard count |
| `consistent-hashing-ring` | consistent-hashing, distributed-caching | Servers and 12 keys on a hash ring; adding server D and removing server B, with the keys that move compared with `hash % N`. | virtual nodes per server |
| `quorum-calculator` | quorum-reads-and-writes, multi-leader-and-leaderless-replication | A write acknowledged by W of N replicas, then a worst-case read of R replicas: whether it sees the latest value (R + W > N), and how many failures reads and writes tolerate. | N, W, R |
| `design-decision-simulator` (simulator) [`cap-partition-scenario`, `url-shortener-builder`, `url-shortener-interview-simulator`, `photo-sharing-builder`, `video-streaming-builder`] | cap-theorem, design-url-shortener, system-design-interview-framework, design-photo-sharing-app, design-video-streaming-platform | A design built one decision at a time: sound choices explain why they work, their trade-off and the interviewer's likely follow-up; weak choices explain why they fail. "Show next decision" plays a recommended path. Scenarios (`options.scenario`): `cap-partition`, `url-shortener`, `url-shortener-interview`, `photo-sharing`, `video-streaming`. | choice at each stage |
| `percentile-explorer` | latency-percentiles | Response times sorted as bars with the average, P50, P90, P95 and P99 marked at their nearest-rank positions, showing how a few slow requests move the average but not the median. | response times |
| `message-queue-simulator` (simulator) [`message-queue-buffering`, `message-redelivery`, `poison-message-dlq`, `queue-backpressure`] | message-queues, delivery-semantics, dead-letter-and-retry-queues, backpressure | Producer → queue → consumers tick by tick: publish, receive, acknowledge, redeliver, dead-letter or reject, with the reason for each. Scenarios (`options.scenario`): `normal`, `crash`, `poison`, `backpressure`. | scenario |
| `retry-circuit-breaker-simulator` (simulator) [`retry-storm`, `circuit-breaker`] | timeouts-retries-and-backoff, circuit-breakers-and-bulkheads | `retries`: 20 clients against a dependency that recovers with limited capacity — immediate retries, plain backoff and backoff with full jitter as calls per tick. `breaker`: closed → open → half-open with fail-fast fallbacks vs threads held by timeouts. | mode, retry strategy |
| `rate-limiter-simulator` (simulator) | rate-limiting | Token bucket, leaky bucket, fixed window and sliding window log at the same nominal rate (3 per second), request by request for a burst, a window-boundary or a steady pattern: allowed, rejected (429) or queued, with each limiter's state. | algorithm, traffic pattern |

## CS Concepts — Excel

All implemented. Worksheets and data are the module's shared datasets (Sales A1:D13 for the PivotTable builder); every result was checked in Excel.

| Id | Topics | What it shows | Custom input |
|----|--------|---------------|--------------|
| `excel-formula-predictor` | excel-basic-formulas, excel-essential-functions, excel-if-and-or | A small worksheet and formula bar; the learner predicts what D1 shows, then steps through substitution, precedence or the function's rule (COUNT vs COUNTA, a zero in AVERAGE, AND vs OR, #DIV/0!) to the result. `options.scenarios` limits the list per topic. | formula scenario, prediction |
| `excel-cell-reference-explorer` | excel-cell-references | A formula copied cell by cell: price × tax rate down C2:C5 (`$E$1`, `E1`, `E$1`, `$E1`) or a discount grid down and across (`$A2*B$1`, relative, absolute), with each shifted formula, the cells it reads and wrong results flagged. | example, reference style |
| `excel-pivottable-builder` | excel-pivottable-fundamentals, excel-pivottable-calculations-and-filtering | The Sales source rows and a PivotTable built step by step: filter rows, unique row items, column split, Sum/Count/Average per cell, Grand Totals. Rejects a field in two areas. | Rows, Columns, Values, Filter field and item |
