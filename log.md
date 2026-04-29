# Fastify

> Automatic wide events, structured errors, drain adapters, enrichers, and tail sampling in Fastify applications.

The `evlog/fastify` plugin auto-creates a request-scoped logger accessible via `request.log` and `useLogger()`, emitting a wide event when the response completes.

<code-collapse>

```txt [Prompt]
Set up evlog in my Fastify app.

- Install evlog: pnpm add evlog
- Call initLogger({ env: { service: 'my-api' } }) at startup
- Alternatively, use evlog/vite plugin in vite.config.ts for auto-init (replaces initLogger)
- Import evlog from 'evlog/fastify' and register with app.register(evlog)
- Access the logger via request.log in route handlers or useLogger() anywhere
- Use log.set() to accumulate context throughout the request
- Optionally pass drain, enrich, include, and keep options when registering

Docs: https://www.evlog.dev/frameworks/fastify
Adapters: https://www.evlog.dev/adapters
```

</code-collapse>

## Quick Start

### 1. Install

```bash [Terminal]
bun add evlog fastify
```

### 2. Initialize and register the plugin

```typescript [src/index.ts]
import Fastify from 'fastify'
import { initLogger } from 'evlog'
import { evlog } from 'evlog/fastify'

initLogger({
  env: { service: 'my-api' },
})

const app = Fastify({ logger: false })

await app.register(evlog)

app.get('/health', async (request) => {
  request.log.set({ route: 'health' })
  return { ok: true }
})

await app.listen({ port: 3000 })
```

<callout color="info" icon="i-custom-vite">

**Using Vite?** The [`evlog/vite` plugin](/core-concepts/vite-plugin) replaces the `initLogger()` call with compile-time auto-initialization, strips `log.debug()` from production builds, and injects source locations.

</callout>

`request.log` is the evlog wide-event logger and shadows Fastify's built-in pino logger on the request. The pino logger remains accessible via `fastify.log` for server-level structured logging.

## Wide Events

Build up context progressively through your handler. One request = one wide event:

```typescript [src/index.ts]
app.get('/users/:id', async (request) => {
  const { id } = request.params as { id: string }

  request.log.set({ user: { id } })

  const user = await db.findUser(id)
  request.log.set({ user: { name: user.name, plan: user.plan } })

  const orders = await db.findOrders(id)
  request.log.set({ orders: { count: orders.length, totalRevenue: sum(orders) } })

  return { user, orders }
})
```

All fields are merged into a single wide event emitted when the request completes:

```bash [Terminal output]
14:58:15 INFO [my-api] GET /users/usr_123 200 in 12ms
  ├─ orders: count=2 totalRevenue=6298
  ├─ user: id=usr_123 name=Alice plan=pro
  └─ requestId: 4a8ff3a8-...
```

## useLogger()

Use `useLogger()` to access the request-scoped logger from anywhere in the call stack without passing the request object through your service layer:

```typescript [src/services/user.ts]
import { useLogger } from 'evlog/fastify'

export async function findUser(id: string) {
  const log = useLogger()
  log.set({ user: { id } })

  const user = await db.findUser(id)
  log.set({ user: { name: user.name, plan: user.plan } })

  return user
}
```

```typescript [src/index.ts]
import { findUser } from './services/user'

app.get('/users/:id', async (request) => {
  const { id } = request.params as { id: string }
  const user = await findUser(id)
  return user
})
```

Both `request.log` and `useLogger()` return the same logger instance. `useLogger()` uses `AsyncLocalStorage` to propagate the logger across async boundaries.

## Background work (`log.fork`)

Use `request.log.fork(label, fn)` for async work that should emit a **separate** child wide event after the response. See [Wide events — After emit](/logging/wide-events#after-emit-sealing-and-background-work).

```typescript [src/index.ts]
import { evlog, useLogger } from 'evlog/fastify'

app.post('/orders', async (request, reply) => {
  request.log.fork!('fulfill', async () => {
    const log = useLogger()
    log.set({ step: 'ok' })
  })
  return { ok: true }
})
```

## Error Handling

Use `createError` for structured errors with `why`, `fix`, and `link` fields. Fastify captures thrown errors via `onError`:

```typescript [src/index.ts]
import { createError, parseError } from 'evlog'

app.get('/checkout', async (_request, reply) => {
  throw createError({
    message: 'Payment failed',
    status: 402,
    why: 'Card declined by issuer',
    fix: 'Try a different payment method',
    link: 'https://docs.example.com/payments/declined',
  })
})

app.setErrorHandler((error, _request, reply) => {
  const parsed = parseError(error)
  reply.status(parsed.status).send({
    message: parsed.message,
    why: parsed.why,
    fix: parsed.fix,
    link: parsed.link,
  })
})
```

The error is captured and logged with both the custom context and structured error fields:

```bash [Terminal output]
14:58:20 ERROR [my-api] GET /checkout 402 in 3ms
  ├─ error: name=EvlogError message=Payment failed status=402
  └─ requestId: 880a50ac-...
```

## Configuration

See the [Configuration reference](/core-concepts/configuration) for all available options (`initLogger`, middleware options, sampling, silent mode, etc.).

## Drain & Enrichers

Configure drain adapters and enrichers directly in the plugin options:

```typescript [src/index.ts]
import { createAxiomDrain } from 'evlog/axiom'
import { createUserAgentEnricher } from 'evlog/enrichers'

const userAgent = createUserAgentEnricher()

await app.register(evlog, {
  drain: createAxiomDrain(),
  enrich: (ctx) => {
    userAgent(ctx)
    ctx.event.region = process.env.FLY_REGION
  },
})
```

### Pipeline (Batching & Retry)

For production, wrap your adapter with `createDrainPipeline` to batch events and retry on failure:

```typescript [src/index.ts]
import type { DrainContext } from 'evlog'
import { createAxiomDrain } from 'evlog/axiom'
import { createDrainPipeline } from 'evlog/pipeline'

const pipeline = createDrainPipeline<DrainContext>({
  batch: { size: 50, intervalMs: 5000 },
  retry: { maxAttempts: 3 },
})
const drain = pipeline(createAxiomDrain())

await app.register(evlog, { drain })
```

<callout color="info" icon="i-lucide-info">

Call `drain.flush()` on server shutdown to ensure all buffered events are sent. See the [Pipeline docs](/adapters/pipeline) for all options.

</callout>

## Tail Sampling

Use `keep` to force-retain specific events regardless of head sampling:

```typescript [src/index.ts]
await app.register(evlog, {
  drain: createAxiomDrain(),
  keep: (ctx) => {
    if (ctx.duration && ctx.duration > 2000) ctx.shouldKeep = true
  },
})
```

## Route Filtering

Control which routes are logged with `include` and `exclude` patterns:

```typescript [src/index.ts]
await app.register(evlog, {
  include: ['/api/**'],
  exclude: ['/_internal/**', '/health'],
  routes: {
    '/api/auth/**': { service: 'auth-service' },
    '/api/payment/**': { service: 'payment-service' },
  },
})
```

## Run Locally

```bash [Terminal]
git clone https://github.com/hugorcd/evlog.git
cd evlog
bun install
bun run example:fastify
```

Open [http://localhost:3000](http://localhost:3000) to explore the interactive test UI.

<card-group>
<card icon="i-simple-icons-github" title="Source Code" to="https://github.com/hugorcd/evlog/tree/main/examples/fastify">

Browse the complete Fastify example source on GitHub.

</card>
</card-group>

## Next Steps

- [Wide Events](/logging/wide-events): Design comprehensive events with context layering
- [Adapters](/adapters/overview): Send logs to Axiom, Sentry, PostHog, and more
- [Sampling](/core-concepts/sampling): Control log volume with head and tail sampling
- [Structured Errors](/logging/structured-errors): Throw errors with `why`, `fix`, and `link` fields

<style>

html .light .shiki span {color: var(--shiki-light);background: var(--shiki-light-bg);font-style: var(--shiki-light-font-style);font-weight: var(--shiki-light-font-weight);text-decoration: var(--shiki-light-text-decoration);}html.light .shiki span {color: var(--shiki-light);background: var(--shiki-light-bg);font-style: var(--shiki-light-font-style);font-weight: var(--shiki-light-font-weight);text-decoration: var(--shiki-light-text-decoration);}html .default .shiki span {color: var(--shiki-default);background: var(--shiki-default-bg);font-style: var(--shiki-default-font-style);font-weight: var(--shiki-default-font-weight);text-decoration: var(--shiki-default-text-decoration);}html .shiki span {color: var(--shiki-default);background: var(--shiki-default-bg);font-style: var(--shiki-default-font-style);font-weight: var(--shiki-default-font-weight);text-decoration: var(--shiki-default-text-decoration);}html .dark .shiki span {color: var(--shiki-dark);background: var(--shiki-dark-bg);font-style: var(--shiki-dark-font-style);font-weight: var(--shiki-dark-font-weight);text-decoration: var(--shiki-dark-text-decoration);}html.dark .shiki span {color: var(--shiki-dark);background: var(--shiki-dark-bg);font-style: var(--shiki-dark-font-style);font-weight: var(--shiki-dark-font-weight);text-decoration: var(--shiki-dark-text-decoration);}html pre.shiki code .sBMFI, html code.shiki .sBMFI{--shiki-light:#E2931D;--shiki-default:#FFCB6B;--shiki-dark:#FFCB6B}html pre.shiki code .sfazB, html code.shiki .sfazB{--shiki-light:#91B859;--shiki-default:#C3E88D;--shiki-dark:#C3E88D}html pre.shiki code .s7zQu, html code.shiki .s7zQu{--shiki-light:#39ADB5;--shiki-light-font-style:italic;--shiki-default:#89DDFF;--shiki-default-font-style:italic;--shiki-dark:#89DDFF;--shiki-dark-font-style:italic}html pre.shiki code .sTEyZ, html code.shiki .sTEyZ{--shiki-light:#90A4AE;--shiki-default:#EEFFFF;--shiki-dark:#BABED8}html pre.shiki code .sMK4o, html code.shiki .sMK4o{--shiki-light:#39ADB5;--shiki-default:#89DDFF;--shiki-dark:#89DDFF}html pre.shiki code .s2Zo4, html code.shiki .s2Zo4{--shiki-light:#6182B8;--shiki-default:#82AAFF;--shiki-dark:#82AAFF}html pre.shiki code .swJcz, html code.shiki .swJcz{--shiki-light:#E53935;--shiki-default:#F07178;--shiki-dark:#F07178}html pre.shiki code .spNyl, html code.shiki .spNyl{--shiki-light:#9C3EDA;--shiki-default:#C792EA;--shiki-dark:#C792EA}html pre.shiki code .sfNiH, html code.shiki .sfNiH{--shiki-light:#FF5370;--shiki-default:#FF9CAC;--shiki-dark:#FF9CAC}html pre.shiki code .sHdIc, html code.shiki .sHdIc{--shiki-light:#90A4AE;--shiki-light-font-style:italic;--shiki-default:#EEFFFF;--shiki-default-font-style:italic;--shiki-dark:#BABED8;--shiki-dark-font-style:italic}html pre.shiki code .sbssI, html code.shiki .sbssI{--shiki-light:#F76D47;--shiki-default:#F78C6C;--shiki-dark:#F78C6C}

</style>

---

- [Source Code](https://github.com/hugorcd/evlog/tree/main/examples/fastify)
