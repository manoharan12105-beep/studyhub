# Annotation Cheat Sheet

The annotations interviewers expect you to recognise, with one-line meanings.

## Core and Boot

| Annotation | Meaning |
|------------|---------|
| `@SpringBootApplication` | `@SpringBootConfiguration` + `@EnableAutoConfiguration` + `@ComponentScan` |
| `@Component` / `@Service` / `@Repository` / `@Controller` | Stereotypes detected by scanning (`@Repository` adds exception translation) |
| `@Configuration` + `@Bean` | Configuration class + method whose return value is a bean |
| `@Autowired` | Mark an injection point (optional on a single constructor) |
| `@Qualifier` / `@Primary` | Pick a specific bean / default among candidates |
| `@Scope("prototype")`, `@RequestScope`, `@SessionScope` | Bean scope |
| `@Lazy` | Create on first use (or inject a lazy proxy) |
| `@PostConstruct` / `@PreDestroy` | Init after injection / cleanup before destruction |
| `@Value("${key:default}")` | Inject one property |
| `@ConfigurationProperties(prefix)` | Bind a group of properties to a typed object |
| `@Profile("dev")` | Register only when the profile is active |
| `@ConditionalOnClass` / `@ConditionalOnMissingBean` / `@ConditionalOnProperty` | Auto-configuration conditions |
| `@Import` | Include other configuration classes |

## Web and Validation

| Annotation | Meaning |
|------------|---------|
| `@RestController` | `@Controller` + `@ResponseBody` |
| `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping` | Map URLs and methods to handlers |
| `@PathVariable`, `@RequestParam`, `@RequestBody`, `@RequestHeader`, `@CookieValue`, `@RequestPart` | Bind request data |
| `@ResponseStatus` | Status for a handler or an exception class |
| `@ExceptionHandler` | Handle an exception type |
| `@RestControllerAdvice` | Global exception handling for all controllers |
| `@CrossOrigin` | CORS for one controller/method (MVC level) |
| `@Valid` | Trigger validation and cascade into nested objects |
| `@Validated` | Validation with groups; enables method validation on a bean |
| `@NotNull`, `@NotEmpty`, `@NotBlank`, `@Size`, `@Min`, `@Max`, `@Positive`, `@Email`, `@Pattern`, `@Past`, `@Future` | Built-in constraints |

## Data and Transactions

| Annotation | Meaning |
|------------|---------|
| `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Column` | Entity mapping |
| `@ManyToOne`, `@OneToMany(mappedBy)`, `@OneToOne`, `@ManyToMany`, `@JoinColumn` | Relationships (`mappedBy` = inverse side) |
| `@Enumerated(EnumType.STRING)`, `@Embedded`, `@Embeddable` | Enums and value objects |
| `@Version` | Optimistic locking column |
| `@Query`, `@Modifying`, `@Param` | Custom JPQL/native queries and updates |
| `@EntityGraph(attributePaths=…)` | Fetch associations for one query |
| `@Lock(LockModeType.PESSIMISTIC_WRITE)` | `SELECT … FOR UPDATE` |
| `@Transactional(propagation, isolation, readOnly, rollbackFor, timeout)` | Declarative transaction |
| `@TransactionalEventListener(phase = AFTER_COMMIT)` | Event listener bound to the transaction outcome |

## Security

| Annotation | Meaning |
|------------|---------|
| `@EnableWebSecurity` | Security configuration (Boot applies it automatically) |
| `@EnableMethodSecurity` | Enable `@PreAuthorize` / `@PostAuthorize` / `@Secured` |
| `@PreAuthorize("hasRole('ADMIN')")` | SpEL check before the method |
| `@PostAuthorize("returnObject.owner == authentication.name")` | Check after the method using the result |
| `@Secured("ROLE_ADMIN")` | Role check without SpEL |
| `@AuthenticationPrincipal` | Inject the current principal into a controller method |

## Production and Advanced

| Annotation | Meaning |
|------------|---------|
| `@EnableAsync` + `@Async` | Run a method on a task executor |
| `@EnableScheduling` + `@Scheduled(cron/fixedRate/fixedDelay)` | Scheduled jobs |
| `@EnableCaching` + `@Cacheable` / `@CachePut` / `@CacheEvict` | Cache abstraction |
| `@Aspect`, `@Before`, `@AfterReturning`, `@AfterThrowing`, `@After`, `@Around`, `@Pointcut` | AOP |
| `@EventListener` | Listen to application events |
| `@EnableResilientMethods` + `@Retryable` / `@ConcurrencyLimit` | Framework 7 retry and concurrency limiting |
| `@Operation`, `@Schema`, `@Tag` | OpenAPI documentation (swagger-annotations) |
