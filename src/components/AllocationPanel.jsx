import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { fmtPct, fmtDollar } from '../utils/financeUtils';
import './AllocationPanel.css';

const COLORS = [
  '#89CFF0', '#4ade80', '#f87171', '#fbbf24', '#a78bfa', '#fb923c',
  '#34d399', '#60a5fa', '#f472b6', '#e879f9', '#38bdf8', '#a3e635',
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  return (
    <div className="pie-tooltip">
      <div className="pie-tooltip-name">{d.name}</div>
      <div className="pie-tooltip-pct">{fmtPct(d.value / 100)}</div>
    </div>
  );
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#000" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function AllocationPanel({ portfolio, tickers, investment }) {
  const { weights } = portfolio;

  const pieData = tickers.map((t, i) => ({
    name: t,
    value: parseFloat((weights[i] * 100).toFixed(2)),
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0.1);

  const tableRows = tickers.map((t, i) => ({
    ticker: t,
    weight: weights[i],
    dollars: weights[i] * investment,
    color: COLORS[i % COLORS.length],
  })).sort((a, b) => b.weight - a.weight);

  return (
    <div className="alloc-section">
      <h2 className="section-title">Optimal Allocation</h2>
      <div className="alloc-grid">
        {/* Pie Chart */}
        <div className="alloc-chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={115}
                innerRadius={50}
                dataKey="value"
                labelLine={false}
                label={<CustomLabel />}
              >
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.color} stroke="rgba(0,0,0,0.4)" strokeWidth={1.5} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Color legend */}
          <div className="pie-legend">
            {pieData.map(d => (
              <div key={d.name} className="pie-legend-item">
                <span className="pie-legend-dot" style={{ background: d.color }} />
                <span>{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="alloc-table-wrap">
          <table className="alloc-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Allocation</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(row => (
                <tr key={row.ticker}>
                  <td>
                    <div className="alloc-ticker-cell">
                      <span className="alloc-dot" style={{ background: row.color }} />
                      <span className="alloc-ticker">{row.ticker}</span>
                    </div>
                  </td>
                  <td>
                    <div className="alloc-bar-wrap">
                      <div className="alloc-bar-track">
                        <div
                          className="alloc-bar-fill"
                          style={{ width: `${row.weight * 100}%`, background: row.color }}
                        />
                      </div>
                      <span className="alloc-pct">{fmtPct(row.weight)}</span>
                    </div>
                  </td>
                  <td className="alloc-dollars">{fmtDollar(row.dollars)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="alloc-total">
            <span>Total Investment</span>
            <span className="alloc-total-val">{fmtDollar(investment)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
