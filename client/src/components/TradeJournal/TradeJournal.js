import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, TextField,
  ToggleButton, ToggleButtonGroup, Divider, Tooltip,
  Tab, Tabs
} from '@mui/material';
import {
  TrendingUp, TrendingDown, ShowChart, CheckCircle, RadioButtonUnchecked, Download
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import apiService from '../../services/api.service';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}
function fmtRupee(n) {
  return `₹${Number(n).toFixed(2)}`;
}

// ── sub-components ───────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon, color = 'primary.main' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>{title}</Typography>
            <Typography variant="h4" color={color} fontWeight="bold">{value}</Typography>
            {sub && <Typography variant="caption" color="textSecondary">{sub}</Typography>}
          </Box>
          <Box sx={{ color, opacity: 0.6, mt: 0.5 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function EquityCurve({ trades }) {
  const data = useMemo(() => {
    const sorted = [...trades]
      .filter(t => t.status === 'COMPLETE' && t.pnl !== undefined)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let cumulative = 0;
    return sorted.map((t, i) => {
      cumulative += t.pnl || 0;
      return {
        name: `#${i + 1}`,
        date: fmtDate(t.createdAt),
        pnl: Math.round(cumulative * 100) / 100,
        tradePnL: Math.round((t.pnl || 0) * 100) / 100,
        symbol: t.tradingSymbol,
      };
    });
  }, [trades]);

  if (data.length === 0) return null;

  const isPositive = data[data.length - 1]?.pnl >= 0;
  const color = isPositive ? '#4caf50' : '#f44336';

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Equity Curve</Typography>
      <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
        Cumulative P&amp;L across {data.length} completed trades
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
          <YAxis tickFormatter={v => `₹${v}`} tick={{ fontSize: 11, fill: '#888' }} />
          <ReTooltip
            contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 6 }}
            formatter={(val, name) => [fmtRupee(val), name === 'pnl' ? 'Cumulative P&L' : 'Trade P&L']}
            labelFormatter={(label, payload) => {
              const p = payload?.[0]?.payload;
              return p ? `${p.symbol} — ${p.date}` : label;
            }}
          />
          <ReferenceLine y={0} stroke="#555" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="pnl" stroke={color} fill="url(#pnlGrad)"
            strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
}

function StrategyTable({ trades }) {
  const rows = useMemo(() => {
    const map = {};
    trades.filter(t => t.status === 'COMPLETE').forEach(t => {
      const k = t.strategyName || 'Manual';
      if (!map[k]) map[k] = { name: k, trades: 0, wins: 0, losses: 0, pnl: 0 };
      map[k].trades++;
      if ((t.pnl || 0) > 0) map[k].wins++; else map[k].losses++;
      map[k].pnl += t.pnl || 0;
    });
    return Object.values(map).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  if (rows.length === 0) return null;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Strategy Performance</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Strategy</TableCell>
              <TableCell align="center">Trades</TableCell>
              <TableCell align="center">Win Rate</TableCell>
              <TableCell align="right">Net P&amp;L</TableCell>
              <TableCell align="right">Avg P&amp;L</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.name} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">{r.name}</Typography>
                </TableCell>
                <TableCell align="center">{r.trades}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${Math.round((r.wins / r.trades) * 100)}%`}
                    size="small"
                    color={r.wins / r.trades >= 0.6 ? 'success' : r.wins / r.trades >= 0.4 ? 'warning' : 'error'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2" fontWeight="bold"
                    color={r.pnl >= 0 ? 'success.main' : 'error.main'}
                  >
                    {fmtRupee(r.pnl)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="caption"
                    color={(r.pnl / r.trades) >= 0 ? 'success.main' : 'error.main'}
                  >
                    {fmtRupee(r.pnl / r.trades)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function TradeJournal() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradeTab, setTradeTab] = useState('paper'); // 'paper' | 'live' | 'all'

  // Filters
  const [filterStatus, setFilterStatus] = useState('ALL');     // ALL | WIN | LOSS | OPEN
  const [filterStrategy, setFilterStrategy] = useState('');
  const [filterSymbol, setFilterSymbol] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    apiService.getJournalTrades('amol')
      .then(res => {
        const data = res.data?.trades || res.data?.data || [];
        setTrades(data);
      })
      .catch(err => console.error('Journal load error:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── Tab filter ─────────────────────────────────────────────────────────────
  const tabTrades = useMemo(() => {
    if (tradeTab === 'paper') return trades.filter(t => t.isPaperTrade !== false);
    if (tradeTab === 'live')  return trades.filter(t => t.isPaperTrade === false);
    return trades;
  }, [trades, tradeTab]);

  // ── Computed stats ─────────────────────────────────────────────────────────
  const { completed, open, wins, netPnL, avgPnL } = useMemo(() => {
    const c = tabTrades.filter(t => t.status === 'COMPLETE');
    const o = tabTrades.filter(t => t.status === 'OPEN');
    const w = c.filter(t => (t.pnl || 0) > 0);
    const net = c.reduce((s, t) => s + (t.pnl || 0), 0);
    return { completed: c, open: o, wins: w, netPnL: net, avgPnL: c.length ? net / c.length : 0 };
  }, [tabTrades]);

  // ── Strategy list for filter dropdown ─────────────────────────────────────
  const strategies = useMemo(() => {
    return [...new Set(tabTrades.map(t => t.strategyName).filter(Boolean))].sort();
  }, [tabTrades]);

  const symbols = useMemo(() => {
    return [...new Set(tabTrades.map(t => t.tradingSymbol).filter(Boolean))].sort();
  }, [tabTrades]);

  // ── Filtered trades ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return tabTrades.filter(t => {
      if (filterStatus === 'WIN' && (t.pnl || 0) <= 0) return false;
      if (filterStatus === 'LOSS' && (t.pnl || 0) >= 0) return false;
      if (filterStatus === 'OPEN' && t.status !== 'OPEN') return false;
      if (filterStrategy && t.strategyName !== filterStrategy) return false;
      if (filterSymbol && t.tradingSymbol !== filterSymbol) return false;
      if (dateFrom && new Date(t.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(t.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tabTrades, filterStatus, filterStrategy, filterSymbol, dateFrom, dateTo]);

  const exportCSV = () => {
    const headers = ['Date','Symbol','Exchange','Strategy','Type','Qty','Entry','Exit','Status','P&L','P&L%','Paper'];
    const rows = filtered.map(t => [
      new Date(t.createdAt).toLocaleDateString('en-IN'),
      t.tradingSymbol, t.exchange, t.strategyName || '',
      t.transactionType, t.quantity,
      t.entryPrice ?? '', t.exitPrice ?? '',
      t.status, t.pnl ?? '', t.pnlPercentage ?? '',
      t.isPaperTrade ? 'Yes' : 'No'
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `trades_${tradeTab}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) {
    return <Box p={3}><Typography>Loading journal…</Typography></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Trade Journal</Typography>
      {/* ── Paper / Live / All tabs ── */}
      <Tabs
        value={tradeTab}
        onChange={(_, v) => { setTradeTab(v); setFilterStrategy(''); setFilterSymbol(''); }}
        sx={{ mb: 2 }}
      >
        <Tab value="paper" label={`Paper Trades (${trades.filter(t => t.isPaperTrade !== false).length})`} />
        <Tab value="live"  label={`Live Trades (${trades.filter(t => t.isPaperTrade === false).length})`} />
        <Tab value="all"   label={`All (${trades.length})`} />
      </Tabs>

      {/* ── Stat cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            title="Total Trades"
            value={tabTrades.length}
            icon={<ShowChart fontSize="large" />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            title="Completed"
            value={completed.length}
            icon={<CheckCircle fontSize="large" />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            title="Win Rate"
            value={completed.length > 0 ? `${Math.round((wins.length / completed.length) * 100)}%` : '—'}
            sub={`${wins.length} wins / ${completed.length - wins.length} losses`}
            icon={<TrendingUp fontSize="large" />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            title="Net P&L"
            value={fmtRupee(netPnL)}
            sub={`Avg ${fmtRupee(avgPnL)} / trade`}
            icon={netPnL >= 0 ? <TrendingUp fontSize="large" /> : <TrendingDown fontSize="large" />}
            color={netPnL >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            title="Open Positions"
            value={open.length}
            icon={<RadioButtonUnchecked fontSize="large" />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* ── Equity curve + strategy table ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <EquityCurve trades={tabTrades} />
        </Grid>
        <Grid item xs={12} md={5}>
          <StrategyTable trades={tabTrades} />
        </Grid>
      </Grid>

      {/* ── Trades table with filters ── */}
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">All Trades</Typography>
            <Button size="small" variant="outlined" startIcon={<Download />} onClick={exportCSV}>
              CSV
            </Button>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <ToggleButtonGroup
              value={filterStatus}
              exclusive
              onChange={(_, v) => v && setFilterStatus(v)}
              size="small"
            >
              <ToggleButton value="ALL">All</ToggleButton>
              <ToggleButton value="WIN" sx={{ color: 'success.main' }}>Wins</ToggleButton>
              <ToggleButton value="LOSS" sx={{ color: 'error.main' }}>Losses</ToggleButton>
              <ToggleButton value="OPEN" sx={{ color: 'warning.main' }}>Open</ToggleButton>
            </ToggleButtonGroup>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Strategy</InputLabel>
              <Select value={filterStrategy} label="Strategy" onChange={e => setFilterStrategy(e.target.value)}>
                <MenuItem value="">All Strategies</MenuItem>
                {strategies.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Symbol</InputLabel>
              <Select value={filterSymbol} label="Symbol" onChange={e => setFilterSymbol(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {symbols.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              label="From" type="date" size="small" value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 140 }}
            />
            <TextField
              label="To" type="date" size="small" value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 140 }}
            />
          </Box>
        </Box>

        <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
          Showing {filtered.length} of {tabTrades.length} trades
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Strategy</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Entry</TableCell>
                <TableCell align="right">Exit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">P&amp;L</TableCell>
                <TableCell align="right">P&amp;L %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No trades match the current filters
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(trade => (
                  <TableRow key={trade._id} hover
                    sx={{ borderLeft: `3px solid ${trade.status === 'OPEN' ? '#ff9800' : (trade.pnl || 0) >= 0 ? '#4caf50' : '#f44336'}` }}
                  >
                    <TableCell>
                      <Typography variant="body2">{fmtDate(trade.createdAt)}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(trade.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">{trade.tradingSymbol}</Typography>
                        {trade.intelligence?.sourceFlow === 'opportunity' && (
                          <Tooltip title={`AI Signal — Score: ${trade.intelligence.opportunityScore ?? '?'}/100 · ${trade.intelligence.matchedStrategy || 'Quick Trade'}`}>
                            <Chip label="AI" size="small" sx={{ fontSize: '0.55rem', height: 14, bgcolor: 'rgba(66,165,245,0.18)', color: '#42a5f5', cursor: 'default', px: 0.3 }} />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="caption" color="textSecondary">{trade.exchange}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={trade.strategyName || 'Manual'}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 130 }}>
                          {trade.strategyName || '—'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trade.transactionType}
                        color={trade.transactionType === 'BUY' ? 'success' : 'error'}
                        size="small" variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{trade.quantity}</TableCell>
                    <TableCell align="right">
                      {trade.entryPrice ? fmtRupee(trade.entryPrice) : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {trade.exitPrice ? fmtRupee(trade.exitPrice) : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trade.status}
                        size="small"
                        color={trade.status === 'COMPLETE' ? 'success' : trade.status === 'OPEN' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {trade.status === 'COMPLETE' && (
                        <Typography
                          variant="body2" fontWeight="bold"
                          color={(trade.pnl || 0) >= 0 ? 'success.main' : 'error.main'}
                        >
                          {fmtRupee(trade.pnl || 0)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {trade.status === 'COMPLETE' && trade.pnlPercentage !== undefined && (
                        <Chip
                          label={`${Number(trade.pnlPercentage).toFixed(2)}%`}
                          size="small"
                          color={(trade.pnlPercentage || 0) >= 0 ? 'success' : 'error'}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
