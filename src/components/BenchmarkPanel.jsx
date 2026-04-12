import React from 'react';
import { fmtPct } from '../utils/financeUtils';
import './BenchmarkPanel.css';

function CompareRow({ label, optimized, spy, format }) {
  const diff = optimized - spy;
  const better = diff > 0;
  return (
    <div className="bm-row">
      <div className="bm-row-label">{label}</div>
      <div className="bm-cell">
        <span className="bm-val accent">{format(optimized)}</span>
      </div>
      <div className="bm-cell">
        <span className="bm-val secondary">{format(spy)}</span>
      </div>
      <div className="bm-cell">
        <span className={`bm-diff ${better ? 'positive' : 'negative'}`}>
          {better ? '+' : ''}{format(diff)}
        </span>
      </div>
    </div>
  );
}

export default function BenchmarkPanel({ portfolio, spyStats }) {
  if (!spyStats) return null;

  const retDiff = portfolio.ret - spyStats.ret;
  const volDiff = portfolio.vol - spyStats.vol;
  const sharpeDiff = portfolio.sharpeRatio - spyStats.sharpeRatio;

  const retBetter = retDiff > 0;
  const volBetter = volDiff < 0; // lower risk is better
  const sharpeBetter = sharpeDiff > 0;

  function generateCommentary() {
    const lines = [];

    if (retBetter) {
      lines.push(`Your optimized portfolio is expected to return ${fmtPct(Math.abs(retDiff))} more per year than SPY.`);
    } else {
      lines.push(`SPY is projected to outpace your portfolio by ${fmtPct(Math.abs(retDiff))} annually — but that comes with different risk characteristics.`);
    }

    if (volBetter) {
      lines.push(`It does so with ${fmtPct(Math.abs(volDiff))} less volatility, indicating better diversification.`);
    } else {
      lines.push(`However, it takes on ${fmtPct(Math.abs(volDiff))} more volatility — meaning larger potential swings.`);
    }

    if (sharpeBetter) {
      lines.push(`The Sharpe ratio of ${portfolio.sharpeRatio.toFixed(2)} vs SPY's ${spyStats.sharpeRatio.toFixed(2)} confirms this portfolio generates more return per unit of risk.`);
    } else {
      lines.push(`SPY's Sharpe ratio of ${spyStats.sharpeRatio.toFixed(2)} exceeds this portfolio's ${portfolio.sharpeRatio.toFixed(2)}, meaning SPY delivers better risk-adjusted returns in this period.`);
    }

    if (retBetter && sharpeBetter) {
      lines.push('Overall, the optimized portfolio outperforms SPY on both return and risk-adjusted basis — a strong result.');
    } else if (sharpeBetter) {
      lines.push('Even if raw returns are lower, the better Sharpe ratio means you\'re being more efficiently compensated for the risk you\'re taking on.');
    } else if (retBetter) {
      lines.push('The higher return may be worth it depending on your risk tolerance, but be aware that SPY provides better risk-adjusted returns over this period.');
    } else {
      lines.push('For this asset selection and time window, SPY offers a simpler, better-compensated alternative — consider broadening or changing your asset mix.');
    }

    return lines;
  }

  const commentary = generateCommentary();

  return (
    <div className="bm-section">
      <h2 className="section-title">Benchmark Comparison</h2>
      <p className="bm-subtitle">Optimized portfolio vs. just buying SPY (S&P 500)</p>

      <div className="bm-table">
        {/* Header */}
        <div className="bm-header">
          <div className="bm-row-label" />
          <div className="bm-cell bm-col-head">
            <span className="bm-col-tag accent-tag">Your Portfolio</span>
          </div>
          <div className="bm-cell bm-col-head">
            <span className="bm-col-tag spy-tag">SPY Only</span>
          </div>
          <div className="bm-cell bm-col-head">
            <span className="bm-col-tag">Difference</span>
          </div>
        </div>

        <CompareRow
          label="Expected Annual Return"
          optimized={portfolio.ret}
          spy={spyStats.ret}
          format={fmtPct}
        />
        <CompareRow
          label="Annual Volatility"
          optimized={portfolio.vol}
          spy={spyStats.vol}
          format={fmtPct}
        />
        <CompareRow
          label="Sharpe Ratio"
          optimized={portfolio.sharpeRatio}
          spy={spyStats.sharpeRatio}
          format={v => v.toFixed(2)}
        />
      </div>

      {/* Commentary */}
      <div className="bm-commentary">
        <div className="bm-commentary-title">Analysis</div>
        {commentary.map((line, i) => (
          <p key={i} className="bm-commentary-line">{line}</p>
        ))}
      </div>
    </div>
  );
}
