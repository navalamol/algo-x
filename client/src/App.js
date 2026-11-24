import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Chip,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShowChart,
  TrendingUp,
  History,
  Settings as SettingsIcon,
  Radar as RadarIcon,
  Search as SearchIcon,
  GridView,
  NotificationsActive,
  MenuBook as MenuBookIcon,
  Science as ScienceIcon,
  Home as HomeIcon,
  LightbulbOutlined,
  ChangeHistory
} from '@mui/icons-material';
import { ListSubheader } from '@mui/material';

import IntelligenceHome from './components/IntelligenceHome/IntelligenceHome';
import Dashboard from './components/Dashboard/Dashboard';
import StockFilter from './components/StockFilter/StockFilter';
import StrategyBuilder from './components/StrategyBuilder/StrategyBuilder';
import TradeHistory from './components/TradeHistory/TradeHistory';
import Settings from './components/Settings/Settings';
import RadarDashboard from './components/RadarDashboard/RadarDashboard';
import StockScanner from './components/StockScanner/StockScanner';
import SectorHeatmap from './components/Heatmap/SectorHeatmap';
import AlertManager from './components/AlertManager/AlertManager';
import TradeJournal from './components/TradeJournal/TradeJournal';
import Backtest from './components/Backtest/Backtest';
import socketService from './services/socket.service';
import apiService from './services/api.service';

const drawerWidth = 240;

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
  },
});

function App() {
  const [tickerStatus, setTickerStatus] = useState('disconnected');
  const [vixData, setVixData] = useState(null); // { vix, condition }
  const [demoMode, setDemoMode] = useState(() => {
    // Optimistic local state from localStorage while we confirm with server
    return localStorage.getItem('demoMode') === 'true';
  });

  useEffect(() => {
    socketService.connect();
    socketService.on('ticker:connected', () => setTickerStatus('connected'));
    socketService.on('ticker:disconnected', () => setTickerStatus('disconnected'));
    socketService.on('ticker:error', () => setTickerStatus('error'));
    socketService.on('vix_update', (data) => setVixData(data));

    fetch('/api/market/vix').then(r => r.json()).then(d => {
      if (d.vix) setVixData({ vix: d.vix, condition: d.condition });
    }).catch(() => {});

    // Sync demo mode state from server on mount
    apiService.getDemoMode()
      .then(res => {
        const serverEnabled = res.data.enabled;
        setDemoMode(serverEnabled);
        localStorage.setItem('demoMode', serverEnabled);
      })
      .catch(() => {});

    // Browser notifications for scanner matches
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    socketService.on('scanner:new_match', (match) => {
      if (Notification.permission === 'granted') {
        new Notification(`📡 Scanner: ${match.symbol}`, {
          body: `${match.templateName} — RSI ${match.rsi?.toFixed(1) ?? '—'} | Vol ${match.volumeVsAvg?.toFixed(1) ?? '—'}×`,
          icon: '/favicon.ico',
          tag: `scanner-${match.symbol}`,
        });
      }
    });

    return () => { socketService.disconnect(); };
  }, []);

  const toggleDemoMode = async () => {
    const next = !demoMode;
    try {
      await apiService.setDemoMode(next);
      setDemoMode(next);
      localStorage.setItem('demoMode', next);
      // Reload the page so all components re-fetch with the new mode
      window.location.reload();
    } catch (err) {
      console.error('Failed to toggle demo mode:', err);
    }
  };

  const navSections = [
    {
      items: [
        { text: 'Home', icon: <HomeIcon />, path: '/' },
      ]
    },
    {
      header: 'Intelligence',
      items: [
        { text: 'Opportunities', icon: <LightbulbOutlined />, path: '/', soon: true },
        { text: 'What Changed', icon: <ChangeHistory />, path: '/', soon: true },
      ]
    },
    {
      header: 'Market',
      items: [
        { text: 'Scanner', icon: <SearchIcon />, path: '/scanner' },
        { text: 'Order Radar', icon: <RadarIcon />, path: '/radar' },
        { text: 'Sector Heatmap', icon: <GridView />, path: '/heatmap' },
        { text: 'Stock Filter', icon: <ShowChart />, path: '/filter' },
      ]
    },
    {
      header: 'Trading',
      items: [
        { text: 'Strategies', icon: <TrendingUp />, path: '/strategies' },
        { text: 'Backtest', icon: <ScienceIcon />, path: '/backtest' },
        { text: 'Trade Journal', icon: <MenuBookIcon />, path: '/journal' },
        { text: 'Trade History', icon: <History />, path: '/trades' },
        { text: 'Alerts', icon: <NotificationsActive />, path: '/alerts' },
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      ]
    },
    {
      items: [
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
      ]
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: 0.5 }}>
                Algo-X
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title={demoMode ? 'Demo mode ON — using mock data. Click to switch to live.' : 'Live mode — click to enable mock/demo data.'}>
                  <Chip
                    label={demoMode ? '⚡ DEMO' : 'LIVE'}
                    size="small"
                    onClick={toggleDemoMode}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: demoMode ? 'warning.dark' : 'transparent',
                      border: demoMode ? 'none' : '1px solid rgba(255,255,255,0.3)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.72rem',
                      '&:hover': { opacity: 0.85 }
                    }}
                  />
                </Tooltip>
                {vixData && (
                  <Tooltip title={`India VIX — ${vixData.condition || 'NORMAL'}`}>
                    <Chip
                      label={`VIX ${vixData.vix?.toFixed(1) ?? '—'}`}
                      size="small"
                      sx={{
                        bgcolor: vixData.vix >= 25
                          ? 'error.dark'
                          : vixData.vix >= 20
                          ? 'warning.dark'
                          : vixData.vix >= 15
                          ? '#1565c0'
                          : 'success.dark',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }}
                    />
                  </Tooltip>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: tickerStatus === 'connected' ? 'success.main' : 'error.main'
                    }}
                  />
                  <Typography variant="body2">
                    {tickerStatus === 'connected' ? 'Live' : 'Disconnected'}
                  </Typography>
                </Box>
              </Box>
            </Toolbar>
          </AppBar>

          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List dense>
                {navSections.map((section, si) => (
                  <React.Fragment key={si}>
                    {section.header && (
                      <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '28px', fontSize: '0.65rem', letterSpacing: 1.2, mt: si > 0 ? 0.5 : 0 }}>
                        {section.header}
                      </ListSubheader>
                    )}
                    {section.items.map((item) => (
                      <ListItem key={item.text} disablePadding>
                        <ListItemButton
                          component={item.soon ? 'div' : Link}
                          to={item.soon ? undefined : item.path}
                          disabled={item.soon}
                          sx={{ opacity: item.soon ? 0.45 : 1, py: 0.6 }}
                        >
                          <ListItemIcon sx={{ minWidth: 36, '& svg': { fontSize: '1.1rem' } }}>{item.icon}</ListItemIcon>
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{ fontSize: '0.85rem' }}
                          />
                          {item.soon && (
                            <Chip label="soon" size="small" sx={{ fontSize: '0.6rem', height: 16, px: 0 }} />
                          )}
                        </ListItemButton>
                      </ListItem>
                    ))}
                    {si < navSections.length - 1 && <Divider sx={{ my: 0.5 }} />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </Drawer>

          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            <Container maxWidth="xl">
              <Routes>
                <Route path="/" element={<IntelligenceHome />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/filter" element={<StockFilter />} />
                <Route path="/strategies" element={<StrategyBuilder />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/trades" element={<TradeHistory />} />
                <Route path="/radar" element={<RadarDashboard />} />
                <Route path="/scanner" element={<StockScanner />} />
                <Route path="/heatmap" element={<SectorHeatmap />} />
                <Route path="/alerts" element={<AlertManager />} />
                <Route path="/journal" element={<TradeJournal />} />
                <Route path="/backtest" element={<Backtest />} />
              </Routes>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
