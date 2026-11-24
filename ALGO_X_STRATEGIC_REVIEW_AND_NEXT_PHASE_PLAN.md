# Algo-X --- Strategic Review, Consolidated Work Plan & Validation Roadmap

**Version:** 1.0\
**Date:** November 2026\
**Purpose:** Full strategic handoff for the next phase of Algo-X after
Missions 0--7\
**Audience:** Claude Code / implementation agent\
**Repository:** `algo-x-main`

------------------------------------------------------------------------

# 0. Executive Decision

Missions 0--7 have moved Algo-X substantially toward the intended
product direction.

The product is no longer merely an algorithmic trading platform with
scanners and strategies. It now has the beginnings of a coherent
intelligence loop:

``` text
Morning Brief
      ↓
Opportunities
      ↓
Evidence
      ↓
What Changed
      ↓
Portfolio Intelligence
      ↓
Paper Trade
      ↓
Journal / Outcome
```

However, this is the point where we must **stop equating feature
completion with product validation**.

## Strategic decision

**Do NOT continue building Missions 8, 9, 10, etc. as a normal feature
roadmap.**

The next phase should be:

> **Validation + attribution + hardening + evidence generation +
> selective product improvements.**

The objective is to determine whether the intelligence layer actually
creates user value before expanding it.

The central question is now:

> **Does Algo-X give me a compelling reason to open it every trading day
> because it saves research time and improves my decisions?**

If yes, deepen the intelligence moat.

If no, improve/rethink the intelligence model before adding more
features.

------------------------------------------------------------------------

# 1. Two-Lens Review

This document combines two independent reviews.

## Lens A --- Review against the original reorientation plan

The original strategic direction was:

> **"What matters in the market today, why does it matter, what evidence
> supports it, and what changed?"**

Mission-by-mission assessment:

  -----------------------------------------------------------------------
  Mission                 Status                  Strategic Assessment
  ----------------------- ----------------------- -----------------------
  M0 Product              Implemented             Strongly aligned
  Reorganization                                  

  M1 Morning Brief        Implemented             Good foundation; needs
                                                  stronger synthesis

  M2 Opportunity Ranking  Implemented             Strong technical
                                                  ranking foundation; not
                                                  yet broad intelligence

  M3 Evidence             Implemented / validated Strong and aligned

  M4 What Changed         Implemented / validated Strong concept and
                                                  implementation

  M5 Historical           Implemented / validated Stronger
  Backtesting                                     infrastructure; still
                                                  not the full Historical
                                                  Evidence Engine

  M6 Portfolio            Implemented / validated Strong and aligned
  Intelligence                                    

  M7 Strategy / Paper     Implemented             Product loop exists;
  Trading Integration                             end-to-end validation
                                                  still required
  -----------------------------------------------------------------------

### Overall Lens A assessment

**\~8.5/10 implementation alignment.**

The architecture is now directionally correct.

The main remaining gaps are not "missing screens." They are:

-   evidence quality
-   real historical evidence
-   feedback from outcomes
-   validation of the opportunity score
-   repeated daily usefulness
-   operational reliability
-   broader differentiation
-   proof that the system actually improves decisions

------------------------------------------------------------------------

# 2. Lens B --- Fresh Review As If This Repository Were New

Ignore the original roadmap and imagine discovering this product today.

The immediate reaction would be:

> **"This is a competent market-analysis application. But why should I
> use it instead of TradingView + Screener/Chartink/Trendlyne + my
> broker + Telegram?"**

That is the key strategic test.

Algo-X already provides:

-   market state
-   technical indicators
-   opportunity ranking
-   evidence cards
-   change detection
-   portfolio intelligence
-   strategy matching
-   paper trading
-   journal
-   alerts
-   backtesting

That is coherent.

But individual components are not necessarily defensible.

## The real potential moat

The moat should not become:

> "We have more indicators."

Nor:

> "We have a better AI stock score."

Nor:

> "We have 100 scanners."

The stronger potential moat is:

> **Decision compression + evidence + personal feedback loop.**

The long-term loop is:

``` text
Market
  ↓
What changed?
  ↓
What deserves attention?
  ↓
Why?
  ↓
What historically happened in similar conditions?
  ↓
Does it matter to my portfolio/watchlist?
  ↓
Human decision
  ↓
Outcome
  ↓
Algo-X measures what actually worked
  ↓
Better evidence / ranking
```

That is substantially more differentiated than another scanner.

------------------------------------------------------------------------

# 3. Current Product Thesis

## Current product promise

Algo-X should increasingly answer:

> **"What deserves my attention today, why, what changed, and what
> evidence supports it?"**

It should compress the work currently performed manually across multiple
tools.

### The user should not need to:

-   inspect 100 charts
-   repeatedly refresh scanners
-   manually compare sector strength
-   remember yesterday's indicator state
-   manually inspect every portfolio holding
-   jump between multiple tools to understand a setup
-   guess whether a technical signal has historically worked

### Instead Algo-X should provide:

``` text
DISCOVER
→ what deserves attention

UNDERSTAND
→ why it matters

VALIDATE
→ what evidence supports it

MONITOR
→ what changed

ACT
→ optionally paper trade / test the thesis

LEARN
→ what actually worked
```

------------------------------------------------------------------------

# 4. What Missions 0--7 Successfully Built

## M0 --- Product Reorganization

### What was achieved

The UI now prioritizes:

-   Intelligence Home
-   Morning Brief
-   Opportunities
-   Portfolio
-   Market intelligence
-   What Changed
-   Evidence
-   Advanced trading functionality underneath

Legacy capabilities remain available rather than being deleted.

### Assessment

**PASS.**

### Remaining issue

The codebase still contains legacy language and positioning around "algo
trading," strategies and execution.

Do not perform a broad rewrite merely to clean this up.

Instead, gradually make the new intelligence hierarchy dominant in:

-   navigation
-   copy
-   empty states
-   onboarding
-   documentation
-   notification language

------------------------------------------------------------------------

# 5. M1 --- Morning Brief

## What exists

The architecture composes:

-   regime
-   VIX
-   sector leaders/laggards
-   opportunities
-   watchlist changes
-   portfolio warnings
-   Telegram delivery

This is the correct foundation.

## What is still missing

The brief currently tends toward:

> "Here is what happened."

The product needs to increasingly become:

> **"Here is what matters."**

For example:

``` text
INFY

Momentum improving
Volume 1.9× average
Above 20/50 SMA
IT sector leading

WHY IT MATTERS:
Multiple independent signals are aligned.

RISK:
Near resistance + elevated volatility.

ACTION:
Worth investigating; not a blind buy signal.
```

The important distinction is **synthesis**.

Do not simply add more statistics.

## Required direction

Morning Brief should eventually have:

1.  Market regime
2.  What changed
3.  Top opportunities
4.  Why each matters
5.  Key risks
6.  Portfolio relevance
7.  Clear "nothing compelling" state when appropriate

The system must be comfortable saying:

> **"No strong setup today."**

That increases trust.

------------------------------------------------------------------------

# 6. M2 --- Opportunity Ranking

## Current implementation

Current scoring:

-   Trend --- 25%
-   Momentum/RSI --- 20%
-   Volume --- 20%
-   Relative Strength vs NIFTY --- 20%
-   VIX regime --- 15%

The score is explainable and missing data is surfaced.

This is good.

## Important limitation

This is currently primarily a **technical opportunity score**.

It is not yet a complete investment intelligence score incorporating:

-   fundamentals
-   valuation
-   earnings/growth
-   catalysts
-   business quality
-   broader risk context

### Do NOT immediately solve this by adding 20 more factors.

That would recreate the feature-creep problem.

First determine whether the existing score has predictive/useful value.

The key experiment is:

> **Does a higher Algo-X score actually lead to better subsequent
> outcomes?**

------------------------------------------------------------------------

# 7. M3 --- Evidence Cards

## Current implementation

Evidence includes:

-   RSI
-   MACD
-   SMA trend
-   Bollinger
-   Volume
-   StochRSI
-   VWAP
-   technical values
-   key levels
-   sector
-   summary

This is a strong foundation.

## Remaining gap

Evidence is still predominantly technical.

That is acceptable for now.

The next improvement should not be "more indicators."

Instead, eventually classify evidence into:

``` text
PRICE / TECHNICAL
VOLUME / PARTICIPATION
RELATIVE STRENGTH
SECTOR / MARKET CONTEXT
FUNDAMENTAL
HISTORICAL OUTCOME
RISK
```

Only add new categories when they improve decisions.

------------------------------------------------------------------------

# 8. M4 --- What Changed

This is potentially one of the most valuable features.

Current architecture:

``` text
Raw indicators
      ↓
Categorical market state
      ↓
Snapshot
      ↓
State transition
      ↓
Meaningful change
```

Current changes include:

-   RSI zone
-   volume band
-   trend bias
-   MACD flip
-   VWAP cross

This is correct.

## Future principle

Do not become a "change log."

The goal is:

> **"What changed enough that I should care?"**

Eventually changes should be ranked by:

-   magnitude
-   persistence
-   independence
-   portfolio relevance
-   opportunity impact

A tiny RSI change should not compete with a regime transition.

------------------------------------------------------------------------

# 9. M5 --- Historical Backtesting

This mission significantly improved the integrity of the project.

Current improvements include:

-   real Kite historical-data path
-   in-sample / out-of-sample split
-   deterministic demo data
-   explicit data source
-   warmup handling
-   overfitting warning
-   separate IS/OOS metrics

## Critical distinction

Backtesting is not the final evidence product.

### Backtesting asks:

> "What would this strategy have done?"

### Historical Evidence asks:

> "When this type of setup appeared historically, what happened
> afterward?"

The second is much closer to the eventual Algo-X moat.

## Future Historical Evidence Engine

A future evidence record could look like:

``` text
Setup:
Momentum + volume expansion + above VWAP

Historical occurrences:
147

Next 5-day return:
Median +2.1%

Positive outcome:
63%

Best regime:
Normal VIX

Worst regime:
Extreme VIX

Max adverse excursion:
-1.8%

Max favorable excursion:
+4.6%
```

This is more useful than simply showing a strategy Sharpe ratio.

### Important

Do not claim this capability until the underlying data and methodology
actually support it.

------------------------------------------------------------------------

# 10. M6 --- Portfolio Intelligence

This is strongly aligned with the new direction.

Current intelligence includes:

-   holding health
-   sector concentration
-   correlation
-   evidence
-   urgency/review states

This is better than a simple P&L dashboard.

The question should remain:

> **"What in my portfolio needs my attention today?"**

Future improvements should focus on:

-   thesis deterioration
-   relative-strength deterioration
-   sector/regime mismatch
-   concentration
-   correlation
-   opportunity quality changes
-   meaningful changes since last review

Not simply more portfolio charts.

------------------------------------------------------------------------

# 11. M7 --- Strategy / Paper Trading Integration

The intended flow now exists:

``` text
Opportunity
    ↓
Evidence
    ↓
Strategy
    ↓
Paper Trade
    ↓
Journal
    ↓
Outcome
```

This is strategically important because it closes the loop.

The trade metadata includes intelligence context such as:

-   opportunity score
-   matched strategy
-   signals
-   source flow

This is exactly what is needed for attribution later.

## Current status

M7 is **BUILT**, but it should not yet be treated as fully validated.

The next validation must prove:

1.  Opportunity card opens.
2.  Evidence loads.
3.  Strategy match is sensible.
4.  Entry/SL/target are understandable.
5.  Paper trade is created correctly.
6.  Intelligence metadata survives into the journal.
7.  Outcome can later be associated with the original intelligence
    state.

------------------------------------------------------------------------

# 12. The Most Important Missing Layer: Feedback

M0--M7 primarily create:

> **Signal → Explanation → Action**

What is missing is:

> **Action → Outcome → Learning**

That is now the highest-value gap.

The system needs to answer:

> **"Are Algo-X's signals actually useful?"**

This must become the next strategic milestone.

------------------------------------------------------------------------

# 13. Next Phase --- Validation Gate

## Do not call this "Mission 8."

Call it:

# Algo-X Validation Gate

The objective is not to add a shiny feature.

The objective is to establish whether the intelligence layer earns its
existence.

------------------------------------------------------------------------

## Phase 1 --- Validate M7 End-to-End

Before adding substantial functionality:

-   run real paper trades through Opportunity → Evidence → Strategy →
    Paper Trade
-   verify metadata
-   verify journal association
-   verify open/closed lifecycle
-   verify no duplicated or missing trades
-   verify source flow

### Acceptance

At least one complete trade should be traceable:

``` text
Opportunity score
→ evidence snapshot
→ matched strategy
→ entry
→ paper execution
→ exit
→ P&L
```

------------------------------------------------------------------------

# 14. Next Build --- Performance Attribution

This should be the first substantial next implementation.

## Objective

Determine whether intelligence-sourced trades outperform ordinary/manual
trades.

### Compare

``` text
Algo-X sourced trades
vs.
Manual / non-intelligence trades
```

Metrics:

-   number of trades
-   win rate
-   average P&L
-   median P&L
-   profit factor
-   average R:R
-   drawdown
-   average holding time

Also break intelligence trades into score bands:

``` text
75–100
60–74
45–59
<45
```

## Critical sample-size rules

Do not make strong conclusions from 5 trades.

Suggested display:

``` text
1–9 trades:
Very low sample — directional only

10–19:
Early evidence

20–49:
Useful directional evidence

50+:
Meaningful personal evidence

100+:
Strong personal dataset
```

These are practical product thresholds, not statistical guarantees.

Always show sample size.

------------------------------------------------------------------------

# 15. Score-to-Outcome Analysis

This is particularly important.

Test:

``` text
Opportunity Score → Subsequent Outcome
```

For example:

``` text
Score 45–54 → average outcome
Score 55–64 → average outcome
Score 65–74 → average outcome
Score 75–84 → average outcome
Score 85+   → average outcome
```

The desired question is not:

> "Is 82 a good score?"

It is:

> **"Does an 82 score historically lead to better outcomes than a 62
> score?"**

If not, the scoring model needs work.

------------------------------------------------------------------------

# 16. Preserve Outcome Attribution

Every intelligence-generated paper trade should preserve the entry
snapshot.

At minimum:

``` text
symbol
entry price
timestamp
opportunity score
score factors
evidence signals
market regime
VIX
sector
matched strategy
stop loss
target
source flow
```

Do not depend on recalculating historical entry conditions later.

**Store the state at decision time.**

This is essential.

------------------------------------------------------------------------

# 17. Deeper Journal Analytics

After enough trades exist, add:

## A. Regime performance

Group by:

-   LOW VIX
-   NORMAL
-   HIGH
-   EXTREME

Compare outcomes.

## B. Day/time performance

-   day of week
-   time of entry
-   average return
-   win rate

## C. Score-to-outcome scatter

Only intelligence-sourced trades.

## D. Strategy performance

Not merely:

> "RSI strategy win rate = 65%"

Instead:

> "RSI setup works best when VIX is normal and sector is strong."

That is more actionable.

## E. Holding period

Average duration and outcome.

------------------------------------------------------------------------

# 18. Exit Intelligence

Once entry intelligence is validated, the natural next problem is:

> **"I know why I entered. How do I know whether the thesis still
> holds?"**

Build advisory exit intelligence.

Potential states:

``` text
HOLD
REVIEW
TAKE_PROFIT
CUT_LOSS
```

But do not make it an automatic real-money execution system.

Use the same EvidenceService.

The exit engine should compare:

``` text
Original thesis
vs.
Current evidence
```

This is much better than arbitrary RSI rules.

------------------------------------------------------------------------

# 19. Intraday Intelligence Alerts

Once scoring is trustworthy enough, add alerts when meaningful state
changes occur.

Examples:

``` text
Score:
61 → 76

NEW STRONG OPPORTUNITY
```

or:

``` text
INFY

Trend: bullish → bearish
Volume: normal → 2.1×
Sector: strong

THESIS CHANGED
```

Alert only on meaningful transitions.

Avoid alert spam.

The user should trust:

> "If Algo-X interrupts me, it is probably worth looking at."

------------------------------------------------------------------------

# 20. Smart Watchlist

Only after the core intelligence is validated.

Create a dynamically ranked watchlist:

``` text
Top 5 opportunities
+
manual watchlist
```

But do not replace the user's manual list.

The Smart Watchlist should be a separate intelligence layer.

------------------------------------------------------------------------

# 21. Instrument Universe Expansion

Current demo universe is relatively small.

Eventually expand demo coverage to approximately 25--30 instruments.

Purpose:

-   realistic demo
-   better sector coverage
-   multiple opportunities
-   richer test scenarios
-   better UI validation

This is **demo quality**, not the product moat.

Therefore it should not outrank validation/attribution.

------------------------------------------------------------------------

# 22. Sector Rotation

After the individual-stock intelligence loop is working, add multi-day
sector context.

The heatmap currently answers:

> "Which sectors are strong today?"

Sector rotation should answer:

> "Which sectors have been strengthening/weakening over several
> sessions?"

This can become useful context for opportunity ranking.

But it is secondary to proving the stock-level intelligence.

------------------------------------------------------------------------

# 23. Operational Reliability

Before daily personal use becomes serious, address operational friction.

Important items:

### Kite authentication

Kite access tokens expire and require browser authentication.

The system should clearly expose:

``` text
Market data status
Kite authentication status
Last successful data update
Data source
```

Do not silently operate on stale data.

### Data-source transparency

Every intelligence result should be able to answer:

> "Where did this data come from?"

Examples:

``` text
LIVE_KITE
HISTORICAL_KITE
SYNTHETIC_DEMO
FALLBACK
```

Never make synthetic fallback look like live market intelligence.

------------------------------------------------------------------------

# 24. Existing VIX / Scanner Infrastructure

Review the existing scanner/Radar/VIX infrastructure for stale or
fragile data sources before relying on it for high-value intelligence.

Particularly verify:

-   VIX is actually populated from a reliable authenticated source
-   Radar data is current
-   Scanner data timestamps are visible
-   cached data isn't mistaken for live data
-   fallback paths are clearly labelled

A feature that technically exists but silently uses stale/default data
is worse than an explicit unavailable state.

------------------------------------------------------------------------

# 25. Demo Mode Must Become a Truthful Simulation

Demo mode is useful.

Keep it.

But maintain a strict boundary.

Every demo result should be clearly attributable to:

``` text
DEMO / SYNTHETIC
```

Demo data should be:

-   deterministic
-   internally consistent
-   realistic
-   reproducible

Never allow demo performance numbers to be mistaken for actual market
evidence.

------------------------------------------------------------------------

# 26. Evidence Quality Hierarchy

Every future intelligence result should conceptually have this
hierarchy:

``` text
CURRENT STATE
    ↓
WHY
    ↓
HISTORICAL EVIDENCE
    ↓
RISK / LIMITATIONS
    ↓
DECISION
```

Example:

``` text
INFY — Score 81

CURRENT:
Above 20/50 SMA
RSI 64
Volume 1.8×

WHY:
Momentum + participation + sector alignment

HISTORICAL:
Similar setups: 132
Positive 5-day outcome: 61%
Median return: +1.7%

RISK:
Resistance nearby
VIX elevated

DECISION:
Worth researching / paper-testing
```

This is the target product shape.

------------------------------------------------------------------------

# 27. What NOT to Build

Explicitly avoid the following unless later evidence proves demand:

## Do not build

-   LLM stock-price prediction
-   "AI says BUY XYZ tomorrow"
-   generic stock chat
-   endless indicators
-   hundreds of strategies
-   social feed
-   leaderboard
-   SaaS multi-tenancy
-   payment gateway
-   real-money execution
-   options automation
-   native mobile app
-   enterprise architecture
-   complex microservices
-   unnecessary data-source integrations
-   external scraping that creates legal/ToS risk

The goal is not to maximize capability.

The goal is to maximize **decision value per unit of user attention**.

------------------------------------------------------------------------

# 28. Feature Prioritization Framework

Every proposed feature must be scored against:

  Dimension         Question
  ----------------- -------------------------------------------------------
  Frequency         Does the user need this daily/weekly?
  Value             Does it materially improve research/decision quality?
  Differentiation   Why isn't this already solved elsewhere?
  Evidence          Can the output be trusted?
  Friction          How much effort does the user need?
  Retention         Does it create a reason to return?
  Feedback          Does it create data that improves Algo-X?
  Complexity        How much engineering is required?

Prefer features that:

> **high value + high frequency + high differentiation + low friction +
> measurable outcome**

------------------------------------------------------------------------

# 29. Recommended Priority Order

## Priority 0 --- M7 Validation

**Must happen first.**

Validate the complete intelligence-to-paper-trade flow.

------------------------------------------------------------------------

## Priority 1 --- Performance Attribution

**Highest priority.**

Answer:

> "Does Algo-X intelligence actually help?"

Build:

-   intelligence vs manual
-   score bands
-   sample-size warnings
-   P&L
-   win rate
-   profit factor
-   R:R

------------------------------------------------------------------------

## Priority 2 --- Outcome Snapshot / Data Integrity

Ensure every intelligence-generated trade stores its entry context
permanently.

This is foundational for all later analytics.

------------------------------------------------------------------------

## Priority 3 --- Deeper Journal Analytics

Only after enough data exists.

Include:

-   score → outcome
-   regime → outcome
-   strategy → outcome
-   time → outcome
-   holding period

------------------------------------------------------------------------

## Priority 4 --- Historical Evidence Engine

Upgrade from:

> backtesting strategies

toward:

> historical outcomes for market setups.

This is potentially the largest future moat.

------------------------------------------------------------------------

## Priority 5 --- Exit Intelligence

Compare original thesis with current state.

------------------------------------------------------------------------

## Priority 6 --- Intraday Intelligence Alerts

Alert only when a meaningful intelligence state crosses a threshold.

------------------------------------------------------------------------

## Priority 7 --- Smart Watchlist

Surface the intelligence where the user already spends time.

------------------------------------------------------------------------

## Priority 8 --- Instrument Universe Expansion

Primarily for demo/testing quality.

------------------------------------------------------------------------

## Priority 9 --- Sector Rotation

Add multi-day macro context.

------------------------------------------------------------------------

## Priority 10 --- Real-Time Polish

Examples:

-   score change push
-   live update indicators
-   freshness timestamps
-   better notifications

------------------------------------------------------------------------

## Priority 11 --- Operational Reliability

Improve:

-   authentication
-   data-source status
-   stale-data handling
-   recovery
-   scheduled jobs

Some operational work may move earlier if it blocks daily use.

------------------------------------------------------------------------

# 30. Recommended Product Experiments

Do not wait for a "perfect" product.

Run experiments.

## Experiment A --- Daily Opening Habit

For 20--30 market sessions, measure:

-   Did I open Algo-X?
-   Did Morning Brief help?
-   Did it surface something I would have missed?
-   Did I investigate an opportunity?
-   Did it change a decision?
-   How much research time did it save?

------------------------------------------------------------------------

# 31. Experiment B --- Opportunity Score

Collect intelligence-sourced paper trades.

Measure:

``` text
score
→ outcome
```

The critical question:

> **Does the ranking contain information?**

------------------------------------------------------------------------

# 32. Experiment C --- What Changed

Track:

-   which change types lead to investigation
-   which change types lead to trades
-   which change types are ignored
-   false/noisy alerts

If 90% of "changes" are ignored, the feature needs better
prioritization.

------------------------------------------------------------------------

# 33. Experiment D --- Morning Brief Compression

Measure whether the brief reduces multi-tool browsing.

Target:

> **Market understanding in \<60 seconds.**

The brief should not become a dashboard that takes 10 minutes to read.

------------------------------------------------------------------------

# 34. Experiment E --- Portfolio Intelligence

Measure:

> Did Portfolio Intelligence identify something I would otherwise have
> missed?

If not, improve relevance rather than adding more metrics.

------------------------------------------------------------------------

# 35. The 30-Day Validation Protocol

Use Algo-X personally for approximately 30 market sessions.

Do not optimize the product every day based on one outcome.

Track:

``` text
Date
Morning Brief opened? Y/N
Useful? Y/N
Opportunity investigated? Y/N
What Changed useful? Y/N
Portfolio warning useful? Y/N
Paper trade taken? Y/N
Reason
Outcome
Would I have found this elsewhere? Y/N
Estimated time saved
```

At the end, review patterns.

------------------------------------------------------------------------

# 36. Product Validation Threshold

A useful future decision gate:

## Strong signal

The user starts thinking:

> **"Let me see what Algo-X says before I decide."**

This is the strongest validation.

## Medium signal

The user opens it frequently but only for specific modules.

That suggests the specific module has value, but the product thesis
needs refinement.

## Weak signal

The user forgets to open it.

That means the daily reason-to-use is not strong enough.

## Failure signal

The user repeatedly checks other tools first because Algo-X does not add
enough.

Then stop feature expansion and rethink the intelligence layer.

------------------------------------------------------------------------

# 37. Important Product Philosophy: "WAIT" Is a Valid Result

Algo-X should not manufacture opportunities.

If:

-   no strong opportunities
-   poor market regime
-   weak evidence
-   conflicting signals

then the output can be:

> **No compelling setup today. WAIT.**

This is a trust feature.

The product should optimize for:

> **correct attention allocation**

not:

> **maximum number of alerts/trades.**

------------------------------------------------------------------------

# 38. Opportunity Ranking --- Future Architecture

Eventually separate:

## Layer 1 --- Candidate generation

Find potentially interesting securities.

## Layer 2 --- Evidence

Explain current conditions.

## Layer 3 --- Historical validation

Estimate how similar setups behaved.

## Layer 4 --- Personal relevance

Does it matter to this user's portfolio/watchlist?

## Layer 5 --- Decision

Present:

-   investigate
-   watch
-   paper-test
-   ignore
-   wait

This is better than a single opaque 0--100 score.

------------------------------------------------------------------------

# 39. Avoid Over-Trusting One Score

The Opportunity Score should eventually become one component of the
decision model.

A future card could say:

``` text
Opportunity: 82

Current setup: STRONG
Historical evidence: MODERATE
Portfolio relevance: HIGH
Risk: MEDIUM

Overall:
WORTH INVESTIGATING
```

This is more trustworthy than:

> "Score 82 = BUY."

------------------------------------------------------------------------

# 40. Historical Evidence --- Methodological Requirements

When building the Historical Evidence Engine, prevent:

-   look-ahead bias
-   survivorship bias
-   leakage
-   overfitting
-   unrealistic execution
-   duplicate overlapping signals
-   ignoring transaction costs
-   cherry-picked windows

Always distinguish:

``` text
In-sample
Out-of-sample
Walk-forward
Paper-traded
Live
```

Do not combine them into one flattering number.

------------------------------------------------------------------------

# 41. Paper Trading --- Purpose

Paper trading should not become a game.

Its purpose is:

> **To generate evidence about the decision process before risking
> money.**

Therefore record the thesis, not merely the order.

For each intelligence trade:

``` text
WHY ENTERED
WHAT EVIDENCE
WHAT SCORE
WHAT STRATEGY
WHAT RISK
WHAT OUTCOME
WHAT WE LEARNED
```

------------------------------------------------------------------------

# 42. Real Money --- Explicitly Deferred

Do not enable real-money execution merely because:

-   UI exists
-   API works
-   backtest looks good
-   5 trades were profitable

The project should remain paper-first until there is substantial
personal evidence.

Any future live-trading gate should require:

-   sufficient sample
-   out-of-sample evidence
-   acceptable drawdown
-   operational reliability
-   explicit user decision

------------------------------------------------------------------------

# 43. Architecture Principle Going Forward

Do not build Missions 3--10 as isolated silos.

Prefer shared primitives:

``` text
Market Data
     ↓
Normalized Market State
     ↓
Context + History
     ↓
Evidence
     ↓
Opportunity / Change / Portfolio Intelligence
     ↓
Decision
     ↓
Outcome
     ↓
Attribution / Learning
```

The same market-state primitive should support:

-   Opportunity
-   Evidence
-   What Changed
-   Portfolio Intelligence
-   Exit Intelligence
-   Historical Evidence

Avoid duplicating business logic.

------------------------------------------------------------------------

# 44. Documentation Discipline

The repository currently uses terms such as:

-   DONE
-   VALIDATED
-   BUILT

These should have precise meanings.

Recommended status vocabulary:

``` text
PLANNED
IMPLEMENTED
INTEGRATION VERIFIED
PERSONALLY VALIDATED
PRODUCT VALIDATED
```

### Important

A unit test proving five demo instruments work does **not** mean the
product is validated.

A mock response is not market validation.

A completed UI is not user validation.

Documentation must preserve this distinction.

------------------------------------------------------------------------

# 45. Engineering Quality Gates

Before marking future work complete:

## Data

-   source identified
-   timestamp available
-   stale data handled
-   fallback clearly labelled

## Logic

-   deterministic
-   testable
-   no hidden hardcoded claims
-   no look-ahead
-   edge cases handled

## UI

-   clear meaning
-   low cognitive load
-   no misleading certainty
-   empty/no-signal states handled

## Demo

-   synthetic data clearly labelled
-   deterministic
-   realistic
-   no fake performance presented as real

## Outcome

-   event captured
-   attribution preserved
-   future analysis possible

------------------------------------------------------------------------

# 46. What Claude Should Do Next

Claude should NOT immediately start an arbitrary new mission.

Execute in this order:

### Step 1

Review Mission 7 implementation against its acceptance criteria.

### Step 2

Fix any M7 integration issues.

### Step 3

Implement **Performance Attribution**.

### Step 4

Ensure intelligence-entry snapshots are stored immutably with trades.

### Step 5

Add enough deterministic demo data to exercise the attribution UI, but
clearly label it synthetic.

### Step 6

Run real paper trades for actual validation.

### Step 7

Implement Deeper Journal Analytics only when enough actual trade data
exists, while supporting demo data for UI verification.

### Step 8

Review the Opportunity Score itself using outcome data.

### Step 9

Only then decide whether to invest in:

-   Historical Evidence Engine
-   Exit Intelligence
-   Intraday Intelligence Alerts
-   Smart Watchlist
-   Sector Rotation
-   other features

------------------------------------------------------------------------

# 47. Do Not Treat the Existing Future-Directions Document as an Automatic Build Order

The existing `future-directions-post-mission-7.md` recommends:

1.  Performance Attribution
2.  Instrument Universe Expansion
3.  Exit Intelligence
4.  Deeper Journal Analytics
5.  Intraday Alerts
6.  Smart Watchlist
7.  Sector Rotation
8.  Real-Time Score Push
9.  Token Auto-Refresh

This is directionally useful, but **the order should now change**.

### Revised order

``` text
M7 Validation
    ↓
Performance Attribution
    ↓
Immutable Entry Snapshot / Data Integrity
    ↓
Personal Paper Trading
    ↓
Score → Outcome Validation
    ↓
Historical Evidence Engine
    ↓
Exit Intelligence
    ↓
Intraday Intelligence Alerts
    ↓
Smart Watchlist
    ↓
Sector Rotation
    ↓
Polish / Operational improvements
```

Instrument-universe expansion can happen whenever demo/test coverage
becomes a bottleneck, but it should not displace product validation.

------------------------------------------------------------------------

# 48. Why This Order Is Better

The original future roadmap is feature-oriented.

The revised roadmap is **evidence-oriented**.

Instead of:

``` text
Build
→ Build
→ Build
→ Build
→ Maybe validate later
```

use:

``` text
Build
→ Observe
→ Measure
→ Learn
→ Improve
→ Build next
```

This is the core strategic change.

------------------------------------------------------------------------

# 49. The Long-Term Product We Are Actually Trying to Create

The eventual Algo-X should feel less like:

> "A trading terminal."

and more like:

> **"My market intelligence layer."**

Opening it should answer:

``` text
WHAT MATTERS TODAY?
        ↓
WHY?
        ↓
WHAT CHANGED?
        ↓
WHAT DOES THE EVIDENCE SAY?
        ↓
DOES IT MATTER TO ME?
        ↓
WHAT SHOULD I INVESTIGATE?
        ↓
WHAT HAPPENED AFTER I ACTED?
```

The execution tools remain available, but they are downstream.

------------------------------------------------------------------------

# 50. Final Strategic Position

## Do not optimize for feature completeness.

Optimize for:

> **Decision usefulness.**

The repository is now sufficiently capable to prove or disprove the core
product thesis.

That means the next milestone is not:

> **"How many more features can we build?"**

It is:

> **"Can Algo-X repeatedly save me time and improve my market
> decisions?"**

If the answer becomes yes, then we have a real product foundation.

If the answer is no, the correct response is not another dashboard.

The correct response is to improve the intelligence itself.

------------------------------------------------------------------------

# 51. Final Priority Table

  --------------------------------------------------------------------------
  Priority          Work                 Goal              Status
  ----------------- -------------------- ----------------- -----------------
  P0                M7 validation        Prove complete    NEXT
                                         loop              

  P1                Performance          Does intelligence NEXT
                    Attribution          help?             

  P1                Entry-state snapshot Preserve evidence NEXT
                                         at decision time  

  P1                Personal paper       Generate real     NEXT
                    trading              evidence          

  P2                Score → Outcome      Validate ranking  NEXT
                    analysis                               

  P2                Journal analytics    Learn winning     NEXT
                                         conditions        

  P2                Historical Evidence  Build evidence    NEXT
                    Engine               moat              

  P3                Exit Intelligence    Maintain thesis   LATER
                                         after entry       

  P3                Intraday             Proactive         LATER
                    Intelligence Alerts  attention         

  P3                Smart Watchlist      Reduce navigation LATER
                                         friction          

  P4                Sector Rotation      Macro context     LATER

  P4                Instrument expansion Demo/test quality AS NEEDED

  P4                Real-time score push UX polish         LATER

  P4                Token/auth           Daily operational AS NEEDED
                    reliability          quality           

  NEVER/DEFER       Real money           Too early         DEFER

  NEVER/DEFER       LLM prediction       Trust risk        DEFER

  NEVER/DEFER       Social/leaderboard   Not core          DEFER

  NEVER/DEFER       SaaS/multitenancy    Not validated     DEFER

  NEVER/DEFER       Mobile app           Web usage not     DEFER
                                         proven            
  --------------------------------------------------------------------------

------------------------------------------------------------------------

# 52. Instruction to Claude

Treat this document as the **strategic source of truth for the next
phase**.

Do not blindly execute every possible future feature.

For each next task:

1.  Check this document.
2.  Check the current repository state.
3.  Identify the highest-value work.
4.  Prefer validation over feature accumulation.
5.  Preserve existing functionality.
6.  Avoid unnecessary architectural rewrites.
7.  Clearly label demo/synthetic/historical/live data.
8.  Maintain evidence traceability.
9.  Do not claim product validation from mock/demo tests.
10. After a meaningful implementation group, update
    `.product/01_STATE.md`, `.product/02_BACKLOG.md`, and
    `.product/03_NEXT_MISSION.md` with accurate status.

Most importantly:

> **Build only when there is a reason to use.\
> Measure whether it worked.\
> Learn from the outcome.\
> Then decide what to build next.**

The goal is not to make Algo-X more impressive.

The goal is to make Algo-X **useful enough that the user wants to open
it every trading day.**
