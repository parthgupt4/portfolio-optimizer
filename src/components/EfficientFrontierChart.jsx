import React, { useState, useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ZAxis,
} from 'recharts';
import { fmtPct } from '../utils/financeUtils';
import './EfficientFrontierChart.css';

const SPECIAL_COLORS = {
  minVar: '#4ade80',
  maxSharpe: '#89CFF0',
  maxReturn: '#f87171',
};

const RISK_PROFILE_MAP = {
  safe: 'minVar',
  hopeful: 'maxSharpe',
  risky: 'maxReturn',
};

function AllocationBreakdown({ allocation, tickers }) {
  return (
    <div className="tooltip-alloc">
      {tickers.map(t => (
        <div key={t} className="tooltip-alloc-row">
          <span className="tooltip-alloc-ticker">{t}</span>
          <span className="tooltip-alloc-pct">{fmtPct(allocation[t] || 0)}</span>
        </div>
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload, tickers }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="ef-tooltip">
      <div className="ef-tooltip-row">
        <span>Return</span><span className="ef-tooltip-val accent">{fmtPct(d.ret)}</span>
      </div>
      <div className="ef-tooltip-row">
        <span>Risk</span><span className="ef-tooltip-val">{fmtPct(d.vol)}</span>
      </div>
      <div className="ef-tooltip-row">
        <span>Sharpe</span><span className="ef-tooltip-val">{d.sharpeRatio?.toFixed(2)}</span>
      </div>
      {d.allocation && tickers && (
        <>
          <div className="ef-tooltip-divider" />
          <div className="ef-tooltip-label">Allocation</div>
          <AllocationBreakdown allocation={d.allocation} tickers={tickers} />
        </>
      )}
    </div>
  );
}

// Custom dot shape for special portfolio points
function SpecialDot({ cx, cy, color, isSelected, label, labelLeft }) {
  if (cx == null || cy == null) return null;
  return (
    <g>
      {isSelected && <circle cx={cx} cy={cy} r={16} fill={color} opacity={0.12} />}
      <circle cx={cx} cy={cy} r={isSelected ? 9 : 6} fill={color} stroke="#000" strokeWidth={1.5} />
      <text
        x={labelLeft ? cx - 8 : cx + 10}
        y={cy - 10}
        fill={color}
        fontSize={10}
        fontWeight="600"
        textAnchor={labelLeft ? 'end' : 'start'}
      >
        {label}
      </text>
    </g>
  );
}

export default function EfficientFrontierChart({ portfolios, frontier, special, riskProfile, tickers }) {
  const [showAnnotation, setShowAnnotation] = useState(true);
  const selectedKey = RISK_PROFILE_MAP[riskProfile];

  // Downsample scatter to ~800 points for performance
  const scatterData = useMemo(() => {
    if (portfolios.length <= 800) return portfolios;
    const step = Math.ceil(portfolios.length / 800);
    return portfolios.filter((_, i) => i % step === 0);
  }, [portfolios]);

  const fmtAxis = (v) => fmtPct(v, 0);

  const allVols = portfolios.map(p => p.vol);
  const allRets = portfolios.map(p => p.ret);
  const volMin = Math.max(0, Math.min(...allVols) * 0.88);
  const volMax = Math.max(...allVols) * 1.06;
  const retMin = Math.min(...allRets) * 0.88;
  const retMax = Math.max(...allRets) * 1.1;

  return (
    <div className="ef-section">
      <div className="ef-header">
        <h2 className="section-title">Efficient Frontier</h2>
        <button className="ef-toggle" onClick={() => setShowAnnotation(v => !v)}>
          {showAnnotation ? 'Hide' : 'Show'} Explanation
        </button>
      </div>

      <div className="ef-chart-wrap">
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
            <XAxis
              type="number"
              dataKey="vol"
              domain={[volMin, volMax]}
              tickFormatter={fmtAxis}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              label={{
                value: 'Annual Risk (Volatility)',
                position: 'insideBottom',
                offset: -12,
                fill: 'rgba(255,255,255,0.35)',
                fontSize: 11,
              }}
              name="vol"
            />
            <YAxis
              type="number"
              dataKey="ret"
              domain={[retMin, retMax]}
              tickFormatter={fmtAxis}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              label={{
                value: 'Expected Annual Return',
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                fill: 'rgba(255,255,255,0.35)',
                fontSize: 11,
              }}
              name="ret"
            />
            <ZAxis range={[20, 20]} />
            <Tooltip content={<CustomTooltip tickers={tickers} />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.15)' }} />

            {/* All simulated portfolio dots */}
            <Scatter
              name="Simulated Portfolios"
              data={scatterData}
              fill="rgba(137,207,240,0.15)"
              shape={(props) => {
                const { cx, cy } = props;
                return <circle cx={cx} cy={cy} r={2.5} fill="rgba(137,207,240,0.18)" />;
              }}
            />

            {/* Efficient frontier — connected line */}
            <Scatter
              name="Efficient Frontier"
              data={frontier}
              fill="rgba(137,207,240,0.7)"
              line={{ stroke: 'rgba(137,207,240,0.7)', strokeWidth: 2 }}
              lineType="fitting"
              shape={(props) => {
                const { cx, cy } = props;
                return <circle cx={cx} cy={cy} r={2} fill="rgba(137,207,240,0.5)" />;
              }}
            />

            {/* Min Variance */}
            <Scatter
              name="Min Variance"
              data={[special.minVar]}
              fill={SPECIAL_COLORS.minVar}
              shape={(props) => (
                <SpecialDot
                  cx={props.cx} cy={props.cy}
                  color={SPECIAL_COLORS.minVar}
                  isSelected={selectedKey === 'minVar'}
                  label="Min Var"
                  labelLeft={false}
                />
              )}
            />

            {/* Max Sharpe */}
            <Scatter
              name="Max Sharpe"
              data={[special.maxSharpe]}
              fill={SPECIAL_COLORS.maxSharpe}
              shape={(props) => (
                <SpecialDot
                  cx={props.cx} cy={props.cy}
                  color={SPECIAL_COLORS.maxSharpe}
                  isSelected={selectedKey === 'maxSharpe'}
                  label="Max Sharpe"
                  labelLeft={false}
                />
              )}
            />

            {/* Max Return */}
            <Scatter
              name="Max Return"
              data={[special.maxReturn]}
              fill={SPECIAL_COLORS.maxReturn}
              shape={(props) => (
                <SpecialDot
                  cx={props.cx} cy={props.cy}
                  color={SPECIAL_COLORS.maxReturn}
                  isSelected={selectedKey === 'maxReturn'}
                  label="Max Return"
                  labelLeft={true}
                />
              )}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="ef-legend">
        {[
          { color: SPECIAL_COLORS.minVar, label: 'Minimum Variance', key: 'minVar' },
          { color: SPECIAL_COLORS.maxSharpe, label: 'Maximum Sharpe', key: 'maxSharpe' },
          { color: SPECIAL_COLORS.maxReturn, label: 'Maximum Return', key: 'maxReturn' },
        ].map(item => (
          <div key={item.key} className={`ef-legend-item ${selectedKey === item.key ? 'active' : ''}`}>
            <span className="ef-legend-dot" style={{ background: item.color }} />
            <span>{item.label}</span>
            {selectedKey === item.key && <span className="ef-legend-badge">Selected</span>}
          </div>
        ))}
        <div className="ef-legend-item">
          <span className="ef-legend-line" />
          <span>Efficient Frontier</span>
        </div>
        <div className="ef-legend-item">
          <span className="ef-legend-dot scatter-dot" />
          <span>2000 Simulated Portfolios</span>
        </div>
      </div>

      {/* Annotation */}
      {showAnnotation && (
        <div className="ef-annotation">
          <div className="ef-annotation-title">Understanding the Efficient Frontier</div>
          <div className="ef-annotation-grid">
            <div className="ef-annotation-block">
              <div className="ef-annotation-label">X Axis — Risk (Volatility)</div>
              <p>Measures how much the portfolio's value fluctuates annually. Higher values mean wider swings up and down. Calculated as the annualized standard deviation of daily log returns.</p>
            </div>
            <div className="ef-annotation-block">
              <div className="ef-annotation-label">Y Axis — Expected Annual Return</div>
              <p>The projected yearly gain based on historical average log returns of each asset, scaled by their portfolio weights, annualized over 252 trading days.</p>
            </div>
            <div className="ef-annotation-block">
              <div className="ef-annotation-label">Why Portfolios Below the Curve Are Suboptimal</div>
              <p>Any portfolio below the frontier accepts the same risk for less return — or more risk for the same return. The frontier traces the set of portfolios where no improvement is possible without increasing risk.</p>
            </div>
            <div className="ef-annotation-block">
              <div className="ef-annotation-label">The 2000 Monte Carlo Simulations</div>
              <p>Each dot is a randomly weighted combination of your assets summing to 100%. By sampling thousands of combinations, we map the boundary of achievable risk-return tradeoffs and locate the optimal frontier.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
