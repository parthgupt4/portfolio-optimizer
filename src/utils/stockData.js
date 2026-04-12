import axios from 'axios';

// CORS proxies for Yahoo Finance
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

/**
 * Fetch historical daily close prices from Yahoo Finance via a CORS proxy.
 * Returns { ticker, prices: number[], dates: string[] }
 */
export async function fetchHistoricalPrices(ticker, period1, period2) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${Math.floor(period1 / 1000)}&period2=${Math.floor(period2 / 1000)}&interval=1d&events=history`;

  let lastError;
  for (const proxy of CORS_PROXIES) {
    try {
      const resp = await axios.get(`${proxy}${encodeURIComponent(url)}`, {
        timeout: 15000,
      });
      const data = resp.data;
      const result = data?.chart?.result?.[0];
      if (!result) throw new Error('No data returned');

      const timestamps = result.timestamp || [];
      const closes = result.indicators?.quote?.[0]?.close || [];
      const adjClose = result.indicators?.adjclose?.[0]?.adjclose || closes;

      const prices = [];
      const dates = [];
      for (let i = 0; i < timestamps.length; i++) {
        const price = adjClose[i] ?? closes[i];
        if (price != null && !isNaN(price)) {
          prices.push(price);
          dates.push(new Date(timestamps[i] * 1000).toISOString().slice(0, 10));
        }
      }

      if (prices.length < 30) throw new Error('Insufficient price data');
      return { ticker, prices, dates };
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`Failed to fetch data for ${ticker}: ${lastError?.message}`);
}

/**
 * Validate that a ticker exists by trying to fetch a small quote
 */
export async function validateTicker(ticker) {
  const end = Date.now();
  const start = end - 30 * 24 * 60 * 60 * 1000; // 30 days
  try {
    const result = await fetchHistoricalPrices(ticker, start, end);
    return result.prices.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get date range timestamps based on the selected time range label
 */
export function getDateRange(range) {
  const end = Date.now();
  const yearsMap = { '1Y': 1, '3Y': 3, '5Y': 5 };
  const years = yearsMap[range] || 3;
  const start = end - years * 365.25 * 24 * 60 * 60 * 1000;
  return { period1: start, period2: end };
}

/**
 * Align multiple price series to the same dates (inner join)
 * Returns { tickers, alignedPrices: number[][] }
 */
export function alignPriceSeries(priceDataArray) {
  if (priceDataArray.length === 0) return { tickers: [], alignedPrices: [] };

  // Build sets of dates per ticker
  const dateSets = priceDataArray.map(d => new Set(d.dates));

  // Intersection of all date sets
  const commonDates = [...dateSets[0]].filter(date =>
    dateSets.every(s => s.has(date))
  ).sort();

  const tickers = priceDataArray.map(d => d.ticker);
  const alignedPrices = priceDataArray.map(d => {
    const dateIdx = {};
    d.dates.forEach((date, i) => { dateIdx[date] = i; });
    return commonDates.map(date => d.prices[dateIdx[date]]);
  });

  return { tickers, alignedPrices };
}
