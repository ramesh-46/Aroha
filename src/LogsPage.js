import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaTerminal, FaCopy, FaFilePdf, FaSyncAlt, FaSearch, FaExclamationTriangle } from "react-icons/fa";

const API = "https://aroha.onrender.com/admin/logs";
const classify = (log) => {
  const s = (log.level + " " + log.message).toLowerCase();
  if (/error|failed|exception|rejected|fatal/.test(s)) return "ERROR";
  if (/warn|timeout|slow/.test(s)) return "WARNING";
  if (/debug/.test(s)) return "DEBUG";
  if (/captured|success|connected|verified|created/.test(s)) return "SUCCESS";
  return "INFO";
};
const palette = {
  ERROR: { fg: "#fca5a5", bg: "rgba(239,68,68,.13)", border: "#7f1d1d" },
  WARNING: { fg: "#fcd34d", bg: "rgba(245,158,11,.12)", border: "#854d0e" },
  DEBUG: { fg: "#67e8f9", bg: "rgba(6,182,212,.12)", border: "#155e75" },
  SUCCESS: { fg: "#6ee7b7", bg: "rgba(16,185,129,.12)", border: "#065f46" },
  INFO: { fg: "#cbd5e1", bg: "rgba(148,163,184,.08)", border: "#334155" }
};

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(API, { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Could not load app logs");
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setUpdated(new Date());
    } catch (e) { setError(e.message + ". Check that the Render backend has deployed the latest code."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => logs.filter(x => {
    const type = classify(x);
    return (severity === "ALL" || severity === type) &&
      (!query || (String(x.message || "") + " " + String(x.level || "")).toLowerCase().includes(query.toLowerCase()));
  }), [logs, query, severity]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(filtered.map(x => "[" + new Date(x.timestamp).toLocaleString() + "] [" + classify(x) + "] " + x.message).join("\n")); }
    catch (_) { setError("Clipboard access denied by browser. You can select the log text and copy it manually."); }
  };
  const style = {
    app: { minHeight: "100vh", padding: "clamp(14px,3vw,34px)", background: "#080d18", color: "#e5e7eb", fontFamily: "Inter,system-ui,sans-serif" },
    panel: { background: "linear-gradient(145deg,#111a2c,#0c1321)", border: "1px solid #263248", borderRadius: 18, overflow: "hidden" },
    input: { minWidth: 0, padding: "12px 14px", borderRadius: 10, border: "1px solid #334155", background: "#0a1220", color: "#f8fafc" },
    button: { display: "inline-flex", gap: 8, alignItems: "center", justifyContent: "center", padding: "11px 14px", borderRadius: 10, border: "1px solid #334155", background: "#182337", color: "#f8fafc", fontWeight: 800, cursor: "pointer" }
  };
  return <main style={style.app}>
    <style>{`
      *{box-sizing:border-box}.logrow{display:grid;grid-template-columns:175px 90px minmax(0,1fr);gap:12px;padding:13px 16px;border-bottom:1px solid #202c40;align-items:start}
      .logrow:last-child{border-bottom:0}.logmsg{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace}
      @media(max-width:680px){.logrow{grid-template-columns:1fr;gap:5px}.toolbar>*{flex:1 1 100%!important;width:100%}}
      @media print{body{background:white!important}.noprint{display:none!important}main{background:white!important;color:#111827!important;padding:0!important}.panel{background:white!important;color:#111827!important;border:1px solid #ddd!important;box-shadow:none!important}.logrow{grid-template-columns:130px 70px minmax(0,1fr);padding:8px;border-color:#ddd}.logmsg{font-size:9px;color:#111827!important}}
    `}</style>
    <div style={{maxWidth:1450,margin:"0 auto"}}>
      <header className="noprint" style={{display:"flex",alignItems:"center",gap:15,marginBottom:24,flexWrap:"wrap"}}>
        <div style={{width:56,height:56,borderRadius:16,display:"grid",placeItems:"center",background:"linear-gradient(135deg,#34d399,#22d3ee)",color:"#062018",fontSize:24}}><FaTerminal/></div>
        <div style={{flex:1}}><div style={{fontSize:11,fontWeight:900,letterSpacing:".16em",color:"#5eead4"}}>AROHA • OPERATIONS</div><h1 style={{margin:"4px 0",fontSize:"clamp(26px,4vw,38px)",color:"#f8fafc"}}>Application Logs</h1><div style={{color:"#94a3b8",fontSize:13}}>Recent backend runtime logs · no login screen</div></div>
        <button style={style.button} onClick={load} disabled={loading}><FaSyncAlt/>{loading?"Refreshing…":"Refresh logs"}</button>
      </header>
      <section className="noprint" style={{...style.panel,padding:16,marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10,marginBottom:16}}>
          {[["TOTAL",logs.length,"#f8fafc"],["ERRORS",logs.filter(x=>classify(x)==="ERROR").length,"#fca5a5"],["WARNINGS",logs.filter(x=>classify(x)==="WARNING").length,"#fcd34d"],["SUCCESS",logs.filter(x=>classify(x)==="SUCCESS").length,"#6ee7b7"]].map(([label,value,color])=><div key={label} style={{padding:14,border:"1px solid #29364a",borderRadius:12,background:"#0a1220"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:900,letterSpacing:".12em"}}>{label}</div><div style={{fontSize:28,fontWeight:900,color,marginTop:6}}>{value}</div></div>)}
        </div>
        <div className="toolbar" style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <div style={{flex:"2 1 240px",position:"relative"}}><FaSearch style={{position:"absolute",left:13,top:15,color:"#64748b"}}/><input aria-label="Search logs" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search order ID, Razorpay, error…" style={{...style.input,width:"100%",paddingLeft:38}}/></div>
          <select aria-label="Severity filter" value={severity} onChange={e=>setSeverity(e.target.value)} style={{...style.input,flex:"1 1 140px"}}>{["ALL","ERROR","WARNING","SUCCESS","INFO","DEBUG"].map(x=><option key={x}>{x}</option>)}</select>
          <button style={style.button} onClick={copy}><FaCopy/>Copy filtered logs</button>
          <button style={{...style.button,background:"#0f766e",borderColor:"#0f766e"}} onClick={()=>window.print()}><FaFilePdf/>Save as PDF</button>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap",color:"#64748b",fontSize:11,marginTop:12}}><span>{filtered.length} shown · maximum 500 recent entries kept in memory</span><span>{updated?"Updated "+updated.toLocaleTimeString():"Waiting for backend"}</span></div>
      </section>
      {error&&<div role="alert" style={{padding:14,marginBottom:14,borderRadius:12,color:"#fecaca",background:"#451a1a",border:"1px solid #7f1d1d"}}><FaExclamationTriangle/> {error}</div>}
      <section className="panel" style={style.panel}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:16,borderBottom:"1px solid #263248"}}><strong>Live runtime log buffer</strong><span style={{fontSize:11,fontWeight:900,color:"#34d399"}}>● AROHA BACKEND</span></div>
        {filtered.length===0?<div style={{padding:36,textAlign:"center",color:"#94a3b8"}}>{loading?"Loading logs…":"No matching logs. Refresh after using the app to generate activity."}</div>:filtered.slice().reverse().map((x,i)=>{const type=classify(x),c=palette[type];return <div className="logrow" key={x.id||x.timestamp+"-"+i}><div style={{fontSize:11,color:"#94a3b8"}}>{new Date(x.timestamp).toLocaleString()}</div><div><span style={{display:"inline-block",padding:"4px 7px",borderRadius:6,fontSize:10,fontWeight:900,color:c.fg,background:c.bg,border:"1px solid "+c.border}}>{type}</span></div><div className="logmsg">{x.message}</div></div>})}
      </section>
      <p className="noprint" style={{fontSize:11,color:"#64748b",textAlign:"center",padding:18}}>This page shows sanitized runtime logs collected since the backend last started. Render platform deploy/build logs are not exposed by this page.</p>
    </div>
  </main>;
}
