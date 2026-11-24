import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Divider,
} from '@mui/material';
import { Refresh, Analytics } from '@mui/icons-material';
import apiService from '../services/api';

const SAMPLE_COLORS = {
  'Strong personal dataset':          '#4caf50',
  'Meaningful personal evidence':     '#66bb6a',
  'Useful directional evidence':      '#ffa726',
  'Early evidence':                   '#ff7043',
  'Very low sample — directional only': '#ef5350',
  'No data yet':                      '#757575',
};

function SampleBadge({ label }) {
  const color = SAMPLE_COLORS[label] || '#757575';
  return (
    <Chip
      label={label}
      size="small"
      sx={{ fontSize: '0.62rem', height: 18, bgcolor: color + '22', color, border: `1px solid ${color}44` }}
    />
  );
}

function StatTile({ label, value, sub }) {
  return (
    <Card variant="outlined" sx={{ textAlign: 'center', p: 1.5 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{value ?? '—'}</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{label}</Typography>
      {sub && <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>{sub}</Typography>}
    </Card>
  );
}

function MetricRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>{value ?? '—'}</Typography>
    </Box>
  );
}

function TradeGroupCard({ title, data, accent }) {
  if (!data) return null;
  const pnlColor = data.totalPnl > 0 ? '#4caf50' : data.totalPnl < 0 ? '#ef5350' : 'text.primary';
  return (
    <Card variant="outlined" sx={{ height: '100%', borderColor: accent + '55' }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="subtitle2" sx={{ color: accent, fontWeight: 700, mb: 1 }}>{title}</Typography>
        <SampleBadge label={data.sampleLabel} />
        <Divider sx={{ my: 1 }} />
        <MetricRow label="Completed Trades" value={data.count} />
        <MetricRow label="Win Rate" value={data.winRate != null ? `${data.winRate}%` : null} />
        <MetricRow label="Avg P&L / trade" value={data.avgPnl != null ? `₹${data.avgPnl.toFixed(2)}` : null} />
        <MetricRow
          label="Total P&L"
          value={data.totalPnl != null
            ? <Typography component="span" variant="caption" sx={{ fontWeight: 700, color: pnlColor }}>₹{data.totalPnl.toFixed(2)}</Typography>
            : null}
        />
        <MetricRow label="Profit Factor" value={data.profitFactor != null ? data.profitFactor : null} />
        <MetricRow label="Avg R:R" value={data.avgRR != null ? `${data.avgRR}:1` : null} />
        {data.openCount > 0 && (
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', mt: 0.5, display: 'block' }}>
            + {data.openCount} open trade{data.openCount > 1 ? 's' : ''} (excluded)
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function insightText(data) {
  const { intelTrades, manualTrades, scoreBands } = data;
  if (!intelTrades || intelTrades.count === 0) {
    return 'No intelligence-sourced trades yet. Place paper trades via Opportunities → Paper Trade to start building evidence.';
  }
  const topBand = scoreBands.find(b => b.band === '75+');
  if (intelTrades.count < 10) {
    return `Only ${intelTrades.count} intelligence trade${intelTrades.count > 1 ? 's' : ''} so far. Keep trading — meaningful patterns emerge around 20+ trades. Early directional signal: ${intelTrades.winRate ?? '—'}% win rate.`;
  }
  if (topBand && topBand.count >= 2 && intelTrades.winRate != null) {
    const diff = topBand.winRate != null ? topBand.winRate - intelTrades.winRate : null;
    if (diff != null && diff > 5) {
      return `High-score trades (75+) show ${topBand.winRate}% win rate vs ${intelTrades.winRate}% overall — the score appears to have predictive value. Keep accumulating data.`;
    }
  }
  if (manualTrades.count > 0 && intelTrades.winRate != null && manualTrades.winRate != null) {
    const diff = intelTrades.winRate - manualTrades.winRate;
    if (diff > 10) return `Intelligence trades outperform manual by ${diff}pp win rate (${intelTrades.winRate}% vs ${manualTrades.winRate}%). Early signal that the intelligence layer adds value.`;
    if (diff < -10) return `Manual trades currently outperform intelligence trades (${manualTrades.winRate}% vs ${intelTrades.winRate}% win rate). Review the opportunity scoring model.`;
    return `Intelligence and manual trades show similar win rates (${intelTrades.winRate}% vs ${manualTrades.winRate}%). Need more data to draw conclusions — target 20+ trades per group.`;
  }
  return `${intelTrades.count} intelligence trades recorded. Win rate: ${intelTrades.winRate ?? '—'}%. Continue trading to build a meaningful sample.`;
}

export default function Attribution() {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [data,    setData]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.get('/attribution?profile=amol');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load attribution data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button size="small" onClick={load}>Retry</Button>}>{error}</Alert>
      </Box>
    );
  }

  if (!data) return null;

  const { intelTrades, manualTrades, scoreBands, dataSource, totalTrades } = data;
  const isDemoData = dataSource === 'SYNTHETIC_DEMO';

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Analytics sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Performance Attribution</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Does Algo-X intelligence actually improve outcomes?
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={isDemoData ? 'SYNTHETIC DEMO' : 'LIVE DATA'}
            size="small"
            sx={{
              bgcolor: isDemoData ? '#ff980022' : '#4caf5022',
              color: isDemoData ? '#ff9800' : '#4caf50',
              border: `1px solid ${isDemoData ? '#ff980044' : '#4caf5044'}`,
              fontWeight: 700, fontSize: '0.65rem',
            }}
          />
          <Button size="small" startIcon={<Refresh />} onClick={load} variant="outlined">Refresh</Button>
        </Box>
      </Box>

      {isDemoData && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: '0.78rem' }}>
          Showing synthetic demo data. Place real paper trades via Opportunities → Paper Trade to generate your personal evidence.
        </Alert>
      )}

      {/* Summary strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatTile label="Total Trades" value={totalTrades} sub="all time" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatTile label="Intelligence-Sourced" value={intelTrades?.count ?? 0} sub="via Opportunity flow" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatTile label="Manual Trades" value={manualTrades?.count ?? 0} sub="no intel context" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatTile
            label="Intel Win Rate"
            value={intelTrades?.winRate != null ? `${intelTrades.winRate}%` : '—'}
            sub={intelTrades?.sampleLabel}
          />
        </Grid>
      </Grid>

      {/* Comparison cards */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Intelligence vs Manual</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TradeGroupCard title="Intelligence Trades" data={intelTrades} accent="#42a5f5" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TradeGroupCard title="Manual Trades" data={manualTrades} accent="#ab47bc" />
        </Grid>
      </Grid>

      {/* Score band table */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Score-to-Outcome Analysis</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
        Does a higher Opportunity Score lead to better outcomes? (Intelligence trades only)
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Score Band</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Trades</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Win Rate</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Avg P&L</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Profit Factor</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Avg R:R</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Evidence Quality</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(scoreBands || []).map(b => (
              <TableRow key={b.band} hover>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem' }}>{b.label}</TableCell>
                <TableCell align="right" sx={{ fontSize: '0.78rem' }}>
                  {b.count > 0 ? b.count : <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '0.78rem' }}>
                  {b.count > 0 && b.winRate != null ? `${b.winRate}%` : <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '0.78rem' }}>
                  {b.count > 0 && b.avgPnl != null
                    ? <Typography component="span" variant="caption" sx={{ color: b.avgPnl >= 0 ? '#4caf50' : '#ef5350', fontWeight: 600 }}>₹{b.avgPnl.toFixed(2)}</Typography>
                    : <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '0.78rem' }}>
                  {b.count > 0 && b.profitFactor != null ? b.profitFactor : <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '0.78rem' }}>
                  {b.count > 0 && b.avgRR != null ? `${b.avgRR}:1` : <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>}
                </TableCell>
                <TableCell>
                  {b.count > 0
                    ? <SampleBadge label={b.sampleLabel} />
                    : <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>No trades yet</Typography>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Key insight */}
      <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Key Insight</Typography>
          <Typography variant="body2">{insightText(data)}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
