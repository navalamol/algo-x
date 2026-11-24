import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Divider,
  Button, Alert, Skeleton, Paper, List, ListItem, ListItemText,
  ListItemIcon, Tooltip
} from '@mui/material';
import {
  TrendingUp, TrendingDown, TrendingFlat, Search, Radar as RadarIcon,
  GridView, NotificationsActive, ArrowForward, Circle,
  LightbulbOutlined, ChangeHistory, WbSunny, AccessTime
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api.service';

function RegimeChip({ vix }) {
  if (!vix) return null;
  const { label, color } =
    vix >= 25 ? { label: 'HIGH FEAR', color: 'error' } :
    vix >= 20 ? { label: 'ELEVATED', color: 'warning' } :
    vix >= 15 ? { label: 'NORMAL', color: 'primary' } :
                { label: 'CALM', color: 'success' };
  return <Chip label={label} color={color} size="small" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} />;
}

function SectionHeader({ children }) {
  return (
    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1, letterSpacing: 1.5, fontSize: '0.68rem' }}>
      {children}
    </Typography>
  );
}

function MissionCard({ title, subtitle, icon, action, actionLabel, status, children }) {
  const navigate = useNavigate();
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>{title}</Typography>
              {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
            </Box>
          </Box>
          {status && <Chip label={status} size="small" sx={{ fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.08)' }} />}
        </Box>
        {children}
      </CardContent>
      {action && (
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate(action)} sx={{ textTransform: 'none', fontSize: '0.78rem' }}>
            {actionLabel}
          </Button>
        </Box>
      )}
    </Card>
  );
}

export default function IntelligenceHome() {
  const navigate = useNavigate();
  const [vixData, setVixData] = useState(null);
  const [briefData, setBriefData] = useState(null);
  const [briefLoading, setBriefLoading] = useState(true);
  const [scanSummary, setScanSummary] = useState(null);

  useEffect(() => {
    // VIX / market regime
    apiService.get('/market/vix')
      .then(r => { if (r.data?.vix) setVixData(r.data); })
      .catch(() => {});

    // Morning brief — not yet implemented, placeholder
    apiService.get('/morning-brief')
      .then(r => setBriefData(r.data))
      .catch(() => setBriefData(null))
      .finally(() => setBriefLoading(false));

    // Scanner — use watching endpoint for activity summary
    apiService.get('/scanner/watching')
      .then(r => setScanSummary(r.data))
      .catch(() => {});
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <WbSunny sx={{ color: 'warning.main', fontSize: '1.2rem' }} />
          <Typography variant="h5" fontWeight="bold">Market Intelligence</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <AccessTime sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">{dateStr} · {timeStr} IST</Typography>
          {vixData && (
            <>
              <Typography variant="caption" color="text.secondary">·</Typography>
              <Typography variant="caption" color="text.secondary">India VIX {vixData.vix?.toFixed(1)}</Typography>
              <RegimeChip vix={vixData.vix} />
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={2.5}>

        {/* Morning Brief */}
        <Grid item xs={12} md={6} lg={4}>
          <MissionCard
            title="Morning Brief"
            subtitle="Today's market at a glance"
            icon={<WbSunny fontSize="small" />}
            status={briefData ? 'LIVE' : 'COMING SOON'}
            action="/scanner"
            actionLabel="Open Scanner"
          >
            {briefLoading ? (
              <>
                <Skeleton height={24} sx={{ mb: 0.5 }} />
                <Skeleton height={24} width="80%" sx={{ mb: 0.5 }} />
                <Skeleton height={24} width="60%" />
              </>
            ) : briefData ? (
              <Box>
                <Typography variant="body2">{briefData.summary || 'Brief loaded.'}</Typography>
              </Box>
            ) : (
              <Box>
                <Alert severity="info" sx={{ py: 0.5, mb: 1.5, fontSize: '0.78rem' }}>
                  Morning Brief (Mission 1) is under construction. It will synthesize VIX, sector strength, top opportunities and watchlist changes into a 60-second daily summary.
                </Alert>
                {vixData && (
                  <Box display="flex" flexDirection="column" gap={0.75}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">India VIX</Typography>
                      <Box display="flex" gap={1} alignItems="center">
                        <Typography variant="body2" fontWeight="bold">{vixData.vix?.toFixed(2)}</Typography>
                        <RegimeChip vix={vixData.vix} />
                      </Box>
                    </Box>
                    <Divider />
                    <Typography variant="caption" color="text.secondary">
                      {vixData.vix >= 20
                        ? 'Elevated volatility — tighter stops, smaller positions.'
                        : vixData.vix >= 15
                        ? 'Normal market conditions.'
                        : 'Low volatility — wider stops may be appropriate.'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </MissionCard>
        </Grid>

        {/* Top Opportunities */}
        <Grid item xs={12} md={6} lg={4}>
          <MissionCard
            title="Top Opportunities"
            subtitle="Stocks ranked by multi-factor score"
            icon={<LightbulbOutlined fontSize="small" />}
            status="COMING SOON"
            action="/scanner"
            actionLabel="Run Scanner now"
          >
            <Alert severity="info" sx={{ py: 0.5, mb: 1.5, fontSize: '0.78rem' }}>
              Opportunity Ranking (Mission 2) will score stocks across Momentum, Volume, Relative Strength, Sector and VIX regime — with every point explainable.
            </Alert>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Example output:
            </Typography>
            {[
              { symbol: 'XYZ', score: 91, reason: 'Momentum ↑ · Sector outperforming · Volume 1.8×' },
              { symbol: 'ABC', score: 84, reason: 'RSI recovery · VWAP reclaim · Buyer imbalance' },
              { symbol: 'DEF', score: 76, reason: 'Trend intact · Volume confirming · Low ATR' },
            ].map(item => (
              <Box key={item.symbol} display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.75}
                sx={{ opacity: 0.5, cursor: 'default' }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold" display="inline">{item.symbol}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">{item.reason}</Typography>
                </Box>
                <Chip label={item.score} size="small" color="primary" sx={{ fontSize: '0.72rem', minWidth: 36 }} />
              </Box>
            ))}
            <Typography variant="caption" color="text.disabled" fontStyle="italic">↑ Illustrative only</Typography>
          </MissionCard>
        </Grid>

        {/* What Changed */}
        <Grid item xs={12} md={6} lg={4}>
          <MissionCard
            title="What Changed"
            subtitle="Portfolio & watchlist updates"
            icon={<ChangeHistory fontSize="small" />}
            status="COMING SOON"
            action="/alerts"
            actionLabel="Manage Alerts"
          >
            <Alert severity="info" sx={{ py: 0.5, mb: 1.5, fontSize: '0.78rem' }}>
              Change Detection (Mission 4) will notify you when momentum, volume or sector strength shifts meaningfully — without you polling each stock.
            </Alert>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Example output:
            </Typography>
            {[
              { symbol: 'XYZ', change: 'Momentum ↑  Sector strength ↑', dir: 'up' },
              { symbol: 'ABC', change: 'Relative strength ↓  Selling vol ↑', dir: 'down' },
              { symbol: 'DEF', change: 'Technical breakdown  Risk ↑', dir: 'down' },
            ].map(item => (
              <Box key={item.symbol} display="flex" alignItems="flex-start" gap={1} mb={0.75} sx={{ opacity: 0.5 }}>
                {item.dir === 'up'
                  ? <TrendingUp sx={{ color: 'success.main', mt: 0.2, fontSize: '1rem', flexShrink: 0 }} />
                  : <TrendingDown sx={{ color: 'error.main', mt: 0.2, fontSize: '1rem', flexShrink: 0 }} />}
                <Box>
                  <Typography variant="body2" fontWeight="bold">{item.symbol}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.change}</Typography>
                </Box>
              </Box>
            ))}
            <Typography variant="caption" color="text.disabled" fontStyle="italic">↑ Illustrative only</Typography>
          </MissionCard>
        </Grid>

        {/* Quick access — existing tools */}
        <Grid item xs={12}>
          <SectionHeader>Advanced Tools</SectionHeader>
          <Grid container spacing={1.5}>
            {[
              { label: 'Scanner', desc: 'Template-based stock scans', icon: <Search fontSize="small" />, path: '/scanner' },
              { label: 'Order Radar', desc: 'Real-time buyer/seller imbalance', icon: <RadarIcon fontSize="small" />, path: '/radar' },
              { label: 'Sector Heatmap', desc: 'Sector performance grid', icon: <GridView fontSize="small" />, path: '/heatmap' },
              { label: 'Strategies', desc: 'Strategy builder & paper trading', icon: <TrendingUp fontSize="small" />, path: '/strategies' },
              { label: 'Backtest', desc: 'Strategy simulation (synthetic data)', icon: <TrendingFlat fontSize="small" />, path: '/backtest' },
              { label: 'Alerts', desc: 'Price & indicator watches', icon: <NotificationsActive fontSize="small" />, path: '/alerts' },
            ].map(item => (
              <Grid item xs={6} sm={4} md={2} key={item.label}>
                <Paper
                  onClick={() => navigate(item.path)}
                  sx={{
                    p: 1.5, cursor: 'pointer', textAlign: 'center',
                    '&:hover': { bgcolor: 'action.hover' }, transition: 'background 0.15s'
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 0.5 }}>{item.icon}</Box>
                  <Typography variant="caption" fontWeight="bold" display="block">{item.label}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{item.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Product journey */}
        <Grid item xs={12}>
          <SectionHeader>Building Towards</SectionHeader>
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            {[
              { label: 'Morning Brief', done: false, next: true },
              { label: 'Opportunity Ranking', done: false },
              { label: 'Why This Stock', done: false },
              { label: 'What Changed', done: false },
              { label: 'Historical Backtesting', done: false },
              { label: 'Portfolio Intelligence', done: false },
            ].map((m, i) => (
              <React.Fragment key={m.label}>
                {i > 0 && <Typography color="text.disabled">→</Typography>}
                <Chip
                  label={m.label}
                  size="small"
                  variant={m.next ? 'filled' : 'outlined'}
                  color={m.next ? 'primary' : 'default'}
                  sx={{ fontSize: '0.68rem', opacity: m.next ? 1 : 0.5 }}
                />
              </React.Fragment>
            ))}
          </Box>
        </Grid>

      </Grid>
    </Box>
  );
}
