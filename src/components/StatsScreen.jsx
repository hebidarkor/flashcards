import React from 'react';
import { today, getDueCountByDate } from '../lib/sm2';

export default function StatsScreen({ cards, stats, onClose }) {
  const total    = cards.length;
  const todayStr = today();

  const due      = cards.filter((c) => c.sm2.dueDate <= todayStr && c.sm2.repetition > 0).length;
  const learned  = cards.filter((c) => c.sm2.repetition > 0).length;
  const newCards = cards.filter((c) => c.sm2.repetition === 0).length;
  const mature   = cards.filter((c) => c.sm2.interval >= 21).length;

  const sessionTotal = stats.got + stats.missed;
  const pct = sessionTotal === 0 ? 0 : Math.round((stats.got / sessionTotal) * 100);

  // ── Card maturity buckets ─────────────────────────────────────────────────
  const maturityBuckets = [
    { label: 'New',   count: newCards },
    { label: '1–3d',  count: cards.filter((c) => c.sm2.interval >= 1  && c.sm2.interval < 4).length },
    { label: '4–7d',  count: cards.filter((c) => c.sm2.interval >= 4  && c.sm2.interval < 8).length },
    { label: '1–3w',  count: cards.filter((c) => c.sm2.interval >= 8  && c.sm2.interval < 22).length },
    { label: '3w+',   count: mature },
  ];
  const maxMaturity = Math.max(...maturityBuckets.map((b) => b.count), 1);

  // ── 7-day forecast ────────────────────────────────────────────────────────
  const dueCounts = getDueCountByDate(cards);
  const forecast = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const dayLabel = i === 0 ? 'Today'
      : i === 1 ? 'Tmrw'
      : d.toLocaleDateString('en', { weekday: 'short' });
    forecast.push({ label: dayLabel, count: dueCounts[key] || 0, key });
  }
  const maxForecast = Math.max(...forecast.map((f) => f.count), 1);

  return (
    <div className="stats-screen">
      <div className="stats-header">
        <h2>Progress</h2>
        <button className="stats-close" onClick={onClose}>✕</button>
      </div>

      {/* Streak */}
      <div className="stats-streak">
        <span className="streak-flame">🔥</span>
        <span className="streak-count">{stats.streak}</span>
        <span className="streak-label">day streak</span>
      </div>

      {/* Summary tiles */}
      <div className="stats-tiles">
        <div className="stat-tile">
          <span className="tile-value">{total}</span>
          <span className="tile-label">Total cards</span>
        </div>
        <div className="stat-tile">
          <span className="tile-value due">{due}</span>
          <span className="tile-label">Due today</span>
        </div>
        <div className="stat-tile">
          <span className="tile-value learned">{learned}</span>
          <span className="tile-label">Seen at least once</span>
        </div>
        <div className="stat-tile">
          <span className="tile-value mature">{mature}</span>
          <span className="tile-label">Mature (21d+)</span>
        </div>
      </div>

      {/* Session accuracy */}
      {sessionTotal > 0 && (
        <div className="stats-section">
          <h3>This session</h3>
          <div className="session-row">
            <span className="session-got">✓ {stats.got} correct</span>
            <span className="session-missed">✗ {stats.missed} missed</span>
            <span className="session-pct">{pct}% accuracy</span>
          </div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* 7-day forecast */}
      <div className="stats-section">
        <h3>Due in the next 7 days</h3>
        <div className="dist-chart forecast-chart">
          {forecast.map((f) => (
            <div key={f.key} className={`dist-col${f.key === todayStr ? ' today-col' : ''}`}>
              <span className="dist-count">{f.count}</span>
              <div
                className={`dist-bar${f.key === todayStr ? ' today-bar' : ''}`}
                style={{ height: `${Math.round((f.count / maxForecast) * 80)}px` }}
              />
              <span className="dist-label">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card maturity distribution */}
      <div className="stats-section">
        <h3>Card maturity</h3>
        <div className="dist-chart">
          {maturityBuckets.map((b) => (
            <div key={b.label} className="dist-col">
              <span className="dist-count">{b.count}</span>
              <div
                className="dist-bar"
                style={{ height: `${Math.round((b.count / maxMaturity) * 80)}px` }}
              />
              <span className="dist-label">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
