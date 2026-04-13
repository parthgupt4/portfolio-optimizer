import React, { useState, useRef, useEffect } from 'react';
import GlobeIcon from './GlobeIcon';
import UserButton from './UserButton';
import './InputPanel.css';

const DEFAULT_INDEX_FUNDS = [
  { ticker: 'SPY', name: 'S&P 500', desc: 'Tracks the 500 largest US companies' },
  { ticker: 'QQQ', name: 'Nasdaq 100', desc: 'Top 100 non-financial Nasdaq companies' },
  { ticker: 'VTI', name: 'Total US Market', desc: 'Entire US stock market, all cap sizes' },
  { ticker: 'BND', name: 'US Bond Market', desc: 'Broad US investment-grade bond exposure' },
  { ticker: 'VEA', name: 'International', desc: 'Developed markets outside North America' },
  { ticker: 'GLD', name: 'Gold', desc: 'Tracks the price of gold bullion' },
];

// Default 6 tickers — excluded from the ETF search results
const DEFAULT_INDEX_TICKERS = new Set(DEFAULT_INDEX_FUNDS.map(f => f.ticker));

// 30+ additional ETFs available via the search bar
const EXTRA_ETF_LIST = [
  { ticker: 'ARKK', name: 'ARK Innovation', desc: 'Disruptive innovation companies' },
  { ticker: 'XLF',  name: 'Financial Sector', desc: 'US financial services companies' },
  { ticker: 'XLE',  name: 'Energy Sector', desc: 'US oil, gas & energy companies' },
  { ticker: 'XLK',  name: 'Technology Sector', desc: 'US technology companies' },
  { ticker: 'XLV',  name: 'Health Care Sector', desc: 'US health care companies' },
  { ticker: 'XLI',  name: 'Industrials Sector', desc: 'US industrial companies' },
  { ticker: 'XLY',  name: 'Consumer Discret.', desc: 'US consumer discretionary' },
  { ticker: 'IWM',  name: 'Russell 2000', desc: 'Small-cap US stocks' },
  { ticker: 'EEM',  name: 'Emerging Markets', desc: 'Stocks from emerging economies' },
  { ticker: 'TLT',  name: 'Long-Term Treasuries', desc: '20+ year US Treasury bonds' },
  { ticker: 'HYG',  name: 'High Yield Bonds', desc: 'US corporate junk bonds' },
  { ticker: 'SCHD', name: 'Schwab Dividend', desc: 'High-dividend US stocks' },
  { ticker: 'VNQ',  name: 'Real Estate (REIT)', desc: 'US real estate investment trusts' },
  { ticker: 'JEPI', name: 'JP Morgan Equity Prem', desc: 'Covered call income strategy' },
  { ticker: 'QYLD', name: 'Nasdaq Covered Call', desc: 'Nasdaq covered call income' },
  { ticker: 'SOXL', name: 'Semis 3× Bull', desc: '3× leveraged semiconductor ETF' },
  { ticker: 'TQQQ', name: 'Nasdaq 3× Bull', desc: '3× leveraged Nasdaq 100 ETF' },
  { ticker: 'SPXL', name: 'S&P 500 3× Bull', desc: '3× leveraged S&P 500 ETF' },
  { ticker: 'DIA',  name: 'Dow Jones 30', desc: 'Tracks the Dow Jones Industrial Average' },
  { ticker: 'MDY',  name: 'S&P MidCap 400', desc: 'Mid-cap US stocks' },
  { ticker: 'IJR',  name: 'S&P SmallCap 600', desc: 'Small-cap US stocks' },
  { ticker: 'VIG',  name: 'Dividend Appreciation', desc: 'Stocks with growing dividends' },
  { ticker: 'IEMG', name: 'Core Emerging Markets', desc: 'Broad emerging market stocks' },
  { ticker: 'IAU',  name: 'iShares Gold Trust', desc: 'Physical gold trust' },
  { ticker: 'SLV',  name: 'Silver Trust', desc: 'Physical silver trust' },
  { ticker: 'USO',  name: 'US Oil Fund', desc: 'WTI crude oil futures' },
  { ticker: 'BITO', name: 'Bitcoin Strategy', desc: 'Bitcoin futures ETF' },
  { ticker: 'PDBC', name: 'Commodities', desc: 'Diversified commodity futures' },
  { ticker: 'VTIP', name: 'TIPS Bond', desc: 'Short-term inflation-protected bonds' },
  { ticker: 'LQD',  name: 'Investment Grade Corp', desc: 'US investment-grade corporate bonds' },
  { ticker: 'ICLN', name: 'Clean Energy', desc: 'Global clean energy companies' },
  { ticker: 'XBI',  name: 'Biotech', desc: 'US biotechnology stocks' },
];

const TIME_RANGES = [
  { label: '1 Year', value: '1Y' },
  { label: '3 Years', value: '3Y' },
  { label: '5 Years', value: '5Y' },
];

const RISK_PROFILES = [
  {
    key: 'safe',
    label: 'Safe',
    sub: 'Long Term Growth',
    desc: 'Targets the minimum variance portfolio — lowest possible volatility',
    icon: '🛡',
  },
  {
    key: 'hopeful',
    label: 'Hopeful',
    sub: 'Balanced',
    desc: 'Targets the maximum Sharpe ratio — best risk-adjusted returns',
    icon: '⚖',
  },
  {
    key: 'risky',
    label: 'Risky',
    sub: 'Big Swings',
    desc: 'Targets the maximum return portfolio — highest upside, highest volatility',
    icon: '🚀',
  },
];

// Stock autocomplete list (same as before)
const STOCK_SUGGESTIONS = [
  { ticker: 'AAPL',  name: 'Apple Inc' },
  { ticker: 'MSFT',  name: 'Microsoft Corporation' },
  { ticker: 'GOOGL', name: 'Alphabet Inc' },
  { ticker: 'AMZN',  name: 'Amazon.com Inc' },
  { ticker: 'TSLA',  name: 'Tesla Inc' },
  { ticker: 'NVDA',  name: 'NVIDIA Corporation' },
  { ticker: 'META',  name: 'Meta Platforms Inc' },
  { ticker: 'NFLX',  name: 'Netflix Inc' },
  { ticker: 'AMD',   name: 'Advanced Micro Devices' },
  { ticker: 'INTC',  name: 'Intel Corporation' },
  { ticker: 'JPM',   name: 'JPMorgan Chase & Co' },
  { ticker: 'BAC',   name: 'Bank of America Corp' },
  { ticker: 'WMT',   name: 'Walmart Inc' },
  { ticker: 'DIS',   name: 'The Walt Disney Company' },
  { ticker: 'V',     name: 'Visa Inc' },
  { ticker: 'MA',    name: 'Mastercard Incorporated' },
  { ticker: 'PYPL',  name: 'PayPal Holdings Inc' },
  { ticker: 'UBER',  name: 'Uber Technologies Inc' },
  { ticker: 'LYFT',  name: 'Lyft Inc' },
  { ticker: 'COIN',  name: 'Coinbase Global Inc' },
  { ticker: 'SPY',   name: 'SPDR S&P 500 ETF Trust' },
  { ticker: 'QQQ',   name: 'Invesco Nasdaq 100 ETF' },
  { ticker: 'VTI',   name: 'Vanguard Total Stock Market ETF' },
  { ticker: 'BND',   name: 'Vanguard Total Bond Market ETF' },
  { ticker: 'GLD',   name: 'SPDR Gold Shares' },
  { ticker: 'VEA',   name: 'Vanguard FTSE Developed Markets ETF' },
  { ticker: 'IWM',   name: 'iShares Russell 2000 ETF' },
  { ticker: 'EEM',   name: 'iShares MSCI Emerging Markets ETF' },
  { ticker: 'VNQ',   name: 'Vanguard Real Estate ETF' },
  { ticker: 'TLT',   name: 'iShares 20+ Year Treasury Bond ETF' },
  { ticker: 'BRKB',  name: 'Berkshire Hathaway Inc' },
  { ticker: 'JNJ',   name: 'Johnson & Johnson' },
  { ticker: 'PG',    name: 'Procter & Gamble Co' },
  { ticker: 'KO',    name: 'The Coca-Cola Company' },
  { ticker: 'PEP',   name: 'PepsiCo Inc' },
  { ticker: 'MCD',   name: "McDonald's Corporation" },
  { ticker: 'SBUX',  name: 'Starbucks Corporation' },
  { ticker: 'NKE',   name: 'Nike Inc' },
  { ticker: 'ADBE',  name: 'Adobe Inc' },
  { ticker: 'CRM',   name: 'Salesforce Inc' },
  { ticker: 'ORCL',  name: 'Oracle Corporation' },
  { ticker: 'IBM',   name: 'IBM Corporation' },
  { ticker: 'CSCO',  name: 'Cisco Systems Inc' },
  { ticker: 'QCOM',  name: 'Qualcomm Incorporated' },
  { ticker: 'TXN',   name: 'Texas Instruments Inc' },
  { ticker: 'AVGO',  name: 'Broadcom Inc' },
  { ticker: 'MU',    name: 'Micron Technology Inc' },
  { ticker: 'SHOP',  name: 'Shopify Inc' },
  { ticker: 'SQ',    name: 'Block Inc' },
  { ticker: 'PLTR',  name: 'Palantir Technologies Inc' },
];

function isValidFormat(ticker) {
  return /^[A-Z]{1,6}(\.[A-Z]{1,2})?$/.test(ticker);
}

function buildInitialState(savedState) {
  return {
    tickers: savedState?.tickers ?? [],
    selectedIndexes: savedState?.selectedIndexes ?? [],
    extraEtfs: savedState?.extraEtfs ?? [],       // extra ETF cards added via search
    investment: savedState?.investment ?? '',
    timeRange: savedState?.timeRange ?? '3Y',
    riskProfile: savedState?.riskProfile ?? 'hopeful',
  };
}

export default function InputPanel({
  onOptimize, isLoading, loadingStatus, savedState, onLogoReset,
  user, userDoc, onSignInClick, onSignOutClick, onHistoryClick,
  onProfileClick, onManageSubClick, onSettingsClick, theme, onThemeToggle,
}) {
  const init = buildInitialState(savedState);

  const [tickerInput, setTickerInput] = useState(init.tickers.join('') === '' ? '' : '');
  const [tickers, setTickers] = useState(init.tickers);
  const [selectedIndexes, setSelectedIndexes] = useState(init.selectedIndexes);
  // extra ETF cards: array of ticker strings (always shown as cards; toggled via selectedIndexes)
  const [extraEtfs, setExtraEtfs] = useState(init.extraEtfs);
  const [investment, setInvestment] = useState(init.investment);
  const [timeRange, setTimeRange] = useState(init.timeRange);
  const [riskProfile, setRiskProfile] = useState(init.riskProfile);
  const [tickerError, setTickerError] = useState('');
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);

  // ETF search state
  const [etfSearch, setEtfSearch] = useState('');
  const [etfDropdownOpen, setEtfDropdownOpen] = useState(false);
  const etfWrapperRef = useRef(null);
  const stockWrapperRef = useRef(null);

  const allTickers = [...tickers, ...selectedIndexes];

  // Filtered stock suggestions — match ticker prefix OR company name substring
  const filteredStocks = tickerInput.trim()
    ? STOCK_SUGGESTIONS.filter(s => {
        const query = tickerInput.trim().toUpperCase();
        const queryLower = tickerInput.trim().toLowerCase();
        return (
          !allTickers.includes(s.ticker) &&
          (s.ticker.startsWith(query) || s.name.toLowerCase().includes(queryLower))
        );
      })
    : [];

  // Filtered ETF suggestions — exclude defaults and already-added extras
  const allExtraSet = new Set(extraEtfs);
  const filteredEtfs = etfSearch.trim()
    ? EXTRA_ETF_LIST.filter(
        e =>
          (e.ticker.includes(etfSearch.toUpperCase()) ||
            e.name.toLowerCase().includes(etfSearch.toLowerCase())) &&
          !DEFAULT_INDEX_TICKERS.has(e.ticker) &&
          !allExtraSet.has(e.ticker)
      )
    : EXTRA_ETF_LIST.filter(
        e => !DEFAULT_INDEX_TICKERS.has(e.ticker) && !allExtraSet.has(e.ticker)
      );

  // Close dropdowns on outside click
  useEffect(() => {
    function onMouseDown(e) {
      if (stockWrapperRef.current && !stockWrapperRef.current.contains(e.target)) {
        setStockDropdownOpen(false);
      }
      if (etfWrapperRef.current && !etfWrapperRef.current.contains(e.target)) {
        setEtfDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // ── Stock ticker add ──────────────────────────────────────────────
  function addTicker(t) {
    const ticker = t.trim().toUpperCase();
    if (!ticker) return;
    if (allTickers.includes(ticker)) {
      setTickerError('Ticker already added');
      setStockDropdownOpen(false);
      return;
    }
    if (!isValidFormat(ticker)) {
      setTickerError('Enter a valid ticker symbol (e.g. AAPL, TSLA)');
      return;
    }
    setTickers(prev => [...prev, ticker]);
    setTickerInput('');
    setTickerError('');
    setStockDropdownOpen(false);
  }

  function handleStockKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addTicker(tickerInput); }
    else if (e.key === 'Escape') setStockDropdownOpen(false);
  }

  function removeTicker(t) {
    setTickers(prev => prev.filter(x => x !== t));
  }

  // ── Default index fund toggle ─────────────────────────────────────
  function toggleIndex(ticker) {
    setSelectedIndexes(prev =>
      prev.includes(ticker) ? prev.filter(x => x !== ticker) : [...prev, ticker]
    );
  }

  // ── Extra ETF search ──────────────────────────────────────────────
  function addExtraEtf(ticker) {
    if (allExtraSet.has(ticker)) return;
    setExtraEtfs(prev => [...prev, ticker]);
    // Auto-toggle it on
    setSelectedIndexes(prev => (prev.includes(ticker) ? prev : [...prev, ticker]));
    setEtfSearch('');
    setEtfDropdownOpen(false);
  }

  function removeExtraEtf(ticker) {
    setExtraEtfs(prev => prev.filter(t => t !== ticker));
    setSelectedIndexes(prev => prev.filter(t => t !== ticker));
  }

  // ── Optimize ──────────────────────────────────────────────────────
  function handleOptimize() {
    if (allTickers.length < 2) return;
    const investAmt = parseFloat(investment.replace(/[^0-9.]/g, ''));
    // inputState is passed back to App so it can be restored on Back
    const inputState = { tickers, selectedIndexes, extraEtfs, investment, timeRange, riskProfile };
    onOptimize(
      {
        tickers: allTickers,
        investment: isNaN(investAmt) ? 10000 : investAmt,
        timeRange,
        riskProfile,
      },
      inputState
    );
  }

  // ── Logo reset (clears everything) ───────────────────────────────
  function handleLogoClick() {
    setTickers([]);
    setSelectedIndexes([]);
    setExtraEtfs([]);
    setInvestment('');
    setTimeRange('3Y');
    setRiskProfile('hopeful');
    setTickerInput('');
    setTickerError('');
    onLogoReset();
  }

  const canOptimize = allTickers.length >= 2 && !isLoading;

  // Optimization counter for free users
  const today = new Date().toISOString().slice(0, 10);
  const FREE_DAILY_LIMIT = 5;
  const isFree = userDoc?.plan === 'free';
  const optimizationsToday = isFree
    ? (userDoc?.lastOptimizationDate === today ? (userDoc?.optimizationsToday || 0) : 0)
    : null;
  const isAtLimit = optimizationsToday !== null && optimizationsToday >= FREE_DAILY_LIMIT;

  return (
    <div className="input-panel">
      {/* Header — logo click resets everything */}
      <div className="panel-header">
        <div className="logo-row">
          <button className="logo-btn" onClick={handleLogoClick} title="Reset all selections">
            <div className="logo-icon">
              <GlobeIcon size={28} color="var(--accent)" />
            </div>
            <div>
              <h1 className="app-title">Atlas Allocation</h1>
              <p className="app-sub">Institutional-grade portfolio optimization, built for everyone</p>
            </div>
          </button>
          <UserButton
            user={user}
            userDoc={userDoc}
            onSignInClick={onSignInClick}
            onSignOutClick={onSignOutClick}
            onHistoryClick={onHistoryClick}
            onProfileClick={onProfileClick}
            onManageSubClick={onManageSubClick}
            onSettingsClick={onSettingsClick}
            theme={theme}
            onThemeToggle={onThemeToggle}
          />
        </div>
      </div>

      {/* Stock Tickers */}
      <section className="input-section">
        <div className="section-label">Individual Stocks</div>
        <div className="ticker-input-row" ref={stockWrapperRef}>
          <div className="ticker-input-wrap">
            <input
              className="text-input ticker-input"
              placeholder="e.g. AAPL, TSLA, MSFT"
              value={tickerInput}
              onChange={e => {
                const val = e.target.value.toUpperCase();
                setTickerInput(val);
                setTickerError('');
                setStockDropdownOpen(val.trim().length > 0);
              }}
              onFocus={() => tickerInput.trim() && setStockDropdownOpen(true)}
              onKeyDown={handleStockKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            {stockDropdownOpen && filteredStocks.length > 0 && (
              <ul className="ticker-dropdown">
                {filteredStocks.map(s => (
                  <li
                    key={s.ticker}
                    className="ticker-dropdown-item"
                    onMouseDown={e => { e.preventDefault(); addTicker(s.ticker); }}
                  >
                    <span className="stock-dd-ticker">{s.ticker}</span>
                    <span className="stock-dd-name">{s.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            className="btn-add"
            onMouseDown={e => e.preventDefault()}
            onClick={() => addTicker(tickerInput)}
            disabled={!tickerInput.trim()}
          >
            Add
          </button>
        </div>
        {tickerError && <div className="input-error">{tickerError}</div>}
        {tickers.length > 0 && (
          <div className="tag-row">
            {tickers.map(t => (
              <span key={t} className="ticker-tag">
                {t}
                <button className="tag-remove" onClick={() => removeTicker(t)}>×</button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Index Funds & ETFs */}
      <section className="input-section">
        <div className="section-label">Index Funds & ETFs</div>

        {/* ETF search bar */}
        <div className="etf-search-wrap" ref={etfWrapperRef}>
          <div className="etf-search-inner">
            <span className="etf-search-icon">⊕</span>
            <input
              className="etf-search-input"
              placeholder="Search ETFs to add (e.g. ARKK, TLT, SCHD…)"
              value={etfSearch}
              onChange={e => {
                setEtfSearch(e.target.value);
                setEtfDropdownOpen(true);
              }}
              onFocus={() => setEtfDropdownOpen(true)}
              onKeyDown={e => { if (e.key === 'Escape') setEtfDropdownOpen(false); }}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          {etfDropdownOpen && filteredEtfs.length > 0 && (
            <ul className="etf-dropdown">
              {filteredEtfs.slice(0, 8).map(etf => (
                <li
                  key={etf.ticker}
                  className="etf-dropdown-item"
                  onMouseDown={e => { e.preventDefault(); addExtraEtf(etf.ticker); }}
                >
                  <span className="etf-dd-ticker">{etf.ticker}</span>
                  <span className="etf-dd-name">{etf.name}</span>
                  <span className="etf-dd-desc">{etf.desc}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Default 6 cards + any extra ETF cards */}
        <div className="index-grid">
          {DEFAULT_INDEX_FUNDS.map(fund => (
            <button
              key={fund.ticker}
              className={`index-card ${selectedIndexes.includes(fund.ticker) ? 'selected' : ''}`}
              onClick={() => toggleIndex(fund.ticker)}
            >
              <div className="index-ticker">{fund.ticker}</div>
              <div className="index-name">{fund.name}</div>
              <div className="index-desc">{fund.desc}</div>
              {selectedIndexes.includes(fund.ticker) && <div className="index-check">✓</div>}
            </button>
          ))}

          {extraEtfs.map(ticker => {
            const meta = EXTRA_ETF_LIST.find(e => e.ticker === ticker);
            return (
              <div key={ticker} className="index-card-wrap">
                <button
                  className={`index-card extra-card ${selectedIndexes.includes(ticker) ? 'selected' : ''}`}
                  onClick={() => toggleIndex(ticker)}
                >
                  <div className="index-ticker">{ticker}</div>
                  <div className="index-name">{meta?.name ?? ''}</div>
                  <div className="index-desc">{meta?.desc ?? ''}</div>
                  {selectedIndexes.includes(ticker) && <div className="index-check">✓</div>}
                </button>
                <button
                  className="extra-card-remove"
                  onClick={() => removeExtraEtf(ticker)}
                  title={`Remove ${ticker}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Investment amount */}
      <section className="input-section two-col">
        <div>
          <div className="section-label">Investment Amount</div>
          <div className="input-prefix-wrap">
            <span className="input-prefix">$</span>
            <input
              className="text-input investment-input"
              placeholder="10,000"
              value={investment}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9.]/g, '');
                setInvestment(raw ? Number(raw).toLocaleString('en-US') : '');
              }}
            />
          </div>
        </div>
        <div>
          <div className="section-label">Data History Time Range</div>
          <div className="range-buttons">
            {TIME_RANGES.map(r => (
              <button
                key={r.value}
                className={`range-btn ${timeRange === r.value ? 'selected' : ''}`}
                onClick={() => setTimeRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Profile */}
      <section className="input-section">
        <div className="section-label">Risk Profile</div>
        <div className="risk-cards">
          {RISK_PROFILES.map(r => (
            <button
              key={r.key}
              className={`risk-card ${riskProfile === r.key ? 'selected' : ''}`}
              onClick={() => setRiskProfile(r.key)}
            >
              <div className="risk-icon">{r.icon}</div>
              <div className="risk-label">{r.label}</div>
              <div className="risk-sub">{r.sub}</div>
              <div className="risk-desc">{r.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Portfolio summary bar */}
      {allTickers.length > 0 && (
        <div className="portfolio-bar">
          <span className="portfolio-bar-label">Assets selected:</span>
          <span className="portfolio-bar-tickers">{allTickers.join(' · ')}</span>
          <span className="portfolio-bar-count">{allTickers.length} total</span>
        </div>
      )}

      {allTickers.length < 2 && (
        <div className="notice">Add at least 2 assets to run optimization</div>
      )}

      {/* Daily usage counter for free users */}
      {isFree && optimizationsToday !== null && (
        <div className={`opt-counter ${isAtLimit ? 'at-limit' : ''}`}>
          <div className="opt-counter-bar">
            <div
              className="opt-counter-fill"
              style={{ width: `${Math.min((optimizationsToday / FREE_DAILY_LIMIT) * 100, 100)}%` }}
            />
          </div>
          <span className="opt-counter-text">
            {optimizationsToday}/{FREE_DAILY_LIMIT} optimizations used today
          </span>
          {isAtLimit && (
            <span className="opt-counter-limit">Daily limit reached — upgrade for unlimited</span>
          )}
        </div>
      )}

      {/* Optimize button */}
      <button
        className={`btn-optimize ${!canOptimize ? 'disabled' : ''}`}
        onClick={handleOptimize}
        disabled={!canOptimize}
      >
        {isLoading ? (
          <span className="loading-row">
            <span className="spinner large" />
            Running optimization…
          </span>
        ) : (
          '◈ Optimize Portfolio'
        )}
      </button>

      {isLoading && loadingStatus && (
        <div className="loading-status">
          <span className="loading-status-dot" />
          {loadingStatus}
        </div>
      )}
    </div>
  );
}
