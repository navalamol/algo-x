import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Divider,
  Button, Alert, Skeleton, Paper, Tooltip, List, ListItem,
  ListItemText, ListItemIcon
} from '@mui/material';
import {
  TrendingUp, TrendingDown, TrendingFlat, Search, Radar as RadarIcon,
  GridView, NotificationsActive, ArrowForward, LightbulbOutlined,
  ChangeHistory, WbSunny, AccessTime, Refresh, ErrorOutline,
  WarningAmber, InfoOutlined, FiberNewOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api.service';

// ── small shared atoms ──────────────────────────────────────────────────────

function RegimePill({ condition }) {
  if (!condition) return null;
  const map = {
    VERY_LOW:  { label: 'Very Low', color: 'success' },
    LOW:       { label: 'Low',      color: 'success' },
    NORMAL:    { label: 'Normal',   color: 'primary' },
    ELEVATED:  { label: 'Elevated', color: 'warning' },
    HIGH:      { label: 'High',     color: 'error'   },
    EXTREME:   { label: 'Extreme',  color: 'error'   },
  };
  const { label, color } = map[condition] || { label: condition, color: 'default' };
  return <Chip label={label} color={color} size="small" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} />;
}

function SentimentPill({ sentiment }) {
  if (!sentiment) return null;
  const map = {
    BULLISH: { label: '▲ Bullish', color: 'success' },
    BEARISH: { label: '▼ Bearish', color: 'error' },
    MIXED:   { label: '↔ Mixed',  color: 'warning' },
    NEUTRAL: { label: '— Neutral', color: 'default' },
  };
  const { label, color } = map[sentiment] || { label: sentiment, color: 'default' };
  return <Chip label={label} color={color} size="small" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} />;
}

function SectionLabel({ children }) {
  return (
    <Typography variant="overline" color="text.secondary"
      sx={{ display: 'block', mb: 1, letterSpacing: 1.5, fontSize: '0.68rem' }}>
      {children}
    </Typography>
  );
}

// ── Morning Brief card ──────────────────────────────────────────────────────

function IndexRow({ label, data }) {
  if (!data) return null;
  const up = data.changePct >= 0;
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Box display="flex" gap={1} alignItems="center">
        <Typography variant="caption" fontWeight="bold">
          {data.price?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </Typography>
        <Typography variant="caption" color={up ? 'success.light' : 'error.light'} fontWeight="bold">
          {up ? '+' : ''}{data.changePct?.toFixed(2)}%
        </Typography>
      </Box>
    </Box>
  );
}

function MorningBriefCard({ brief, loading, onRetry }) {
  const navigate = useNavigate();

  if (loading) return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton height={28} width="60%" sx={{ mb: 1 }} />
        <Skeleton height={22} sx={{ mb: 0.5 }} />
        <Skeleton height={22} width="80%" sx={{ mb: 0.5 }} />
        <Skeleton height={22} width="70%" />
      </CardContent>
    </Card>
  );

  if (!brief) return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <WbSunny sx={{ color: 'warning.main', fontSize: '1.1rem' }} />
          <Typography variant="subtitle1" fontWeight="bold">Morning Brief</Typography>
        </Box>
        <Alert severity="warning" sx={{ py: 0.5, mb: 1.5, fontSize: '0.78rem' }}>
          Could not reach backend. Make sure the server is running on port 5000 (<code>npm run dev</code>) then click Retry.
        </Alert>
        {onRetry && (
          <Button size="small" startIcon={<Refresh />} onClick={onRetry} variant="outlined" sx={{ textTransform: 'none', fontSize: '0.78rem' }}>
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const { regime, marketSentiment, breadth, sectorLeaders = [], sectorLaggers = [], noSetup, dataSource, nifty, bankNifty, marketDataSource } = brief;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <WbSunny sx={{ color: 'warning.main', fontSize: '1.1rem' }} />
            <Typography variant="subtitle1" fontWeight="bold">Morning Brief</Typography>
          </Box>
          <Tooltip title={marketDataSource ?? 'Live data'}>
            <Chip
              label={dataSource === 'demo' ? 'DEMO' : 'LIVE'}
              size="small"
              sx={{
                fontSize: '0.65rem',
                bgcolor: dataSource === 'demo' ? 'rgba(255,180,0,0.15)' : 'rgba(76,175,80,0.15)',
                color: dataSource === 'demo' ? 'warning.light' : 'success.light',
              }}
            />
          </Tooltip>
        </Box>

        {/* NIFTY + BANK NIFTY */}
        {(nifty || bankNifty) && (
          <Box mb={1.5} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1, p: 1 }}>
            {nifty    && <IndexRow label="NIFTY 50"    data={nifty} />}
            {bankNifty && <IndexRow label="BANK NIFTY" data={bankNifty} />}
          </Box>
        )}

        {/* VIX + Regime */}
        <Box display="flex" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
          <Typography variant="body2" color="text.secondary">India VIX</Typography>
          <Typography variant="body1" fontWeight="bold">{regime?.vix?.toFixed(1) ?? '—'}</Typography>
          <RegimePill condition={regime?.condition} />
          {regime?.trend && regime.trend !== 'STABLE' && (
            <Chip
              label={regime.trend === 'RISING' ? 'VIX ↑' : 'VIX ↓'}
              size="small"
              color={regime.trend === 'RISING' ? 'warning' : 'success'}
              variant="outlined"
              sx={{ fontSize: '0.65rem' }}
            />
          )}
        </Box>

        {regime?.recommendation && (
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}
            sx={{ fontStyle: 'italic', borderLeft: '2px solid', borderColor: 'divider', pl: 1 }}>
            {regime.recommendation}
          </Typography>
        )}

        {/* Sentiment + Breadth */}
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5} flexWrap="wrap">
          <SentimentPill sentiment={marketSentiment} />
          {breadth && (
            <Typography variant="caption" color="text.secondary">
              {breadth.advancing}↑ {breadth.declining}↓ of {breadth.total} sectors
            </Typography>
          )}
        </Box>

        {/* Sector Leaders */}
        {sectorLeaders.length > 0 && (
          <Box mb={1}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Sector Leaders
            </Typography>
            <Box display="flex" gap={0.75} flexWrap="wrap">
              {sectorLeaders.map(s => (
                <Chip
                  key={s.sector}
                  label={`${s.sector} +${s.changePct?.toFixed(1)}%`}
                  size="small"
                  sx={{ bgcolor: 'rgba(76,175,80,0.15)', color: 'success.light', fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Sector Laggers */}
        {sectorLaggers.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Weakness
            </Typography>
            <Box display="flex" gap={0.75} flexWrap="wrap">
              {sectorLaggers.map(s => (
                <Chip
                  key={s.sector}
                  label={`${s.sector} ${s.changePct?.toFixed(1)}%`}
                  size="small"
                  sx={{ bgcolor: 'rgba(244,67,54,0.15)', color: 'error.light', fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {noSetup && (
          <Alert severity="info" sx={{ mt: 1.5, py: 0.5, fontSize: '0.78rem' }}>
            No strong setups today — consider waiting.
          </Alert>
        )}
      </CardContent>
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/scanner')} sx={{ textTransform: 'none', fontSize: '0.78rem' }}>
          Run Scanner
        </Button>
      </Box>
    </Card>
  );
}

// ── Top Opportunities card ──────────────────────────────────────────────────

function OpportunitiesCard({ brief, loading }) {
  const navigate = useNavigate();

  if (loading) return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton height={28} width="60%" sx={{ mb: 1 }} />
        {[1, 2, 3].map(i => <Skeleton key={i} height={36} sx={{ mb: 0.5 }} />)}
      </CardContent>
    </Card>
  );

  const topOpps = brief?.topOpportunities ?? [];
  const noSetup = brief?.noSetup;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <LightbulbOutlined sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
          <Typography variant="subtitle1" fontWeight="bold">Top Setups</Typography>
          {!brief && <Chip label="COMING SOON" size="small" sx={{ fontSize: '0.65rem', opacity: 0.6 }} />}
        </Box>

        {!brief ? (
          <Alert severity="info" sx={{ py: 0.5, mb: 1, fontSize: '0.78rem' }}>
            Opportunity Ranking (Mission 2) will score stocks across Momentum, Volume, Relative Strength and Sector — every point explainable.
          </Alert>
        ) : noSetup || topOpps.length === 0 ? (
          <Alert severity="info" sx={{ py: 0.5, fontSize: '0.78rem' }}>
            No high-conviction setups today. Recommendation: WAIT / MONITOR.
          </Alert>
        ) : (
          topOpps.map((o, i) => (
            <Box key={o.symbol} mb={i < topOpps.length - 1 ? 1 : 0}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" fontWeight="bold">{o.symbol}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {o.templates.join(' · ')}
                  </Typography>
                </Box>
                <Box display="flex" gap={0.5} alignItems="center" flexShrink={0} ml={1}>
                  {o.rsi != null && (
                    <Chip label={`RSI ${o.rsi.toFixed(0)}`} size="small"
                      sx={{ fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.08)' }} />
                  )}
                  {o.volumeVsAvg != null && (
                    <Chip label={`Vol ${o.volumeVsAvg.toFixed(1)}×`} size="small"
                      sx={{ fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.08)' }} />
                  )}
                </Box>
              </Box>
              {i < topOpps.length - 1 && <Divider sx={{ mt: 1 }} />}
            </Box>
          ))
        )}
      </CardContent>
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/scanner')} sx={{ textTransform: 'none', fontSize: '0.78rem' }}>
          Full Scanner
        </Button>
      </Box>
    </Card>
  );
}

// ── Scan Summary card ───────────────────────────────────────────────────────

function ScanSummaryCard({ brief, loading }) {
  const navigate = useNavigate();

  if (loading) return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton height={28} width="60%" sx={{ mb: 1 }} />
        {[1, 2, 3].map(i => <Skeleton key={i} height={28} sx={{ mb: 0.5 }} />)}
      </CardContent>
    </Card>
  );

  const scanSummary = (brief?.scanSummary ?? []).filter(s => s.count > 0);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <Search sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
          <Typography variant="subtitle1" fontWeight="bold">Scan Summary</Typography>
        </Box>

        {!brief || scanSummary.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No scanner results yet. Run the scanner or start watch mode.</Typography>
        ) : (
          scanSummary.map((s, i) => (
            <Box key={s.templateId} mb={i < scanSummary.length - 1 ? 0.75 : 0}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">{s.templateName}</Typography>
                <Box display="flex" gap={0.75} alignItems="center">
                  <Chip
                    label={`${s.count} match${s.count !== 1 ? 'es' : ''}`}
                    size="small"
                    color={s.count > 0 ? 'primary' : 'default'}
                    sx={{ fontSize: '0.68rem' }}
                  />
                </Box>
              </Box>
              {s.topSymbols?.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {s.topSymbols.join(', ')}
                </Typography>
              )}
              {i < scanSummary.length - 1 && <Divider sx={{ mt: 0.75 }} />}
            </Box>
          ))
        )}
      </CardContent>
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/scanner')} sx={{ textTransform: 'none', fontSize: '0.78rem' }}>
          Open Scanner
        </Button>
      </Box>
    </Card>
  );
}

// ── What Changed card ───────────────────────────────────────────────────────

const SIG_COLOR = {
  high:   '#ef5350',
  medium: '#ffa726',
  low:    'text.secondary',
};

const SIG_ICON = {
  high:   <ErrorOutline   sx={{ fontSize: 15, color: '#ef5350' }} />,
  medium: <WarningAmber   sx={{ fontSize: 15, color: '#ffa726' }} />,
  low:    <InfoOutlined   sx={{ fontSize: 15, color: '#757575' }} />,
};

const CHANGE_TYPE_LABEL = {
  rsi_zone:    'RSI',
  volume_band: 'Volume',
  trend_bias:  'Trend',
  macd_flip:   'MACD',
  vwap_cross:  'VWAP',
};

function WhatChangedCard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.get('/changes');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load changes');
    } finally {
      setLoading(false);
    }
  }, []);

  const newSession = useCallback(async () => {
    try {
      await apiService.post('/changes/snapshot');
      load();
    } catch (err) {
      setError('Could not reset snapshot: ' + (err.response?.data?.message || err.message));
    }
  }, [load]);

  useEffect(() => { load(); }, [load]);

  const changes = (data?.changes ?? []).slice(0, 5);

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <ChangeHistory sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
            <Typography variant="subtitle1" fontWeight="bold">What Changed</Typography>
            {data?.dataSource && (
              <Chip
                label={data.dataSource === 'demo' ? '⚡ DEMO' : '● LIVE'}
                size="small"
                sx={{
                  fontSize: '0.62rem',
                  bgcolor: data.dataSource === 'demo' ? 'rgba(255,180,0,0.15)' : 'rgba(76,175,80,0.15)',
                  color:   data.dataSource === 'demo' ? 'warning.light' : 'success.light',
                }}
              />
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="New session — reset baseline to now">
              <Button
                size="small"
                startIcon={<FiberNewOutlined sx={{ fontSize: 14 }} />}
                onClick={newSession}
                sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.25 }}
                variant="outlined"
              >
                New Session
              </Button>
            </Tooltip>
            <Tooltip title="Refresh">
              <Button size="small" onClick={load} sx={{ minWidth: 32, p: 0.25 }}>
                <Refresh sx={{ fontSize: 15 }} />
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {data?.snapshotAt && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1, fontSize: '0.65rem' }}>
            Comparing to snapshot taken {new Date(data.snapshotAt).toLocaleTimeString('en-IN')}
            {data.symbolCount ? ` · ${data.symbolCount} symbols tracked` : ''}
          </Typography>
        )}

        {loading && (
          <Box>
            {[1, 2, 3].map(i => <Skeleton key={i} variant="text" height={28} sx={{ mb: 0.5 }} animation="wave" />)}
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error" action={<Button size="small" onClick={load}>Retry</Button>} sx={{ fontSize: '0.78rem' }}>
            {error}
          </Alert>
        )}

        {!loading && !error && changes.length === 0 && (
          <Alert severity="info" sx={{ py: 0.5, fontSize: '0.78rem' }}>
            No significant changes since last snapshot — market state is stable. Click "New Session" to reset the baseline.
          </Alert>
        )}

        {!loading && !error && changes.length > 0 && (
          <List dense disablePadding>
            {changes.map((c, i) => (
              <React.Fragment key={`${c.symbol}-${c.changeType}-${i}`}>
                <ListItem disablePadding sx={{ py: 0.4, alignItems: 'flex-start' }}>
                  <ListItemIcon sx={{ minWidth: 22, mt: 0.3 }}>
                    {SIG_ICON[c.significance] || SIG_ICON.low}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          sx={{ color: SIG_COLOR[c.significance] || 'text.primary', fontSize: '0.78rem' }}
                        >
                          {c.symbol}
                        </Typography>
                        <Chip
                          label={CHANGE_TYPE_LABEL[c.changeType] || c.changeType}
                          size="small"
                          sx={{ fontSize: '0.6rem', height: 16, bgcolor: 'rgba(255,255,255,0.08)' }}
                        />
                        {c.sector && (
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                            {c.sector}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', lineHeight: 1.4 }}>
                        {c.detail}
                      </Typography>
                    }
                  />
                </ListItem>
                {i < changes.length - 1 && <Divider sx={{ ml: 3.5, borderColor: 'rgba(255,255,255,0.05)' }} />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    apiService.get('/morning-brief')
      .then(r => setBrief(r.data?.data || null))
      .catch(() => setBrief(null))
      .finally(() => setLoading(false));
  }, [retryCount]);

  const handleRetry = () => setRetryCount(c => c + 1);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Box>
      {/* Page header */}
      <Box mb={3}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <WbSunny sx={{ color: 'warning.main', fontSize: '1.3rem' }} />
          <Typography variant="h5" fontWeight="bold">Market Intelligence</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <AccessTime sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {dateStr} · {timeStr} IST
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2.5}>

        {/* Row 1: three main cards */}
        <Grid item xs={12} md={4}>
          <MorningBriefCard brief={brief} loading={loading} onRetry={handleRetry} />
        </Grid>
        <Grid item xs={12} md={4}>
          <OpportunitiesCard brief={brief} loading={loading} />
        </Grid>
        <Grid item xs={12} md={4}>
          <ScanSummaryCard brief={brief} loading={loading} />
        </Grid>

        {/* What Changed — Mission 4 */}
        <Grid item xs={12}>
          <WhatChangedCard />
        </Grid>

        {/* Quick access tiles */}
        <Grid item xs={12}>
          <SectionLabel>Advanced Tools</SectionLabel>
          <Grid container spacing={1.5}>
            {[
              { label: 'Scanner',       desc: 'Template-based scans',          icon: <Search fontSize="small" />,             path: '/scanner' },
              { label: 'Order Radar',   desc: 'Buyer/seller imbalance',        icon: <RadarIcon fontSize="small" />,          path: '/radar' },
              { label: 'Sector Heatmap',desc: 'Sector performance grid',       icon: <GridView fontSize="small" />,           path: '/heatmap' },
              { label: 'Strategies',    desc: 'Builder + paper trading',       icon: <TrendingUp fontSize="small" />,         path: '/strategies' },
              { label: 'Backtest',      desc: 'Strategy simulation',           icon: <TrendingFlat fontSize="small" />,       path: '/backtest' },
              { label: 'Alerts',        desc: 'Price & indicator watches',     icon: <NotificationsActive fontSize="small" />,path: '/alerts' },
            ].map(item => (
              <Grid item xs={6} sm={4} md={2} key={item.label}>
                <Paper
                  onClick={() => navigate(item.path)}
                  sx={{ p: 1.5, cursor: 'pointer', textAlign: 'center',
                    '&:hover': { bgcolor: 'action.hover' }, transition: 'background 0.15s' }}
                >
                  <Box sx={{ color: 'primary.main', mb: 0.5 }}>{item.icon}</Box>
                  <Typography variant="caption" fontWeight="bold" display="block">{item.label}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{item.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Mission roadmap strip */}
        <Grid item xs={12}>
          <SectionLabel>Roadmap</SectionLabel>
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            {[
              { label: '✓ Morning Brief',       done: true  },
              { label: '✓ Opportunities',        done: true  },
              { label: '✓ Why This Stock',       done: true  },
              { label: '✓ What Changed',         done: true  },
              { label: 'Historical Evidence',    done: false },
              { label: 'Portfolio Intelligence', done: false },
            ].map((m, i) => (
              <React.Fragment key={m.label}>
                {i > 0 && <Typography color="text.disabled" sx={{ fontSize: '0.8rem' }}>→</Typography>}
                <Chip
                  label={m.label}
                  size="small"
                  variant={m.done ? 'filled' : 'outlined'}
                  color={m.done ? 'success' : 'default'}
                  sx={{ fontSize: '0.68rem', opacity: m.done ? 1 : 0.45 }}
                />
              </React.Fragment>
            ))}
          </Box>
        </Grid>

      </Grid>
    </Box>
  );
}
