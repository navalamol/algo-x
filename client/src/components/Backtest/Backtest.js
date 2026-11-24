import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Button, TextField, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Accordion, AccordionSummary, AccordionDetails, Alert
} from '@mui/material';
import {
  PlayArrow, ExpandMore, TrendingUp, TrendingDown,
  ShowChart, AccountBalance, Speed, Warning
} from '@mui/icons-material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell
} from 'recharts';
import apiService from '../../services/api.service';

const SYMBOLS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'WIPRO', 'LT', 'BAJFINANCE', 'ADANIENT'];

function MetricCard({ title, value, sub, color = 'primary.main', icon }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="textSecondary">{title}</Typography>
            <Typography variant="h5" color={color} fontWeight="bold" sx={{ lineHeight: 1.3 }}>{value}</Typography>
            {sub && <Typography variant="caption" color="textSecondary">{sub}</Typography>}
          </Box>
          <Box sx={{ color, opacity: 0.5, mt: 0.5 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Backtest() {
  const [strategies, setStrategies] = useState([]);
  const [form, setForm] = useState({
    strategyId: '',
    symbol: 'RELIANCE',
    days: 180,
    capital: 100000,
    slippage: 0.1,
    brokerage: 20,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiService.get('/backtest/strategies')
      .then(res => setStrategies(res.data?.data || []))
      .catch(() => {});
  }, []);

  const handleRun = async () => {
    if (!form.strategyId) { setError('Please select a strategy.'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await apiService.post('/backtest/run', form);
      if (res.data?.success) {
        setResult(res.data.data);
      } else {
        setError(res.data?.message || 'Backtest failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const { metrics, trades = [], equity = [] } = result || {};

  // Monthly P&L from trade list
  const monthlyPnL = useMemo(() => {
    if (!trades.length) return [];
    const map = {};
    trades.forEach(t => {
      const mo = t.exitDate?.slice(0, 7) || '?';
      map[mo] = (map[mo] || 0) + (t.pnl || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, pnl]) => ({ month, pnl: Math.round(pnl * 100) / 100 }));
  }, [trades]);

  const isPositive = metrics?.netPnL >= 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Backtesting</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Simulate a strategy on historical data to evaluate performance before going live.
        {' '}In demo mode, synthetic price data is generated automatically.
      </Typography>

      {/* ── Config Panel ── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Configuration</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Strategy</InputLabel>
              <Select
                value={form.strategyId}
                label="Strategy"
                onChange={e => setForm(f => ({ ...f, strategyId: e.target.value }))}
              >
                {strategies.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Symbol</InputLabel>
              <Select
                value={form.symbol}
                label="Symbol"
                onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
              >
                {SYMBOLS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={4} md={1.5}>
            <TextField
              label="Days" type="number" size="small" fullWidth
              value={form.days}
              onChange={e => setForm(f => ({ ...f, days: parseInt(e.target.value) || 180 }))}
              inputProps={{ min: 60, max: 730 }}
            />
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <TextField
              label="Capital (₹)" type="number" size="small" fullWidth
              value={form.capital}
              onChange={e => setForm(f => ({ ...f, capital: parseInt(e.target.value) || 100000 }))}
            />
          </Grid>

          <Grid item xs={6} sm={4} md={1.5}>
            <TextField
              label="Slippage %" type="number" size="small" fullWidth
              value={form.slippage}
              onChange={e => setForm(f => ({ ...f, slippage: parseFloat(e.target.value) || 0 }))}
              inputProps={{ step: 0.05, min: 0 }}
            />
          </Grid>

          <Grid item xs={6} sm={4} md={1.5}>
            <TextField
              label="Brokerage ₹" type="number" size="small" fullWidth
              value={form.brokerage}
              onChange={e => setForm(f => ({ ...f, brokerage: parseFloat(e.target.value) || 0 }))}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={0.5}>
            <Button
              variant="contained"
              fullWidth
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
              onClick={handleRun}
              disabled={loading}
              sx={{ height: 40 }}
            >
              {loading ? 'Running…' : 'Run'}
            </Button>
          </Grid>
        </Grid>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      {/* ── Results ── */}
      {result && metrics && (
        <>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Typography variant="h6">{result.strategyName} — {result.symbol}</Typography>
            <Chip
              label={`${result.days} bars`}
              size="small" variant="outlined"
            />
            <Chip
              label={`${metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn}% return`}
              size="small"
              color={metrics.totalReturn >= 0 ? 'success' : 'error'}
            />
          </Box>

          {/* Metric cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                title="Total Trades"
                value={metrics.totalTrades}
                icon={<ShowChart />}
                color="primary.main"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                title="Win Rate"
                value={`${metrics.winRate}%`}
                sub={`${metrics.wins}W / ${metrics.losses}L`}
                icon={<TrendingUp />}
                color={metrics.winRate >= 50 ? 'success.main' : 'warning.main'}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                title="Net P&L"
                value={`₹${metrics.netPnL.toLocaleString('en-IN')}`}
                sub={`Avg ₹${((metrics.netPnL) / Math.max(1, metrics.totalTrades)).toFixed(0)} / trade`}
                icon={isPositive ? <TrendingUp /> : <TrendingDown />}
                color={isPositive ? 'success.main' : 'error.main'}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                title="Profit Factor"
                value={metrics.profitFactor}
                sub={`Gross P ₹${metrics.grossProfit.toLocaleString('en-IN')}`}
                icon={<AccountBalance />}
                color={metrics.profitFactor >= 1.5 ? 'success.main' : metrics.profitFactor >= 1 ? 'warning.main' : 'error.main'}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                title="Max Drawdown"
                value={`${metrics.maxDrawdownPct}%`}
                sub={`₹${metrics.maxDrawdown.toLocaleString('en-IN')}`}
                icon={<Warning />}
                color={metrics.maxDrawdownPct > 20 ? 'error.main' : metrics.maxDrawdownPct > 10 ? 'warning.main' : 'success.main'}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                title="Sharpe (Approx)"
                value={metrics.sharpeApprox}
                sub="Annualized est."
                icon={<Speed />}
                color={metrics.sharpeApprox >= 1 ? 'success.main' : metrics.sharpeApprox >= 0 ? 'warning.main' : 'error.main'}
              />
            </Grid>
          </Grid>

          {/* Equity Curve */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Equity Curve</Typography>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={equity} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? '#4caf50' : '#f44336'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isPositive ? '#4caf50' : '#f44336'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} tickCount={6} />
                <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#888' }} />
                <ReTooltip
                  contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 6 }}
                  formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Portfolio Value']}
                />
                <ReferenceLine y={form.capital} stroke="#666" strokeDasharray="4 4" label={{ value: 'Start', fill: '#888', fontSize: 10 }} />
                <Area
                  type="monotone" dataKey="value"
                  stroke={isPositive ? '#4caf50' : '#f44336'}
                  fill="url(#eqGrad)" strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          {/* Monthly P&L */}
          {monthlyPnL.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Monthly P&L</Typography>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyPnL} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis tickFormatter={v => `₹${v}`} tick={{ fontSize: 10, fill: '#888' }} />
                  <ReTooltip
                    contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 6 }}
                    formatter={(v) => [`₹${v}`, 'P&L']}
                  />
                  <ReferenceLine y={0} stroke="#555" />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                    {monthlyPnL.map((d, i) => (
                      <Cell key={i} fill={d.pnl >= 0 ? '#4caf50' : '#f44336'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          )}

          {/* Trade List */}
          <Accordion defaultExpanded={trades.length <= 20}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Trade Log ({trades.length} trades)</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Entry Date</TableCell>
                      <TableCell>Exit Date</TableCell>
                      <TableCell align="right">Entry ₹</TableCell>
                      <TableCell align="right">Exit ₹</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell>Exit Reason</TableCell>
                      <TableCell align="right">P&L</TableCell>
                      <TableCell align="right">RSI@Entry</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trades.map((t, i) => (
                      <TableRow key={i} hover
                        sx={{ borderLeft: `3px solid ${t.pnl >= 0 ? '#4caf50' : '#f44336'}` }}
                      >
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{t.entryDate}</TableCell>
                        <TableCell>{t.exitDate}</TableCell>
                        <TableCell align="right">₹{t.entryPrice}</TableCell>
                        <TableCell align="right">₹{t.exitPrice}</TableCell>
                        <TableCell align="right">{t.qty}</TableCell>
                        <TableCell>
                          <Chip
                            label={t.exitReason}
                            size="small"
                            color={t.exitReason === 'TAKE_PROFIT' ? 'success' : t.exitReason === 'STOP_LOSS' ? 'error' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2" fontWeight="bold"
                            color={t.pnl >= 0 ? 'success.main' : 'error.main'}
                          >
                            {t.pnl >= 0 ? '+' : ''}₹{t.pnl}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {t.rsiAtEntry !== null ? t.rsiAtEntry?.toFixed(1) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </>
      )}

      {!result && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ShowChart sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">Configure and run a backtest to see results</Typography>
          <Typography variant="body2" color="textDisabled" sx={{ mt: 1 }}>
            Select a strategy, choose a symbol and date range, then click Run.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
