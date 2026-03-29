import { useState, useEffect } from “react”;

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
pair: “XAUUSD”,
lots: 0.02,
pipValue: 0.20,
usdEur: 0.92,
};

function formatNum(n: number, decimals: number = 2): string {
return Number(n).toFixed(decimals);
}

const PULSE_STYLE = `@keyframes ping { 0% { transform: scale(1); opacity: 0.8; } 70% { transform: scale(2.4); opacity: 0; } 100% { transform: scale(2.4); opacity: 0; } } @keyframes glow { 0%, 100% { box-shadow: 0 0 3px #22c55e; } 50% { box-shadow: 0 0 8px #22c55e, 0 0 16px #22c55e88; } } .dot-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 12px; height: 12px; } .dot-ping { position: absolute; inset: 0; border-radius: 50%; background: #22c55e55; animation: ping 1.8s ease-out infinite; } .dot-core { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; position: relative; z-index: 1; animation: glow 2s ease-in-out infinite; }`;

export default function PipCalculator() {
const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
const [editing, setEditing] = useState(false);
const [draft, setDraft] = useState<Config>(DEFAULT_CONFIG);
const [rateStatus, setRateStatus] = useState<“loading” | “live” | “fallback”>(“loading”);
const [rateDate, setRateDate] = useState<string | null>(null);

const [pips, setPips] = useState(””);
const [pipResult, setPipResult] = useState<PipResult | null>(null);
const [amount, setAmount] = useState(””);
const [currency, setCurrency] = useState(“USD”);
const [amountResult, setAmountResult] = useState<AmountResult | null>(null);
const [activeTab, setActiveTab] = useState(“pips”);

useEffect(() => {
async function fetchRate() {
try {
const res = await fetch(“https://api.frankfurter.app/latest?from=USD&to=EUR”);
const data = await res.json();
const rate: number = data.rates.EUR;
setConfig((c) => ({ …c, usdEur: rate }));
setDraft((d) => ({ …d, usdEur: rate }));
setRateDate(data.date);
setRateStatus(“live”);
} catch {
setRateStatus(“fallback”);
}
}
fetchRate();
}, []);

useEffect(() => {
if (pips === “” || isNaN(Number(pips))) { setPipResult(null); return; }
const val = Number(pips);
const usd = val * config.pipValue;
const eur = usd * config.usdEur;
setPipResult({ usd, eur, positive: val >= 0 });
}, [pips, config]);

useEffect(() => {
if (amount === “” || isNaN(Number(amount))) { setAmountResult(null); return; }
const val = Number(amount);
const usd = currency === “USD” ? val : val / config.usdEur;
setAmountResult({ pips: usd / config.pipValue });
}, [amount, currency, config]);

return (
<div style={{
minHeight: “100vh”,
background: “#0a0a0f”,
display: “flex”,
alignItems: “center”,
justifyContent: “center”,
fontFamily: “‘Courier New’, monospace”,
padding: “20px”,
}}>
<style>{PULSE_STYLE}</style>
<div style={{ width: “100%”, maxWidth: 420 }}>

```
    {/* Header */}
    <div style={{ textAlign: "center", marginBottom: 18 }}>
      <div style={{ fontSize: 11, letterSpacing: 6, color: "#f0b429", marginBottom: 6, textTransform: "uppercase" }}>
        Trading Tool
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: 2 }}>
        PIPSWINNERS CALCULATOR
      </div>
      <div style={{ fontSize: 12, color: "#555", marginTop: 4, letterSpacing: 2 }}>
        USD · EUR · PIPS
      </div>
    </div>

    {/* Live rate banner */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, minHeight: 22 }}>
      {rateStatus === "loading" && (
        <span style={{ fontSize: 10, color: "#444", letterSpacing: 2 }}>⏳ OBTENIENDO TASA EN VIVO...</span>
      )}
      {rateStatus === "live" && (
        <>
          <div className="dot-wrap">
            <div className="dot-ping" />
            <div className="dot-core" />
          </div>
          <span style={{ fontSize: 10, color: "#22c55e", letterSpacing: 2 }}>
            USD/EUR EN VIVO · {rateDate}
          </span>
        </>
      )}
      {rateStatus === "fallback" && (
        <span style={{ fontSize: 10, color: "#f0b429", letterSpacing: 2 }}>⚠ TASA MANUAL · EDITA EN CONFIG</span>
      )}
    </div>

    {/* Config Card */}
    <div style={{ background: "#12121a", border: "1px solid #222", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editing ? 16 : 0 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {!editing && (
            <>
              <Chip label="Par" value={String(config.pair)} />
              <Chip label="Lotes" value={String(config.lots)} />
              <Chip label="$/pip" value={`$${config.pipValue}`} />
              <Chip
                label="€ rate"
                value={rateStatus === "loading" ? "···" : formatNum(config.usdEur, 4)}
                live={rateStatus === "live"}
              />
            </>
          )}
          {editing && <span style={{ color: "#f0b429", fontSize: 12, letterSpacing: 2 }}>EDITAR CONFIG</span>}
        </div>
        <button
          onClick={() => { setEditing(!editing); setDraft(config); }}
          style={{
            background: "transparent", border: "1px solid #f0b429", color: "#f0b429",
            borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", letterSpacing: 1,
          }}
        >
          {editing ? "CANCELAR" : "EDITAR"}
        </button>
      </div>

      {editing && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {([
            { key: "pair", label: "Par", type: "text" },
            { key: "lots", label: "Lotes", type: "number" },
            { key: "pipValue", label: "USD por pip", type: "number" },
            { key: "usdEur", label: "Rate USD→EUR", type: "number" },
          ] as { key: keyof Config; label: string; type: string }[]).map((f) => (
            <div key={f.key}>
              <div style={{ fontSize: 10, color: "#555", marginBottom: 4, letterSpacing: 2 }}>{f.label.toUpperCase()}</div>
              <input
                type={f.type}
                value={String(draft[f.key])}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                style={{
                  width: "100%", background: "#0a0a0f", border: "1px solid #333",
                  borderRadius: 6, color: "#fff", padding: "8px 10px",
                  fontSize: 13, fontFamily: "'Courier New', monospace", boxSizing: "border-box",
                }}
              />
            </div>
          ))}
          <div style={{ gridColumn: "1/-1" }}>
            <button
              onClick={() => {
                setConfig({
                  pair: String(draft.pair),
                  lots: Number(draft.lots),
                  pipValue: Number(draft.pipValue),
                  usdEur: Number(draft.usdEur),
                });
                setEditing(false);
              }}
              style={{
                width: "100%", background: "#f0b429", border: "none", borderRadius: 8,
                color: "#0a0a0f", padding: "10px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", letterSpacing: 2,
              }}
            >
              GUARDAR
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Tabs */}
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {([["pips", "PIPS → $€"], ["amount", "$€ → PIPS"]] as [string, string][]).map(([key, label]) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          style={{
            flex: 1,
            background: activeTab === key ? "#f0b429" : "#12121a",
            border: activeTab === key ? "none" : "1px solid #222",
            borderRadius: 8, color: activeTab === key ? "#0a0a0f" : "#555",
            padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            letterSpacing: 2, transition: "all 0.2s",
          }}
        >
          {label}
        </button>
      ))}
    </div>

    {/* Pips -> USD/EUR */}
    {activeTab === "pips" && (
      <div style={{ background: "#12121a", border: "1px solid #222", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, marginBottom: 10 }}>INGRESA PIPS</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            type="number"
            placeholder="ej: 150 o -80"
            value={pips}
            onChange={(e) => setPips(e.target.value)}
            style={{
              flex: 1, background: "#0a0a0f", border: "1px solid #333",
              borderRadius: 8, color: "#fff", padding: "12px 14px",
              fontSize: 20, fontFamily: "'Courier New', monospace",
            }}
          />
          <button
            onClick={() => setPips("")}
            style={{
              background: "#1a1a25", border: "1px solid #333", borderRadius: 8,
              color: "#555", padding: "0 14px", fontSize: 18, cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        {pipResult && (
          <div style={{ display: "grid", gap: 10 }}>
            <ResultBox label="💵 USD" value={`${pipResult.positive ? "+" : ""}$${formatNum(pipResult.usd)}`} positive={pipResult.positive} />
            <ResultBox label="💶 EUR" value={`${pipResult.positive ? "+" : ""}€${formatNum(pipResult.eur)}`} positive={pipResult.positive} />
            <div style={{ background: "#0a0a0f", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#444", letterSpacing: 1 }}>
              {Math.abs(Number(pips))} pips × ${config.pipValue}/pip = ${formatNum(Math.abs(pipResult.usd))} → €{formatNum(Math.abs(pipResult.eur))} @ {formatNum(config.usdEur, 4)}
            </div>
          </div>
        )}
      </div>
    )}

    {/* USD/EUR -> Pips */}
    {activeTab === "amount" && (
      <div style={{ background: "#12121a", border: "1px solid #222", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, marginBottom: 10 }}>INGRESA IMPORTE</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {["USD", "EUR"].map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                style={{
                  background: currency === c ? "#f0b429" : "#0a0a0f",
                  border: currency === c ? "none" : "1px solid #333",
                  borderRadius: 6, color: currency === c ? "#0a0a0f" : "#555",
                  padding: "0 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                {c === "USD" ? "$" : "€"} {c}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder={currency === "USD" ? "ej: 30" : "ej: 27.60"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              flex: 1, background: "#0a0a0f", border: "1px solid #333",
              borderRadius: 8, color: "#fff", padding: "12px 14px",
              fontSize: 20, fontFamily: "'Courier New', monospace",
            }}
          />
          <button
            onClick={() => setAmount("")}
            style={{
              background: "#1a1a25", border: "1px solid #333", borderRadius: 8,
              color: "#555", padding: "0 14px", fontSize: 18, cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        {amountResult && (
          <div style={{ display: "grid", gap: 10 }}>
            <ResultBox label="📍 PIPS" value={`${formatNum(amountResult.pips, 1)} pips`} positive={true} gold />
            <div style={{ background: "#0a0a0f", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#444", letterSpacing: 1 }}>
              {currency === "EUR"
                ? `€${amount} ÷ ${formatNum(config.usdEur, 4)} = $${formatNum(Number(amount) / config.usdEur)} ÷ $${config.pipValue}/pip`
                : `$${amount} ÷ $${config.pipValue}/pip`} = {formatNum(amountResult.pips, 1)} pips
            </div>
          </div>
        )}
      </div>
    )}

    <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "#2a2a35", letterSpacing: 2 }}>
      {config.pair} · {config.lots} LOTS · ${config.pipValue}/PIP
    </div>

    <a
      href="https://t.me/PIPSWINNERSCOMMUNITY"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        marginTop: 16, padding: "14px 20px",
        background: "linear-gradient(135deg, #0088cc18, #0088cc08)",
        border: "1px solid #0088cc44", borderRadius: 12, textDecoration: "none", cursor: "pointer",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#0088cc">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.64-.203-.658-.64.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
      </svg>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0088cc", letterSpacing: 3 }}>ÚNETE A LA COMUNIDAD</div>
        <div style={{ fontSize: 10, color: "#0088cc66", letterSpacing: 1, marginTop: 3 }}>t.me/PIPSWINNERSCOMMUNITY</div>
      </div>
    </a>
  </div>
</div>
```

);
}

function Chip({ label, value, live }: { label: string; value: string; live?: boolean }) {
return (
<div style={{ display: “flex”, flexDirection: “column” }}>
<div style={{ display: “flex”, alignItems: “center”, gap: 5 }}>
<span style={{ fontSize: 9, color: “#444”, letterSpacing: 2 }}>{label.toUpperCase()}</span>
{live && (
<div className="dot-wrap">
<div className="dot-ping" />
<div className="dot-core" />
</div>
)}
</div>
<span style={{ fontSize: 13, color: “#f0b429”, fontWeight: 700 }}>{value}</span>
</div>
);
}

function ResultBox({ label, value, positive, gold }: { label: string; value: string; positive: boolean; gold?: boolean }) {
const color = gold ? “#f0b429” : positive ? “#22c55e” : “#ef4444”;
return (
<div style={{
background: “#0a0a0f”,
border: `1px solid ${color}22`,
borderLeft: `3px solid ${color}`,
borderRadius: 8, padding: “14px 16px”,
display: “flex”, justifyContent: “space-between”, alignItems: “center”,
}}>
<span style={{ fontSize: 12, color: “#555”, letterSpacing: 2 }}>{label}</span>
<span style={{ fontSize: 22, fontWeight: 700, color, fontFamily: “‘Courier New’, monospace” }}>{value}</span>
</div>
);
}
