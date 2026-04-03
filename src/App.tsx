import { useState, useEffect } from "react";

interface Config {
  pair: string;
  lots: number;
  pipValue: number;
  usdEur: number;
}

interface PipResult {
  usd: number;
  eur: number;
  positive: boolean;
}

interface AmountResult {
  pips: number;
}

const DEFAULT_CONFIG: Config = {
  pair: "XAUUSD",
  lots: 0.02,
  pipValue: 0.2,
  usdEur: 0.92,
};

function formatNum(n: number, decimals: number = 2): string {
  return Number(n).toFixed(decimals);
}

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0a0a0f;
    font-family: "Courier New", monospace;
    min-height: 100vh;
  }

  .page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    background: #0a0a0f;
  }

  .card-wrap {
    width: 100%;
    max-width: 560px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 24px;
  }

  .header-tag {
    font-size: 11px;
    letter-spacing: 6px;
    color: #f0b429;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  .header-title {
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 2px;
  }

  .header-sub {
    font-size: 13px;
    color: #555;
    margin-top: 6px;
    letter-spacing: 3px;
  }

  .rate-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
    min-height: 24px;
    font-size: 11px;
    letter-spacing: 2px;
  }

  .card {
    background: #12121a;
    border: 1px solid #222;
    border-radius: 14px;
    padding: 20px 24px;
    margin-bottom: 16px;
  }

  .config-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chips {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  .chip-label {
    font-size: 9px;
    color: #444;
    letter-spacing: 2px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .chip-value {
    font-size: 14px;
    color: #f0b429;
    font-weight: 700;
    margin-top: 2px;
  }

  .edit-btn {
    background: transparent;
    border: 1px solid #f0b429;
    color: #f0b429;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 11px;
    cursor: pointer;
    letter-spacing: 1px;
    font-family: "Courier New", monospace;
    white-space: nowrap;
  }

  .fields-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 16px;
  }

  .field-label {
    font-size: 10px;
    color: #555;
    margin-bottom: 5px;
    letter-spacing: 2px;
  }

  .field-input {
    width: 100%;
    background: #0a0a0f;
    border: 1px solid #333;
    border-radius: 8px;
    color: #fff;
    padding: 10px 12px;
    font-size: 14px;
    font-family: "Courier New", monospace;
  }

  .field-input:focus {
    outline: none;
    border-color: #f0b429;
  }

  .save-btn {
    width: 100%;
    background: #f0b429;
    border: none;
    border-radius: 10px;
    color: #0a0a0f;
    padding: 12px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 2px;
    font-family: "Courier New", monospace;
    margin-top: 4px;
  }

  .tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
  }

  .tab-btn {
    flex: 1;
    border-radius: 10px;
    padding: 12px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 2px;
    font-family: "Courier New", monospace;
    transition: all 0.2s;
  }

  .tab-btn.active {
    background: #f0b429;
    border: none;
    color: #0a0a0f;
  }

  .tab-btn.inactive {
    background: #12121a;
    border: 1px solid #222;
    color: #555;
  }

  .section-label {
    font-size: 10px;
    color: #555;
    letter-spacing: 3px;
    margin-bottom: 12px;
  }

  .input-row {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
  }

  .main-input {
    flex: 1;
    background: #0a0a0f;
    border: 1px solid #333;
    border-radius: 10px;
    color: #fff;
    padding: 14px 16px;
    font-size: 22px;
    font-family: "Courier New", monospace;
  }

  .main-input:focus {
    outline: none;
    border-color: #f0b429;
  }

  .clear-btn {
    background: #1a1a25;
    border: 1px solid #333;
    border-radius: 10px;
    color: #555;
    padding: 0 16px;
    font-size: 18px;
    cursor: pointer;
  }

  .currency-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .currency-btn {
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: "Courier New", monospace;
    letter-spacing: 1px;
  }

  .currency-btn.active {
    background: #f0b429;
    border: none;
    color: #0a0a0f;
  }

  .currency-btn.inactive {
    background: #0a0a0f;
    border: 1px solid #333;
    color: #555;
  }

  .results {
    display: grid;
    gap: 10px;
  }

  .result-box {
    background: #0a0a0f;
    border-radius: 10px;
    padding: 16px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .result-label {
    font-size: 12px;
    color: #555;
    letter-spacing: 2px;
  }

  .result-value {
    font-size: 26px;
    font-weight: 700;
    font-family: "Courier New", monospace;
  }

  .formula-box {
    background: #0a0a0f;
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 11px;
    color: #444;
    letter-spacing: 1px;
    line-height: 1.6;
  }

  .footer-info {
    text-align: center;
    margin-top: 20px;
    font-size: 10px;
    color: #2a2a35;
    letter-spacing: 2px;
  }

  .tg-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin-top: 16px;
    padding: 16px 24px;
    background: #0088cc0d;
    border: 1px solid #0088cc33;
    border-radius: 14px;
    text-decoration: none;
    transition: background 0.2s;
  }

  .tg-link:hover {
    background: #0088cc22;
  }

  .tg-title {
    font-size: 13px;
    font-weight: 700;
    color: #0088cc;
    letter-spacing: 3px;
  }

  .tg-sub {
    font-size: 10px;
    color: #0088cc55;
    letter-spacing: 1px;
    margin-top: 3px;
  }

  @keyframes ping {
    0% { transform: scale(1); opacity: 0.8; }
    70% { transform: scale(2.4); opacity: 0; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 3px #22c55e; }
    50% { box-shadow: 0 0 10px #22c55e; }
  }
  .dot-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
  }
  .dot-ping {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(34,197,94,0.3);
    animation: ping 1.8s ease-out infinite;
  }
  .dot-core {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #22c55e;
    position: relative;
    z-index: 1;
    animation: glow 2s ease-in-out infinite;
  }

  @media (min-width: 768px) {
    .page {
      align-items: center;
      padding: 60px 40px;
    }
    .card-wrap {
      max-width: 620px;
    }
    .header-title {
      font-size: 34px;
    }
    .header-tag {
      font-size: 12px;
    }
    .header-sub {
      font-size: 14px;
    }
    .chip-value {
      font-size: 15px;
    }
    .result-value {
      font-size: 30px;
    }
    .main-input {
      font-size: 26px;
      padding: 16px 18px;
    }
    .tab-btn {
      font-size: 14px;
      padding: 14px;
    }
  }

  @media (min-width: 1200px) {
    .card-wrap {
      max-width: 680px;
    }
    .header-title {
      font-size: 38px;
      letter-spacing: 4px;
    }
    .card {
      padding: 26px 32px;
    }
    .result-value {
      font-size: 34px;
    }
    .main-input {
      font-size: 30px;
    }
  }

  @media (max-width: 400px) {
    .header-title {
      font-size: 20px;
    }
    .chips {
      gap: 12px;
    }
    .chip-value {
      font-size: 12px;
    }
    .result-value {
      font-size: 22px;
    }
    .main-input {
      font-size: 18px;
    }
    .tab-btn {
      font-size: 11px;
      padding: 10px 6px;
      letter-spacing: 1px;
    }
  }
`;

function Chip({ label, value, live }: { label: string; value: string; live?: boolean }) {
  return (
    <div>
      <div className="chip-label">
        {label.toUpperCase()}
        {live && (
          <div className="dot-wrap">
            <div className="dot-ping" />
            <div className="dot-core" />
          </div>
        )}
      </div>
      <div className="chip-value">{value}</div>
    </div>
  );
}

function ResultBox({ label, value, positive, gold }: { label: string; value: string; positive: boolean; gold?: boolean }) {
  const color = gold ? "#f0b429" : positive ? "#22c55e" : "#ef4444";
  return (
    <div className="result-box" style={{ borderLeft: "3px solid " + color, border: "1px solid " + color + "22", borderLeftWidth: 3, borderLeftColor: color }}>
      <span className="result-label">{label}</span>
      <span className="result-value" style={{ color }}>{value}</span>
    </div>
  );
}

export default function App() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Config>(DEFAULT_CONFIG);
  const [rateStatus, setRateStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [rateDate, setRateDate] = useState<string | null>(null);

  const [pips, setPips] = useState("");
  const [pipResult, setPipResult] = useState<PipResult | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [amountResult, setAmountResult] = useState<AmountResult | null>(null);
  const [activeTab, setActiveTab] = useState("pips");

  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=USD&to=EUR")
      .then((r) => r.json())
      .then((data) => {
        const rate: number = data.rates.EUR;
        setConfig((c) => ({ ...c, usdEur: rate }));
        setDraft((d) => ({ ...d, usdEur: rate }));
        setRateDate(data.date);
        setRateStatus("live");
      })
      .catch(() => setRateStatus("fallback"));
  }, []);

  useEffect(() => {
    if (pips === "" || isNaN(Number(pips))) { setPipResult(null); return; }
    const val = Number(pips);
    setPipResult({ usd: val * config.pipValue, eur: val * config.pipValue * config.usdEur, positive: val >= 0 });
  }, [pips, config]);

  useEffect(() => {
    if (amount === "" || isNaN(Number(amount))) { setAmountResult(null); return; }
    const usd = currency === "USD" ? Number(amount) : Number(amount) / config.usdEur;
    setAmountResult({ pips: usd / config.pipValue });
  }, [amount, currency, config]);

  const fields: { key: keyof Config; label: string; type: string }[] = [
    { key: "pair", label: "Par", type: "text" },
    { key: "lots", label: "Lotes", type: "number" },
    { key: "pipValue", label: "USD por pip", type: "number" },
    { key: "usdEur", label: "Rate USD a EUR", type: "number" },
  ];

  return (
    <div className="page">
      <style>{STYLES}</style>
      <div className="card-wrap">

        <div className="header">
          <div className="header-tag">Trading Tool</div>
          <div className="header-title">PIPSWINNERS CALCULATOR</div>
          <div className="header-sub">USD - EUR - PIPS</div>
        </div>

        <div className="rate-banner">
          {rateStatus === "loading" && <span style={{ color: "#444" }}>OBTENIENDO TASA EN VIVO...</span>}
          {rateStatus === "live" && (
            <>
              <div className="dot-wrap"><div className="dot-ping" /><div className="dot-core" /></div>
              <span style={{ color: "#22c55e" }}>USD/EUR EN VIVO - {rateDate}</span>
            </>
          )}
          {rateStatus === "fallback" && <span style={{ color: "#f0b429" }}>TASA MANUAL - EDITA EN CONFIG</span>}
        </div>

        <div className="card">
          <div className="config-row">
            <div className="chips">
              {!editing && (
                <>
                  <Chip label="Par" value={config.pair} />
                  <Chip label="Lotes" value={String(config.lots)} />
                  <Chip label="$/pip" value={"$" + config.pipValue} />
                  <Chip label="EUR rate" value={rateStatus === "loading" ? "..." : formatNum(config.usdEur, 4)} live={rateStatus === "live"} />
                </>
              )}
              {editing && <span style={{ color: "#f0b429", fontSize: 12, letterSpacing: 2 }}>EDITAR CONFIG</span>}
            </div>
            <button className="edit-btn" onClick={() => { setEditing(!editing); setDraft(config); }}>
              {editing ? "CANCELAR" : "EDITAR"}
            </button>
          </div>

          {editing && (
            <div className="fields-grid">
              {fields.map((f) => (
                <div key={f.key}>
                  <div className="field-label">{f.label.toUpperCase()}</div>
                  <input className="field-input" type={f.type} value={String(draft[f.key])}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <button className="save-btn" onClick={() => {
                  setConfig({ pair: String(draft.pair), lots: Number(draft.lots), pipValue: Number(draft.pipValue), usdEur: Number(draft.usdEur) });
                  setEditing(false);
                }}>GUARDAR</button>
              </div>
            </div>
          )}
        </div>

        <div className="tabs">
          <button className={"tab-btn " + (activeTab === "pips" ? "active" : "inactive")} onClick={() => setActiveTab("pips")}>PIPS a $</button>
          <button className={"tab-btn " + (activeTab === "amount" ? "active" : "inactive")} onClick={() => setActiveTab("amount")}>$ a PIPS</button>
        </div>

        {activeTab === "pips" && (
          <div className="card">
            <div className="section-label">INGRESA PIPS</div>
            <div className="input-row">
              <input className="main-input" type="number" placeholder="ej: 150 o -80" value={pips} onChange={(e) => setPips(e.target.value)} />
              <button className="clear-btn" onClick={() => setPips("")}>X</button>
            </div>
            {pipResult && (
              <div className="results">
                <ResultBox label="USD" value={(pipResult.positive ? "+" : "") + "$" + formatNum(pipResult.usd)} positive={pipResult.positive} />
                <ResultBox label="EUR" value={(pipResult.positive ? "+" : "") + formatNum(pipResult.eur) + " EUR"} positive={pipResult.positive} />
                <div className="formula-box">
                  {Math.abs(Number(pips))} pips x ${config.pipValue}/pip = ${formatNum(Math.abs(pipResult.usd))} = {formatNum(Math.abs(pipResult.eur))} EUR @ {formatNum(config.usdEur, 4)}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "amount" && (
          <div className="card">
            <div className="section-label">INGRESA IMPORTE</div>
            <div className="currency-row">
              <button className={"currency-btn " + (currency === "USD" ? "active" : "inactive")} onClick={() => setCurrency("USD")}>$ USD</button>
              <button className={"currency-btn " + (currency === "EUR" ? "active" : "inactive")} onClick={() => setCurrency("EUR")}>EUR</button>
            </div>
            <div className="input-row">
              <input className="main-input" type="number" placeholder={currency === "USD" ? "ej: 30" : "ej: 27"} value={amount} onChange={(e) => setAmount(e.target.value)} />
              <button className="clear-btn" onClick={() => setAmount("")}>X</button>
            </div>
            {amountResult && (
              <div className="results">
                <ResultBox label="PIPS" value={formatNum(amountResult.pips, 1) + " pips"} positive={true} gold />
                <div className="formula-box">
                  {currency === "EUR"
                    ? formatNum(Number(amount), 2) + " EUR / " + formatNum(config.usdEur, 4) + " = $" + formatNum(Number(amount) / config.usdEur) + " / $" + config.pipValue + "/pip"
                    : "$" + amount + " / $" + config.pipValue + "/pip"} = {formatNum(amountResult.pips, 1)} pips
                </div>
              </div>
            )}
          </div>
        )}

        <div className="footer-info">{config.pair} - {config.lots} LOTS - ${config.pipValue}/PIP</div>

        <a className="tg-link" href="https://t.me/PIPSWINNERSCOMMUNITY" target="_blank" rel="noopener noreferrer">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#0088cc">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.64-.203-.658-.64.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
          </svg>
          <div>
            <div className="tg-title">UNETE A LA COMUNIDAD</div>
            <div className="tg-sub">t.me/PIPSWINNERSCOMMUNITY</div>
          </div>
        </a>

      </div>
    </div>
  );
}
