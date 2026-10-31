import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaBoxOpen, FaSearch, FaSyncAlt, FaEdit, FaTimes, FaCheck, FaMapMarkerAlt, FaPhone, FaUser, FaCalendarAlt, FaReceipt, FaTruck, FaChevronDown } from "react-icons/fa";
import Swal from "./sweetalertConfig";

const API = "https://aroha.onrender.com";
const STATUSES = ["Pending", "Under Consideration", "Processing", "Packing", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Payment Verification Pending", "Payment Verified", "Payment Failed"];
const statusTone = (status) => {
  if (status === "Delivered" || status === "Payment Verified") return "success";
  if (status === "Cancelled" || status === "Payment Failed") return "danger";
  if (status === "Processing" || status === "Packing" || status === "Shipped" || status === "Out for Delivery") return "info";
  return "warning";
};
const money = (value) => "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const dateText = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const token = localStorage.getItem("sellerToken");
  const headers = { Authorization: "Bearer " + token };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API + "/orders/all", { headers });
      const rows = Array.isArray(response.data) ? response.data : response.data.orders || [];
      setOrders(rows);
      console.info("[ADMIN_ORDERS] FETCH_OK", { count: rows.length });
    } catch (error) {
      console.error("[ADMIN_ORDERS] FETCH_FAILED", error.response?.data || error.message);
      Swal.fire("Unable to load orders", error.response?.data?.message || "Please sign in to the admin dashboard again.", "error");
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [
      order.orderId, order._id, order.customerName, order.customerMobile, order.deliveryAddress,
      order.userId?.name, order.userId?.email
    ].some((value) => String(value || "").toLowerCase().includes(term));
    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    const created = new Date(order.createdAt);
    const matchesFrom = !dateFrom || created >= new Date(dateFrom + "T00:00:00");
    const matchesTo = !dateTo || created <= new Date(dateTo + "T23:59:59");
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  }), [orders, search, statusFilter, dateFrom, dateTo]);

  const beginEdit = (order) => { setEditingId(order._id); setDraftStatus(order.status || "Pending"); };
  const cancelEdit = () => { setEditingId(""); setDraftStatus(""); };

  const saveStatus = async (order) => {
    if (!STATUSES.includes(draftStatus)) return Swal.fire("Invalid status", "Choose a valid order status.", "warning");
    if (draftStatus === order.status) return cancelEdit();
    setSavingId(order._id);
    try {
      const response = await axios.put(API + "/orders/status/" + order._id, { status: draftStatus }, { headers });
      setOrders((current) => current.map((item) => item._id === order._id ? response.data : item));
      console.info("[ADMIN_ORDERS] STATUS_UPDATED", { orderId: order.orderId || order._id, from: order.status, to: draftStatus });
      cancelEdit();
      Swal.fire({ title: "Order status updated", text: "Status changed to " + draftStatus + ".", icon: "success", timer: 1600, showConfirmButton: false });
    } catch (error) {
      console.error("[ADMIN_ORDERS] STATUS_UPDATE_FAILED", { orderId: order.orderId || order._id, status: draftStatus, error: error.response?.data || error.message });
      Swal.fire("Status update failed", error.response?.data?.message || "The server rejected this status. Please refresh and try again.", "error");
    } finally { setSavingId(""); }
  };

  const counts = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => ["Pending", "Under Consideration", "Payment Verification Pending"].includes(o.status)).length,
    processing: orders.filter((o) => ["Processing", "Packing", "Shipped", "Out for Delivery"].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === "Delivered").length
  }), [orders]);

  return <main className="aroha-admin-orders">
    <style>{css}</style>
    <header className="ao-header">
      <div><span className="ao-eyebrow">AROHA ADMIN / OPERATIONS</span><h1>Order Management</h1><p>Review every order, update its progress and keep customers informed.</p></div>
      <button className="ao-btn ao-btn-light" onClick={fetchOrders} disabled={loading}><FaSyncAlt className={loading ? "ao-spin" : ""}/> Refresh orders</button>
    </header>

    <section className="ao-stats">
      <div className="ao-stat"><span>Total orders</span><strong>{counts.total}</strong><FaReceipt/></div>
      <div className="ao-stat"><span>Needs attention</span><strong>{counts.pending}</strong><FaBoxOpen/></div>
      <div className="ao-stat"><span>In progress</span><strong>{counts.processing}</strong><FaTruck/></div>
      <div className="ao-stat"><span>Delivered</span><strong>{counts.delivered}</strong><FaCheck/></div>
    </section>

    <section className="ao-toolbar">
      <label className="ao-search"><FaSearch/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order ID, customer, mobile or address"/></label>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status"><option>All</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
      <label className="ao-date"><span>From</span><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}/></label>
      <label className="ao-date"><span>To</span><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}/></label>
      <button className="ao-btn ao-btn-ghost" onClick={() => { setSearch(""); setStatusFilter("All"); setDateFrom(""); setDateTo(""); }}>Clear</button>
    </section>

    {loading ? <div className="ao-empty"><span className="ao-loader"/><strong>Loading orders…</strong></div> :
      filteredOrders.length === 0 ? <div className="ao-empty"><FaBoxOpen/><strong>No matching orders</strong><span>Try changing your search or filters.</span></div> :
      <section className="ao-grid">{filteredOrders.map((order) => {
        const status = order.status || "Pending";
        const editing = editingId === order._id;
        const expanded = expandedId === order._id;
        return <article className="ao-card" key={order._id}>
          <div className="ao-card-top"><div><span className="ao-order-label">ORDER</span><h2>#{order.orderId || String(order._id).slice(-8).toUpperCase()}</h2><small><FaCalendarAlt/> {dateText(order.createdAt)}</small></div><span className={"ao-badge " + statusTone(status)}>{status}</span></div>
          <div className="ao-customer"><div className="ao-avatar"><FaUser/></div><div><strong>{order.customerName || order.userId?.name || "Customer"}</strong><span><FaPhone/> {order.customerMobile || order.userId?.mobile || "No mobile"}</span></div></div>
          <div className="ao-address"><FaMapMarkerAlt/><span>{order.deliveryAddress || "No delivery address provided"}</span></div>
          <div className="ao-items">{(order.items || []).slice(0, expanded ? undefined : 2).map((item, index) => {
            const product = item.productSnapshot || item.productId || {};
            const image = product.images?.[0];
            return <div className="ao-item" key={item._id || index}>
              {image ? <img src={image.startsWith("http") ? image : API + "/uploads/" + image} alt={product.name || "Product"} loading="lazy"/> : <div className="ao-no-image"><FaBoxOpen/></div>}
              <div className="ao-item-info"><strong>{product.name || "Product"}</strong><span>Qty {item.quantity} · {money(item.discountedPrice ?? product.finalPrice ?? product.price)}</span></div>
              <b>{money(item.lineTotal ?? (Number(item.discountedPrice || 0) * Number(item.quantity || 1)))}</b>
            </div>;
          })}</div>
          {(order.items || []).length > 2 && <button className="ao-link" onClick={() => setExpandedId(expanded ? "" : order._id)}>{expanded ? "Show less" : "Show all " + order.items.length + " items"} <FaChevronDown/></button>}
          <div className="ao-total"><span>Order total</span><strong>{money(order.totalAmount)}</strong></div>
          <div className="ao-meta"><span>Payment: {order.paymentMethod || "—"}</span><span>Coupon: {order.couponCode || "None"}</span></div>
          {editing ? <div className="ao-edit"><label>Update order status<select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>{STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><div><button className="ao-btn ao-btn-primary" onClick={() => saveStatus(order)} disabled={savingId === order._id}>{savingId === order._id ? "Saving…" : <><FaCheck/> Save status</>}</button><button className="ao-btn ao-btn-ghost" onClick={cancelEdit} disabled={savingId === order._id}><FaTimes/> Cancel</button></div></div> :
          <button className="ao-btn ao-btn-edit" onClick={() => beginEdit(order)}><FaEdit/> Edit order status</button>}
          {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && <details className="ao-history"><summary>Status history ({order.statusHistory.length})</summary>{[...order.statusHistory].reverse().map((entry, index) => <div key={index}><b>{entry.status}</b><span>{dateText(entry.updatedAt)}</span></div>)}</details>}
        </article>;
      })}</section>}
    <footer className="ao-footer">Showing {filteredOrders.length} of {orders.length} orders</footer>
  </main>;
}

const css = `
.aroha-admin-orders{--ink:var(--admin-text,#171717);--muted:var(--admin-muted,#737373);--line:var(--admin-border,#e7e5e4);--surface:var(--admin-card,#fff);--page:var(--admin-bg,#f7f7f6);min-height:100vh;padding:clamp(14px,3vw,30px);background:var(--page);color:var(--ink);font-family:Inter,system-ui,sans-serif;box-sizing:border-box}
.aroha-admin-orders *{box-sizing:border-box}.ao-header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:22px}.ao-eyebrow{font-size:10px;letter-spacing:2px;font-weight:800;color:var(--muted)}.ao-header h1{font-size:clamp(25px,4vw,34px);margin:5px 0}.ao-header p{margin:0;color:var(--muted);font-size:14px}.ao-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid transparent;border-radius:10px;padding:10px 14px;font-weight:700;font-size:13px;cursor:pointer;transition:transform .18s,background .18s,box-shadow .18s}.ao-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 7px 18px #00000012}.ao-btn:disabled{opacity:.55;cursor:wait}.ao-btn-light,.ao-btn-ghost{background:var(--surface);border-color:var(--line);color:var(--ink)}.ao-btn-primary{background:#171717;color:white}.ao-btn-edit{width:100%;background:#171717;color:#fff;margin-top:14px}
.ao-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.ao-stat{position:relative;display:grid;gap:5px;padding:16px;background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:0 3px 12px #00000006}.ao-stat span{font-size:12px;color:var(--muted)}.ao-stat strong{font-size:25px}.ao-stat svg{position:absolute;right:15px;top:18px;color:var(--muted);opacity:.55}
.ao-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:13px;background:var(--surface);border:1px solid var(--line);border-radius:14px;margin-bottom:18px}.ao-search{display:flex;align-items:center;gap:9px;flex:1 1 240px;min-width:0;color:var(--muted)}.ao-search input,.ao-toolbar select,.ao-date input,.ao-edit select{width:100%;min-width:0;border:1px solid var(--line);border-radius:9px;background:var(--surface);color:var(--ink);padding:10px 11px;font:inherit;font-size:13px;outline:none}.ao-search input:focus,.ao-toolbar select:focus,.ao-date input:focus,.ao-edit select:focus{border-color:#777;box-shadow:0 0 0 3px #0000000a}.ao-toolbar>select{flex:0 1 180px}.ao-date{display:flex;align-items:center;gap:7px;color:var(--muted);font-size:12px}.ao-date input{width:auto}
.ao-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:15px;align-items:start}.ao-card{min-width:0;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:0 4px 16px #00000007;transition:transform .2s,box-shadow .2s}.ao-card:hover{transform:translateY(-2px);box-shadow:0 10px 26px #0000000d}.ao-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--line)}.ao-order-label{font-size:10px;letter-spacing:1.5px;color:var(--muted);font-weight:800}.ao-card-top h2{font-size:16px;margin:3px 0 5px;overflow-wrap:anywhere}.ao-card-top small{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:11px}.ao-badge{display:inline-flex;align-items:center;max-width:48%;padding:6px 9px;border-radius:999px;font-size:11px;font-weight:800;text-align:center}.ao-badge.success{background:#e9f7ee;color:#18743a}.ao-badge.danger{background:#fdecec;color:#b42318}.ao-badge.info{background:#eaf2ff;color:#2458a6}.ao-badge.warning{background:#fff5df;color:#946200}
.ao-customer{display:flex;align-items:center;gap:10px;padding:13px 0 8px}.ao-avatar{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;background:#f0efed;color:#444}.ao-customer>div:last-child{display:grid;gap:4px;min-width:0}.ao-customer strong{font-size:13px}.ao-customer span{display:flex;gap:6px;align-items:center;color:var(--muted);font-size:11px}.ao-address{display:flex;gap:8px;align-items:flex-start;color:var(--muted);font-size:12px;line-height:1.5;padding:7px 0 12px}.ao-address svg{flex:0 0 auto;margin-top:2px}.ao-address span{overflow-wrap:anywhere}
.ao-items{display:grid;gap:8px}.ao-item{display:flex;align-items:center;gap:9px;padding:8px;background:var(--page);border-radius:10px;min-width:0}.ao-item img,.ao-no-image{width:44px;height:44px;flex:0 0 44px;border-radius:8px;object-fit:cover;background:#e9e7e4}.ao-no-image{display:grid;place-items:center;color:#777}.ao-item-info{display:grid;gap:4px;flex:1;min-width:0}.ao-item-info strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ao-item-info span{font-size:11px;color:var(--muted)}.ao-item>b{font-size:12px;white-space:nowrap}.ao-link{display:inline-flex;align-items:center;gap:6px;margin-top:8px;border:0;background:none;color:var(--muted);font-size:11px;font-weight:700;cursor:pointer}.ao-link:hover{color:var(--ink)}.ao-total{display:flex;justify-content:space-between;align-items:center;padding:13px 0 7px;border-bottom:1px solid var(--line);font-size:13px}.ao-total span,.ao-meta{color:var(--muted)}.ao-total strong{font-size:18px;color:var(--ink)}.ao-meta{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:11px;padding-top:9px}.ao-edit{display:grid;gap:10px;margin-top:14px;padding:12px;background:var(--page);border:1px solid var(--line);border-radius:12px}.ao-edit label{display:grid;gap:7px;font-size:12px;font-weight:700}.ao-edit>div{display:flex;gap:8px;flex-wrap:wrap}.ao-history{margin-top:12px;border-top:1px solid var(--line);padding-top:10px;font-size:12px}.ao-history summary{cursor:pointer;color:var(--muted);font-weight:700}.ao-history>div{display:flex;justify-content:space-between;gap:8px;padding:7px 0}.ao-history span{color:var(--muted);font-size:11px}.ao-empty{min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--muted);background:var(--surface);border:1px dashed var(--line);border-radius:16px}.ao-empty>svg{font-size:26px}.ao-footer{text-align:right;color:var(--muted);font-size:11px;padding:14px 2px}.ao-loader{width:25px;height:25px;border:3px solid var(--line);border-top-color:var(--ink);border-radius:50%;animation:ao-spin .8s linear infinite}.ao-spin{animation:ao-spin .8s linear infinite}@keyframes ao-spin{to{transform:rotate(360deg)}}
@media(max-width:700px){.ao-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ao-toolbar{align-items:stretch}.ao-search{flex-basis:100%}.ao-toolbar>select{flex:1 1 100%}.ao-date{flex:1 1 130px;display:grid;gap:5px}.ao-date input{width:100%}.ao-grid{grid-template-columns:minmax(0,1fr)}.ao-header>.ao-btn{width:100%}.ao-card{padding:13px}}
@media(prefers-reduced-motion:reduce){.aroha-admin-orders *{animation:none!important;transition:none!important}}
`;
