import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp,
  TrendingDown,
  FilterList,
  Visibility as WatchIcon,
  VisibilityOff as StopWatchIcon,
  NotificationsActive
} from '@mui/icons-material';
import socketService from '../../services/socket.service';
import apiService from '../../services/api.service';

export default function StockScanner() {
  const [templates, setTemplates] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanInfo, setLastScanInfo] = useState(null);
  const [watching, setWatching] = useState(new Set());        // Set of watched templateIds
  const [newMatches, setNewMatches] = useState([]);           // recent new-match notifications
  const [snackbar, setSnackbar] = useState(null);             // { message, severity }

  const loadWatching = useCallback(() => {
    apiService.get('/scanner/watching').then(res => {
      if (res.data.success) {
        setWatching(new Set(res.data.data.map(w => w.templateId)));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    apiService.get('/scanner/templates').then(res => {
      if (res.data.success) setTemplates(res.data.data);
    }).catch(() => {});

    loadWatching();

    socketService.on('scanner_results', (data) => {
      setResults(data.results || []);
      setLastScanInfo({ templateName: data.templateName, count: data.count, time: new Date() });
      setLoading(false);
    });

    socketService.on('scanner:new_match', (data) => {
      setNewMatches(prev => [data, ...prev].slice(0, 20));
      setSnackbar({
        message: `🔍 ${data.symbol} matched ${data.templateName}`,
        severity: 'info'
      });
    });

    return () => {
      socketService.off('scanner_results');
      socketService.off('scanner:new_match');
    };
  }, [loadWatching]);

  const toggleWatch = async (templateId, e) => {
    e.stopPropagation();
    try {
      if (watching.has(templateId)) {
        await apiService.delete(`/scanner/watch/${templateId}`);
        setWatching(prev => { const s = new Set(prev); s.delete(templateId); return s; });
        setSnackbar({ message: 'Watch stopped', severity: 'default' });
      } else {
        await apiService.post(`/scanner/watch/${templateId}`);
        setWatching(prev => new Set([...prev, templateId]));
        setSnackbar({ message: '👁 Watching — you\'ll be notified of new matches', severity: 'success' });
      }
    } catch (e) {
      setSnackbar({ message: 'Watch toggle failed', severity: 'error' });
    }
  };

  const runScan = async (templateId) => {
    setSelectedTemplate(templateId);
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.post('/scanner/run', { templateId });
      if (res.data.success) {
        setResults(res.data.data);
        setLastScanInfo({ templateName: templateId, count: res.data.count, time: new Date() });
      }
    } catch (e) {
      setError('Scan failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const templateColors = {
    momentum_burst: '#4caf50',
    oversold_reversal: '#2196f3',
    volume_breakout: '#ff9800',
    vwap_reclaim: '#9c27b0',
    weak_hands_exit: '#f44336'
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SearchIcon sx={{ color: '#2196f3', fontSize: 32 }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Market Scanner
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Screen stocks across multiple conditions in real time
          </Typography>
        </Box>
      </Box>

      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
        Scan Templates
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {templates.map((t) => (
          <Grid item xs={12} sm={6} md={4} key={t.id}>
            <Card
              sx={{
                border: selectedTemplate === t.id ? `2px solid ${templateColors[t.id] || '#fff'}` : '1px solid transparent',
                cursor: 'pointer',
                '&:hover': { borderColor: templateColors[t.id] || '#fff' }
              }}
            >
              <CardActionArea onClick={() => runScan(t.id)} disabled={loading}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FilterList sx={{ color: templateColors[t.id] || '#fff', fontSize: 20 }} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        {t.name}
                      </Typography>
                    </Box>
                    <Tooltip title={watching.has(t.id) ? 'Stop watching' : 'Watch for new matches'}>
                      <IconButton
                        size="small"
                        onClick={(e) => toggleWatch(t.id, e)}
                        sx={{ color: watching.has(t.id) ? '#4caf50' : 'text.secondary' }}
                      >
                        {watching.has(t.id) ? <WatchIcon fontSize="small" /> : <StopWatchIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {t.description}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {t.conditions.map((c, i) => (
                      <Chip
                        key={i}
                        label={`${c.indicator} ${c.operator} ${c.value}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem' }}
                      />
                    ))}
                  </Box>
                  {watching.has(t.id) && (
                    <Chip
                      icon={<NotificationsActive sx={{ fontSize: '14px !important' }} />}
                      label="Watching"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ mt: 1, fontSize: '0.65rem' }}
                    />
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {newMatches.length > 0 && (
        <Card sx={{ mb: 2, border: '1px solid #4caf50' }}>
          <CardContent sx={{ pb: '12px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <NotificationsActive sx={{ color: '#4caf50', fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                New Matches ({newMatches.length})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {newMatches.slice(0, 10).map((m, i) => (
                <Chip
                  key={i}
                  label={`${m.symbol} — ${m.templateName}`}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', animation: i === 0 ? 'pulse 1s ease-out' : 'none' }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Scanning…</Typography>
        </Box>
      )}

      {lastScanInfo && !loading && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={`${lastScanInfo.count} match${lastScanInfo.count !== 1 ? 'es' : ''}`}
            color={lastScanInfo.count > 0 ? 'success' : 'default'}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            Scanned at {lastScanInfo.time.toLocaleTimeString()}
          </Typography>
          {selectedTemplate && (
            <Button size="small" onClick={() => runScan(selectedTemplate)}>
              Rescan
            </Button>
          )}
        </Box>
      )}

      {results.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell align="right">Price (₹)</TableCell>
                <TableCell align="right">Change %</TableCell>
                <TableCell align="right">Volume</TableCell>
                <TableCell align="right">RSI</TableCell>
                <TableCell align="right">VWAP (₹)</TableCell>
                <TableCell align="right">Buy/Sell Ratio</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((stock) => (
                <TableRow key={stock.symbol} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {stock.change >= 0
                        ? <TrendingUp sx={{ color: '#4caf50', fontSize: 16 }} />
                        : <TrendingDown sx={{ color: '#f44336', fontSize: 16 }} />}
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{stock.symbol}</Typography>
                        <Typography variant="caption" color="text.secondary">{stock.exchange}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    ₹{stock.price.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${stock.change >= 0 ? '+' : ''}${stock.change}%`}
                      size="small"
                      sx={{
                        bgcolor: stock.change >= 0 ? 'success.dark' : 'error.dark',
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {(stock.volume || 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="right">
                    {stock.rsi !== null ? (
                      <Chip
                        label={stock.rsi}
                        size="small"
                        sx={{
                          bgcolor: stock.rsi > 70 ? 'error.dark' : stock.rsi < 30 ? 'success.dark' : 'grey.700',
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                    ) : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {stock.vwap ? `₹${stock.vwap.toLocaleString('en-IN')}` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {stock.buyerRatio ? (
                      <Typography
                        variant="body2"
                        sx={{ color: stock.buyerRatio >= 1 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}
                      >
                        {stock.buyerRatio.toFixed(2)}x
                      </Typography>
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && results.length === 0 && selectedTemplate && (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <Typography color="text.secondary">
              No stocks matched this scan at the moment. Try again in a few seconds.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(null)}
          severity={snackbar?.severity === 'default' ? 'info' : (snackbar?.severity || 'info')}
          sx={{ width: '100%' }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
