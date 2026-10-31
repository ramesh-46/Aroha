import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "./sweetalertConfig";

const API = "https://aroha.onrender.com";
const emptyForm = { name: "", mobile: "", email: "", gender: "", address: "", details: "", referralCode: "", referredBy: "", rewardCoins: 0, password: "", newRecoveryCode: "" };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const token = localStorage.getItem("sellerToken");
  const headers = { Authorization: "Bearer " + token };

  const fetchUsers = async (query = search) => {
    setLoading(true);
    try {
      const res = await axios.get(API + "/auth/users" + (query ? "?q=" + encodeURIComponent(query) : ""));
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("[ADMIN_USERS] FETCH_FAILED", err.response?.data || err.message);
      Swal.fire("Unable to load users.", err.response?.data?.message || "Check admin login and backend logs.", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(""); }, []);

  const openUser = async (user) => {
    try {
      const res = await axios.get(API + "/auth/users/" + user._id + "/orders");
      const current = res.data.user || user;
      setSelectedUser(current);
      setUserOrders(res.data.orders || []);
      setForm({
        name: current.name || "", mobile: current.mobile || "", email: current.email || "",
        gender: current.gender || "", address: current.address || "", details: current.details || "",
        referralCode: current.referralCode || "", referredBy: current.referredBy || "",
        rewardCoins: current.rewardCoins ?? 0, password: "", newRecoveryCode: ""
      });
      setEditing(false);
    } catch (err) {
      console.error("[ADMIN_USERS] DETAILS_FAILED", err.response?.data || err.message);
      Swal.fire("Unable to load user details.", err.response?.data?.message || "", "error");
    }
  };

  const saveUser = async (event) => {
    event.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.newRecoveryCode) delete payload.newRecoveryCode;
      const res = await axios.put(API + "/auth/users/" + selectedUser._id, payload, { headers });
      setSelectedUser(res.data.user);
      setForm((previous) => ({ ...previous, password: "" }));
      setEditing(false);
      await fetchUsers();
      Swal.fire("User updated", "All submitted details were saved.", "success");
      console.info("[ADMIN_USERS] USER_UPDATED", selectedUser._id);
    } catch (err) {
      console.error("[ADMIN_USERS] UPDATE_FAILED", err.response?.data || err.message);
      Swal.fire("Update failed", err.response?.data?.message || "Check admin authorization and server logs.", "error");
    } finally { setSaving(false); }
  };

  const field = (label, key, type = "text", wide = false) => (
    <label style={{ ...styles.field, ...(wide ? styles.wide : {}) }} key={key}>
      <span>{label}</span>
      {type === "textarea" ? <textarea value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} disabled={!editing} rows={3} style={styles.control} /> :
      <input type={type} value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} disabled={!editing} style={styles.control} />}
    </label>
  );

  return <main className="aum-page" style={styles.page}>
    <style>{`.aum-layout{display:grid;grid-template-columns:minmax(0,320px) minmax(0,1fr);gap:16px;align-items:start;width:100%;min-width:0}.aum-layout>section{min-width:0;overflow:hidden}.aum-layout input,.aum-layout textarea{max-width:100%;min-width:0}.aum-user-list{max-height:calc(100vh - 210px);overflow-y:auto;overscroll-behavior:contain}.aum-user-card{width:100%;min-width:0;overflow-wrap:anywhere}.aum-details{width:100%;min-width:0}.aum-details form{width:100%;min-width:0}.aum-details form label{min-width:0}.aum-details form input,.aum-details form textarea{width:100%;max-width:100%;box-sizing:border-box}.aum-detail-actions{position:sticky;bottom:0;background:#fff;padding:10px 0;z-index:2}@media(max-width:760px){.aum-layout{grid-template-columns:minmax(0,1fr)}.aum-user-list{max-height:42vh}.aum-layout>section{padding:13px!important}.aum-details{width:100%;overflow:hidden}.aum-details form{grid-template-columns:minmax(0,1fr)!important}.aum-details form label{grid-column:1/-1!important}.aum-details form input,.aum-details form textarea{font-size:16px}.aum-details h3{overflow-wrap:anywhere}.aum-detail-actions{flex-wrap:wrap}.aum-detail-actions button{flex:1 1 130px}}`}</style>
    <header style={styles.header}>
      <div><h2 style={styles.heading}>Users & Complete Profile Management</h2><p style={styles.muted}>View customer details, edit supported fields and inspect order history.</p></div>
      <div style={styles.searchRow}><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchUsers(search)} placeholder="Search name, mobile, email or ID" style={styles.control} /><button style={styles.button} onClick={() => fetchUsers(search)}>Search</button></div>
    </header>
    <div className="aum-layout" style={styles.layout}>
      <section style={styles.panel}>
        <h3 style={styles.sectionTitle}>All users ({users.length})</h3>
        {loading ? <p>Loading users…</p> : users.length === 0 ? <p>No users found.</p> : users.map((u) => <button key={u._id} style={{ ...styles.userCard, ...(selectedUser?._id === u._id ? styles.activeUser : {}) }} onClick={() => openUser(u)}>
          <strong>{u.name || "Unnamed user"}</strong><span>{u.mobile}</span><span>{u.email || "No email"}</span><small>{u._id}</small><small>Coins: {u.rewardCoins || 0} · Referral: {u.referralCode || "—"}</small>
        </button>)}
      </section>
      <section style={styles.panel}>
        {!selectedUser ? <p>Select a user to view and edit their details.</p> : <>
          <div style={styles.detailHeader}><div><h3 style={styles.sectionTitle}>{selectedUser.name || "User details"}</h3><small style={styles.muted}>ID: {selectedUser._id}</small></div>
            <button style={styles.button} onClick={() => setEditing((v) => !v)}>{editing ? "Cancel edit" : "Edit all details"}</button>
          </div>
          <form onSubmit={saveUser} style={styles.form}>
            {field("Full name", "name")}{field("Mobile", "mobile", "tel")}{field("Email", "email", "email")}{field("Gender", "gender")}
            {field("Address", "address", "textarea", true)}{field("Additional details", "details", "textarea", true)}
            {field("Referral code", "referralCode")}{field("Referred by (user ID)", "referredBy")}{field("Reward coins", "rewardCoins", "number")}
            {editing && field("Set new password (leave blank to keep current)", "password", "password", true)}
            {editing && field("Set new recovery code (leave blank to keep current)", "newRecoveryCode", "text", true)}
            {editing && <div className="aum-detail-actions" style={styles.actions}><button type="submit" style={styles.button} disabled={saving}>{saving ? "Saving…" : "Save all changes"}</button><button type="button" style={styles.secondary} onClick={() => openUser(selectedUser)}>Discard</button></div>}
          </form>
          <h3 style={styles.sectionTitle}>Order history ({userOrders.length})</h3>
          {userOrders.length === 0 ? <p className={styles.muted}>No orders for this user.</p> : userOrders.map((order) => <article key={order._id} style={styles.orderCard}>
            <strong>Order #{order.orderId || order._id.slice(-6)}</strong><p>Status: {order.status}</p><p>Coupon: {order.couponCode || "None"}</p><p>Total: ₹{Number(order.totalAmount || 0).toFixed(2)}</p>
          </article>)}
        </>}
      </section>
    </div>
  </main>;
}

const styles = {
  page: { padding: "clamp(14px,3vw,28px)", background: "#f6f7fb", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 18 },
  heading: { margin: 0, color: "#111827" }, muted: { color: "#64748b", fontSize: 13 },
  searchRow: { display: "flex", gap: 8, minWidth: 280, flex: "1 1 340px" },
  layout: { display: "grid", gridTemplateColumns: "minmax(0,320px) minmax(0,1fr)", gap: 16, alignItems: "start", width: "100%", minWidth: 0 },
  panel: { background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 6px 22px #0f172a0d", display: "grid", gap: 12, minWidth: 0 },
  sectionTitle: { margin: "0 0 8px", color: "#111827" }, userCard: { textAlign: "left", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", background: "#f8fafc", cursor: "pointer", display: "grid", gap: 4, color: "#334155" },
  activeUser: { borderColor: "#2563eb", background: "#eff6ff" }, control: { width: "100%", minWidth: 0, padding: "10px 12px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", boxSizing: "border-box" },
  button: { border: 0, borderRadius: 9, padding: "10px 14px", background: "#111827", color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }, secondary: { border: "1px solid #cbd5e1", borderRadius: 9, padding: "10px 14px", background: "#fff", cursor: "pointer" },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }, form: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))", gap: 12, minWidth: 0 },
  field: { display: "grid", gap: 5, fontSize: 13, color: "#475569" }, wide: { gridColumn: "1 / -1" }, actions: { display: "flex", gap: 8, gridColumn: "1 / -1" },
  orderCard: { border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, fontSize: 13, color: "#475569" }
};
