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
const PING_RATE = 3.305785;
const EPSILON = 0.001;

const formatNumber = (value, digits = 2) =>
  Number(value).toLocaleString('zh-Hant', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const toPing = (value) => value / PING_RATE;
const fromPing = (value) => value * PING_RATE;
const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function App() {
  const initial = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      r0: parseNumber(params.get('r0'), 0.35),
      r1: parseNumber(params.get('r1'), 0.25),
      t0: parseNumber(params.get('T0'), 1000),
      mode: params.get('mode') === 'T' ? 'T' : 'A',
      unit: params.get('unit') === 'ping' ? 'ping' : 'm2',
      basis: params.get('basis') === 'A' ? 'A' : 'T',
      P0: parseNumber(params.get('P0'), 30),
      kMax: parseNumber(params.get('kMax'), 0.3),
      kStep: parseNumber(params.get('kStep'), 0.05),
    };
  }, []);

  const [r0, setR0] = useState(initial.r0);
  const [r1, setR1] = useState(initial.r1);
  const [t0, setT0] = useState(initial.t0);
  const [mode, setMode] = useState(initial.mode);
  const [unit, setUnit] = useState(initial.unit);
  const [basis, setBasis] = useState(initial.basis);
  const [P0, setP0] = useState(initial.P0);
  const [kMax, setKMax] = useState(initial.kMax);
  const [kStep, setKStep] = useState(initial.kStep);
  const [copyStatus, setCopyStatus] = useState('');

  const unitLabel = unit === 'ping' ? '坪' : '㎡';
  const displayArea = (value) => (unit === 'ping' ? toPing(value) : value);
  const inputAreaValue = displayArea(parseNumber(t0, 0));

  const parsed = useMemo(() => {
    const ratio0 = clamp(parseNumber(r0, 0), EPSILON, 1 - EPSILON);
    const ratio1 = clamp(parseNumber(r1, 0), EPSILON, 1 - EPSILON);
    const total0 = Math.max(parseNumber(t0, 0), 0);
    const usable0 = total0 * (1 - ratio0);
    const virtual0 = total0 * ratio0;

    let total1 = total0;
    let usable1 = usable0;

    if (mode === 'A') {
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
  }, [r0, r1, t0, mode]);

  const sales = useMemo(() => {
    const S0 = basis === 'T' ? parsed.total0 : parsed.usable0;
    const S1 = basis === 'T' ? parsed.total1 : parsed.usable1;
    const rawK = S0 > 0 ? 1 - S1 / S0 : 0;
    const kCurrent = clamp(rawK, 0, 1 - EPSILON);
    const P1 = parseNumber(P0, 0) / (1 - kCurrent);
    const delta = 1 / (1 - kCurrent) - 1;
    return {
      S0,
      S1,
      rawK,
      kCurrent,
      P1,
      delta,
    };
  }, [basis, parsed, P0]);

  const donutData = useMemo(
    () => [
      { name: '改革前虛坪', value: displayArea(parsed.virtual0) },
      { name: '改革前實坪', value: displayArea(parsed.usable0) },
    ],
    [parsed, unit]
  );

  const barData = useMemo(
    () => [
      {
        name: '改革前',
        虛坪: displayArea(parsed.virtual0),
        實坪: displayArea(parsed.usable0),
      },
      {
        name: '改革後',
        虛坪: displayArea(parsed.virtual1),
        實坪: displayArea(parsed.usable1),
      },
    ],
    [parsed, unit]
  );

  const sensitivityData = useMemo(() => {
    const max = clamp(parseNumber(kMax, 0), 0, 1 - EPSILON);
    const step = clamp(parseNumber(kStep, 0.01), 0.01, 0.5);
    const rows = [];
    for (let k = 0; k <= max + 1e-9; k += step) {
      const factor = parseNumber(P0, 0) / (1 - k || 1);
      rows.push({
        k: Number(k.toFixed(2)),
        P1: Number(factor.toFixed(3)),
      });
    }
    return rows;
  }, [kMax, kStep, P0]);

  const diff = {
    usable: parsed.usable1 - parsed.usable0,
    virtual: parsed.virtual1 - parsed.virtual0,
    total: parsed.total1 - parsed.total0,
  };

  const handleCopyLink = async () => {
    const params = new URLSearchParams({
      r0: parsed.ratio0.toFixed(4),
      r1: parsed.ratio1.toFixed(4),
      T0: parsed.total0.toFixed(2),
      mode,
      unit,
      basis,
      P0: parseNumber(P0, 0).toString(),
      kMax: clamp(parseNumber(kMax, 0), 0, 1 - EPSILON).toFixed(2),
      kStep: clamp(parseNumber(kStep, 0.01), 0.01, 0.5).toFixed(2),
    });
    const url = new URL(window.location.href);
    url.search = params.toString();
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopyStatus('已複製分享連結');
    } catch (error) {
      setCopyStatus('無法複製連結，請手動複製網址列。');
    }
  };

  const kNearLimit = sales.kCurrent >= 0.98 || parseNumber(kMax, 0) >= 0.98;
  const ratioWarning = parsed.ratio0 >= 0.98 || parsed.ratio1 >= 0.98;

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
              max="0.99"
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
              max="0.99"
              step="0.01"
              value={r1}
              onChange={(event) => setR1(event.target.value)}
            />
          </div>
          <div className="control">
            <label htmlFor="t0">改革前總面積 T0（{unitLabel}）</label>
            <input
              id="t0"
              type="number"
              min="0"
              step="10"
              value={inputAreaValue}
              onChange={(event) => {
                const next = parseNumber(event.target.value, 0);
                setT0(unit === 'ping' ? fromPing(next) : next);
              }}
            />
          </div>
        </div>
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-button ${mode === 'A' ? 'active' : ''}`}
            onClick={() => setMode('A')}
          >
            A 固定（實坪固定）
          </button>
          <button
            type="button"
            className={`toggle-button ${mode === 'T' ? 'active' : ''}`}
            onClick={() => setMode('T')}
          >
            T 固定（總面積固定）
          </button>
          <button
            type="button"
            className={`toggle-button ${unit === 'm2' ? 'active' : ''}`}
            onClick={() => setUnit('m2')}
          >
            m²
          </button>
          <button
            type="button"
            className={`toggle-button ${unit === 'ping' ? 'active' : ''}`}
            onClick={() => setUnit('ping')}
          >
            坪
          </button>
          <button type="button" className="toggle-button" onClick={handleCopyLink}>
            複製分享連結
          </button>
        </div>
        {copyStatus ? <p className="note">{copyStatus}</p> : null}
        {ratioWarning ? <p className="note">提示：r 接近 1 會導致面積推算失真，已自動限制。</p> : null}
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
                <Tooltip formatter={(value) => `${formatNumber(value)} ${unitLabel}`} />
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
                <YAxis tickFormatter={(value) => `${formatNumber(value, 0)} ${unitLabel}`} />
                <Tooltip formatter={(value) => `${formatNumber(value)} ${unitLabel}`} />
                <Legend />
                <Bar dataKey="實坪" stackId="a" fill="#2563eb" />
                <Bar dataKey="虛坪" stackId="a" fill="#93c5fd" />
              </BarChart>
            </ResponsiveContainer>
            <p className="note">
              口徑：{mode === 'A' ? 'A 固定（實坪固定）' : 'T 固定（總面積固定）'}
            </p>
          </div>
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <span>實坪變化</span>
            <strong>{formatNumber(displayArea(diff.usable))} {unitLabel}</strong>
          </div>
          <div className="summary-item">
            <span>虛坪變化</span>
            <strong>{formatNumber(displayArea(diff.virtual))} {unitLabel}</strong>
          </div>
          <div className="summary-item">
            <span>總面積變化</span>
            <strong>{formatNumber(displayArea(diff.total))} {unitLabel}</strong>
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
            <label htmlFor="P0">P0（基準單價）</label>
            <input
              id="P0"
              type="number"
              min="0"
              step="0.1"
              value={P0}
              onChange={(event) => setP0(event.target.value)}
            />
          </div>
          <div className="control">
            <label htmlFor="kMax">kMax（最大虛坪縮減比例）</label>
            <input
              id="kMax"
              type="number"
              min="0"
              max="0.99"
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
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-button ${basis === 'T' ? 'active' : ''}`}
            onClick={() => setBasis('T')}
          >
            銷售口徑：權狀 T（預設）
          </button>
          <button
            type="button"
            className={`toggle-button ${basis === 'A' ? 'active' : ''}`}
            onClick={() => setBasis('A')}
          >
            銷售口徑：室內 A
          </button>
        </div>
        {kNearLimit ? <p className="note">提示：k 接近 1 會導致單價趨近無限，已自動限制。</p> : null}
        <div className="chart-grid">
          <div className="card">
            <h3>單價上調敏感度曲線（P1 = P0 / (1 - k)）</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={sensitivityData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="k" tickFormatter={(value) => `${value}`} />
                <YAxis domain={[1, 'auto']} />
                <Tooltip formatter={(value) => `${value}`} />
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
                <strong>{formatNumber(clamp(parseNumber(kMax, 0), 0, 1 - EPSILON) * 100, 1)}%</strong>
              </div>
              <div className="summary-item">
                <span>最高單價</span>
                <strong>
                  {formatNumber(
                    sensitivityData.length
                      ? sensitivityData[sensitivityData.length - 1].P1
                      : 1,
                    3
                  )}
                </strong>
              </div>
              <div className="summary-item">
                <span>目前情境 k</span>
                <strong>{formatNumber(sales.kCurrent * 100, 2)}%</strong>
              </div>
              <div className="summary-item">
                <span>目前情境 P1</span>
                <strong>{formatNumber(sales.P1, 2)}</strong>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>情境對應表</h3>
          <table className="table">
            <thead>
              <tr>
                <th>k</th>
                <th>S0</th>
                <th>S1</th>
                <th>P1</th>
                <th>ΔP%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{formatNumber(sales.kCurrent, 3)}</td>
                <td>
                  {formatNumber(displayArea(sales.S0))} {unitLabel}
                </td>
                <td>
                  {formatNumber(displayArea(sales.S1))} {unitLabel}
                </td>
                <td>{formatNumber(sales.P1, 2)}</td>
                <td>{formatNumber(sales.delta * 100, 2)}%</td>
              </tr>
            </tbody>
          </table>
          <p className="note">
            S0/S1 依銷售口徑與目前情境計算；P0 單位可自訂（例：萬/坪 或 萬/m²）。
          </p>
        </div>
      </section>

      <section className="section">
        <h2>3｜差異摘要與解讀</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span>改革前實坪</span>
            <strong>{formatNumber(displayArea(parsed.usable0))} {unitLabel}</strong>
          </div>
          <div className="summary-item">
            <span>改革後實坪</span>
            <strong>{formatNumber(displayArea(parsed.usable1))} {unitLabel}</strong>
          </div>
          <div className="summary-item">
            <span>改革前虛坪</span>
            <strong>{formatNumber(displayArea(parsed.virtual0))} {unitLabel}</strong>
          </div>
          <div className="summary-item">
            <span>改革後虛坪</span>
            <strong>{formatNumber(displayArea(parsed.virtual1))} {unitLabel}</strong>
          </div>
          <div className="summary-item">
            <span>改革後總面積</span>
            <strong>{formatNumber(displayArea(parsed.total1))} {unitLabel}</strong>
          </div>
          <div className="summary-item">
            <span>改革前總面積</span>
            <strong>{formatNumber(displayArea(parsed.total0))} {unitLabel}</strong>
          </div>
        </div>
        <p className="note">
          差異摘要可直接觀察虛坪縮減在不同口徑下對實坪、虛坪與總面積的影響，
          便於評估銷售敘事與價格調整策略。
        </p>
      </section>

      <section className="section">
        <h2>計算式／代表符號說明</h2>
        <ul className="note">
          <li>r：虛坪率（公設比）。</li>
          <li>T：權狀面積（總面積）。</li>
          <li>A：室內面積（實坪）。</li>
          <li>C：公設面積（虛坪）。</li>
          <li>關係式：A = T(1-r)，C = Tr，T = A/(1-r)，C = T - A。</li>
          <li>單位：1 坪 = 3.305785 m²；坪 = m² / 3.305785；m² = 坪 × 3.305785。</li>
          <li>單價策略（總銷固定）：R = P×S，若 S1 = S0(1-k) ⇒ P1 = P0/(1-k)，ΔP% = 1/(1-k) - 1。</li>
          <li>S（銷售口徑面積）預設為權狀 T，可切換為室內 A。</li>
        </ul>
      </section>
    </div>
  );
}
