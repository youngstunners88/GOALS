# ⚽ $GOALS Protocol Frontend Architecture

> **Enterprise-grade frontend architecture with Clean Architecture, Effect System, and Separation of Concerns.**

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  Components  │ │     Pages    │ │     Hooks    │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  Use Cases   │ │     DTOs     │ │   Services   │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   Entities   │ │ Value Objects│ │    Events    │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  HTTP Client │ │   Storage    │ │  Blockchain  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── core/                    # Cross-cutting concerns
│   │   ├── effects/             # Effect system for async operations
│   │   ├── routing/             # Declarative routing system
│   │   ├── state/               # State management (store, slices, selectors)
│   │   ├── abstraction/         # Ports, adapters, DI container
│   │   └── separation/          # Layer guards, feature modules, boundaries
│   ├── domain/                  # Domain layer (pure business logic)
│   │   ├── entities/            # Domain entities
│   │   ├── valueObjects/        # Immutable value objects
│   │   ├── events/              # Domain events and event bus
│   │   └── services/            # Domain services
│   ├── application/             # Application layer (orchestration)
│   │   ├── useCases/            # Use cases / interactors
│   │   ├── dto/                 # Data transfer objects
│   │   ├── ports/               # Application ports
│   │   └── services/            # Application services
│   ├── presentation/            # UI layer
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   └── hooks/               # Custom React hooks
│   └── infrastructure/          # External concerns
│       ├── http/                # API clients
│       ├── storage/             # Storage implementations
│       └── blockchain/          # Web3 adapters
├── scripts/
│   └── check-architecture.js    # Architecture validation
└── ARCHITECTURE.md              # This file
```

## 🎯 Core Systems

### 1. Effect System (`src/core/effects/`)

A type-safe, composable effect system for managing side effects.

```typescript
import { createEffect, effectRunner } from '@core/effects';

const fetchPlayers = createEffect(
  'fetchPlayers',
  async (params: { page: number }, context) => {
    const response = await api.get(`/players?page=${params.page}`, {
      signal: context.abortSignal,
    });
    return response.data;
  },
  {
    debounceMs: 300,
    retries: 3,
    timeoutMs: 10000,
    cacheMs: 60000,
  }
);

// Run with full lifecycle control
const result = await fetchPlayers.run({ page: 1 });

// Subscribe to state changes
fetchPlayers.subscribe((result) => {
  console.log(result.status); // 'idle' | 'pending' | 'success' | 'failure'
});

// Cancel pending execution
fetchPlayers.cancel();
```

**Features:**
- ✅ Cancellation via `AbortSignal`
- ✅ Debounce & throttle
- ✅ Retry with exponential backoff
- ✅ Timeout handling
- ✅ Deduplication
- ✅ Caching
- ✅ Observable state

### 2. Routing System (`src/core/routing/`)

Declarative routing with guards, lazy loading, and module organization.

```typescript
import { createRouter, routeRegistry, createWalletGuard } from '@core/routing';

const walletGuard = createWalletGuard(
  () => web3Provider.getAccounts().then(a => a.length > 0)
);

routeRegistry.registerModule({
  name: 'marketplace',
  prefix: '/marketplace',
  routes: [
    {
      path: '/',
      name: 'marketplace.home',
      component: MarketplacePage,
      guards: [walletGuard],
    },
    {
      path: '/player/:id',
      name: 'marketplace.player',
      component: PlayerDetailPage,
    },
  ],
});

const router = createRouter(routeRegistry.getAllRoutes());
```

### 3. State Management (`src/core/state/`)

Immer-powered store with slices, selectors, and middleware.

```typescript
import { createStore, createSlice, createSelector } from '@core/state';

const playerSlice = createSlice({
  name: 'players',
  initialState: { items: [], loading: false },
  reducers: {
    'players/set': (state, action) => {
      state.items = action.payload;
    },
    'players/setLoading': (state, action) => {
      state.loading = action.payload;
    },
  },
});

const store = createStore(
  combineReducers({ players: playerSlice.reducer })
);

// Dispatch action
store.dispatch(playerSlice.actions.set(players));

// Memoized selector
const selectTopPlayers = createSelector(
  (state) => state.players.items,
  (items) => items.filter((p) => p.stats.overall > 85)
);
```

### 4. Abstraction Layer (`src/core/abstraction/`)

**Ports & Adapters** pattern with dependency injection.

```typescript
import { container, AxiosHttpAdapter, ConsoleLoggerAdapter } from '@core/abstraction';

// Register implementations
container.registerSingleton('http', AxiosHttpAdapter);
container.registerSingleton('logger', () => new ConsoleLoggerAdapter({ app: 'goals' }));

// Resolve anywhere in the app
const http = container.resolve<HttpPort>('http');
const logger = container.resolve<LoggerPort>('logger');
```

**Available Ports:**
- `HttpPort` - HTTP abstraction
- `StoragePort` - Storage abstraction
- `LoggerPort` - Logging abstraction
- `BlockchainPort` - Web3 abstraction

### 5. Separation of Concerns (`src/core/separation/`)

**Layer Guard** enforces Clean Architecture dependency rules:

```typescript
import { layerGuard } from '@core/separation';

// This will throw if presentation tries to import infrastructure
layerGuard.validateImport('presentation', '../infrastructure/http/client');
```

**Dependency Rules:**
- `presentation` → `application`, `domain`
- `application` → `domain`
- `domain` → (nothing - pure!)
- `infrastructure` → `application`, `domain`

**Feature Modules** organize code by feature:

```typescript
import { defineFeature } from '@core/separation';

defineFeature({
  name: 'minting',
  routes: [...],
  slices: [mintingSlice],
  effects: [mintPlayerEffect],
  initialize: async () => {
    // Feature bootstrap
  },
});
```

## 🧪 Architecture Validation

Run the architecture checker to detect layer violations:

```bash
npm run arch:check
```

This scans all `.ts`/`.tsx` files and reports any imports that violate Clean Architecture rules.

## 🚀 Quick Start

```bash
cd goals-protocol/frontend
npm install
npm run dev
```

## 📐 Design Principles

1. **Domain First** - Business logic lives in `domain/` with zero external dependencies
2. **Dependency Inversion** - All external concerns are abstracted through ports
3. **Feature Organization** - Code is organized by feature, not by technical role
4. **Effect Isolation** - Side effects are explicit, testable, and cancellable
5. **Immutable State** - State changes are tracked and predictable via Immer
6. **Type Safety** - Full TypeScript coverage with strict mode
