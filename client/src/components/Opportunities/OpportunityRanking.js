import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea,
  Chip, Collapse, LinearProgress, Divider, IconButton,
  Tooltip, CircularProgress, Alert, Button, Stack
} from '@mui/material';
import {
  TrendingUp, Speed, BarChart, CompareArrows, Waves,
  ExpandMore, ExpandLess, Refresh, InfoOutlined
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
          height: 5,
          borderRadius: 2,
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

function OpportunityCard({ opp, rank }) {
  const [expanded, setExpanded] = useState(false);
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
                  variant="determinate"
                  value={opp.totalScore}
                  size={48}
                  thickness={4}
                  sx={{ color, '& circle': { strokeLinecap: 'round' } }}
                />
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={48}
                  thickness={4}
                  sx={{
                    position: 'absolute', left: 0,
                    color: 'rgba(255,255,255,0.06)',
                    '& circle': { strokeLinecap: 'round' },
                  }}
                />
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 'bold', color }}>
                    {opp.totalScore}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={scoreLabel(opp.totalScore)}
                size="small"
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
                        variant="determinate"
                        value={pct}
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
        <Box sx={{ p: 2, pt: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', mb: 1.5, display: 'block', fontSize: '0.68rem' }}>
            Score breakdown — {opp.dataPoints} price points analysed
          </Typography>
          {FACTORS.map(f => (
            <FactorBar key={f.key} factor={f} bd={opp.breakdown?.[f.key]} />
          ))}
        </Box>
      </Collapse>
    </Card>
  );
}

export default function OpportunityRanking() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
            Stocks ranked by multi-factor score — Trend · Momentum · Volume · Relative Strength · VIX
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
            <Chip
              label={`VIX ${data.vix?.toFixed(1)}`}
              size="small"
              sx={{ fontSize: '0.65rem' }}
              variant="outlined"
            />
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
        <Tooltip title="Click any card to expand the full 5-factor breakdown">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, cursor: 'help', ml: 'auto' }}>
            <InfoOutlined sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
              Click card to expand breakdown
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
