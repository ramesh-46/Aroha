import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function RewardsPage() {
  const [data, setData] = useState({ coins: 0, referralCode: "", history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) { setError("Please sign in again to view your rewards."); setLoading(false); return; }
    axios.get("https://aroha.onrender.com/rewards/me", { headers: { Authorization: "Bearer " + token } })
      .then((res) => setData(res.data))
      .catch(() => setError("Rewards could not be loaded. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(data.referralCode); alert("Referral code copied!"); }
    catch (_) { alert("Copy this code: " + data.referralCode); }
  };

  return <main style={{ minHeight: "100vh", padding: "clamp(18px,4vw,48px)", background: "radial-gradient(circle at top right,#fce7f3,transparent 38%),linear-gradient(135deg,#f8fafc,#eef2ff)", fontFamily: "Inter,Arial,sans-serif" }}>
    <button onClick={() => navigate("/maindashboard")} style={{ border: 0, background: "#111827", color: "white", borderRadius: 12, padding: "11px 16px", cursor: "pointer" }}>← Back to shopping</button>
    <section style={{ maxWidth: 900, margin: "32px auto", background: "white", borderRadius: 28, padding: "clamp(22px,5vw,48px)", boxShadow: "0 24px 70px #312e8118" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, animation: "arohaCoinFloat 2.2s ease-in-out infinite" }}>🪙✨</div>
        <p style={{ color: "#7c3aed", fontWeight: 800, letterSpacing: 2 }}>AROHA REWARDS CLUB</p>
        <h1 style={{ fontSize: "clamp(30px,6vw,48px)", margin: "8px 0", color: "#111827" }}>Every purchase brings a little more joy.</h1>
        <p style={{ color: "#64748b" }}>Earn coins on eligible paid orders and invite friends to join.</p>
      </div>
      {loading ? <p>Loading your rewards…</p> : error ? <p style={{ color: "#b91c1c" }}>{error}</p> : <>
        <div style={{ margin: "28px 0", padding: 28, borderRadius: 22, color: "white", background: "linear-gradient(120deg,#7c3aed,#db2777,#f59e0b)", boxShadow: "0 14px 35px #7c3aed33" }}>
          <p style={{ margin: 0, opacity: .9 }}>YOUR COIN BALANCE</p>
          <div style={{ fontSize: "clamp(40px,8vw,64px)", fontWeight: 900 }}>{Number(data.coins || 0).toLocaleString("en-IN")} 🪙</div>
          <p style={{ marginBottom: 0 }}>Coins are added after payment is verified.</p>
        </div>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 20, padding: 22 }}>
          <h2>Invite friends. Earn rewards.</h2>
          <p style={{ color: "#64748b" }}>Share your personal referral code. Your referral bonus is credited after your friend completes their first captured online payment.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <code style={{ flex: 1, minWidth: 160, padding: 14, borderRadius: 12, background: "#f1f5f9", fontSize: 18, fontWeight: 800 }}>{data.referralCode || "Code not available"}</code>
            <button onClick={copyCode} disabled={!data.referralCode} style={{ border: 0, borderRadius: 12, background: "#111827", color: "white", padding: "12px 18px", cursor: "pointer" }}>Copy code</button>
          </div>
        </div>
        <h2 style={{ marginTop: 32 }}>Coin activity</h2>
        {data.history.length ? data.history.map((item, index) => <div key={index} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "14px 0", borderBottom: "1px solid #e2e8f0" }}><span>{item.note || item.type}</span><strong style={{ color: "#7c3aed" }}>+{item.coins} 🪙</strong></div>) : <p style={{ color: "#64748b" }}>Your coin activity will appear here after your first eligible payment.</p>}
      </>}
    </section>
    <style>{'@keyframes arohaCoinFloat{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-10px) rotate(6deg)}} @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}'}</style>
  </main>;
}
