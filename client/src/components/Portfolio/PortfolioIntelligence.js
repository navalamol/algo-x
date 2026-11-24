import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, IconButton, LinearProgress, Alert, Divider, Tooltip,
  CircularProgress, Button
} from '@mui/material';
import {
  KeyboardArrowDown, KeyboardArrowUp, Refresh,
  TrendingUp, TrendingDown, Warning, CheckCircle,
  Visibility, AccountBalance, Hub
} from '@mui/icons-material';
import apiService from '../../services/api.service';

const HEALTH_CONFIG = {
  URGENT: { color: 'error',   label: 'URGENT', icon: <Warning sx={{ fontSize: 14 }} />,       chip: 'error'   },
  WATCH:  { color: 'warning', label: 'WATCH',  icon: <Visibility sx={{ fontSize: 14 }} />,    chip: 'warning' },
  REVIEW: { color: 'info',    label: 'REVIEW', icon: <Hub sx={{ fontSize: 14 }} />,            chip: 'info'    },
  HOLD:   { color: 'success', label: 'HOLD',   icon: <CheckCircle sx={{ fontSize: 14 }} />,   chip: 'success' },
};

const ALLOC_RISK_COLOR = { HIGH: 'error.main', MEDIUM: 'warning.main', LOW: 'success.main' };
const CORR_RISK_COLOR  = { HIGH: '#f44336', MODERATE: '#ff9800' };

function SummaryCard({ label, value, color, icon }) {
  return (
    <Card sx={{ height: '100%', borderTop: `3px solid`, borderColor: `${color}.main` }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <Box sx={{ color: `${color}.main` }}>{icon}</Box>
          <Typography variant="caption" color="textSecondary" fontWeight="bold">{label}</Typography>
        </Box>
        <Typography variant="h3" color={`${color}.main`} fontWeight="bold">{value}</Typography>
      </CardContent>
    </Card>
  );
}

function HoldingRow({ h }) {
  const [open, setOpen] = useState(false);
  const cfg = HEALTH_CONFIG[h.health] || HEALTH_CONFIG.REVIEW;

  return (
    <>
      <TableRow hover onClick={() => setOpen(o => !o)} sx={{ cursor: 'pointer', borderLeft: `3px solid`, borderColor: `${cfg.color}.main` }}>
        <TableCell sx={{ width: 32, p: 0.5 }}>
          <IconButton size="small">{open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}</IconButton>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontWeight="bold">{h.symbol}</Typography>
            <Chip label={h.sector} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
          </Box>
        </TableCell>
        <TableCell align="right">{h.qty}</TableCell>
        <TableCell align="right">₹{h.entryPrice?.toLocaleString('en-IN')}</TableCell>
        <TableCell align="right">₹{h.currentPrice?.toLocaleString('en-IN')}</TableCell>
        <TableCell align="right">
          <Typography variant="body2" color={h.pnlPct >= 0 ? 'success.main' : 'error.main'} fontWeight="bold">
            {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct?.toFixed(2)}%
          </Typography>
          <Typography variant="caption" color="textSecondary">
            ₹{h.pnlAbs?.toLocaleString('en-IN')}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            icon={cfg.icon}
            label={cfg.label}
            size="small"
            color={cfg.chip}
            variant={h.health === 'HOLD' ? 'outlined' : 'filled'}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, border: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, px: 2 }}>
              <Typography variant="body2" color={`${cfg.color}.main`} fontWeight="bold" sx={{ mb: 1 }}>
                {h.healthReason}
              </Typography>
              <Grid container spacing={1}>
                {h.signals?.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary" fontWeight="bold">Positive signals</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                      {h.signals.map((s, i) => (
                        <Chip key={i} label={s} size="small" color="success" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  </Grid>
                )}
                {h.riskFlags?.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary" fontWeight="bold">Risk flags</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                      {h.riskFlags.map((r, i) => (
                        <Chip key={i} label={r} size="small" color="error" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
              {h.marketState && (
                <Box display="flex" flexWrap="wrap" gap={1} mt={1.5}>
                  {Object.entries(h.marketState).filter(([k]) => k !== 'symbol' && k !== 'price').map(([k, v]) => (
                    <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function PortfolioIntelligence() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await apiService.get('/portfolio/intelligence');
      if (res.data?.success) setData(res.data.data);
      else setError(res.data?.message || 'Failed to load');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { summary, holdings = [], sectors = [], correlations = [] } = data || {};

  const isDemo = summary?.dataSource === 'demo';

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>Portfolio Intelligence</Typography>
        <Button size="small" startIcon={<Refresh />} onClick={load} disabled={loading}>Refresh</Button>
      </Box>

      {isDemo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Demo mode — showing 5 synthetic holdings covering all health states. Connect a Kite API key and open real paper trades to see live analysis.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && !data && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {summary && (
        <>
          {/* ── Summary strip ── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3} md={1.5}>
              <SummaryCard label="URGENT" value={summary.URGENT} color="error"   icon={<Warning />} />
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <SummaryCard label="WATCH"  value={summary.WATCH}  color="warning" icon={<Visibility />} />
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <SummaryCard label="REVIEW" value={summary.REVIEW} color="info"    icon={<Hub />} />
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <SummaryCard label="HOLD"   value={summary.HOLD}   color="success" icon={<CheckCircle />} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Typography variant="caption" color="textSecondary">Portfolio Value</Typography>
                  <Typography variant="h6" fontWeight="bold">₹{summary.portfolioValue?.toLocaleString('en-IN')}</Typography>
                  <Typography variant="caption" color="textSecondary">{summary.totalHoldings} holdings</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Typography variant="caption" color="textSecondary">Total P&L</Typography>
                  <Typography variant="h6" fontWeight="bold" color={summary.totalPnL >= 0 ? 'success.main' : 'error.main'}>
                    {summary.totalPnL >= 0 ? '+' : ''}₹{summary.totalPnL?.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" color={summary.totalPnLPct >= 0 ? 'success.main' : 'error.main'}>
                    {summary.totalPnLPct >= 0 ? '+' : ''}{summary.totalPnLPct}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {summary.topRisk && (
              <Grid item xs={12} md={2}>
                <Card sx={{ height: '100%', border: '1px solid', borderColor: 'error.dark' }}>
                  <CardContent sx={{ pb: '12px !important' }}>
                    <Typography variant="caption" color="error.main" fontWeight="bold">Top Risk</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{summary.topRisk}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* ── Holdings table ── */}
          {holdings.length > 0 ? (
            <Paper sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ p: 2, pb: 1 }}>Holdings</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 32 }} />
                      <TableCell>Symbol</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Entry ₹</TableCell>
                      <TableCell align="right">Current ₹</TableCell>
                      <TableCell align="right">P&L</TableCell>
                      <TableCell>Health</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {holdings
                      .sort((a, b) => {
                        const order = { URGENT: 0, WATCH: 1, REVIEW: 2, HOLD: 3 };
                        return (order[a.health] ?? 4) - (order[b.health] ?? 4);
                      })
                      .map(h => <HoldingRow key={h.symbol} h={h} />)
                    }
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
              <AccountBalance sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="textSecondary">No open positions found in your portfolio.</Typography>
            </Paper>
          )}

          {/* ── Sector concentration ── */}
          {sectors.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Sector Concentration</Typography>
              {sectors.map(s => (
                <Box key={s.sector} sx={{ mb: 1.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight="bold">{s.sector}</Typography>
                      <Typography variant="caption" color="textSecondary">{s.symbols.join(', ')}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" color={ALLOC_RISK_COLOR[s.allocRisk]} fontWeight="bold">
                        {s.allocation}%
                      </Typography>
                      <Chip label={s.allocRisk} size="small" color={s.allocRisk === 'HIGH' ? 'error' : s.allocRisk === 'MEDIUM' ? 'warning' : 'success'} variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, s.allocation)}
                    sx={{
                      height: 8, borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: s.allocRisk === 'HIGH' ? 'error.main' : s.allocRisk === 'MEDIUM' ? 'warning.main' : 'success.main',
                      }
                    }}
                  />
                </Box>
              ))}
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                HIGH ≥ 40% · MEDIUM 25–40% · LOW &lt; 25% of portfolio value
              </Typography>
            </Paper>
          )}

          {/* ── Correlations ── */}
          {correlations.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Correlated Holdings</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
                Highly correlated holdings move together — a single sector event affects both simultaneously.
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Pair</TableCell>
                      <TableCell align="right">Correlation (r)</TableCell>
                      <TableCell>Risk</TableCell>
                      <TableCell>Note</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {correlations.map((c, i) => (
                      <TableRow key={i} hover>
                        <TableCell><strong>{c.symbolA}</strong> ↔ <strong>{c.symbolB}</strong></TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold" sx={{ color: CORR_RISK_COLOR[c.risk] }}>
                            {c.r > 0 ? '+' : ''}{c.r}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={c.risk} size="small" color={c.risk === 'HIGH' ? 'error' : 'warning'} variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="textSecondary">{c.note}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
