import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea,
  Chip, Collapse, LinearProgress, Divider, IconButton,
  Tooltip, CircularProgress, Alert, Button, Stack, Tab, Tabs,
  List, ListItem, ListItemIcon, ListItemText, Skeleton,
  TextField, InputAdornment
} from '@mui/material';
import {
  TrendingUp, Speed, BarChart, CompareArrows, Waves,
  ExpandMore, ExpandLess, Refresh, InfoOutlined,
  CheckCircleOutline, ErrorOutline, RemoveCircleOutline,
  Psychology, AccountTree, FlashOn, CheckCircle
} from '@mui/icons-material';
import apiService from '../../services/api.service';

// Factor metadata
const FACTORS = [
  { key: 'trend',       label: 'Trend',           icon: <TrendingUp   sx={{ fontSize: 16 }} />, color: '#42a5f5' },
  { key: 'momentum',    label: 'Momentum',        icon: <Speed         sx={{ fontSize: 16 }} />, color: '#ab47bc' },
  { key: 'volume',      label: 'Volume',          icon: <BarChart      sx={{ fontSize: 16 }} />, color: '#26a69a' },
  { key: 'relStrength', label: 'Rel. Strength',   icon: <CompareArrows sx={{ fontSize: 16 }} />, color: '#ffa726' },
  { key: 'vixRegime',   label: 'VIX Regime',      icon: <Waves         sx={{ fontSize: 16 }} />, color: '#ef5350' },
];

function scoreColor(score) {
  if (score >= 70) return '#4caf50';
  if (score >= 50) return '#ffa726';
  return '#757575';
}

function scoreLabel(score) {
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Moderate';
  if (score >= 45) return 'Weak';
  return 'Low';
}

function FactorBar({ factor, bd }) {
  const pct = bd ? Math.round((bd.score / bd.max) * 100) : 0;
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ color: factor.color }}>{factor.icon}</Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            {factor.label}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.72rem' }}>
          {bd?.score ?? '—'} / {bd?.max ?? '—'}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 5, borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': { bgcolor: factor.color, borderRadius: 2 },
        }}
      />
      {bd?.reason && (
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', mt: 0.3, display: 'block' }}>
          {bd.reason}
        </Typography>
      )}
    </Box>
  );
}

function signalIcon(type) {
  if (type === 'positive') return <CheckCircleOutline sx={{ fontSize: 15, color: '#4caf50' }} />;
  if (type === 'risk')     return <ErrorOutline       sx={{ fontSize: 15, color: '#ef5350' }} />;
  return                          <RemoveCircleOutline sx={{ fontSize: 15, color: '#757575' }} />;
}

function TechValue({ label, value, unit = '' }) {
  if (value === null || value === undefined) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.3 }}>
      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>{label}</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', fontWeight: 500 }}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}{unit}
      </Typography>
    </Box>
  );
}

function EvidencePanel({ symbol, visible, onEvidence }) {
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [fetched, setFetched]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.get(`/opportunities/${symbol}/evidence`);
      setEvidence(res.data.data);
      if (onEvidence) onEvidence(res.data.data);
      setFetched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  }, [symbol, onEvidence]);

  // Auto-load when the tab becomes visible for the first time
  useEffect(() => {
    if (visible && !fetched && !loading) load();
  }, [visible, fetched, loading, load]);

  if (loading) return (
    <Box sx={{ p: 1.5 }}>
      {[1, 2, 3].map(i => <Skeleton key={i} variant="text" sx={{ mb: 0.5 }} animation="wave" />)}
    </Box>
  );

  if (error) return (
    <Box sx={{ p: 1.5 }}>
      <Alert severity="error" action={<Button size="small" onClick={load}>Retry</Button>} sx={{ fontSize: '0.72rem' }}>
        {error}
      </Alert>
    </Box>
  );

  if (!evidence) return null;

  const t = evidence.technicals || {};
  const kl = evidence.keyLevels || {};
  const positiveSignals = evidence.signals.filter(s => s.type === 'positive');
  const riskSignals     = evidence.signals.filter(s => s.type === 'risk');
  const neutralSignals  = evidence.signals.filter(s => s.type === 'neutral');

  return (
    <Box sx={{ p: 2, pt: 1 }}>
      {/* Summary */}
      <Box sx={{ mb: 1.5, p: 1.2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, borderLeft: '3px solid #42a5f5' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', lineHeight: 1.5 }}>
          {evidence.summary}
        </Typography>
      </Box>

      {/* Signals */}
      {evidence.signals.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Technical Signals
          </Typography>
          <List dense disablePadding>
            {[...positiveSignals, ...riskSignals, ...neutralSignals].map((sig, i) => (
              <ListItem key={i} disablePadding sx={{ mb: 0.3, alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: 22, mt: 0.1 }}>{signalIcon(sig.type)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.72rem', color: sig.type === 'positive' ? '#4caf50' : sig.type === 'risk' ? '#ef5350' : '#757575' }}>
                      {sig.label}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
                      {sig.detail}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 1.5 }} />

      {/* Technicals grid */}
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={6}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Indicators
          </Typography>
          <TechValue label="RSI (14)"       value={t.rsi} />
          <TechValue label="SMA 20"         value={t.sma20} unit=" ₹" />
          <TechValue label="SMA 50"         value={t.sma50} unit=" ₹" />
          <TechValue label="VWAP"           value={t.vwap}  unit=" ₹" />
          <TechValue label="ATR (14)"       value={t.atr}   unit=" ₹" />
          <TechValue label="Volume vs Avg"  value={t.volumeVsAvg} unit="×" />
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Key Levels
          </Typography>
          <TechValue label="Support"    value={kl.support}    unit=" ₹" />
          <TechValue label="Resistance" value={kl.resistance} unit=" ₹" />
          <TechValue label="VWAP"       value={kl.vwap}       unit=" ₹" />
          {t.bollingerBands && <>
            <TechValue label="BB Upper"  value={t.bollingerBands.upper}  unit=" ₹" />
            <TechValue label="BB Lower"  value={t.bollingerBands.lower}  unit=" ₹" />
          </>}
          {t.macd && <TechValue label="MACD Histogram" value={t.macd.histogram} />}
        </Grid>
      </Grid>

      {/* Footer meta */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        {evidence.sector && (
          <Chip label={evidence.sector} size="small" sx={{ fontSize: '0.6rem', height: 16 }} variant="outlined" />
        )}
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', ml: 'auto' }}>
          {evidence.dataPoints} pts · {new Date(evidence.generatedAt).toLocaleTimeString('en-IN')}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Strategy matching (client-side, uses evidence already loaded) ─────────────

const STRATEGY_RULES = [
  {
    name: 'RSI Oversold Reversal',
    test: (t) => t.rsi !== null && t.rsi < 35,
    reason: (t) => `RSI at ${t.rsi?.toFixed(1)} (< 35)`,
  },
  {
    name: 'VWAP Breakout',
    test: (t, price) => price && t.vwap && price > t.vwap && t.volumeVsAvg > 1.5,
    reason: (t) => `Price above VWAP, volume ${t.volumeVsAvg?.toFixed(1)}× avg`,
  },
  {
    name: 'Support Bounce',
    test: (t, price, kl) => price && kl.support && price <= kl.support * 1.025 && t.rsi > 30 && t.rsi < 55,
    reason: (t, price, kl) => `Price ₹${price?.toFixed(0)} near support ₹${kl.support?.toFixed(0)}`,
  },
  {
    name: 'Volume Spike Catcher',
    test: (t) => t.volumeVsAvg > 2.0,
    reason: (t) => `Volume ${t.volumeVsAvg?.toFixed(1)}× average`,
  },
  {
    name: 'Mean Reversion',
    test: (t) => t.rsi !== null && t.rsi > 68,
    reason: (t) => `RSI ${t.rsi?.toFixed(1)} — overbought mean-reversion candidate`,
  },
];

function matchStrategies(evidence, price) {
  if (!evidence) return [];
  const t = evidence.technicals || {};
  const kl = evidence.keyLevels || {};
  return STRATEGY_RULES
    .filter(r => r.test(t, price, kl))
    .map(r => ({ name: r.name, reason: r.reason(t, price, kl) }));
}

// ── PaperTradePanel ───────────────────────────────────────────────────────────

function PaperTradePanel({ opp, evidence, visible }) {
  const price = opp.price || 0;
  const kl = evidence?.keyLevels || {};
  const t  = evidence?.technicals || {};

  const defaultSL     = kl.support  ? Math.round(kl.support  * 0.998 * 100) / 100 : Math.round(price * 0.97 * 100) / 100;
  const defaultTarget = kl.resistance ? Math.round(kl.resistance * 1.002 * 100) / 100 : Math.round(price * 1.05 * 100) / 100;
  const riskPerShare  = Math.max(price - defaultSL, 1);
  const defaultQty    = Math.max(1, Math.floor((100000 * 0.02) / riskPerShare));

  const [qty,    setQty]    = useState(String(defaultQty));
  const [entry,  setEntry]  = useState(String(price));
  const [sl,     setSl]     = useState(String(defaultSL));
  const [tgt,    setTgt]    = useState(String(defaultTarget));
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);  // { success, message }
  const [error,      setError]      = useState(null);

  // Reset when card collapses / different symbol shown
  useEffect(() => {
    if (visible) {
      setQty(String(defaultQty));
      setEntry(String(price));
      setSl(String(defaultSL));
      setTgt(String(defaultTarget));
      setResult(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, opp.symbol]);

  if (!evidence) {
    return (
      <Box sx={{ p: 2, pt: 1 }}>
        <Alert severity="info" sx={{ fontSize: '0.72rem' }}>
          Switch to "Why This Stock" tab first to load evidence, then return here.
        </Alert>
      </Box>
    );
  }

  const entryNum = parseFloat(entry) || 0;
  const slNum    = parseFloat(sl)    || 0;
  const tgtNum   = parseFloat(tgt)   || 0;
  const qtyNum   = parseInt(qty, 10) || 0;

  const riskAmt  = (entryNum - slNum) * qtyNum;
  const rewardAmt = (tgtNum - entryNum) * qtyNum;
  const rrRatio  = riskAmt > 0 ? (rewardAmt / riskAmt).toFixed(2) : '—';
  const rrColor  = parseFloat(rrRatio) >= 2 ? '#4caf50' : parseFloat(rrRatio) >= 1 ? '#ffa726' : '#ef5350';

  const matches = matchStrategies(evidence, entryNum);

  const handlePlace = async () => {
    if (!qtyNum || !entryNum || qtyNum <= 0 || entryNum <= 0) {
      setError('Enter valid quantity and entry price.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        symbol: opp.symbol,
        quantity: qtyNum,
        entryPrice: entryNum,
        stopLoss: slNum || null,
        target: tgtNum || null,
        opportunityScore: opp.totalScore,
        matchedStrategy: matches[0]?.name || null,
        signals: (evidence.signals || []).slice(0, 3).map(s => s.label),
        scoreFactors: opp.breakdown || null,
        sector: evidence.sector || null,
        evidenceSnapshot: evidence.technicals ? {
          rsi: evidence.technicals.rsi,
          macdHistogram: evidence.technicals.macd?.histogram,
          volumeVsAvg: evidence.technicals.volumeVsAvg,
          smaTrend: evidence.technicals.smaTrend,
          stochRsi: evidence.technicals.stochRsi,
          vwapPosition: evidence.technicals.vwapPosition,
        } : null,
      };
      const res = await apiService.post('/paper-trade/quick', payload);
      setResult({ success: true, message: res.data.data?.message || 'Trade placed!' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place trade');
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.success) {
    return (
      <Box sx={{ p: 2, pt: 1, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
        <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold', mb: 0.5 }}>
          {result.message}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Trade is now OPEN in your Journal.
        </Typography>
        <Box sx={{ mt: 1.5 }}>
          <Button size="small" variant="outlined" onClick={() => setResult(null)} sx={{ fontSize: '0.7rem' }}>
            Place Another
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pt: 1 }}>
      {/* Strategy matches */}
      {matches.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5, display: 'block' }}>
            Matching Strategies
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {matches.map(m => (
              <Tooltip key={m.name} title={m.reason}>
                <Chip
                  label={m.name} size="small"
                  sx={{ fontSize: '0.62rem', height: 18, bgcolor: 'rgba(66,165,245,0.12)', color: '#42a5f5', cursor: 'default' }}
                />
              </Tooltip>
            ))}
          </Stack>
        </Box>
      )}
      {matches.length === 0 && (
        <Box sx={{ mb: 1.5, p: 1, bgcolor: 'rgba(255,167,38,0.07)', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: '#ffa726', fontSize: '0.68rem' }}>
            No active strategies match current conditions — you can still place a manual paper trade.
          </Typography>
        </Box>
      )}

      {/* R:R strip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, p: 1, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', display: 'block' }}>Risk</Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.72rem', color: '#ef5350' }}>
            ₹{riskAmt > 0 ? riskAmt.toFixed(0) : '—'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', display: 'block' }}>Reward</Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.72rem', color: '#4caf50' }}>
            ₹{rewardAmt > 0 ? rewardAmt.toFixed(0) : '—'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', display: 'block' }}>R:R Ratio</Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.72rem', color: rrColor }}>
            {rrRatio}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', display: 'block' }}>Score</Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.72rem', color: '#42a5f5' }}>
            {opp.totalScore}/100
          </Typography>
        </Box>
      </Box>

      {/* Trade form */}
      <Grid container spacing={1} sx={{ mb: 1.5 }}>
        <Grid item xs={6}>
          <TextField
            label="Qty" size="small" fullWidth
            value={qty} onChange={e => setQty(e.target.value)}
            InputProps={{ sx: { fontSize: '0.78rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.72rem' } }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Entry ₹" size="small" fullWidth
            value={entry} onChange={e => setEntry(e.target.value)}
            InputProps={{ sx: { fontSize: '0.78rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.72rem' } }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Stop-Loss ₹" size="small" fullWidth
            value={sl} onChange={e => setSl(e.target.value)}
            InputProps={{ sx: { fontSize: '0.78rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.72rem' } }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Target ₹" size="small" fullWidth
            value={tgt} onChange={e => setTgt(e.target.value)}
            InputProps={{ sx: { fontSize: '0.78rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.72rem' } }}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 1, fontSize: '0.68rem', py: 0.3 }}>{error}</Alert>
      )}

      <Button
        variant="contained"
        fullWidth
        size="small"
        onClick={handlePlace}
        disabled={submitting}
        startIcon={submitting ? <CircularProgress size={14} /> : <FlashOn />}
        sx={{ fontSize: '0.78rem', py: 0.8, bgcolor: '#42a5f5', '&:hover': { bgcolor: '#1e88e5' } }}
      >
        {submitting ? 'Placing…' : 'Place Paper Trade'}
      </Button>

      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', display: 'block', mt: 0.8, textAlign: 'center' }}>
        Paper trade only — no real money executes
      </Typography>
    </Box>
  );
}

function OpportunityCard({ opp, rank }) {
  const [expanded, setExpanded]   = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [evidence, setEvidence]   = useState(null);
  const color = scoreColor(opp.totalScore);

  return (
    <Card
      sx={{
        bgcolor: 'background.paper',
        border: `1px solid ${expanded ? color + '55' : 'rgba(255,255,255,0.08)'}`,
        transition: 'border-color 0.2s',
      }}
    >
      <CardActionArea onClick={() => setExpanded(e => !e)} sx={{ p: 0 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Rank badge */}
            <Box
              sx={{
                width: 28, height: 28, borderRadius: '50%',
                bgcolor: color + '22', border: `1.5px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color }}>
                {rank}
              </Typography>
            </Box>

            {/* Symbol & name */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                {opp.symbol}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }} noWrap>
                {opp.name !== opp.symbol ? opp.name : ''}
              </Typography>
            </Box>

            {/* Price */}
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.78rem', flexShrink: 0 }}>
              ₹{opp.price?.toLocaleString('en-IN')}
            </Typography>

            {/* Score ring */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate" value={opp.totalScore} size={48} thickness={4}
                  sx={{ color, '& circle': { strokeLinecap: 'round' } }}
                />
                <CircularProgress
                  variant="determinate" value={100} size={48} thickness={4}
                  sx={{ position: 'absolute', left: 0, color: 'rgba(255,255,255,0.06)', '& circle': { strokeLinecap: 'round' } }}
                />
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 'bold', color }}>
                    {opp.totalScore}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={scoreLabel(opp.totalScore)} size="small"
                sx={{ fontSize: '0.6rem', height: 16, px: 0, mt: 0.3, bgcolor: color + '22', color }}
              />
            </Box>

            {/* Expand icon */}
            <Box sx={{ color: 'text.disabled', flexShrink: 0 }}>
              {expanded ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
            </Box>
          </Box>

          {/* Mini factor bar row (collapsed view) */}
          {!expanded && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1.2, flexWrap: 'wrap' }}>
              {FACTORS.map(f => {
                const bd = opp.breakdown?.[f.key];
                const pct = bd ? Math.round((bd.score / bd.max) * 100) : 0;
                return (
                  <Tooltip key={f.key} title={`${f.label}: ${bd?.score ?? '—'}/${bd?.max ?? '—'}`}>
                    <Box sx={{ flex: 1, minWidth: 32 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                        {f.label.split(' ')[0]}
                      </Typography>
                      <LinearProgress
                        variant="determinate" value={pct}
                        sx={{
                          height: 3, borderRadius: 1,
                          bgcolor: 'rgba(255,255,255,0.08)',
                          '& .MuiLinearProgress-bar': { bgcolor: f.color, borderRadius: 1 },
                        }}
                      />
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          )}
        </CardContent>
      </CardActionArea>

      {/* Expanded detail */}
      <Collapse in={expanded} unmountOnExit>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* Tab switcher */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          onClick={e => e.stopPropagation()}
          sx={{
            minHeight: 36,
            px: 1,
            '& .MuiTab-root': { minHeight: 36, fontSize: '0.7rem', py: 0 },
            '& .MuiTabs-indicator': { bgcolor: color },
          }}
        >
          <Tab label="Score Breakdown" icon={<AccountTree sx={{ fontSize: 13 }} />} iconPosition="start" />
          <Tab label="Why This Stock"  icon={<Psychology  sx={{ fontSize: 13 }} />} iconPosition="start" />
          <Tab label="Paper Trade"     icon={<FlashOn     sx={{ fontSize: 13 }} />} iconPosition="start" />
        </Tabs>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />

        {/* Score breakdown panel */}
        {activeTab === 0 && (
          <Box sx={{ p: 2, pt: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', mb: 1.5, display: 'block', fontSize: '0.68rem' }}>
              Score breakdown — {opp.dataPoints} price points analysed
            </Typography>
            {FACTORS.map(f => (
              <FactorBar key={f.key} factor={f} bd={opp.breakdown?.[f.key]} />
            ))}
          </Box>
        )}

        {/* Evidence panel */}
        {activeTab === 1 && (
          <EvidencePanel symbol={opp.symbol} visible={activeTab === 1} onEvidence={setEvidence} />
        )}

        {/* Paper trade panel */}
        {activeTab === 2 && (
          <PaperTradePanel opp={opp} evidence={evidence} visible={activeTab === 2} />
        )}
      </Collapse>
    </Card>
  );
}

export default function OpportunityRanking() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.get('/opportunities');
      setData(res.data.data);
      setLastFetch(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const opportunities = data?.opportunities ?? [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Opportunities
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
            Stocks ranked by multi-factor score — expand a card for score breakdown or "Why this stock" evidence
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          {data?.dataSource && (
            <Chip
              label={data.dataSource === 'demo' ? '⚡ DEMO' : '● LIVE'}
              size="small"
              sx={{ fontSize: '0.65rem', bgcolor: data.dataSource === 'demo' ? 'warning.dark' : 'success.dark', color: 'white' }}
            />
          )}
          {data?.vix !== undefined && (
            <Chip label={`VIX ${data.vix?.toFixed(1)}`} size="small" sx={{ fontSize: '0.65rem' }} variant="outlined" />
          )}
          <Tooltip title="Refresh rankings">
            <span>
              <IconButton size="small" onClick={fetch} disabled={loading}>
                <Refresh sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Score legend */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        {[
          { label: '75–100 Strong',  color: '#4caf50' },
          { label: '60–74 Moderate', color: '#ffa726' },
          { label: '45–59 Weak',     color: '#757575' },
          { label: '0–44 Low',       color: '#424242' },
        ].map(item => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
              {item.label}
            </Typography>
          </Box>
        ))}
        <Tooltip title='Click a card to expand, then switch to "Why This Stock" for evidence'>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, cursor: 'help', ml: 'auto' }}>
            <InfoOutlined sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
              Expand → "Why This Stock" for evidence
            </Typography>
          </Box>
        </Tooltip>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {/* Error */}
      {!loading && error && (
        <Alert severity="error" action={<Button size="small" onClick={fetch}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* Empty */}
      {!loading && !error && opportunities.length === 0 && (
        <Alert severity="info">
          No opportunities found — scanner needs price history to accumulate (wait a few minutes in live mode).
        </Alert>
      )}

      {/* Cards */}
      {!loading && opportunities.length > 0 && (
        <Grid container spacing={1.5}>
          {opportunities.map((opp, idx) => (
            <Grid item xs={12} md={6} key={opp.symbol}>
              <OpportunityCard opp={opp} rank={idx + 1} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Footer */}
      {lastFetch && !loading && (
        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 2, display: 'block', textAlign: 'right', fontSize: '0.65rem' }}>
          Computed at {lastFetch.toLocaleTimeString('en-IN')}
          {data?.dataSource === 'demo' && ' · Demo mode — scores derived from scenario price histories'}
        </Typography>
      )}
    </Box>
  );
}
