// Symbol -> Sector lookup (Nifty 50 + key mid-caps)
const SECTOR_MAP = {
  // IT
  TCS: 'IT', INFY: 'IT', WIPRO: 'IT', HCLTECH: 'IT', TECHM: 'IT',
  LTIM: 'IT', MPHASIS: 'IT', COFORGE: 'IT', PERSISTENT: 'IT',
  // Banking & Finance
  HDFCBANK: 'Banking', ICICIBANK: 'Banking', SBIN: 'Banking',
  AXISBANK: 'Banking', KOTAKBANK: 'Banking', INDUSINDBK: 'Banking',
  BANKBARODA: 'Banking', PNB: 'Banking', FEDERALBNK: 'Banking',
  HDFC: 'Finance', BAJFINANCE: 'Finance', BAJAJFINSV: 'Finance',
  // Pharma
  SUNPHARMA: 'Pharma', DRREDDY: 'Pharma', CIPLA: 'Pharma',
  DIVISLAB: 'Pharma', BIOCON: 'Pharma', ALKEM: 'Pharma',
  // Auto
  MARUTI: 'Auto', TATAMOTORS: 'Auto', 'BAJAJ-AUTO': 'Auto',
  HEROMOTOCO: 'Auto', EICHERMOT: 'Auto', M_M: 'Auto', TVSMOTORS: 'Auto',
  // FMCG
  HINDUNILVR: 'FMCG', ITC: 'FMCG', NESTLEIND: 'FMCG',
  BRITANNIA: 'FMCG', DABUR: 'FMCG', MARICO: 'FMCG', GODREJCP: 'FMCG',
  // Metals
  TATASTEEL: 'Metals', JSWSTEEL: 'Metals', HINDALCO: 'Metals',
  VEDL: 'Metals', SAIL: 'Metals', NMDC: 'Metals', COALINDIA: 'Metals',
  // Energy
  RELIANCE: 'Energy', ONGC: 'Energy', BPCL: 'Energy',
  IOC: 'Energy', NTPC: 'Energy', POWERGRID: 'Energy', TATAPOWER: 'Energy',
  // Realty
  DLF: 'Realty', GODREJPROP: 'Realty', OBEROIRLTY: 'Realty',
  PRESTIGE: 'Realty', BRIGADE: 'Realty',
  // Cement
  ULTRACEMCO: 'Cement', SHREECEM: 'Cement', ACC: 'Cement', AMBUJACEM: 'Cement',
  // Telecom
  BHARTIARTL: 'Telecom',
  // Consumer
  TITAN: 'Consumer', ASIANPAINT: 'Consumer', PIDILITIND: 'Consumer',
};

// Reverse map: sector -> [symbols]
const SECTORS = {};
for (const [sym, sector] of Object.entries(SECTOR_MAP)) {
  if (!SECTORS[sector]) SECTORS[sector] = [];
  SECTORS[sector].push(sym);
}

module.exports = { SECTOR_MAP, SECTORS };
