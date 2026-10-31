import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "./sweetalertConfig";

const API = "https://aroha.onrender.com";
const defaults = { rewardsEnabled: true, coinsPer100Spent: 5, referralBonusCoins: 100, referredUserBonusCoins: 100, coinRupeeValue: 0.1 };

export default function ReferralRewardsControls() {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("sellerToken");
  useEffect(() => {
    axios.get(API + "/settings").then((res) => setSettings({ ...defaults, ...(res.data.settings || {}) }))
      .catch((err) => { console.error("[REFERRALS] SETTINGS_LOAD_FAILED", err.response?.data || err.message); Swal.fire("Unable to load referral settings", "", "error"); })
      .finally(() => setLoading(false));
  }, []);
  const change = (key, value) => setSettings((previous) => ({ ...previous, [key]: value }));
  const save = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const payload = {};
      ["rewardsEnabled", "coinsPer100Spent", "referralBonusCoins", "referredUserBonusCoins", "coinRupeeValue"].forEach((key) => payload[key] = key === "rewardsEnabled" ? settings[key] : Number(settings[key]));
      await axios.put(API + "/settings", payload, { headers: { Authorization: "Bearer " + token } });
      console.info("[REFERRALS] SETTINGS_SAVED", payload);
      Swal.fire("Referral and rewards settings saved", "", "success");
    } catch (err) {
      console.error("[REFERRALS] SETTINGS_SAVE_FAILED", err.response?.data || err.message);
      Swal.fire("Save failed", err.response?.data?.message || "Check admin authorization and backend logs.", "error");
    } finally { setSaving(false); }
  };
  if (loading) return <main style={styles.page}>Loading referral and rewards controls…</main>;
  return <main style={styles.page}>
    <header><p style={styles.eyebrow}>AROHA ADMIN</p><h1 style={styles.title}>Referral & Rewards Controls</h1><p style={styles.muted}>Manage customer reward coins and referral bonuses from one dedicated page.</p></header>
    <form onSubmit={save} style={styles.card}>
      <label style={styles.toggle}><input type="checkbox" checked={!!settings.rewardsEnabled} onChange={(e) => change("rewardsEnabled", e.target.checked)} /> Enable reward and referral credits</label>
      <div style={styles.grid}>
        <label>Coins earned per ₹100 purchase<input type="number" min="0" value={settings.coinsPer100Spent} onChange={(e) => change("coinsPer100Spent", e.target.value)} /></label>
        <label>Bonus coins for referrer<input type="number" min="0" value={settings.referralBonusCoins} onChange={(e) => change("referralBonusCoins", e.target.value)} /></label>
        <label>Bonus coins for referred customer<input type="number" min="0" value={settings.referredUserBonusCoins} onChange={(e) => change("referredUserBonusCoins", e.target.value)} /></label>
        <label>Rupee value of one coin<input type="number" min="0" step="0.01" value={settings.coinRupeeValue} onChange={(e) => change("coinRupeeValue", e.target.value)} /></label>
      </div>
      <p style={styles.note}>Referral bonuses are credited after the referred customer's first captured payment. Purchase rewards are also processed after payment capture. Coupon creation and usage remain in Coupon Management.</p>
      <button disabled={saving} style={styles.button}>{saving ? "Saving…" : "Save referral & rewards settings"}</button>
    </form>
  </main>;
}
const styles = {
  page: { minHeight: "100vh", padding: "clamp(16px,4vw,36px)", background: "#f6f7fb", fontFamily: "Inter,system-ui,sans-serif", color: "#111827" },
  eyebrow: { color: "#64748b", fontWeight: 800, letterSpacing: 2, fontSize: 11 }, title: { margin: "4px 0 8px", fontSize: "clamp(24px,4vw,34px)" }, muted: { color: "#64748b" },
  card: { maxWidth: 900, marginTop: 22, padding: "clamp(16px,3vw,26px)", background: "#fff", borderRadius: 16, boxShadow: "0 8px 30px #0f172a0d", display: "grid", gap: 20 },
  toggle: { display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }, grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 },
  note: { color: "#64748b", fontSize: 13, lineHeight: 1.6 }, button: { justifySelf: "start", padding: "12px 18px", border: 0, borderRadius: 10, background: "#111827", color: "#fff", fontWeight: 700, cursor: "pointer" }
};
