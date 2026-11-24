# Engineering Decisions

Key architectural decisions, their rationale, and trade-offs.

---

## D-1: File-Based Profiles Instead of MongoDB

**Decision:** Profile data (config, strategies, trades, journal) stored as JSON files in `profiles/{name}/`, not in MongoDB collections.

**Why:** Simpler to inspect, edit, and backup manually. Personal tool — no need for multi-process access or atomic writes. JSON files work fine for 2 users with low write frequency.

**Trade-off:** No querying. Performance stats require reading the entire trades.json file. If trades.json grows to 10,000+ rows, switch to a MongoDB `Trade` collection filtered by profile name.

**When to revisit:** If a profile's `trades.json` exceeds 1 MB or stats calculation becomes slow (> 1s).

---

## D-2: Demo Mode via isDemoMode() Guard

**Decision:** A single boolean check (`isDemoMode()` in `kite.config.js`) routes all Kite API calls to MockService when no API key is configured.

**Why:** Development and testing shouldn't require real Kite credentials. Same code path runs in both modes.

**Trade-off:** MockService data is static. Demo mode doesn't reflect real market conditions. This is intentional.

**Implication:** Any new service that calls `kiteService.getQuote()` or `kiteService.placeOrder()` automatically gets mock data in demo mode — no additional changes needed.

---

## D-3: Services Instantiated in server.js, Injected via app.locals

**Decision:** All stateful services (TickerService, StrategyService, etc.) are created once in `server.js` and passed to routes via `app.locals`.

**Why:** Avoids singletons at the module level. Makes dependencies explicit and testable. Each service gets the same Socket.io `io` instance for real-time push.

**Trade-off:** `app.locals` is global to the Express app. For a larger system, use dependency injection. Fine for personal use.

---

## D-4: Paper Trading Defaults to True

**Decision:** New profiles created via `create-profile.js` default to `"paperTrading": true`.

**Why:** Safety. The user must explicitly opt into real money trading. No accidental live orders.

**Trade-off:** None — this is the right default.

**To enable live trading:** Edit `profiles/{name}/config.json`, set `"paperTrading": false`, AND ensure Kite access token is valid.

---

## D-5: VIX Fetched via NSE HTML Scrape

**Decision:** VixService fetches India VIX by scraping the NSE India website, not via an official API.

**Why:** NSE doesn't provide a free public VIX API. Kite Connect's historical API provides VIX candles but not live VIX without a subscription.

**Trade-off:** Fragile — will break if NSE changes their page structure. Fallback: use last known VIX value.

**When to fix:** If VIX stops updating, check the NSE page structure and update the CSS selector in `vix.service.js`.

---

## D-6: Strategy Conditions Stored as JSON Rules

**Decision:** Strategy entry/exit conditions are stored as arrays of `{ indicator, operator, value }` objects, not as code.

**Example:**
```json
[
  { "indicator": "rsi", "operator": "<", "value": 30 },
  { "indicator": "volumeVsAvg", "operator": ">", "value": 1.5 }
]
```

**Why:** Strategies can be created via the UI without writing code. Conditions are serializable to JSON for storage in MongoDB and profile files.

**Trade-off:** Cannot express complex multi-step logic (e.g., "RSI was below 30 three bars ago"). Complex strategies need a code-based condition function. This is not yet supported.

---

## D-7: Socket.io for Real-Time, Axios for Data Fetch

**Decision:** Real-time streaming (ticks, radar, alerts) uses Socket.io events. CRUD operations (create strategy, place order) use REST via Axios.

**Why:** Clean separation. REST for commands/queries, WebSocket for streaming data. Follows standard practice.

**Trade-off:** Clients must maintain both a REST session and a Socket.io connection. Acceptable for a single-page app.

---

## D-8: React with Local State (No Redux)

**Decision:** Each component manages its own state with `useState` and `useEffect`. No Redux, Zustand, or Context API.

**Why:** Personal tool, small team, low complexity. Redux adds ceremony without benefit at this scale.

**Trade-off:** Shared state (e.g., active profile name) is not shared between components. Currently, the profile must be selected in Settings and each component fetches data independently.

**When to fix:** If components start needing the same state (e.g., current profile name, VIX level, paper trading balance shown in the header), add a lightweight Context.

---

## D-9: Single Node Process, No Queue

**Decision:** All services (strategy evaluation, radar scan, VIX fetch) run as `setInterval` loops inside the same Node.js process.

**Why:** Simple. For 2 users and < 50 subscribed instruments, one process handles the load easily.

**Trade-off:** A crash in one service (uncaught exception) can take down the whole server. Services don't have isolated failure domains.

**When to revisit:** If the instrument universe grows to 500+ symbols, or if strategy evaluation logic becomes CPU-intensive (e.g., backtesting).
