// Financial math utilities for portfolio optimization

export const RISK_FREE_RATE = 0.05; // 5% annual

/**
 * Compute log returns from a price array
 * returns[i] = ln(price[i+1] / price[i])
 */
export function logReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0 && prices[i] > 0) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
  }
  return returns;
}

/** Arithmetic mean of an array */
export function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Sample variance */
export function variance(arr) {
  const m = mean(arr);
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
}

/** Sample standard deviation */
export function std(arr) {
  return Math.sqrt(variance(arr));
}

/** Sample covariance between two equal-length arrays */
export function covariance(a, b) {
  if (a.length !== b.length || a.length < 2) return 0;
  const ma = mean(a);
  const mb = mean(b);
  return a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0) / (a.length - 1);
}

/**
 * Build NxN covariance matrix from a 2D array of return series
 * returnsMatrix[i] = returns array for asset i
 */
export function covMatrix(returnsMatrix) {
  const n = returnsMatrix.length;
  const mat = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const cov = covariance(returnsMatrix[i], returnsMatrix[j]);
      mat[i][j] = cov;
      mat[j][i] = cov;
    }
  }
  return mat;
}

/**
 * Portfolio expected annual return given weights and mean daily returns
 */
export function portfolioReturn(weights, meanReturns) {
  const dailyReturn = weights.reduce((s, w, i) => s + w * meanReturns[i], 0);
  return dailyReturn * 252; // annualise
}

/**
 * Portfolio annual volatility given weights and covariance matrix (daily)
 */
export function portfolioVolatility(weights, covMat) {
  const n = weights.length;
  let variance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * covMat[i][j];
    }
  }
  return Math.sqrt(variance * 252); // annualise
}

/** Sharpe ratio */
export function sharpe(ret, vol) {
  if (vol === 0) return 0;
  return (ret - RISK_FREE_RATE) / vol;
}

/** Generate a random weight vector that sums to 1 (no negatives) */
export function randomWeights(n) {
  const raw = Array.from({ length: n }, () => -Math.log(Math.random()));
  const sum = raw.reduce((s, v) => s + v, 0);
  return raw.map(v => v / sum);
}

/**
 * Run Monte Carlo simulation — returns array of portfolio objects
 * Each: { weights, ret, vol, sharpeRatio }
 */
export function monteCarloSimulation(meanReturns, covMat, tickers, nSims = 2000) {
  const n = meanReturns.length;
  const portfolios = [];

  for (let s = 0; s < nSims; s++) {
    const weights = randomWeights(n);
    const ret = portfolioReturn(weights, meanReturns);
    const vol = portfolioVolatility(weights, covMat);
    const sharpeRatio = sharpe(ret, vol);
    portfolios.push({
      weights,
      ret,
      vol,
      sharpeRatio,
      allocation: tickers.reduce((obj, t, i) => ({ ...obj, [t]: weights[i] }), {}),
    });
  }

  return portfolios;
}

/**
 * Extract special portfolios from simulation results
 */
export function extractSpecialPortfolios(portfolios) {
  const minVar = portfolios.reduce((best, p) => p.vol < best.vol ? p : best, portfolios[0]);
  const maxSharpe = portfolios.reduce((best, p) => p.sharpeRatio > best.sharpeRatio ? p : best, portfolios[0]);
  const maxReturn = portfolios.reduce((best, p) => p.ret > best.ret ? p : best, portfolios[0]);
  return { minVar, maxSharpe, maxReturn };
}

/**
 * Build efficient frontier points:
 * For each volatility bucket, pick the portfolio with the highest return
 */
export function buildEfficientFrontier(portfolios, buckets = 60) {
  const vols = portfolios.map(p => p.vol);
  const minVol = Math.min(...vols);
  const maxVol = Math.max(...vols);
  const step = (maxVol - minVol) / buckets;

  const frontier = [];
  for (let b = 0; b < buckets; b++) {
    const lo = minVol + b * step;
    const hi = lo + step;
    const inBucket = portfolios.filter(p => p.vol >= lo && p.vol < hi);
    if (inBucket.length > 0) {
      const best = inBucket.reduce((a, c) => c.ret > a.ret ? c : a, inBucket[0]);
      frontier.push(best);
    }
  }
  return frontier.sort((a, b) => a.vol - b.vol);
}

/** Format percent */
export function fmtPct(v, decimals = 2) {
  return (v * 100).toFixed(decimals) + '%';
}

/** Format dollar */
export function fmtDollar(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}
