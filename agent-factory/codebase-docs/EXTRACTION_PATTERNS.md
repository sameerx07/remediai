# Extraction Patterns Reference

Codebase Docs reads this file automatically. It defines exact code patterns to identify and extract documentable surfaces across all supported languages.

---

## Pattern Priority (Scan Order)

1. Package manifests → understand project shape
2. API specs (OpenAPI, proto, GraphQL SDL) → highest-fidelity source
3. Database schemas → understand data model
4. API routes/controllers → primary documentation target
5. Business logic (services, workers) → understand workflows
6. Shared types → referenced by everything
7. UI components → frontend library
8. Infrastructure → deployment and cloud
9. Configuration → env vars, CI/CD
10. Existing docs/comments → preserve team knowledge

---

## TypeScript / JavaScript Patterns

### Next.js App Router

| File Pattern | What It Contains |
|---|---|
| `app/**/route.ts` | API route handler (GET, POST, PUT, DELETE, PATCH) |
| `app/**/page.tsx` | Page component (extract metadata, params) |
| `app/**/layout.tsx` | Layout (extract shared UI structure) |
| `app/**/loading.tsx` | Loading state |
| `app/**/error.tsx` | Error boundary |
| `app/**/not-found.tsx` | 404 handler |
| `middleware.ts` | Request middleware (auth, redirects, headers) |
| `app/**/actions.ts` | Server Actions |

**Route path derivation:** `app/api/users/[id]/route.ts` → `GET/POST /api/users/:id`

### Express / Fastify / Hono

```typescript
// Express patterns to detect
router.get('/path', ...middleware, handler)
router.post('/path', ...middleware, handler)
app.use('/prefix', router)

// Fastify
fastify.get('/path', { schema: {...} }, handler)

// Hono
app.get('/path', ...middleware, handler)
const route = new Hono().basePath('/api')
```

### NestJS

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get(':id')
  @Roles('admin', 'user')
  findOne(@Param('id') id: string, @Query('include') include?: string): Promise<User> {}

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateUserDto): Promise<User> {}
}
```

### tRPC

```typescript
export const appRouter = router({
  user: router({
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => { ... }),
    create: protectedProcedure
      .input(createUserSchema)
      .mutation(({ input, ctx }) => { ... }),
  }),
});
```

### React Components

```typescript
// Function component with interface
interface CardProps {
  title: string;
  description?: string;
  variant?: 'default' | 'outlined' | 'elevated';
  onClose?: () => void;
  children: React.ReactNode;
}
export function Card({ title, variant = 'default', ...props }: CardProps) {}

// forwardRef
export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {})

// Compound
export const Select = Object.assign(SelectRoot, { Option, Group, Trigger })

// Context provider
export const ThemeContext = createContext<ThemeContextValue>(defaultTheme)
export function ThemeProvider({ children }: { children: ReactNode }) {}

// Custom hook
export function useSignals(symbols: string[]): { data: Signal[]; loading: boolean } {}
```

### TypeScript Types

```typescript
// All exported types get documented
export interface User { id: string; email: string; role: Role }
export type Direction = 'long' | 'short' | 'neutral'
export enum Status { Active = 'active', Inactive = 'inactive' }
export const TIMEFRAMES = ['1m', '5m', '1h', '1d'] as const
export type Timeframe = (typeof TIMEFRAMES)[number]
export type ApiResponse<T> = { data: T; meta: PaginationMeta }
```

---

## Python Patterns

### FastAPI

```python
@router.get("/items/{item_id}", response_model=ItemResponse, tags=["items"])
async def get_item(
    item_id: UUID = Path(..., description="Item UUID"),
    include_deleted: bool = Query(False, description="Include soft-deleted"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> ItemResponse:
    """Retrieve a single item by ID."""
```

### Pydantic Models

```python
class CreateSignalRequest(BaseModel):
    """Request body for signal generation."""
    symbols: list[str] = Field(..., min_length=1, max_length=10, description="Ticker symbols")
    timeframe: Literal["1m", "5m", "1h", "1d"] = Field(..., description="Candle timeframe")
    strategy: str = Field("momentum", description="Strategy identifier")

    model_config = ConfigDict(json_schema_extra={"example": {...}})
```

### Celery / Background Tasks

```python
@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_signal_batch(self, batch_id: str, symbols: list[str]) -> dict:
    """Process a batch of signal generation requests."""
```

### Django REST Framework

```python
class SignalViewSet(ModelViewSet):
    """CRUD for trading signals."""
    queryset = Signal.objects.select_related('user').all()
    serializer_class = SignalSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    filterset_fields = ['symbol', 'direction', 'created_at']
    ordering_fields = ['confidence', 'created_at']
```

### SQLAlchemy Models

```python
class Signal(Base):
    __tablename__ = "signals"
    __table_args__ = (
        Index("ix_signals_symbol_created", "symbol", "created_at"),
    )
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    symbol: Mapped[str] = mapped_column(String(10), nullable=False)
    direction: Mapped[Direction] = mapped_column(Enum(Direction))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    user: Mapped["User"] = relationship(back_populates="signals")
```

---

## Go Patterns

### Gin / Echo / Chi

```go
// Gin
r.GET("/users/:id", middleware.Auth(), handlers.GetUser)
r.POST("/users", handlers.CreateUser)

// Echo
e.GET("/users/:id", getUser, authMiddleware)

// Chi
r.Route("/users", func(r chi.Router) {
    r.Use(authMiddleware)
    r.Get("/{id}", getUser)
    r.Post("/", createUser)
})
```

### Structs (Models/DTOs)

```go
type User struct {
    ID        uuid.UUID `json:"id" db:"id"`
    Email     string    `json:"email" db:"email" validate:"required,email"`
    Name      string    `json:"name" db:"name"`
    Role      Role      `json:"role" db:"role"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type CreateUserRequest struct {
    Email string `json:"email" validate:"required,email"`
    Name  string `json:"name" validate:"required,min=2"`
}
```

### Interfaces

```go
type SignalService interface {
    Generate(ctx context.Context, req GenerateRequest) ([]Signal, error)
    GetByID(ctx context.Context, id uuid.UUID) (*Signal, error)
    List(ctx context.Context, filter SignalFilter) ([]Signal, error)
}
```

---

## Rust Patterns

### Actix-web / Axum

```rust
// Actix-web
#[get("/users/{id}")]
async fn get_user(path: web::Path<Uuid>, db: web::Data<Pool>) -> impl Responder {}

// Axum
async fn get_user(Path(id): Path<Uuid>, State(db): State<Pool>) -> Result<Json<User>, AppError> {}

Router::new()
    .route("/users/:id", get(get_user))
    .route("/users", post(create_user))
    .layer(AuthLayer::new())
```

### Structs

```rust
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Signal {
    pub id: Uuid,
    pub symbol: String,
    pub direction: Direction,
    pub confidence: f64,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub created_at: DateTime<Utc>,
}
```

---

## Java / Kotlin (Spring Boot) Patterns

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.isOwner(#id)")
    public ResponseEntity<UserDto> getUser(@PathVariable UUID id) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto createUser(@Valid @RequestBody CreateUserRequest request) {}
}

// Kotlin + Ktor
routing {
    authenticate("jwt") {
        route("/users") {
            get("/{id}") { /* handler */ }
            post { /* handler */ }
        }
    }
}
```

---

## C# / .NET Patterns

```csharp
// Minimal API
app.MapGet("/users/{id}", async (Guid id, IUserService service) => { })
   .RequireAuthorization("AdminPolicy")
   .WithName("GetUser")
   .Produces<UserDto>(200)
   .Produces(404);

// Controller-based
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(UserDto), 200)]
    public async Task<IActionResult> GetUser(Guid id) {}
}
```

---

## Terraform (HCL) Patterns

```hcl
variable "cluster_name" {
  description = "Name of the AKS cluster"
  type        = string
  validation {
    condition     = length(var.cluster_name) <= 63
    error_message = "Cluster name must be 63 characters or fewer."
  }
}

resource "azurerm_kubernetes_cluster" "this" {
  name                = var.cluster_name
  location            = var.location
  resource_group_name = var.resource_group_name
  kubernetes_version  = var.kubernetes_version
}

output "cluster_id" {
  description = "AKS cluster resource ID"
  value       = azurerm_kubernetes_cluster.this.id
}
```

---

## Database Schema Patterns

### Prisma
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  signals   Signal[]
  @@index([email])
  @@map("users")
}
```

### Alembic (migration detection)
```python
def upgrade() -> None:
    op.create_table('signals', ...)
    op.add_column('users', sa.Column('role', ...))
```

### Drizzle
```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
});
```

---

## Configuration Patterns

### Environment Variables (detect from code)
```typescript
const config = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DATABASE_URL!, // required — no fallback
  cacheEnabled: process.env.ENABLE_CACHE !== 'false', // optional, default true
};
```

```python
DATABASE_URL = os.environ["DATABASE_URL"]  # required (raises KeyError)
LOG_LEVEL = os.environ.get("LOG_LEVEL", "info")  # optional
```

### Feature Flags
```typescript
export const flags = {
  ENABLE_NEW_DASHBOARD: process.env.FF_NEW_DASHBOARD === 'true',
  MAX_SIGNALS_PER_REQUEST: parseInt(process.env.MAX_SIGNALS || '10'),
};
```

---

## CI/CD Patterns

### GitHub Actions
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
```

### Azure Pipelines
```yaml
stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        steps:
          - script: pip install -r requirements.txt
          - script: pytest tests/ -q
  - stage: Deploy
    dependsOn: Build
    condition: succeeded()
```

---

## What NOT to Document

| Skip | Reason |
|---|---|
| `node_modules/`, `.venv/`, `vendor/` | Third-party code |
| `.git/` | Version control internals |
| `dist/`, `build/`, `.next/`, `out/` | Build artifacts |
| `__pycache__/`, `.pyc` files | Python bytecode |
| Generated Prisma client | Document the schema, not the generated client |
| GraphQL codegen output | Document the SDL schema source |
| Lock files (package-lock, yarn.lock) | No useful documentation content |
| Binary files, images, fonts | Not documentable |
| Test snapshots | Implementation detail |
| `.env` (actual secrets) | Security risk — only document `.env.example` |
