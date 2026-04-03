import { useState, useEffect, useRef } from "react";

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
  lots: 0.01,
  pipValue: 0.1,
  usdEur: 0.92,
};

function formatNum(n: number, decimals = 2): string {
  return Number(n).toFixed(decimals);
}

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root {
    width: 100%;
    min-height: 100vh;
    background: #0a0a0f;
    font-family: "Courier New", Courier, monospace;
  }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
  input:focus { outline: none; border-color: #f0b429 !important; }
  button:focus { outline: none; }

  @keyframes ping {
    0%   { transform: scale(1);   opacity: 0.8; }
    70%  { transform: scale(2.4); opacity: 0;   }
    100% { transform: scale(2.4); opacity: 0;   }
  }
  @keyframes glow {
    0%,100% { box-shadow: 0 0 3px #22c55e; }
    50%     { box-shadow: 0 0 10px #22c55e; }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-6px); }
  }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes resultPop {
    0%   { transform: scale(0.95); opacity: 0; }
    60%  { transform: scale(1.02); }
    100% { transform: scale(1);    opacity: 1; }
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

  .page-enter { animation: fadeIn 0.6s ease both; }

  .header-title {
    animation: float 4s ease-in-out infinite;
  }

  .card-animate {
    animation: fadeSlideIn 0.5s ease both;
  }

  .result-animate {
    animation: resultPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  .tab-btn {
    transition: background 0.2s, color 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .tab-btn:hover {
    transform: translateY(-1px);
  }
  .tab-btn.active {
    box-shadow: 0 4px 20px rgba(240,180,41,0.35);
  }

  .edit-btn {
    transition: background 0.2s, color 0.2s, transform 0.15s;
  }
  .edit-btn:hover {
    background: rgba(240,180,41,0.1) !important;
    transform: translateY(-1px);
  }

  .save-btn {
    transition: transform 0.15s, box-shadow 0.2s;
  }
  .save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(240,180,41,0.4);
  }

  .tg-link {
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .tg-link:hover {
    background: rgba(0,136,204,0.15) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0,136,204,0.2);
  }

  .clear-btn {
    transition: background 0.15s, color 0.15s;
  }
  .clear-btn:hover {
    background: #2a2a35 !important;
    color: #aaa !important;
  }

  .currency-btn {
    transition: background 0.15s, color 0.15s, transform 0.15s;
  }
  .currency-btn:hover {
    transform: translateY(-1px);
  }

  .main-input {
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .main-input:focus {
    box-shadow: 0 0 0 2px rgba(240,180,41,0.2);
  }

  .scanline {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(240,180,41,0.08), transparent);
    animation: scanline 8s linear infinite;
    pointer-events: none;
    z-index: 0;
  }

  .particles-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }

  .content {
    position: relative;
    z-index: 1;
  }
`;

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = [];
    const colors = ["#f0b42920", "#22c55e18", "#0088cc15"];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animId: number;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas" />;
}

function Chip({ label, value, live }: { label: string; value: string; live?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: 9, color: "#444", letterSpacing: 2, whiteSpace: "nowrap" }}>
          {label.toUpperCase()}
        </span>
        {live && (
          <div className="dot-wrap">
            <div className="dot-ping" />
            <div className="dot-core" />
          </div>
        )}
      </div>
      <span style={{ fontSize: 14, color: "#f0b429", fontWeight: 700, whiteSpace: "nowrap" }}>
        {value}
      </span>
    </div>
  );
}

function ResultBox({ label, value, positive, gold }: { label: string; value: string; positive: boolean; gold?: boolean }) {
  const color = gold ? "#f0b429" : positive ? "#22c55e" : "#ef4444";
  return (
    <div
      className="result-animate"
      style={{
        background: "linear-gradient(135deg, #0e0e18, #0a0a0f)",
        borderRadius: 10,
        padding: "14px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderLeft: "3px solid " + color,
        border: "1px solid " + color + "33",
        borderLeftWidth: 3,
        borderLeftColor: color,
        boxShadow: "0 2px 16px " + color + "15",
      }}
    >
      <span style={{ fontSize: 12, color: "#555", letterSpacing: 2 }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "Courier New, monospace", textShadow: "0 0 20px " + color + "66" }}>
        {value}
      </span>
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

  const [vw, setVw] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setVw(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const isMobile = vw < 600;
  const cardW = isMobile ? "100%" : Math.min(560, vw - 80) + "px";

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
    { key: "pair",     label: "Par",            type: "text"   },
    { key: "lots",     label: "Lotes",          type: "number" },
    { key: "pipValue", label: "USD por pip",    type: "number" },
    { key: "usdEur",   label: "Rate USD > EUR", type: "number" },
  ];

  const inputStyle = {
    flex: 1,
    background: "#0a0a0f",
    border: "1px solid #2a2a35",
    borderRadius: 10,
    color: "#fff",
    padding: isMobile ? "12px 14px" : "14px 18px",
    fontSize: isMobile ? 22 : 26,
    fontFamily: "Courier New, monospace",
    width: "100%",
  };

  const clearBtnStyle = {
    background: "#1a1a25",
    border: "1px solid #2a2a35",
    borderRadius: 10,
    color: "#666",
    padding: "0 16px",
    fontSize: 16,
    cursor: "pointer",
    flexShrink: 0,
    minWidth: 44,
    height: isMobile ? 50 : 58,
    fontFamily: "Courier New, monospace",
  };

  const cardStyle = {
    background: "linear-gradient(135deg, #13131e 0%, #0f0f17 100%)",
    border: "1px solid #1e1e2e",
    borderRadius: 16,
    padding: isMobile ? "16px 18px" : "22px 28px",
    marginBottom: 14,
    boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
  };

  return (
    <div
      className="page-enter"
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #1a1208 0%, #0a0a0f 60%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "24px 16px" : "48px 40px",
        position: "relative",
      }}
    >
      <style>{GLOBAL_CSS}</style>
      <ParticleCanvas />
      <div className="scanline" />

      <div className="content" style={{ width: cardW }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            fontSize: 11,
            letterSpacing: 6,
            color: "#f0b429",
            marginBottom: 10,
            textTransform: "uppercase",
            background: "linear-gradient(90deg, #f0b429, #ffd97d, #f0b429)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 3s linear infinite",
          }}>
            Trading Tool
          </div>
          <div
            className="header-title"
            style={{
              fontSize: isMobile ? 22 : 30,
              fontWeight: 700,
              letterSpacing: 2,
              background: "linear-gradient(135deg, #ffffff 0%, #cccccc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            PIPSWINNERS CALCULATOR
          </div>
          <div style={{ fontSize: 12, color: "#333", marginTop: 6, letterSpacing: 4 }}>
            USD - EUR - PIPS
          </div>
        </div>

        {/* RATE BANNER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 18, minHeight: 22, fontSize: 10, letterSpacing: 2 }}>
          {rateStatus === "loading" && <span style={{ color: "#333" }}>OBTENIENDO TASA EN VIVO...</span>}
          {rateStatus === "live" && (
            <>
              <div className="dot-wrap"><div className="dot-ping" /><div className="dot-core" /></div>
              <span style={{ color: "#22c55e" }}>USD/EUR EN VIVO - {rateDate}</span>
            </>
          )}
          {rateStatus === "fallback" && <span style={{ color: "#f0b429" }}>TASA MANUAL - EDITA EN CONFIG</span>}
        </div>

        {/* CONFIG CARD */}
        <div className="card-animate" style={{ ...cardStyle, animationDelay: "0.1s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: editing ? 18 : 0 }}>
            <div style={{ display: "flex", gap: isMobile ? 14 : 22, flexWrap: "wrap", flex: 1 }}>
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
            <button
              className="edit-btn"
              onClick={() => { setEditing(!editing); setDraft(config); }}
              style={{ background: "transparent", border: "1px solid #f0b42966", color: "#f0b429", borderRadius: 8, padding: "6px 14px", fontSize: 11, cursor: "pointer", letterSpacing: 1, fontFamily: "Courier New, monospace", flexShrink: 0 }}
            >
              {editing ? "CANCELAR" : "EDITAR"}
            </button>
          </div>

          {editing && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {fields.map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: 10, color: "#444", marginBottom: 5, letterSpacing: 2 }}>{f.label.toUpperCase()}</div>
                  <input
                    className="main-input"
                    type={f.type}
                    value={String(draft[f.key])}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    style={{ width: "100%", background: "#0a0a0f", border: "1px solid #2a2a35", borderRadius: 8, color: "#fff", padding: "10px 12px", fontSize: 14, fontFamily: "Courier New, monospace", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <button
                  className="save-btn"
                  onClick={() => { setConfig({ pair: String(draft.pair), lots: Number(draft.lots), pipValue: Number(draft.pipValue), usdEur: Number(draft.usdEur) }); setEditing(false); }}
                  style={{ width: "100%", background: "linear-gradient(135deg, #f0b429, #e09a10)", border: "none", borderRadius: 10, color: "#0a0a0f", padding: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 2, fontFamily: "Courier New, monospace" }}
                >
                  GUARDAR
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {[["pips", "PIPS a $"], ["amount", "$ a PIPS"]].map(([key, label]) => (
            <button
              key={key}
              className={"tab-btn " + (activeTab === key ? "active" : "")}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1,
                background: activeTab === key ? "linear-gradient(135deg, #f0b429, #e09a10)" : "#12121a",
                border: activeTab === key ? "none" : "1px solid #1e1e2e",
                borderRadius: 10,
                color: activeTab === key ? "#0a0a0f" : "#444",
                padding: isMobile ? "11px 6px" : "13px 10px",
                fontSize: isMobile ? 12 : 13,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: 2,
                fontFamily: "Courier New, monospace",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* PIPS TAB */}
        {activeTab === "pips" && (
          <div className="card-animate" style={cardStyle}>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 3, marginBottom: 12 }}>INGRESA PIPS</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input className="main-input" type="number" placeholder="ej: 150 o -80" value={pips} onChange={(e) => setPips(e.target.value)} style={inputStyle} />
              <button className="clear-btn" onClick={() => setPips("")} style={clearBtnStyle}>X</button>
            </div>
            {pipResult && (
              <div style={{ display: "grid", gap: 10 }}>
                <ResultBox label="USD" value={(pipResult.positive ? "+" : "") + "$" + formatNum(pipResult.usd)} positive={pipResult.positive} />
                <ResultBox label="EUR" value={(pipResult.positive ? "+" : "") + formatNum(pipResult.eur) + " EUR"} positive={pipResult.positive} />
                <div style={{ background: "#0a0a0f", borderRadius: 10, padding: "11px 14px", fontSize: 11, color: "#333", letterSpacing: 1, lineHeight: 1.7, border: "1px solid #1a1a25" }}>
                  {Math.abs(Number(pips))} pips x ${config.pipValue} = ${formatNum(Math.abs(pipResult.usd))} = {formatNum(Math.abs(pipResult.eur))} EUR @ {formatNum(config.usdEur, 4)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AMOUNT TAB */}
        {activeTab === "amount" && (
          <div className="card-animate" style={cardStyle}>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 3, marginBottom: 12 }}>INGRESA IMPORTE</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["USD", "EUR"].map((c) => (
                <button
                  key={c}
                  className="currency-btn"
                  onClick={() => setCurrency(c)}
                  style={{
                    background: currency === c ? "linear-gradient(135deg, #f0b429, #e09a10)" : "#0a0a0f",
                    border: currency === c ? "none" : "1px solid #2a2a35",
                    borderRadius: 8,
                    color: currency === c ? "#0a0a0f" : "#444",
                    padding: "10px 20px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "Courier New, monospace",
                    letterSpacing: 1,
                  }}
                >
                  {c === "USD" ? "$ USD" : "EUR"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input className="main-input" type="number" placeholder={currency === "USD" ? "ej: 30" : "ej: 27"} value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />
              <button className="clear-btn" onClick={() => setAmount("")} style={clearBtnStyle}>X</button>
            </div>
            {amountResult && (
              <div style={{ display: "grid", gap: 10 }}>
                <ResultBox label="PIPS" value={formatNum(amountResult.pips, 1) + " pips"} positive={true} gold />
                <div style={{ background: "#0a0a0f", borderRadius: 10, padding: "11px 14px", fontSize: 11, color: "#333", letterSpacing: 1, lineHeight: 1.7, border: "1px solid #1a1a25" }}>
                  {currency === "EUR"
                    ? formatNum(Number(amount)) + " EUR / " + formatNum(config.usdEur, 4) + " = $" + formatNum(Number(amount) / config.usdEur) + " / $" + config.pipValue + "/pip"
                    : "$" + amount + " / $" + config.pipValue + "/pip"} = {formatNum(amountResult.pips, 1)} pips
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "#1e1e2e", letterSpacing: 2 }}>
          {config.pair} - {config.lots} LOTS - ${config.pipValue}/PIP
        </div>

        {/* TELEGRAM */}
        <a
          href="https://t.me/PIPSWINNERSCOMMUNITY"
          target="_blank"
          rel="noopener noreferrer"
          className="tg-link"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 14, padding: isMobile ? "14px 18px" : "16px 24px", background: "rgba(0,136,204,0.06)", border: "1px solid rgba(0,136,204,0.2)", borderRadius: 14, textDecoration: "none" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#0088cc">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.64-.203-.658-.64.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
          </svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0088cc", letterSpacing: 3 }}>UNETE A LA COMUNIDAD</div>
            <div style={{ fontSize: 10, color: "#0088cc44", letterSpacing: 1, marginTop: 3 }}>t.me/PIPSWINNERSCOMMUNITY</div>
          </div>
        </a>

      </div>
    </div>
  );
}
