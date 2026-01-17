import { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#1d4ed8', '#93c5fd'];

const formatNumber = (value, digits = 2) =>
  Number(value).toLocaleString('zh-Hant', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function App() {
  const [r0, setR0] = useState(0.35);
  const [r1, setR1] = useState(0.25);
  const [t0, setT0] = useState(1000);
  const [basis, setBasis] = useState('A');
  const [kMax, setKMax] = useState(0.3);
  const [kStep, setKStep] = useState(0.05);

  const parsed = useMemo(() => {
    const ratio0 = clamp(Number(r0) || 0, 0, 0.9);
    const ratio1 = clamp(Number(r1) || 0, 0, 0.9);
    const total0 = Math.max(Number(t0) || 0, 0);
    const usable0 = total0 * (1 - ratio0);
    const virtual0 = total0 * ratio0;

    let total1 = total0;
    let usable1 = usable0;

    if (basis === 'A') {
      usable1 = usable0;
      total1 = usable1 / (1 - ratio1 || 1);
    } else {
      total1 = total0;
      usable1 = total1 * (1 - ratio1);
    }

    const virtual1 = Math.max(total1 - usable1, 0);

    return {
      ratio0,
      ratio1,
      total0,
      total1,
      usable0,
      usable1,
      virtual0,
      virtual1,
    };
  }, [r0, r1, t0, basis]);

  const donutData = useMemo(
    () => [
      { name: '改革前虛坪', value: parsed.virtual0 },
      { name: '改革前實坪', value: parsed.usable0 },
    ],
    [parsed]
  );

  const barData = useMemo(
    () => [
      {
        name: '改革前',
        虛坪: parsed.virtual0,
        實坪: parsed.usable0,
      },
      {
        name: '改革後',
        虛坪: parsed.virtual1,
        實坪: parsed.usable1,
      },
    ],
    [parsed]
  );

  const sensitivityData = useMemo(() => {
    const max = clamp(Number(kMax) || 0, 0, 0.9);
    const step = clamp(Number(kStep) || 0.01, 0.01, 0.5);
    const rows = [];
    for (let k = 0; k <= max + 1e-9; k += step) {
      const factor = 1 / (1 - k || 1);
      rows.push({
        k: Number(k.toFixed(2)),
        P1: Number(factor.toFixed(3)),
      });
    }
    return rows;
  }, [kMax, kStep]);

  const diff = {
    usable: parsed.usable1 - parsed.usable0,
    virtual: parsed.virtual1 - parsed.virtual0,
    total: parsed.total1 - parsed.total0,
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>虛坪改革三頁互動 dashboard</h1>
        <p>
          輸入改革前後虛坪率與總面積，切換 A 固定 / T 固定口徑，
          即時計算面積結構變化與單價敏感度。
        </p>
      </header>

      <section className="section">
        <h2>1｜改革前後結構與口徑切換</h2>
        <div className="controls">
          <div className="control">
            <label htmlFor="r0">改革前虛坪率 r0</label>
            <input
              id="r0"
              type="number"
              min="0"
              max="0.9"
              step="0.01"
              value={r0}
              onChange={(event) => setR0(event.target.value)}
            />
          </div>
          <div className="control">
            <label htmlFor="r1">改革後虛坪率 r1</label>
            <input
              id="r1"
              type="number"
              min="0"
              max="0.9"
              step="0.01"
              value={r1}
              onChange={(event) => setR1(event.target.value)}
            />
          </div>
          <div className="control">
            <label htmlFor="t0">改革前總面積 T0</label>
            <input
              id="t0"
              type="number"
              min="0"
              step="10"
              value={t0}
              onChange={(event) => setT0(event.target.value)}
            />
          </div>
        </div>
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-button ${basis === 'A' ? 'active' : ''}`}
            onClick={() => setBasis('A')}
          >
            A 固定（實坪固定）
          </button>
          <button
            type="button"
            className={`toggle-button ${basis === 'T' ? 'active' : ''}`}
            onClick={() => setBasis('T')}
          >
            T 固定（總面積固定）
          </button>
        </div>
        <div className="chart-grid">
          <div className="card">
            <h3>改革前圓環圖</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${formatNumber(value)} ㎡`} />
              </PieChart>
            </ResponsiveContainer>
            <p className="note">改革前虛坪率：{formatNumber(parsed.ratio0 * 100, 1)}%</p>
          </div>
          <div className="card">
            <h3>改革前後堆疊柱狀圖</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${formatNumber(value)} ㎡`} />
                <Legend />
                <Bar dataKey="實坪" stackId="a" fill="#2563eb" />
                <Bar dataKey="虛坪" stackId="a" fill="#93c5fd" />
              </BarChart>
            </ResponsiveContainer>
            <p className="note">
              口徑：{basis === 'A' ? 'A 固定（實坪固定）' : 'T 固定（總面積固定）'}
            </p>
          </div>
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <span>實坪變化</span>
            <strong>{formatNumber(diff.usable)} ㎡</strong>
          </div>
          <div className="summary-item">
            <span>虛坪變化</span>
            <strong>{formatNumber(diff.virtual)} ㎡</strong>
          </div>
          <div className="summary-item">
            <span>總面積變化</span>
            <strong>{formatNumber(diff.total)} ㎡</strong>
          </div>
          <div className="summary-item">
            <span>改革後虛坪率</span>
            <strong>{formatNumber(parsed.ratio1 * 100, 1)}%</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>2｜總銷固定：單價上調敏感度</h2>
        <div className="controls">
          <div className="control">
            <label htmlFor="kMax">kMax（最大虛坪縮減比例）</label>
            <input
              id="kMax"
              type="number"
              min="0"
              max="0.9"
              step="0.01"
              value={kMax}
              onChange={(event) => setKMax(event.target.value)}
            />
          </div>
          <div className="control">
            <label htmlFor="kStep">kStep（步長）</label>
            <input
              id="kStep"
              type="number"
              min="0.01"
              max="0.5"
              step="0.01"
              value={kStep}
              onChange={(event) => setKStep(event.target.value)}
            />
          </div>
        </div>
        <div className="chart-grid">
          <div className="card">
            <h3>單價上調敏感度曲線（P1 = P0 / (1 - k)）</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={sensitivityData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="k" tickFormatter={(value) => `${value}`} />
                <YAxis domain={[1, 'auto']} />
                <Tooltip formatter={(value) => `${value} × P0`} />
                <Line type="monotone" dataKey="P1" stroke="#1d4ed8" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="note">
              k 代表面積縮減比例，假設總銷固定則單價需上調以維持總銷。
            </p>
          </div>
          <div className="card">
            <h3>敏感度摘要</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span>kMax</span>
                <strong>{formatNumber(kMax * 100, 1)}%</strong>
              </div>
              <div className="summary-item">
                <span>最高單價倍數</span>
                <strong>
                  {formatNumber(
                    sensitivityData.length
                      ? sensitivityData[sensitivityData.length - 1].P1
                      : 1,
                    3
                  )}
                  ×
                </strong>
              </div>
              <div className="summary-item">
                <span>初始單價倍數</span>
                <strong>1.000×</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>3｜差異摘要與解讀</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span>改革前實坪</span>
            <strong>{formatNumber(parsed.usable0)} ㎡</strong>
          </div>
          <div className="summary-item">
            <span>改革後實坪</span>
            <strong>{formatNumber(parsed.usable1)} ㎡</strong>
          </div>
          <div className="summary-item">
            <span>改革前虛坪</span>
            <strong>{formatNumber(parsed.virtual0)} ㎡</strong>
          </div>
          <div className="summary-item">
            <span>改革後虛坪</span>
            <strong>{formatNumber(parsed.virtual1)} ㎡</strong>
          </div>
          <div className="summary-item">
            <span>改革後總面積</span>
            <strong>{formatNumber(parsed.total1)} ㎡</strong>
          </div>
          <div className="summary-item">
            <span>改革前總面積</span>
            <strong>{formatNumber(parsed.total0)} ㎡</strong>
          </div>
        </div>
        <p className="note">
          差異摘要可直接觀察虛坪縮減在不同口徑下對實坪、虛坪與總面積的影響，
          便於評估銷售敘事與價格調整策略。
        </p>
      </section>
    </div>
  );
}
