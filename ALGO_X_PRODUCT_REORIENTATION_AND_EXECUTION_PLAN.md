# Algo-X --- Product Reorientation & Execution Mission

**Document purpose:** Strategic/product/engineering handoff for Claude
Code.

**Status:** Direction-setting document.\
**Repository:** `algo-x-main`\
**Primary objective:** Reorganize the existing Algo-X platform around a
compelling daily user value proposition, without removing existing
capabilities.

------------------------------------------------------------------------

## 1. Executive Decision

Do **not** delete or abandon the existing trading-platform capabilities.

Instead:

> **Keep the current trading, scanner, radar, strategy, paper-trading,
> alerts, heatmap and execution modules as a secondary/advanced layer.
> Reorganize the product around a new primary mission: helping an Indian
> retail investor understand what deserves attention, why it matters,
> what changed, and what evidence supports a decision.**

The product should evolve from:

> **"An algorithmic trading platform with scanners and strategies."**

toward:

> **"A personal Indian market intelligence and decision-support
> engine."**

The distinction is critical.

The current repository has substantial technical capability, but
capability alone is not sufficient product value. The primary product
must answer a recurring question that makes the user voluntarily open
it:

> **"What in the market or my portfolio deserves my attention today, and
> why?"**

The existing automated trading system remains valuable, but it should
not be the main reason a new user adopts Algo-X.

------------------------------------------------------------------------

# 2. Product Principle

Use this equation for every future feature:

> **User Value \>\>\> Reason to Use + Learning Effort + Time/Attention
> Cost + Money Cost**

Currently money cost is ₹0, but attention and learning effort are still
real costs.

A feature should therefore not be built merely because it is technically
interesting.

For every proposed feature, answer:

1.  What user problem does this solve?
2.  Why would the user open Algo-X for this instead of TradingView /
    Screener / Chartink / Trendlyne / StockEdge / broker tools?
3.  How frequently does the problem occur?
4.  Does the feature save meaningful research time?
5.  Does it improve decision quality or discipline?
6.  Can the value be understood in under 30 seconds?
7.  Can a user benefit without learning a complex new workflow?
8.  Is the evidence behind the feature trustworthy?
9.  Can this be built incrementally?
10. Does it increase retention/repeated usage?

If the answer is mostly "no", deprioritize it.

------------------------------------------------------------------------

# 3. Critical Lessons From Previous Projects

This project must explicitly avoid repeating the failure pattern seen in
earlier projects such as TrustWeave and RAG/knowledge projects.

The problem was not primarily insufficient engineering.

The recurring problem was:

> **Too much capability was built before proving that people had a
> strong enough reason to repeatedly use the product.**

Therefore:

### Do NOT optimize for

-   number of features
-   number of screens
-   architecture sophistication
-   multi-tenancy
-   SaaS infrastructure
-   enterprise readiness
-   payment systems
-   mobile app
-   social features
-   AI branding
-   huge strategy libraries
-   endless indicators
-   complicated automation

before proving recurring user value.

### Optimize for

-   one compelling daily workflow
-   extremely clear value
-   evidence-backed outputs
-   low cognitive load
-   fast time-to-value
-   repeated usage
-   personal usefulness
-   measurable decision/time savings

------------------------------------------------------------------------

# 4. Existing Repo Must Be Preserved

The current Algo-X repository already contains substantial
functionality.

Do not remove working modules simply because the product direction is
changing.

Treat the existing capabilities as a **secondary Advanced Trading /
Execution layer**.

Current capabilities include:

-   real-time Kite/WebSocket market data
-   technical indicators
-   stock filtering
-   strategy engine
-   order management
-   paper trading
-   India VIX integration
-   order-book radar
-   scanner templates
-   scanner watch mode
-   Telegram alerts
-   sector heatmap
-   profiles
-   strategy library
-   trade history
-   risk controls
-   alerts
-   backtesting-related infrastructure
-   authentication
-   dashboard

These remain useful.

The change is primarily:

> **Product hierarchy, information architecture, landing-page mission,
> prioritization, and evidence quality.**

Do not rebuild existing functionality unnecessarily.

------------------------------------------------------------------------

# 5. New Product Mission

## Mission

> **Help an Indian retail investor discover, understand, prioritize and
> monitor market opportunities and portfolio risks without spending
> hours manually researching dozens of stocks.**

This is decision support, not financial advice.

Algo-X should not position itself as:

-   a guaranteed stock picker
-   a prediction engine
-   an "AI that knows tomorrow's price"
-   a replacement for a broker
-   an automated profit machine

Instead it should provide:

> **structured evidence, ranking, context, historical behavior and
> monitoring.**

------------------------------------------------------------------------

# 6. Primary User

The first user should be an individual Indian equity investor/trader
who:

-   follows Indian equities
-   maintains a watchlist and/or portfolio
-   spends time researching stocks
-   uses multiple websites/apps
-   understands basic investing/technical analysis
-   wants better signal-to-noise
-   does not want to stare at charts all day
-   wants alerts when something meaningful changes
-   values evidence over hype

This user may be:

### A. Position/swing investor

Interested in:

-   quality
-   growth
-   valuation
-   momentum
-   sector strength
-   catalysts
-   risk
-   entry timing

### B. Active trader

Interested in:

-   momentum
-   volume
-   VWAP
-   breakout
-   order flow
-   volatility
-   intraday setups

Algo-X can support both.

However:

> **Do not make intraday automation the primary product proposition.**

The broader and more durable value is market intelligence and decision
support.

------------------------------------------------------------------------

# 7. Product Hierarchy

The product should be reorganized conceptually as:

``` text
                         ALGO-X
                           |
                MARKET INTELLIGENCE
                           |
          +----------------+----------------+
          |                                 |
       DISCOVER                         MONITOR
          |                                 |
   Opportunities                    My Portfolio
          |                         My Watchlist
          |                              |
     RANK + FILTER                  What Changed?
          |
       UNDERSTAND
          |
     Why this stock?
          |
       EVIDENCE
          |
 Historical behavior / risk /
 fundamentals / technicals /
 market regime / sector
          |
        DECIDE
          |
   Watch / Research / Wait /
   Enter / Reduce / Exit
          |
      ADVANCED
          |
   Strategies / Scanners /
   Radar / Paper Trading /
   Backtesting / Execution
```

The Advanced Trading layer remains available.

It is simply no longer the first thing the product asks a user to
understand.

------------------------------------------------------------------------

# 8. Landing Page / Primary Product Experience

The landing page is strategically important.

It should communicate the new mission through **missions**, not a
generic list of features.

Do not lead with:

> "We have 12 indicators, 10 strategies, real-time WebSocket, radar,
> scanner, etc."

Lead with user outcomes.

Suggested landing-page structure:

## Mission 1 --- Start My Day

> **What deserves my attention today?**

Show:

-   market regime
-   NIFTY / BANK NIFTY context
-   India VIX
-   sector leadership
-   unusual activity
-   top opportunities
-   watchlist changes
-   portfolio warnings

The user should understand the answer in seconds.

------------------------------------------------------------------------

## Mission 2 --- Find Opportunities

> **Show me stocks worth researching.**

The system should rank candidates using multiple evidence dimensions.

Example:

``` text
XYZ

Opportunity Score: 91/100

Quality       9.0
Growth        8.7
Valuation     8.2
Momentum      7.8
Volume        8.9
Sector        9.1
Risk          8.0
```

Important:

The score is not a recommendation.

It is a prioritization mechanism.

------------------------------------------------------------------------

## Mission 3 --- Tell Me Why

> **Why is this stock interesting?**

A user should never see a score without explanation.

Example:

``` text
WHY XYZ IS RANKED HIGH

Fundamental
✓ Earnings improving
✓ Debt acceptable
✓ Cash flow positive

Valuation
✓ Below historical valuation range

Technical
✓ Above 50DMA
✓ Momentum improving
✓ Volume 1.8× average

Market Context
✓ Sector outperforming NIFTY

Risk
✓ Liquidity acceptable
✓ Volatility normal

Conclusion:
Worth researching further.
```

The goal is to compress a 30--60 minute research process into a concise
evidence summary.

------------------------------------------------------------------------

## Mission 4 --- Tell Me What Changed

> **I don't want to continuously monitor 30 stocks. Tell me what
> changed.**

This should become a major retention mechanism.

Examples:

``` text
PORTFOLIO CHANGES

XYZ
Momentum ↑
Sector strength ↑
Volume ↑

ABC
Relative strength ↓
Selling volume ↑

DEF
Technical breakdown
Risk score deteriorated
```

The product becomes a monitoring assistant rather than another screen
the user must constantly watch.

------------------------------------------------------------------------

## Mission 5 --- Test the Idea

> **Has this setup historically worked?**

This leads to the validated backtesting/evidence engine.

Examples:

``` text
Momentum Burst

Historical occurrences: 1,284

1D median return: +0.8%
5D median return: +2.4%
20D median return: +4.7%

5D win rate: 61%
Profit factor: 1.42
Max drawdown: 18.2%

Best regime:
VIX 12–18

Weak regime:
VIX >25
```

This turns generic technical signals into evidence.

------------------------------------------------------------------------

## Mission 6 --- Automate

Only after the user understands the intelligence layer:

> **Turn a validated strategy into alerts or paper trades.**

This is where the current strategy engine, paper trading, Telegram, risk
controls and future broker execution belong.

------------------------------------------------------------------------

# 9. The Core Product Loop

The product should create this loop:

``` text
Market changes
      ↓
Algo-X detects meaningful change
      ↓
Ranks what matters
      ↓
Explains why
      ↓
Shows historical evidence
      ↓
User decides
      ↓
User watches / paper trades / trades
      ↓
Outcome is recorded
      ↓
Algo-X learns which signals actually mattered
```

This is stronger than:

``` text
indicator → signal → trade
```

because it connects discovery, evidence, decision and learning.

------------------------------------------------------------------------

# 10. Opportunity Ranking --- Core New Capability

Build an **Opportunity Ranking Engine**.

It should combine multiple dimensions rather than relying on one
technical indicator.

Initial dimensions:

### Fundamental / business quality

Where data is available:

-   revenue growth
-   earnings growth
-   ROE / ROCE
-   debt
-   cash flow
-   margin trends
-   promoter/ownership context where reliable
-   profitability consistency

### Valuation

Where data is available:

-   P/E
-   P/B
-   EV/EBITDA
-   historical valuation percentile
-   industry comparison

### Technical

-   trend
-   price vs moving averages
-   RSI
-   MACD
-   VWAP
-   ATR
-   support/resistance
-   momentum
-   breakout/reclaim

### Volume / liquidity

-   volume vs average
-   volume trend
-   liquidity
-   abnormal volume

### Relative strength

-   stock vs NIFTY
-   stock vs sector
-   sector vs NIFTY

### Market regime

-   NIFTY trend
-   breadth
-   India VIX
-   volatility regime

### Risk

-   volatility
-   drawdown
-   liquidity
-   concentration
-   distance from invalidation level

Do not pretend every stock has every data point.

Missing data must be explicit.

------------------------------------------------------------------------

# 11. Score Design

The initial score should be explainable.

Avoid opaque ML scores initially.

Example:

``` text
Opportunity Score =
  20% Quality
+ 15% Growth
+ 15% Valuation
+ 15% Momentum
+ 10% Volume
+ 10% Relative Strength
+ 10% Market/sector context
+  5% Risk
```

These weights are only an initial proposal.

They must be configurable and validated.

The important principle is:

> **Every point in the score must be explainable.**

Never display:

> Score = 91

without being able to answer:

> "Why 91?"

------------------------------------------------------------------------

# 12. Evidence-First Design

Every signal should eventually have evidence.

For each setup:

``` text
Signal
↓
Definition
↓
Historical occurrences
↓
Expected behavior
↓
Best market regime
↓
Worst market regime
↓
Win rate
↓
Distribution of outcomes
↓
Drawdown
↓
Out-of-sample result
↓
Current match
```

This creates a meaningful distinction from generic scanners.

The user is not simply told:

> "RSI = 29."

They are told:

> "This setup occurred 1,100 times historically and behaved differently
> depending on regime."

------------------------------------------------------------------------

# 13. Critical Backtesting Integrity Rule

The repository currently contains backtesting-related code and must be
audited carefully.

Do **not** represent synthetic/random OHLCV simulations as historical
evidence.

If data is synthetic:

``` text
SIMULATION / ILLUSTRATIVE ONLY
```

must be clearly labelled.

If data is genuinely historical:

``` text
HISTORICAL BACKTEST
```

may be used.

Future results must distinguish:

1.  illustrative simulation
2.  historical backtest
3.  out-of-sample test
4.  paper trading
5.  live trading

Never mix them.

Never manufacture a win rate.

Never hardcode expected strategy performance as if it were empirical
evidence.

This is a product trust requirement.

------------------------------------------------------------------------

# 14. Real Backtesting Direction

The real backtesting engine should eventually support:

### Input

-   symbol/universe
-   timeframe
-   start/end date
-   strategy
-   entry conditions
-   exit conditions
-   stop loss
-   take profit
-   position sizing
-   brokerage
-   slippage
-   capital

### Output

-   total return
-   CAGR where meaningful
-   win rate
-   average win
-   average loss
-   profit factor
-   expectancy
-   max drawdown
-   Sharpe
-   Sortino where appropriate
-   number of trades
-   exposure
-   turnover
-   best/worst periods
-   regime breakdown

Also support:

### In-sample

and:

### Out-of-sample

and preferably:

### Walk-forward validation

Do not optimize parameters against the same period used to judge
performance.

------------------------------------------------------------------------

# 15. "What Changed?" Engine

This should be a first-class service.

For every watchlist/portfolio stock, compare current state against prior
observation.

Potential change categories:

### Price

-   breakout
-   breakdown
-   trend change

### Momentum

-   RSI acceleration/deceleration
-   MACD transition
-   relative strength change

### Volume

-   unusual volume
-   accumulation/distribution pattern

### Fundamentals

When reliable data exists:

-   earnings change
-   margin change
-   valuation change

### Sector

-   sector leadership change
-   sector weakness

### Market

-   regime change
-   volatility change

The system should only surface **meaningful changes**, not noise.

------------------------------------------------------------------------

# 16. Morning Brief

Build a concise daily market brief.

Potential delivery:

-   web dashboard
-   Telegram

Target:

> **\< 60 seconds to understand the brief.**

Example structure:

``` text
ALGO-X MORNING BRIEF

MARKET
NIFTY:
BANK NIFTY:
INDIA VIX:
REGIME:

SECTOR LEADERS
1.
2.
3.

TOP OPPORTUNITIES
1. XYZ — score 91
   reason...
2. ABC — score 87
   reason...

PORTFOLIO
3 changes
1 risk warning

WATCHLIST
2 new setups
1 deteriorating setup

TODAY'S ACTION
No strong setup? WAIT.
```

Do not turn the morning brief into a 5-page research report.

------------------------------------------------------------------------

# 17. "No Trade / Wait" Must Be a Valid Output

The system should not be optimized to always produce a signal.

Possible daily result:

``` text
No high-conviction opportunity.

Recommendation:
WAIT / MONITOR
```

This is important for credibility.

The goal is not maximum alerts.

The goal is:

> **maximum signal-to-noise.**

------------------------------------------------------------------------

# 18. Portfolio Intelligence

Add a portfolio layer without turning it into a generic portfolio
tracker.

Questions to answer:

-   What changed in my portfolio?
-   Which holding deteriorated?
-   Which holding improved?
-   Which holdings are highly correlated?
-   Which sectors are overrepresented?
-   Which positions are too volatile?
-   Which positions have weak technical structure?
-   Which holdings have attractive fundamentals but poor current setup?
-   Which positions require review?

Possible summary:

``` text
PORTFOLIO HEALTH

8 HOLD
2 REVIEW
1 WATCH
0 URGENT

Largest risk:
Sector concentration

Biggest improvement:
XYZ relative strength

Biggest deterioration:
ABC momentum + volume
```

Again:

> review ≠ automatic sell recommendation.

------------------------------------------------------------------------

# 19. Existing Scanner Module

Do not remove the scanner.

Reposition it.

### Current role

Advanced user tool.

### New role

Underlying signal-generation engine.

Existing scanner templates remain useful:

-   Momentum Burst
-   Oversold Reversal Candidate
-   Volume Breakout
-   VWAP Reclaim
-   Weak Hands Exit
-   StochRSI Oversold
-   MACD Bullish Cross

But scanners should eventually feed:

> Opportunity Ranking

rather than existing as isolated screens.

------------------------------------------------------------------------

# 20. Existing Order Radar

Keep it.

Position it as:

> **Order-flow evidence**

not a magical prediction mechanism.

Avoid claims like:

> "Buyer imbalance predicts the next move."

Instead:

> "Order-flow imbalance is one additional market signal."

The user should be able to see:

``` text
Price
+
Volume
+
Trend
+
Relative Strength
+
Order Flow
```

as combined evidence.

------------------------------------------------------------------------

# 21. Existing VIX Module

Keep and expand.

India VIX can be used to contextualize:

-   position sizing
-   volatility
-   stop distances
-   strategy performance
-   market regime
-   alert sensitivity

But avoid hardcoded simplistic assumptions.

Example:

> "Strategy X historically performs better in VIX 12--18."

is more useful than:

> "VIX \>20 means reduce quantity by exactly 30%."

------------------------------------------------------------------------

# 22. Existing Strategy Engine

Keep.

Reposition it under:

## Advanced → Strategies

Users should be able to:

-   create strategy
-   activate/deactivate
-   paper trade
-   backtest
-   inspect performance
-   monitor
-   receive alerts
-   eventually connect broker execution

The strategy engine becomes the **execution layer of validated
intelligence**, not the entire product.

------------------------------------------------------------------------

# 23. Existing Paper Trading

Keep and strengthen.

Paper trading is useful because it creates the bridge:

``` text
Research
→
Signal
→
Strategy
→
Paper trade
→
Journal
→
Validation
→
Potential live execution
```

Do not rush live execution.

------------------------------------------------------------------------

# 24. Trade Journal

Trade Journal should become part of the learning loop.

Every trade should capture:

-   strategy
-   signal
-   entry
-   stop
-   target
-   exit
-   P&L
-   market regime
-   VIX
-   setup type
-   reason
-   result
-   notes

Then calculate:

-   strategy win rate
-   expectancy
-   best setup
-   worst setup
-   performance by regime
-   performance by time
-   mistakes

The journal should answer:

> **"What am I personally doing well or badly?"**

That is more valuable than simply displaying a trade list.

------------------------------------------------------------------------

# 25. Product Information Architecture

Suggested top-level navigation:

``` text
HOME
  Morning Brief
  Market Regime
  Today's Opportunities
  What Changed

OPPORTUNITIES
  Ranked Stocks
  Why This Stock?
  Evidence

PORTFOLIO
  Holdings
  What Changed
  Risk
  Watchlist

MARKET
  Sectors
  Scanner
  Radar
  Heatmap

STRATEGIES
  Strategy Library
  Builder
  Backtest
  Paper Trading

JOURNAL
  Trades
  Performance
  Learnings

ALERTS
  Telegram
  Watch Mode

SETTINGS
```

Do not build all of these immediately.

This is the target conceptual architecture.

------------------------------------------------------------------------

# 26. Landing Page Should Explain the Product Through Missions

Avoid:

``` text
Feature
Feature
Feature
Feature
Feature
```

Prefer:

### Mission 1

**Know what matters today.**

### Mission 2

**Find opportunities without scanning thousands of stocks.**

### Mission 3

**Understand why the opportunity matters.**

### Mission 4

**See what changed in your portfolio.**

### Mission 5

**Check whether the setup has historically worked.**

### Mission 6

**Turn validated ideas into paper trades and alerts.**

This makes the product understandable to someone who has never used it.

------------------------------------------------------------------------

# 27. Competitive Positioning

Algo-X should not attempt to replace every existing tool.

Existing tools already provide strong capabilities in areas such as:

-   charting
-   technical screening
-   fundamental screening
-   broker execution
-   options analytics
-   social trading

Therefore the product should differentiate through:

> **cross-signal synthesis + prioritization + explanation + monitoring +
> evidence.**

The product should feel like:

> **"The layer that sits above my existing market tools and tells me
> what actually deserves my attention."**

Not:

> "Another place to look at charts."

------------------------------------------------------------------------

# 28. What NOT To Build Yet

Explicitly deprioritize:

-   mobile app
-   SaaS multi-tenancy
-   payment gateway
-   subscriptions
-   marketplace
-   social network
-   leaderboard
-   Discord integration
-   huge strategy marketplace
-   dozens of new indicators
-   ML prediction engine
-   LLM stock prediction chatbot
-   options automation
-   broker auto-execution as primary feature
-   enterprise architecture
-   complex microservices
-   multi-country market support

These can be reconsidered after product-market evidence.

------------------------------------------------------------------------

# 29. AI/LLM Use

Do not add AI simply because AI is fashionable.

Good AI use:

### Explain

> "Why did XYZ move into the top 10?"

### Summarize

> "What changed across my portfolio today?"

### Compare

> "Why did XYZ rank above ABC?"

### Investigate

> "What are the main reasons this setup may fail?"

### Natural-language research

> "Show me mid-cap stocks with improving earnings, reasonable valuation
> and positive relative strength."

Bad AI use:

> "Predict tomorrow's stock price."

> "Tell me which stock will double."

The product's core intelligence should remain deterministic and
evidence-driven where possible.

AI can sit on top as an explanation/research interface.

------------------------------------------------------------------------

# 30. Data Quality Is a Product Feature

Never hide data limitations.

For every important output, track:

-   source
-   timestamp
-   freshness
-   completeness
-   confidence

If fundamentals are stale:

> `Fundamental data updated 17 days ago`

If sector data is estimated:

> `Sector data estimated`

If a signal lacks enough history:

> `Insufficient historical evidence`

Trust is more valuable than apparent sophistication.

------------------------------------------------------------------------

# 31. Success Metrics

Do not measure success initially by:

-   lines of code
-   number of features
-   number of strategies
-   number of API endpoints

Measure:

### Activation

Can a new user understand the value in \<2 minutes?

### Daily value

Did the user find at least one useful insight?

### Research time saved

How much manual research did Algo-X replace?

### Repeat usage

Does the user return daily/weekly?

### Signal quality

How often does an alert lead to meaningful investigation?

### Noise

How many alerts are ignored?

### Decision support

Did the user change or improve a decision because of Algo-X?

### Trust

Do users understand why the system produced the result?

------------------------------------------------------------------------

# 32. The 30-Day Personal Validation Test

Before building a major SaaS/product layer:

Use Algo-X personally for approximately 30 market sessions.

Track:

``` text
Date
Opened?
Morning Brief useful?
Opportunity useful?
Portfolio change useful?
Signal worth researching?
Time saved?
Actual decision influenced?
Alert ignored?
Reason ignored?
```

At the end:

### Strong validation

You naturally check Algo-X before making market decisions.

### Weak validation

You use it occasionally but still rely completely on other tools.

### Failure validation

You stop opening it.

If it fails the personal validation test, do not solve the problem by
adding more features.

Revisit the value proposition.

------------------------------------------------------------------------

# 33. Feature Prioritization Framework

Every feature gets a score:

``` text
Value Score
×
Frequency
×
Differentiation
×
Evidence Quality
÷
Implementation Effort
```

Prefer:

> **high value + high frequency + low effort**

Examples:

### High priority

-   Morning Brief
-   Opportunity Ranking
-   Why This Stock
-   What Changed
-   real historical backtesting
-   evidence cards
-   portfolio intelligence
-   Telegram delivery

### Medium

-   advanced regime analytics
-   deeper order-flow analysis
-   multi-timeframe evidence
-   trade journal analytics

### Low

-   more indicators
-   more generic strategies
-   social features
-   mobile app

------------------------------------------------------------------------

# 34. Development Strategy

Work in small missions.

Each mission must produce a visible user outcome.

Bad mission:

> "Refactor scoring architecture."

Good mission:

> "User can see the 10 most interesting stocks today and understand why
> each was selected."

Bad mission:

> "Implement data abstraction."

Good mission:

> "Opportunity scores now use real historical data and show data
> freshness."

Every mission must have:

1.  objective
2.  user value
3.  acceptance criteria
4.  technical implementation
5.  validation
6.  evidence of completion
7.  next mission

------------------------------------------------------------------------

# 35. Recommended Execution Order

## Mission 0 --- Product Reorganization

-   Update product vision.
-   Update landing page.
-   Reorganize navigation.
-   Preserve existing modules.
-   Make Advanced Trading secondary.
-   Document the new product hierarchy.

**Do not build major new backend functionality yet.**

------------------------------------------------------------------------

## Mission 1 --- Morning Brief

Build the first daily habit.

Requirements:

-   market regime
-   VIX
-   sector context
-   top opportunities
-   portfolio/watchlist changes
-   concise explanations
-   Telegram delivery
-   web display

Success criterion:

> User can understand today's market situation in \<60 seconds.

------------------------------------------------------------------------

## Mission 2 --- Opportunity Ranking

Build the ranking engine.

Requirements:

-   multi-factor score
-   explainable components
-   no opaque AI
-   missing data handling
-   data freshness
-   ranking history

Success criterion:

> User receives a small list worth researching instead of a giant
> scanner result.

------------------------------------------------------------------------

## Mission 3 --- Why This Stock

Build evidence cards.

Requirements:

-   score breakdown
-   reasons
-   positives
-   risks
-   technical context
-   market/sector context
-   data timestamps

Success criterion:

> User understands why a stock ranked highly without opening five
> external tools.

------------------------------------------------------------------------

## Mission 4 --- What Changed

Build portfolio/watchlist change detection.

Success criterion:

> User can stop manually checking every stock.

------------------------------------------------------------------------

## Mission 5 --- Real Historical Backtesting

Replace/clearly separate synthetic simulations.

Requirements:

-   genuine historical data
-   costs
-   slippage
-   out-of-sample
-   drawdown
-   regime analysis
-   transparent methodology

Success criterion:

> Every strategy's claimed performance can be traced to real historical
> evidence.

------------------------------------------------------------------------

## Mission 6 --- Portfolio Intelligence

Connect:

-   holdings
-   opportunity score
-   risk
-   changes
-   alerts
-   journal

Success criterion:

> Algo-X becomes useful even when the user does not want to place a
> trade.

------------------------------------------------------------------------

## Mission 7 --- Strategy / Paper Trading Integration

Connect the new intelligence layer with the existing execution layer.

Flow:

``` text
Opportunity
→ Evidence
→ Strategy
→ Paper Trade
→ Journal
→ Validation
```

------------------------------------------------------------------------

# 36. Existing Modules Should Be Tagged

Internally classify every module:

### PRIMARY

Directly contributes to:

-   Discover
-   Understand
-   Monitor
-   Decide

### SECONDARY

Advanced functionality:

-   scanner
-   radar
-   strategy builder
-   paper trading
-   backtesting
-   execution

### INFRASTRUCTURE

-   authentication
-   data
-   WebSocket
-   profiles
-   persistence
-   API
-   logging

### EXPERIMENTAL

Anything not yet validated for user value.

This helps prevent random feature growth.

------------------------------------------------------------------------

# 37. Technical Architecture Principle

Do not rewrite the architecture merely to match this product direction.

Prefer incremental composition.

Existing services should be reused.

New services can be introduced where necessary:

``` text
OpportunityService
EvidenceService
ChangeDetectionService
MarketRegimeService
PortfolioIntelligenceService
```

These should consume existing market/indicator/scanner/radar services.

Avoid duplicating market-data logic.

------------------------------------------------------------------------

# 38. Suggested Domain Model

Conceptually:

``` text
MarketSnapshot
    |
    +-- MarketRegime
    +-- SectorStrength
    +-- Volatility

StockSnapshot
    |
    +-- Fundamentals
    +-- Valuation
    +-- Technicals
    +-- Volume
    +-- RelativeStrength
    +-- OrderFlow
    +-- Risk

Opportunity
    |
    +-- Score
    +-- Reasons
    +-- Risks
    +-- Evidence
    +-- HistoricalBehavior

Watchlist / Portfolio
    |
    +-- ChangeEvents
    +-- RiskEvents
    +-- OpportunityEvents

Strategy
    |
    +-- Backtest
    +-- PaperTrade
    +-- Journal
```

Keep this conceptual model clean even if implementation remains simple.

------------------------------------------------------------------------

# 39. Security / Financial Safety

The product handles financial information and potentially broker
credentials.

Maintain:

-   paper trading defaults
-   kill switch
-   risk limits
-   no accidental live trading
-   explicit live-trading confirmation
-   audit logs
-   token security
-   clear distinction between signal and recommendation

Do not silently enable live execution.

------------------------------------------------------------------------

# 40. Language and UX

The product should be understandable to an intelligent retail investor
without requiring quant expertise.

Prefer:

> "Momentum improved"

over:

> "MACD histogram crossed the zero line."

Show the technical explanation underneath if desired.

Prefer:

> "Worth researching"

over:

> "BUY."

Prefer:

> "Risk increased"

over:

> "ATR percentile moved to 82."

The user should understand the result first and the mechanics second.

------------------------------------------------------------------------

# 41. Product Personality

Algo-X should feel:

-   analytical
-   calm
-   evidence-driven
-   concise
-   practical
-   non-hype
-   transparent
-   trader-friendly

It should NOT feel:

-   like a casino
-   like a prediction guru
-   like a social-media stock tip service
-   like a dashboard overloaded with numbers

------------------------------------------------------------------------

# 42. Definition of Done for the New Direction

The product direction should be considered successful when a user can do
this:

``` text
Open Algo-X
    ↓
Understand today's market
    ↓
See 5–10 relevant opportunities
    ↓
Understand WHY they matter
    ↓
See historical evidence
    ↓
See what changed in their portfolio
    ↓
Decide what deserves research
    ↓
Optionally use scanner/strategy/paper trading
```

without needing a tutorial.

If that workflow requires extensive explanation, simplify it.

------------------------------------------------------------------------

# 43. Hard Product Test

Before approving any major feature, Claude should ask:

> **"If this feature disappeared tomorrow, would a real user notice and
> care?"**

If the answer is no:

-   deprioritize
-   do not polish
-   do not expand

Second question:

> **"Is this making Algo-X more useful, or merely more impressive?"**

Prefer useful.

Third:

> **"Does this increase the reason to return?"**

Prefer recurring value.

------------------------------------------------------------------------

# 44. Strategic North Star

The ultimate north-star workflow is:

> **"Tell me what matters, show me why, prove whether it historically
> worked, and tell me when something important changes."**

Everything else is supporting infrastructure.

------------------------------------------------------------------------

# 45. What Claude Should Do Now

Do not immediately start coding all future missions.

First:

### Step 1

Inspect the existing repository and current product documents.

### Step 2

Reconcile the existing product vision with this document.

### Step 3

Create/update the product roadmap around the new primary mission.

### Step 4

Identify which current screens/services can be reused.

### Step 5

Design the landing page/information architecture.

### Step 6

Implement the smallest complete vertical slice:

``` text
Morning Brief
+
Opportunity Ranking
+
Why This Stock
```

Use existing real-time/market/scanner infrastructure wherever possible.

### Step 7

Validate the workflow.

### Step 8

Only then continue to:

``` text
What Changed
→
Backtesting Evidence
→
Portfolio Intelligence
→
Strategy Integration
```

Do not start broad parallel development.

------------------------------------------------------------------------

# 46. Important: Preserve Existing Work

This document does **not** authorize deletion of:

-   scanners
-   strategies
-   radar
-   heatmap
-   paper trading
-   trade history
-   alerts
-   Telegram
-   VIX
-   broker integration
-   profiles
-   existing infrastructure

Those become the secondary/advanced system.

The goal is to **reorganize and elevate the most valuable parts**, not
throw away engineering investment.

------------------------------------------------------------------------

# 47. Final Product Thesis

Algo-X should ultimately answer four questions better than the user's
existing collection of tools:

### 1. WHAT MATTERS?

> What deserves my attention today?

### 2. WHY?

> Why does this stock/setup matter?

### 3. DOES IT HAVE EVIDENCE?

> Has this type of setup historically worked, and under what conditions?

### 4. WHAT CHANGED?

> What changed in my portfolio/watchlist that I should know about?

If Algo-X can reliably answer those four questions, it has a strong
reason to exist.

If it cannot, adding more trading features will not solve the core
product problem.

------------------------------------------------------------------------

# 48. Guiding Rule for Future Work

> **Do not build Algo-X into the biggest trading platform. Build it into
> the most useful 5 minutes of an Indian retail investor's market day.**

That is the product direction.
