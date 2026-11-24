const logger = require('../utils/logger');
const { isDemoMode } = require('../config/kite.config');
const { computeMarketState } = require('../utils/market-state');
const { SECTOR_MAP } = require('../config/sector-mapping');
const mockService = require('./mock.service');

// Significance levels for ordering
const SIG_ORDER = { high: 0, medium: 1, low: 2 };

// Human-readable labels for each category value
const RSI_LABELS = {
  extreme_oversold: 'extreme oversold (<20)',
  oversold:         'oversold (20–30)',
  building:         'building momentum (30–50)',
  momentum:         'momentum zone (50–65)',
  strong:           'strong (65–72)',
  overbought:       'overbought (>72)',
  unknown:          'unknown',
};

const TREND_LABELS = {
  uptrend:     'confirmed uptrend (price > SMA20 > SMA50)',
  above_sma20: 'above SMA20 (SMA50 alignment pending)',
  below_sma20: 'below SMA20',
  downtrend:   'downtrend (price < SMA20 < SMA50)',
  unknown:     'unknown',
};

const VOLUME_LABELS = {
  spike:    'volume spike (≥2×)',
  elevated: 'elevated volume (1.5–2×)',
  normal:   'normal volume (0.7–1.5×)',
  weak:     'weak volume (<0.7×)',
  unknown:  'unknown',
};

function significanceFor(changeType, from, to) {
  switch (changeType) {
    case 'rsi_zone': {
      const extremes = new Set(['extreme_oversold', 'oversold', 'overbought']);
      if (extremes.has(from) || extremes.has(to)) return 'high';
      return 'medium';
    }
    case 'macd_flip':
      return 'medium';
    case 'trend_bias': {
      const majors = new Set(['uptrend', 'downtrend']);
      if (majors.has(from) || majors.has(to)) return 'medium';
      return 'low';
    }
    case 'volume_band':
      return to === 'spike' ? 'medium' : 'low';
    case 'vwap_cross':
      return 'low';
    default:
      return 'low';
  }
}

function buildDetail(symbol, changeType, from, to, price) {
  switch (changeType) {
    case 'rsi_zone':
      return `${symbol} RSI moved from ${RSI_LABELS[from] || from} into ${RSI_LABELS[to] || to}.`;
    case 'macd_flip':
      return `${symbol} MACD flipped ${to} — momentum bias reversed.`;
    case 'trend_bias':
      return `${symbol} trend shifted: ${TREND_LABELS[from] || from} → ${TREND_LABELS[to] || to}.`;
    case 'volume_band':
      return `${symbol} volume moved from ${VOLUME_LABELS[from] || from} to ${VOLUME_LABELS[to] || to} at ₹${price?.toLocaleString('en-IN') || price}.`;
    case 'vwap_cross':
      return `${symbol} price crossed ${to === 'above' ? 'above' : 'below'} VWAP — intraday bias shifted ${to === 'above' ? 'bullish' : 'bearish'}.`;
    default:
      return `${symbol} ${changeType}: ${from} → ${to}`;
  }
}

class ChangeDetectionService {
  constructor() {
    this.scannerService = null;
    this.evidenceService = null;
    this._snapshot = new Map();   // symbol → MarketState (last known)
    this._snapshotAt = null;
    this._changes = [];
    this._cacheTTL = 90 * 1000;  // 90s cache on change list
    this._lastDetect = 0;
  }

  setScannerService(s) { this.scannerService = s; }
  setEvidenceService(e) { this.evidenceService = e; }

  /**
   * Captures current market state for all known symbols as the new baseline.
   * Called at startup and when user starts a new session.
   */
  async takeSnapshot() {
    if (isDemoMode()) {
      // In demo mode snapshot is implicit — the mock changes are always "vs last session"
      this._snapshotAt = new Date().toISOString();
      this._changes = [];
      this._lastDetect = 0;
      logger.info('[ChangeDetection] Demo snapshot taken');
      return { snapshotAt: this._snapshotAt, symbolCount: 7 };
    }

    if (!this.evidenceService || !this.scannerService) {
      logger.warn('[ChangeDetection] Cannot snapshot: services not wired');
      return { snapshotAt: null, symbolCount: 0 };
    }

    const symbols = [...(this.scannerService.priceHistory?.keys() || [])];
    let count = 0;
    for (const symbol of symbols) {
      try {
        const ev = await this.evidenceService.getEvidence(symbol);
        if (!ev || !ev.technicals || ev.dataPoints < 15) continue;
        const state = computeMarketState(symbol, ev.technicals, ev.price);
        this._snapshot.set(symbol, state);
        count++;
      } catch (err) {
        logger.warn(`[ChangeDetection] Snapshot error for ${symbol}:`, err.message);
      }
    }

    this._snapshotAt = new Date().toISOString();
    this._changes = [];
    this._lastDetect = 0;
    logger.info(`[ChangeDetection] Snapshot taken: ${count} symbols`);
    return { snapshotAt: this._snapshotAt, symbolCount: count };
  }

  /**
   * Compares current evidence state vs snapshot and returns ChangeEvents.
   * Results are cached for _cacheTTL ms.
   */
  async detectChanges() {
    if (Date.now() - this._lastDetect < this._cacheTTL && this._changes.length > 0) {
      return this._changes;
    }

    if (!this.evidenceService || !this.scannerService || this._snapshot.size === 0) {
      return [];
    }

    const detectedAt = new Date().toISOString();
    const events = [];
    const symbols = [...this._snapshot.keys()];

    for (const symbol of symbols) {
      try {
        const ev = await this.evidenceService.getEvidence(symbol);
        if (!ev || !ev.technicals || ev.dataPoints < 15) continue;

        const prev = this._snapshot.get(symbol);
        const curr = computeMarketState(symbol, ev.technicals, ev.price);
        const sector = SECTOR_MAP[symbol] || null;

        // Check each dimension for a categorical change
        const checks = [
          { changeType: 'rsi_zone',    from: prev.rsiZone,      to: curr.rsiZone      },
          { changeType: 'trend_bias',  from: prev.trendBias,    to: curr.trendBias    },
          { changeType: 'macd_flip',   from: prev.macdBias,     to: curr.macdBias     },
          { changeType: 'volume_band', from: prev.volumeBand,   to: curr.volumeBand   },
          { changeType: 'vwap_cross',  from: prev.vwapPosition, to: curr.vwapPosition },
        ];

        for (const { changeType, from, to } of checks) {
          if (from === 'unknown' || to === 'unknown' || from === to) continue;
          const significance = significanceFor(changeType, from, to);
          events.push({
            symbol,
            sector,
            changeType,
            significance,
            from,
            to,
            detail: buildDetail(symbol, changeType, from, to, ev.price),
            price: ev.price,
            detectedAt,
          });
        }
      } catch (err) {
        logger.warn(`[ChangeDetection] Detect error for ${symbol}:`, err.message);
      }
    }

    // Sort: HIGH first, then MEDIUM, then LOW
    events.sort((a, b) => (SIG_ORDER[a.significance] ?? 3) - (SIG_ORDER[b.significance] ?? 3));

    this._changes = events;
    this._lastDetect = Date.now();
    return events;
  }

  /**
   * Public API — demo returns mock changes, live runs detectChanges().
   */
  async getChanges() {
    if (isDemoMode()) {
      return mockService.getChanges();
    }

    const changes = await this.detectChanges();
    return {
      changes,
      snapshotAt: this._snapshotAt,
      detectedAt: new Date().toISOString(),
      dataSource: 'live',
      symbolCount: this._snapshot.size,
    };
  }
}

module.exports = new ChangeDetectionService();
