import axios from 'axios';

const MAX_RETRIES = 2; // retries per source (so up to 3 attempts per source total)
const TIMEOUT_MS = 15000;

// ─── Source 1: Yahoo Finance via corsproxy.io ─────────────────────────────────

async function fetchYahoo(ticker, period1Unix, period2Unix) {
  const yahooUrl =
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}` +
    `?period1=${period1Unix}&period2=${period2Unix}&interval=1d&events=history`;
  const proxied = `https://corsproxy.io/?url=${encodeURIComponent(yahooUrl)}`;

  const resp = await axios.get(proxied, { timeout: TIMEOUT_MS });
  const result = resp.data?.chart?.result?.[0];
  if (!result) throw new Error('Yahoo: empty result');

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
  if (prices.length < 30) throw new Error('Yahoo: insufficient data');
  return { ticker, prices, dates };
}

// ─── Source 2: Alpha Vantage ──────────────────────────────────────────────────

async function fetchAlphaVantage(ticker, period1Unix, period2Unix) {
  const key = process.env.REACT_APP_ALPHA_VANTAGE_KEY;
  if (!key || key === 'your_alpha_vantage_key_here') {
    throw new Error('Alpha Vantage: API key not configured');
  }

  const url =
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED` +
    `&symbol=${ticker}&outputsize=full&apikey=${key}&datatype=json`;

  const resp = await axios.get(url, { timeout: TIMEOUT_MS });
  const series = resp.data?.['Time Series (Daily)'];
  if (!series) {
    const info = resp.data?.['Information'] || resp.data?.['Note'];
    throw new Error(`Alpha Vantage: ${info || 'no data'}`);
  }

  const period1Date = new Date(period1Unix * 1000).toISOString().slice(0, 10);
  const period2Date = new Date(period2Unix * 1000).toISOString().slice(0, 10);

  const prices = [];
  const dates = [];
  // AV returns newest-first; reverse to get chronological order
  const sortedDates = Object.keys(series).sort();
  for (const date of sortedDates) {
    if (date < period1Date || date > period2Date) continue;
    const price = parseFloat(series[date]['5. adjusted close']);
    if (!isNaN(price)) {
      prices.push(price);
      dates.push(date);
    }
  }
  if (prices.length < 30) throw new Error('Alpha Vantage: insufficient data');
  return { ticker, prices, dates };
}

// ─── Source 3: Twelve Data ────────────────────────────────────────────────────

async function fetchTwelveData(ticker, period1Unix, period2Unix) {
  const key = process.env.REACT_APP_TWELVE_DATA_KEY;
  if (!key || key === 'your_twelve_data_key_here') {
    throw new Error('Twelve Data: API key not configured');
  }

  const startDate = new Date(period1Unix * 1000).toISOString().slice(0, 10);
  const endDate   = new Date(period2Unix * 1000).toISOString().slice(0, 10);

  const url =
    `https://api.twelvedata.com/time_series` +
    `?symbol=${ticker}&interval=1day&outputsize=5000` +
    `&start_date=${startDate}&end_date=${endDate}&apikey=${key}`;

  const resp = await axios.get(url, { timeout: TIMEOUT_MS });
  const values = resp.data?.values;
  if (!Array.isArray(values) || values.length === 0) {
    const msg = resp.data?.message || resp.data?.status || 'no data';
    throw new Error(`Twelve Data: ${msg}`);
  }

  // Twelve Data returns newest-first; reverse for chronological order
  const sorted = [...values].reverse();
  const prices = [];
  const dates  = [];
  for (const entry of sorted) {
    const price = parseFloat(entry.close);
    if (!isNaN(price)) {
      prices.push(price);
      dates.push(entry.datetime.slice(0, 10));
    }
  }
  if (prices.length < 30) throw new Error('Twelve Data: insufficient data');
  return { ticker, prices, dates };
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function withRetry(fn, maxRetries, label, onProgress) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      onProgress?.(`${label} — retry ${attempt}/${maxRetries}…`);
      // Small back-off: 800 ms × attempt
      await new Promise(r => setTimeout(r, 800 * attempt));
    }
    try {
      return await fn();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch historical daily close prices with a waterfall of sources.
 * Order: Yahoo Finance → Alpha Vantage → Twelve Data
 * Each source is retried up to MAX_RETRIES times before moving on.
 *
 * @param {string}   ticker
 * @param {number}   period1  - start timestamp in ms
 * @param {number}   period2  - end timestamp in ms
 * @param {Function} [onProgress] - called with a status string on each attempt
 * @returns {{ ticker, prices: number[], dates: string[] }}
 */
export async function fetchHistoricalPrices(ticker, period1, period2, onProgress) {
  const p1Unix = Math.floor(period1 / 1000);
  const p2Unix = Math.floor(period2 / 1000);

  const sources = [
    {
      name: 'Yahoo Finance',
      fn: () => fetchYahoo(ticker, p1Unix, p2Unix),
    },
    {
      name: 'Alpha Vantage',
      fn: () => fetchAlphaVantage(ticker, p1Unix, p2Unix),
    },
    {
      name: 'Twelve Data',
      fn: () => fetchTwelveData(ticker, p1Unix, p2Unix),
    },
  ];

  const errors = [];

  for (const source of sources) {
    onProgress?.(`Fetching ${ticker} via ${source.name}…`);
    try {
      const result = await withRetry(
        source.fn,
        MAX_RETRIES,
        `${ticker} / ${source.name}`,
        onProgress
      );
      return result;
    } catch (err) {
      errors.push(`${source.name}: ${err.message}`);
      // Only log fallback message if there is a next source
      const nextIdx = sources.indexOf(source) + 1;
      if (nextIdx < sources.length) {
        onProgress?.(`${ticker}: ${source.name} failed — trying ${sources[nextIdx].name}…`);
      }
    }
  }

  throw new Error(
    `Could not fetch data for ${ticker}. Tried: ${errors.join(' | ')}`
  );
}

/**
 * Get date range timestamps based on the selected time range label.
 */
export function getDateRange(range) {
  const end = Date.now();
  const yearsMap = { '1Y': 1, '3Y': 3, '5Y': 5 };
  const years = yearsMap[range] || 3;
  const start = end - years * 365.25 * 24 * 60 * 60 * 1000;
  return { period1: start, period2: end };
}

/**
 * Align multiple price series to the same dates (inner join).
 * Returns { tickers, alignedPrices: number[][] }
 */
export function alignPriceSeries(priceDataArray) {
  if (priceDataArray.length === 0) return { tickers: [], alignedPrices: [] };

  const dateSets = priceDataArray.map(d => new Set(d.dates));
  const commonDates = [...dateSets[0]]
    .filter(date => dateSets.every(s => s.has(date)))
    .sort();

  const tickers = priceDataArray.map(d => d.ticker);
  const alignedPrices = priceDataArray.map(d => {
    const dateIdx = {};
    d.dates.forEach((date, i) => { dateIdx[date] = i; });
    return commonDates.map(date => d.prices[dateIdx[date]]);
  });

  return { tickers, alignedPrices };
}
