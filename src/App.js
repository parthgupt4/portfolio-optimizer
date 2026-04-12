import React, { useState } from 'react';
import './App.css';
import InputPanel from './components/InputPanel';
import ResultsPanel from './components/ResultsPanel';
import {
  logReturns, mean, covMatrix, monteCarloSimulation,
  extractSpecialPortfolios, buildEfficientFrontier,
  sharpe,
} from './utils/financeUtils';
import { fetchHistoricalPrices, getDateRange, alignPriceSeries } from './utils/stockData';

const RISK_PROFILE_KEY_MAP = {
  safe: 'minVar',
  hopeful: 'maxSharpe',
  risky: 'maxReturn',
};

export default function App() {
  const [view, setView] = useState('input'); // 'input' | 'results' | 'error'
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState(null);
  // Preserves form state across back-navigation; null = fresh defaults
  const [savedInputState, setSavedInputState] = useState(null);

  async function handleOptimize(config, inputState) {
    setIsLoading(true);
    setLoadingStatus('Starting…');
    setErrorMsg('');
    // Save the raw form state so back-navigation restores it
    setSavedInputState(inputState);

    try {
      const { tickers, investment, timeRange, riskProfile } = config;
      const { period1, period2 } = getDateRange(timeRange);

      // Fetch all tickers + SPY for benchmark
      const tickersToFetch = [...new Set([...tickers, 'SPY'])];
      let priceDataArray;
      try {
        // Fetch sequentially so status messages are readable one at a time
        priceDataArray = [];
        for (const t of tickersToFetch) {
          const data = await fetchHistoricalPrices(t, period1, period2, setLoadingStatus);
          priceDataArray.push(data);
        }
      } catch (err) {
        throw new Error(`Data fetch failed: ${err.message}`);
      }

      // Align price series by shared trading dates
      const portfolioData = priceDataArray.filter(d => tickers.includes(d.ticker));
      const spyData = priceDataArray.find(d => d.ticker === 'SPY');
      const { tickers: alignedTickers, alignedPrices } = alignPriceSeries(portfolioData);

      if (!alignedPrices[0] || alignedPrices[0].length < 30) {
        throw new Error('Not enough overlapping trading days. Try a broader time range or different assets.');
      }

      // Compute log returns, mean returns, and covariance matrix
      const returnsMatrix = alignedPrices.map(prices => logReturns(prices));
      const meanReturns = returnsMatrix.map(r => mean(r));
      const covMat = covMatrix(returnsMatrix);

      // Monte Carlo simulation — 2000 random portfolios
      const portfolios = monteCarloSimulation(meanReturns, covMat, alignedTickers, 2000);

      // Extract special portfolios and build frontier
      const special = extractSpecialPortfolios(portfolios);
      const frontier = buildEfficientFrontier(portfolios, 60);

      // Get selected portfolio based on risk profile
      const selectedPortfolio = { ...special[RISK_PROFILE_KEY_MAP[riskProfile]] };
      selectedPortfolio.weights = alignedTickers.map(t => selectedPortfolio.allocation[t] || 0);

      // Compute SPY benchmark stats
      let spyStats = null;
      if (spyData) {
        const spyReturns = logReturns(spyData.prices);
        const spyMean = mean(spyReturns);
        const spyRet = spyMean * 252;
        const spyVol = Math.sqrt(
          spyReturns.reduce((s, v) => s + (v - spyMean) ** 2, 0) / (spyReturns.length - 1) * 252
        );
        spyStats = { ret: spyRet, vol: spyVol, sharpeRatio: sharpe(spyRet, spyVol) };
      }

      setLoadingStatus('Done!');
      setResults({ portfolios, frontier, special, selectedPortfolio, tickers: alignedTickers, investment, timeRange, riskProfile, spyStats });
      setView('results');
    } catch (err) {
      setErrorMsg(err.message || 'An unknown error occurred');
      setView('error');
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  }

  // Back button — go to input, restore previous form state
  function handleBack() {
    setView('input');
    setErrorMsg('');
  }

  // Logo click — full reset, clear saved state
  function handleLogoReset() {
    setSavedInputState(null);
    setResults(null);
    setErrorMsg('');
    setView('input');
  }

  return (
    <div className="app-root">
      {(view === 'input' || view === 'error') && (
        <>
          <InputPanel
            onOptimize={handleOptimize}
            isLoading={isLoading}
            loadingStatus={loadingStatus}
            savedState={savedInputState}
            onLogoReset={handleLogoReset}
          />
          {view === 'error' && (
            <div className="error-banner">
              <span className="error-icon">⚠</span>
              <span>{errorMsg}</span>
              <button className="error-dismiss" onClick={() => setView('input')}>Dismiss</button>
            </div>
          )}
        </>
      )}
      {view === 'results' && results && (
        <ResultsPanel
          portfolios={results.portfolios}
          frontier={results.frontier}
          special={results.special}
          selectedPortfolio={results.selectedPortfolio}
          tickers={results.tickers}
          investment={results.investment}
          timeRange={results.timeRange}
          riskProfile={results.riskProfile}
          spyStats={results.spyStats}
          onBack={handleBack}
          onLogoReset={handleLogoReset}
        />
      )}
    </div>
  );
}
