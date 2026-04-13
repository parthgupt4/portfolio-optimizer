import React, { useState, useEffect } from 'react';
import './App.css';
import InputPanel from './components/InputPanel';
import ResultsPanel from './components/ResultsPanel';
import AuthModal from './components/AuthModal';
import HistoryPanel from './components/HistoryPanel';
import LandingPage from './components/LandingPage';
import PlanSelection from './components/PlanSelection';
import UpgradeModal from './components/UpgradeModal';
import ProfileModal from './components/ProfileModal';
import ManageSubModal from './components/ManageSubModal';
import SettingsModal from './components/SettingsModal';
import CompareModal from './components/CompareModal';
import GlobeIcon from './components/GlobeIcon';
import {
  logReturns, mean, covMatrix, monteCarloSimulation,
  extractSpecialPortfolios, buildEfficientFrontier, sharpe,
} from './utils/financeUtils';
import { fetchHistoricalPrices, getDateRange, alignPriceSeries } from './utils/stockData';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, addDoc, serverTimestamp,
  doc, setDoc, updateDoc, onSnapshot,
} from 'firebase/firestore';

const RISK_PROFILE_KEY_MAP = { safe: 'minVar', hopeful: 'maxSharpe', risky: 'maxReturn' };
const ADMIN_EMAIL = 'parthgupt4@gmail.com';
const FREE_DAILY_LIMIT = 5;

export default function App() {
  // ── Core optimization ──────────────────────────────────────────────
  const [view, setView] = useState('input');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState(null);
  const [savedInputState, setSavedInputState] = useState(null);

  // ── Auth + user document ───────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userDoc, setUserDoc] = useState(null);
  const [userDocLoading, setUserDocLoading] = useState(false);
  const [planSelLoading, setPlanSelLoading] = useState(false);

  // ── Theme ──────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('atlas-theme') || 'dark');

  // ── UI overlays ────────────────────────────────────────────────────
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showManageSubModal, setShowManageSubModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [compareEntries, setCompareEntries] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState(null);

  // ── Apply theme on change ──────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('atlas-theme', theme);
  }, [theme]);

  // ── Apply theme on mount ───────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Handle Stripe checkout return
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout) {
      window.history.replaceState({}, '', window.location.pathname);
      setCheckoutStatus(checkout);
      setTimeout(() => setCheckoutStatus(null), 8000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth state listener ────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setUserDoc(null);
        setUserDocLoading(false);
      }
    });
    return unsub;
  }, []);

  // ── Firestore user doc listener ────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setUserDocLoading(true);
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Always ensure the admin email has the admin role
          if (user?.email === ADMIN_EMAIL && data.plan !== 'admin') {
            updateDoc(doc(db, 'users', user.uid), { plan: 'admin' }).catch(console.error);
          }
          setUserDoc({ id: snapshot.id, ...data });
        } else {
          setUserDoc(null);
        }
        setUserDocLoading(false);
      },
      () => setUserDocLoading(false)
    );
    return () => { unsub(); setUserDocLoading(false); };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Theme toggle ───────────────────────────────────────────────────
  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }

  // ── Auth actions ───────────────────────────────────────────────────
  async function handleSignOut() {
    try { await signOut(auth); } catch (_) {}
    setView('input');
    setResults(null);
    setSavedInputState(null);
  }

  // ── Plan selection ─────────────────────────────────────────────────
  async function createUserDoc(plan) {
    const today = new Date().toISOString().slice(0, 10);
    const finalPlan = user.email === ADMIN_EMAIL ? 'admin' : plan;
    await setDoc(doc(db, 'users', user.uid), {
      plan: finalPlan,
      email: user.email,
      displayName: user.displayName || null,
      optimizationsToday: 0,
      lastOptimizationDate: today,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: serverTimestamp(),
    });
    return finalPlan;
  }

  async function handleSelectFree() {
    setPlanSelLoading(true);
    try { await createUserDoc('free'); } catch (e) { console.error(e); }
    setPlanSelLoading(false);
  }

  async function handleSelectPro() {
    setPlanSelLoading(true);
    try {
      await createUserDoc('free');
      await initiateStripeCheckout();
    } catch (e) {
      console.error(e);
    }
    setPlanSelLoading(false);
  }

  // ── Stripe checkout ────────────────────────────────────────────────
  async function initiateStripeCheckout() {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setErrorMsg(`Stripe checkout failed: ${err.message}`);
    }
  }

  // ── Optimization limit check ───────────────────────────────────────
  async function checkAndIncrementCount() {
    if (!userDoc || userDoc.plan === 'pro' || userDoc.plan === 'admin') return true;

    const today = new Date().toISOString().slice(0, 10);
    const count = userDoc.lastOptimizationDate === today
      ? (userDoc.optimizationsToday || 0)
      : 0;

    if (count >= FREE_DAILY_LIMIT) {
      setShowUpgradeModal(true);
      return false;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        optimizationsToday: count + 1,
        lastOptimizationDate: today,
      });
    } catch (e) { console.error(e); }

    return true;
  }

  // ── Firestore save ─────────────────────────────────────────────────
  async function saveToFirestore(config, inputState, resultsData) {
    if (!user) return;
    const { investment, timeRange, riskProfile } = config;
    const { portfolios, frontier, special, selectedPortfolio, tickers: alignedTickers, spyStats } = resultsData;
    try {
      await addDoc(collection(db, 'users', user.uid, 'optimizations'), {
        timestamp: serverTimestamp(),
        stocks: inputState.tickers,
        indexFunds: inputState.selectedIndexes,
        extraEtfs: inputState.extraEtfs,
        riskProfile,
        dollarAmount: investment,
        timeRange,
        results: {
          allocation: selectedPortfolio.allocation,
          stats: {
            ret: selectedPortfolio.ret,
            vol: selectedPortfolio.vol,
            sharpeRatio: selectedPortfolio.sharpeRatio,
          },
          benchmark: spyStats,
          portfolios: portfolios.map(p => ({ ret: p.ret, vol: p.vol, sharpeRatio: p.sharpeRatio })),
          frontier: frontier.map(p => ({ ret: p.ret, vol: p.vol })),
          special: Object.fromEntries(
            Object.entries(special).map(([k, v]) => [k, {
              ret: v.ret, vol: v.vol, sharpeRatio: v.sharpeRatio,
              allocation: v.allocation, weights: v.weights || [],
            }])
          ),
          selectedPortfolio: {
            ret: selectedPortfolio.ret,
            vol: selectedPortfolio.vol,
            sharpeRatio: selectedPortfolio.sharpeRatio,
            allocation: selectedPortfolio.allocation,
            weights: selectedPortfolio.weights || [],
          },
          tickers: alignedTickers,
          investment,
        },
      });
    } catch (err) {
      console.error('Failed to save to Firestore:', err);
    }
  }

  // ── Optimize ────────────────────────────────────────────────────────
  async function handleOptimize(config, inputState) {
    const allowed = await checkAndIncrementCount();
    if (!allowed) return;

    setIsLoading(true);
    setLoadingStatus('Starting…');
    setErrorMsg('');
    setSavedInputState(inputState);

    const isPriority = userDoc?.plan === 'pro' || userDoc?.plan === 'admin';

    try {
      const { tickers, investment, timeRange, riskProfile } = config;
      const { period1, period2 } = getDateRange(timeRange);
      const tickersToFetch = [...new Set([...tickers, 'SPY'])];

      let priceDataArray = [];
      try {
        for (const t of tickersToFetch) {
          const prefix = isPriority ? '⚡ Priority · ' : '';
          const data = await fetchHistoricalPrices(
            t, period1, period2,
            msg => setLoadingStatus(`${prefix}${msg}`)
          );
          priceDataArray.push(data);
        }
      } catch (err) {
        throw new Error(`Data fetch failed: ${err.message}`);
      }

      const portfolioData = priceDataArray.filter(d => tickers.includes(d.ticker));
      const spyData = priceDataArray.find(d => d.ticker === 'SPY');
      const { tickers: alignedTickers, alignedPrices } = alignPriceSeries(portfolioData);

      if (!alignedPrices[0] || alignedPrices[0].length < 30) {
        throw new Error('Not enough overlapping trading days. Try a broader time range or different assets.');
      }

      const returnsMatrix = alignedPrices.map(prices => logReturns(prices));
      const meanReturns = returnsMatrix.map(r => mean(r));
      const covMat = covMatrix(returnsMatrix);
      const portfolios = monteCarloSimulation(meanReturns, covMat, alignedTickers, 2000);
      const special = extractSpecialPortfolios(portfolios);
      const frontier = buildEfficientFrontier(portfolios, 60);

      const selectedPortfolio = { ...special[RISK_PROFILE_KEY_MAP[riskProfile]] };
      selectedPortfolio.weights = alignedTickers.map(t => selectedPortfolio.allocation[t] || 0);

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
      const newResults = {
        portfolios, frontier, special, selectedPortfolio,
        tickers: alignedTickers, investment, timeRange, riskProfile, spyStats,
      };
      setResults(newResults);
      setView('results');
      saveToFirestore(config, inputState, newResults);
    } catch (err) {
      setErrorMsg(err.message || 'An unknown error occurred');
      setView('error');
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────
  function handleBack() { setView('input'); setErrorMsg(''); }
  function handleLogoReset() { setSavedInputState(null); setResults(null); setErrorMsg(''); setView('input'); }

  // ── History load ───────────────────────────────────────────────────
  function handleLoadHistory(entry) {
    const investStr = entry.dollarAmount
      ? Number(entry.dollarAmount).toLocaleString('en-US')
      : '';
    setSavedInputState({
      tickers: entry.stocks || [],
      selectedIndexes: entry.indexFunds || [],
      extraEtfs: entry.extraEtfs || [],
      investment: investStr,
      timeRange: entry.timeRange,
      riskProfile: entry.riskProfile,
    });
    const r = entry.results;
    setResults({
      portfolios: r.portfolios || [],
      frontier: r.frontier || [],
      special: r.special || {},
      selectedPortfolio: r.selectedPortfolio || {
        allocation: r.allocation || {},
        weights: [],
        ret: r.stats?.ret ?? 0,
        vol: r.stats?.vol ?? 0,
        sharpeRatio: r.stats?.sharpeRatio ?? 0,
      },
      tickers: r.tickers || [],
      investment: r.investment ?? entry.dollarAmount ?? 0,
      timeRange: entry.timeRange,
      riskProfile: entry.riskProfile,
      spyStats: r.benchmark || null,
    });
    setView('results');
    setShowHistory(false);
  }

  // ── Compare ────────────────────────────────────────────────────────
  function handleOpenCompare(entries) {
    setCompareEntries(entries);
    setShowCompare(true);
  }

  // ── Shared auth/menu props ─────────────────────────────────────────
  const authProps = {
    user,
    userDoc,
    onSignInClick: () => setShowAuthModal(true),
    onSignOutClick: handleSignOut,
    onHistoryClick: () => setShowHistory(true),
    onProfileClick: () => setShowProfileModal(true),
    onManageSubClick: () => setShowManageSubModal(true),
    onSettingsClick: () => setShowSettingsModal(true),
    theme,
    onThemeToggle: toggleTheme,
  };

  // ── Render: loading ────────────────────────────────────────────────
  if (authLoading || (!!user && userDocLoading)) {
    return (
      <div className="loading-screen">
        <div className="loading-globe">
          <GlobeIcon size={48} color="var(--accent)" strokeWidth={1} />
        </div>
      </div>
    );
  }

  // ── Render: not signed in → landing ───────────────────────────────
  if (!user) {
    return (
      <>
        <LandingPage onSignIn={() => setShowAuthModal(true)} theme={theme} onThemeToggle={toggleTheme} />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  // ── Render: signed in, no user doc → plan selection ───────────────
  if (!userDoc) {
    return (
      <PlanSelection
        user={user}
        onSelectFree={handleSelectFree}
        onSelectPro={handleSelectPro}
        loading={planSelLoading}
      />
    );
  }

  // ── Render: main app ───────────────────────────────────────────────
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
            userDoc={userDoc}
            {...authProps}
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
          userDoc={userDoc}
          onUpgradeClick={() => setShowUpgradeModal(true)}
          {...authProps}
        />
      )}

      {/* Checkout status banner */}
      {checkoutStatus === 'success' && (
        <div className="checkout-banner">
          <span>🎉</span>
          <span>Payment received! Your Pro plan is activating — this may take a moment.</span>
          <button className="checkout-banner-close" onClick={() => setCheckoutStatus(null)}>×</button>
        </div>
      )}

      {/* Overlays */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {showHistory && (
        <HistoryPanel
          user={user}
          userDoc={userDoc}
          onClose={() => setShowHistory(false)}
          onLoad={handleLoadHistory}
          onSignInClick={() => { setShowHistory(false); setShowAuthModal(true); }}
          onCompare={handleOpenCompare}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => { setShowUpgradeModal(false); initiateStripeCheckout(); }}
        />
      )}

      {showProfileModal && (
        <ProfileModal user={user} userDoc={userDoc} onClose={() => setShowProfileModal(false)} />
      )}

      {showManageSubModal && (
        <ManageSubModal
          userDoc={userDoc}
          onClose={() => setShowManageSubModal(false)}
          onUpgrade={() => { setShowManageSubModal(false); initiateStripeCheckout(); }}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          user={user}
          theme={theme}
          onThemeToggle={toggleTheme}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showCompare && (
        <CompareModal entries={compareEntries} onClose={() => setShowCompare(false)} />
      )}
    </div>
  );
}
