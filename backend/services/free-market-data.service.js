/**
 * FreeMarketDataService
 *
 * Fetches live Indian market data from Yahoo Finance v8 chart API.
 * No API key, no authentication, no cookies required.
 *
 * Data is 15-minute delayed during market hours (standard for free feeds).
 * Results are cached for 5 minutes to avoid hammering Yahoo Finance.
 *
 * Confirmed working symbols (^NSEI, ^NSEBANK, ^INDIAVIX, sector indices).
 * Yahoo Finance v7 quote API returns 401 — use v8/finance/chart only.
 */

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://query2.finance.yahoo.com/v8/finance/chart';
const FALLBACK_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const SYMBOL_MAP = [
  { key: 'nifty',    symbol: '^NSEI',      label: 'NIFTY 50' },
  { key: 'bankNifty',symbol: '^NSEBANK',   label: 'BANK NIFTY' },
  { key: 'vix',      symbol: '^INDIAVIX',  label: 'India VIX' },
  // Sector indices
  { key: 'IT',       symbol: '^CNXIT',     label: 'IT',     isSector: true },
  { key: 'Pharma',   symbol: '^CNXPHARMA', label: 'Pharma', isSector: true },
  { key: 'Auto',     symbol: '^CNXAUTO',   label: 'Auto',   isSector: true },
  { key: 'FMCG',     symbol: '^CNXFMCG',   label: 'FMCG',   isSector: true },
  { key: 'Metals',   symbol: '^CNXMETAL',  label: 'Metals', isSector: true },
  { key: 'Realty',   symbol: '^CNXREALTY', label: 'Realty', isSector: true },
  { key: 'Energy',   symbol: '^CNXENERGY', label: 'Energy', isSector: true },
];

class FreeMarketDataService {
  constructor() {
    this._cache = null;
    this._cacheTime = 0;
  }

  async _fetchOne(symbol) {
    const encoded = encodeURIComponent(symbol);
    const url = `${BASE_URL}/${encoded}?interval=1d&range=1d`;
    try {
      const res = await axios.get(url, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const meta = res.data?.chart?.result?.[0]?.meta;
      if (!meta) throw new Error('no meta in response');
      const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
      return {
        price: meta.regularMarketPrice,
        changePct: meta.regularMarketChangePercent ??
          ((meta.regularMarketPrice - prevClose) / prevClose * 100),
        change: meta.regularMarketPrice - prevClose,
        prevClose,
      };
    } catch (err) {
      // Try fallback subdomain
      const fbUrl = `${FALLBACK_URL}/${encoded}?interval=1d&range=1d`;
      const res = await axios.get(fbUrl, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const meta = res.data?.chart?.result?.[0]?.meta;
      if (!meta) throw new Error(`no data for ${symbol}`);
      const prevClose = meta.chartPreviousClose ?? meta.regularMarketPrice;
      return {
        price: meta.regularMarketPrice,
        changePct: meta.regularMarketChangePercent ??
          ((meta.regularMarketPrice - prevClose) / prevClose * 100),
        change: meta.regularMarketPrice - prevClose,
        prevClose,
      };
    }
  }

  async getMarketData() {
    const now = Date.now();
    if (this._cache && (now - this._cacheTime) < CACHE_TTL_MS) {
      return this._cache;
    }

    const results = await Promise.allSettled(
      SYMBOL_MAP.map(({ symbol }) => this._fetchOne(symbol))
    );

    const raw = {};
    SYMBOL_MAP.forEach(({ key }, i) => {
      raw[key] = results[i].status === 'fulfilled' ? results[i].value : null;
      if (results[i].status === 'rejected') {
        logger.warn(`FreeMarketData: failed to fetch ${key} — ${results[i].reason?.message}`);
      }
    });

    // Build sector list sorted by change %
    const sectors = SYMBOL_MAP
      .filter(s => s.isSector && raw[s.key] !== null)
      .map(s => ({ sector: s.label, changePct: raw[s.key].changePct }))
      .sort((a, b) => b.changePct - a.changePct);

    // Also add Banking from bankNifty data
    if (raw.bankNifty) {
      const bankEntry = { sector: 'Banking', changePct: raw.bankNifty.changePct };
      // Insert in sorted position
      const idx = sectors.findIndex(s => s.changePct < bankEntry.changePct);
      if (idx === -1) sectors.push(bankEntry);
      else sectors.splice(idx, 0, bankEntry);
    }

    const data = {
      fetchedAt: new Date().toISOString(),
      source: 'Yahoo Finance (15-min delayed)',
      nifty: raw.nifty,
      bankNifty: raw.bankNifty,
      vix: raw.vix,
      sectors,
    };

    this._cache = data;
    this._cacheTime = now;
    logger.info(`FreeMarketData: fetched — NIFTY ${raw.nifty?.changePct?.toFixed(2)}% | VIX ${raw.vix?.price?.toFixed(2)}`);
    return data;
  }

  invalidateCache() {
    this._cache = null;
    this._cacheTime = 0;
  }
}

module.exports = new FreeMarketDataService();
