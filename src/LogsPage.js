import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaTerminal, FaCopy, FaFilePdf, FaSyncAlt, FaSearch, FaExclamationTriangle } from "react-icons/fa";

const API = "https://aroha.onrender.com/admin/logs";
const levelOf = (entry) => entry.level === "error" ? "error" : entry.level === "warn" ? "warning" : entry.level === "info" ? "info" : (/error|failed|exception|rejected/i.test(entry.message || "") ? "error" : /warn/i.test(entry.message || "") ? "warning" : "info");
const levelColor = { error: "#fca5a5", warning: "#fcd34d", info: "#6ee7b7" };
const btn = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 14px", borderRadius: 10, border: "1px solid #334155", background: "#182337", color: "#f8fafc", fontWeight: 800, cursor: "pointer" };

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [hours, setHours] = useState("6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [live, setLive] = useState(true);
  const [connection, setConnection] = useState("connecting");

  const loadLogs = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(API + "?hours=" + encodeURIComponent(hours) + "&limit=100", { cache: "no-store", headers: { Authorization: "Bearer " + localStorage.getItem("sellerToken") } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load logs.");
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setNote(data.note || "");
      setUpdatedAt(new Date());
    } catch (e) {
      setError((e && e.message) || "Unable to load logs. Check that the backend deployment is complete.");
    } finally { setLoading(false); }
  }, [hours]);

  useEffect(() => {
  if (!live) { setConnection("paused"); return undefined; }
  let disposed = false;
  const poll = async () => {
    if (disposed) return;
    try {
      const response = await fetch(API + "?hours=" + encodeURIComponent(hours) + "&limit=100", { cache: "no-store", headers: { Authorization: "Bearer " + localStorage.getItem("sellerToken") } });
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Admin sign-in required to view logs." : "Unable to refresh logs.");
      const data = await response.json();
      if (!disposed) { setLogs(Array.isArray(data.logs) ? data.logs : []); setConnection("live"); setUpdatedAt(new Date()); setError(""); }
    } catch (e) { if (!disposed) { setConnection("reconnecting"); setError(e.message || "Unable to refresh logs."); } }
  };
  poll();
  const timer = setInterval(poll, 10000);
  return () => { disposed = true; clearInterval(timer); };
}, [live, hours]);

  const visible = useMemo(() => logs.filter((entry) => {
    const matchesLevel = level === "all" || levelOf(entry) === level;
    const haystack = [entry.message, entry.timestamp, entry.username, entry.userId, entry.role, entry.event, entry.path].filter(Boolean).join(" ");
    return matchesLevel && haystack.toLowerCase().includes(search.toLowerCase());
  }), [logs, search, level]);

  async function copyLogs() {
    try {
      await navigator.clipboard.writeText(visible.map((entry) => "[" + entry.timestamp + "] [" + levelOf(entry).toUpperCase() + "] [" + (entry.username || "Unknown") + " / " + (entry.userId || "system") + "] " + (entry.event || "") + " " + entry.message).join("\n"));
    } catch (_) { setError("Clipboard was blocked by your browser. You can select the log text and copy it manually."); }
  }

  const count = (name) => logs.filter((entry) => levelOf(entry) === name).length;

  return <main style={{ minHeight: "100vh", background: "#080d18", color: "#e5e7eb", padding: "clamp(14px,3vw,34px)", fontFamily: "Inter,system-ui,-apple-system,Segoe UI,sans-serif" }}>
    <style>{`
      *{box-sizing:border-box}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
      .logrow{display:grid;grid-template-columns:180px 90px minmax(0,1fr);gap:12px;padding:13px 16px;border-bottom:1px solid #243044;align-items:start}
      .logmsg{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace}
      @media(max-width:760px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.logrow{grid-template-columns:1fr;gap:5px}.logtime{font-size:11px}}
      @media print{body{background:white!important}.noprint{display:none!important}main{background:white!important;color:#111827!important;padding:0!important}.panel{background:white!important;color:#111827!important;border:1px solid #ddd!important;box-shadow:none!important}.logrow{grid-template-columns:135px 70px minmax(0,1fr);border-color:#ddd;padding:8px}.logmsg{color:#111827!important;font-size:9px}}
    `}</style>
    <div style={{ maxWidth: 1450, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ width: 54, height: 54, display: "grid", placeItems: "center", borderRadius: 16, background: "linear-gradient(135deg,#34d399,#22d3ee)", color: "#062018", fontSize: 24 }}><FaTerminal /></div>
        <div style={{ flex: "1 1 240px" }}><div style={{ color: "#5eead4", fontSize: 11, fontWeight: 900, letterSpacing: ".15em" }}>AROHA • OPERATIONS</div><h1 style={{ margin: "4px 0", fontSize: "clamp(27px,4vw,38px)", letterSpacing: "-.04em" }}>Runtime Logs</h1><div style={{ color: "#94a3b8", fontSize: 13 }}>Aroha backend · newest events first</div></div>
        <span style={{display:"inline-flex",alignItems:"center",gap:7,color:connection==="live"?"#6ee7b7":connection==="reconnecting"?"#fcd34d":"#94a3b8",fontSize:12,fontWeight:900}}>{connection==="live"?"● LIVE TAIL":connection==="reconnecting"?"● RECONNECTING":connection==="paused"?"● PAUSED":"● CONNECTING"}</span><button style={btn} onClick={() => setLive((value) => !value)}>{live ? "Pause live" : "Resume live"}</button><button style={btn} onClick={loadLogs} disabled={loading}><FaSyncAlt /> {loading ? "Refreshing…" : "Refresh history"}</button>
      </header>

      <section className="panel" style={{ background: "linear-gradient(145deg,#111a2c,#0d1422)", border: "1px solid #29364a", borderRadius: 18, padding: 16, marginBottom: 16, boxShadow: "0 18px 45px #0003" }}>
        <div className="stats">
          {[["TOTAL LOGS", logs.length, "#f8fafc"], ["ERRORS", count("error"), "#fca5a5"], ["WARNINGS", count("warning"), "#fcd34d"], ["INFO", count("info"), "#6ee7b7"]].map(([label, value, color]) => <div key={label} style={{ padding: 15, borderRadius: 12, background: "#0a1220", border: "1px solid #29364a" }}><div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 900, letterSpacing: ".12em" }}>{label}</div><div style={{ color, fontSize: 28, fontWeight: 900, marginTop: 6 }}>{value}</div></div>)}
        </div>
        <div className="noprint" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 15 }}>
          <div style={{ flex: "2 1 230px", position: "relative" }}><FaSearch style={{ position: "absolute", top: 15, left: 13, color: "#64748b" }} /><input aria-label="Search logs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search errors, order IDs, messages…" style={{ width: "100%", padding: 12, paddingLeft: 38, borderRadius: 10, border: "1px solid #344256", background: "#0b1220", color: "white" }} /></div>
          <select aria-label="Filter severity" value={level} onChange={(e) => setLevel(e.target.value)} style={{ padding: 12, borderRadius: 10, border: "1px solid #344256", background: "#0b1220", color: "white" }}><option value="all">All levels</option><option value="error">Errors</option><option value="warning">Warnings</option><option value="info">Info</option></select>
          <select aria-label="Time range" value={hours} onChange={(e) => setHours(e.target.value)} style={{ padding: 12, borderRadius: 10, border: "1px solid #344256", background: "#0b1220", color: "white" }}><option value="1">Last hour</option><option value="6">Last 6 hours</option><option value="24">Last 24 hours</option><option value="72">Last 3 days</option><option value="168">Last 7 days</option></select>
          <button style={btn} onClick={copyLogs}><FaCopy /> Copy logs</button>
          <button style={{ ...btn, background: "#0f766e", borderColor: "#0f766e" }} onClick={() => window.print()}><FaFilePdf /> Save PDF</button>
        </div>
        <div style={{ color: "#64748b", fontSize: 11, marginTop: 12 }}>{visible.length} entries shown · {updatedAt ? "Last updated " + updatedAt.toLocaleTimeString() : "Loading"} · refresh to fetch new entries</div>
      </section>

      {error && <div role="alert" style={{ marginBottom: 14, padding: 13, borderRadius: 10, color: "#fecaca", background: "#451a1a", border: "1px solid #7f1d1d" }}><FaExclamationTriangle /> {error}</div>}
      {note && <p style={{ color: "#94a3b8", fontSize: 12 }}>{note}</p>}
      <section className="panel" style={{ background: "#111a2c", border: "1px solid #29364a", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: 16, borderBottom: "1px solid #29364a", gap: 10 }}><strong>Log stream <span style={{ color: "#64748b", fontWeight: 500 }}> / {visible.length} entries</span></strong><span style={{ color: "#34d399", fontSize: 11, fontWeight: 900 }}>● BACKEND</span></div>
        {visible.length === 0 ? <div style={{ padding: 36, textAlign: "center", color: "#94a3b8" }}>{loading ? "Loading logs…" : "No matching logs. Try Refresh or change the time range."}</div> : visible.map((entry, i) => { const severity = levelOf(entry); return <div className="logrow" key={entry.id || (entry.timestamp + "-" + i)}><div className="logtime" style={{ color: "#94a3b8", fontSize: 11 }}>{new Date(entry.timestamp).toLocaleString()}</div><div style={{ color: levelColor[severity], fontSize: 10, fontWeight: 900 }}>{severity.toUpperCase()}</div><div className="logmsg"><strong>{entry.username || "Unknown"} · {entry.userId || "System"} · {entry.event || "runtime.console"}</strong>{"\n"}{entry.message}</div></div>; })}
      </section>
      <footer className="noprint" style={{ textAlign: "center", color: "#475569", fontSize: 11, padding: 22 }}>Logs are held in memory and reset whenever the backend restarts. This page shows sanitized application runtime logs, not Render build/deploy history.</footer>
    </div>
  </main>;
}
