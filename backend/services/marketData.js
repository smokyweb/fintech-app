// Mock market data service with realistic price movements

const basePrices = {
  // Futures
  'BTC-FUT': 67500, 'ETH-FUT': 3450, 'GOLD-FUT': 2350, 'OIL-FUT': 78.50,
  // Crypto
  'BTC': 67500, 'ETH': 3450, 'SOL': 145, 'ADA': 0.45,
  // Forex
  'EUR/USD': 1.0850, 'GBP/USD': 1.2650, 'USD/JPY': 151.50, 'AUD/USD': 0.6550,
  'USD/CHF': 0.8850, 'USD/CAD': 1.3650,
};

const prices = { ...basePrices };

function getVolatility(symbol) {
  if (symbol.includes('FUT') || ['BTC', 'ETH', 'SOL', 'ADA'].includes(symbol)) return 0.002;
  return 0.0005; // Forex lower volatility
}

function updatePrices() {
  for (const [symbol, base] of Object.entries(basePrices)) {
    const vol = getVolatility(symbol);
    const change = (Math.random() - 0.5) * 2 * vol;
    prices[symbol] = +(prices[symbol] * (1 + change)).toFixed(
      symbol.includes('/') ? 4 : symbol === 'ADA' ? 4 : 2
    );
    // Mean revert if too far from base
    if (Math.abs(prices[symbol] - base) / base > 0.1) {
      prices[symbol] = +(base * (1 + (Math.random() - 0.5) * 0.02)).toFixed(
        symbol.includes('/') ? 4 : symbol === 'ADA' ? 4 : 2
      );
    }
  }
}

// Update every 10 seconds
setInterval(updatePrices, 10000);
updatePrices();

function getPrice(symbol) {
  return prices[symbol] || null;
}

function getAllPrices() {
  return { ...prices };
}

function getFuturesPrices() {
  return Object.fromEntries(Object.entries(prices).filter(([k]) => k.includes('-FUT')));
}

function getForexPrices() {
  return Object.fromEntries(Object.entries(prices).filter(([k]) => k.includes('/')));
}

function getCryptoPrices() {
  return Object.fromEntries(
    Object.entries(prices).filter(([k]) => ['BTC', 'ETH', 'SOL', 'ADA'].includes(k))
  );
}

module.exports = { getPrice, getAllPrices, getFuturesPrices, getForexPrices, getCryptoPrices, prices };
